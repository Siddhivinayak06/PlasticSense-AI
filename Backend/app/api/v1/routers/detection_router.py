import math
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile, status
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_detection_service
from app.api.upload_guard import charge_rate_limit, inference_rate_limit, read_upload_limited
from app.api.v1.schemas.detection_schema import (
    DetectionItemSchema,
    DetectionSchema,
    PaginatedDetectionEnvelope,
    PaginationMeta,
    SingleDetectionEnvelope,
    BatchDetectResponseSchema,
    MapDetectionEnvelope
)
from app.application.dto.detection_dto import DetectionCreateDTO
from app.application.services.detection_service import DetectionService, ModelUnavailableError
from app.core.config import settings
from app.core.cache import cache_clear, cache_get, cache_set
from app.core.logging import logger
from app.core.auth import get_current_user_optional, get_current_user, verify_report_ownership, require_admin
from app.infrastructure.database.models.user_profile_model import UserProfileModel

router = APIRouter(prefix="/detections", tags=["Detections"])

# Reports within this great-circle distance of each other are treated as one
# observed cluster. 2.5 km approximates a municipal ward-scale catchment.
CLUSTER_RADIUS_M = 2500.0
EARTH_RADIUS_M = 6_371_000.0


def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in metres.

    Replaces math.hypot() on raw degrees, which treated 1 degree of longitude as
    equal to 1 degree of latitude. At Indian latitudes (~20 deg N) a longitude
    degree is about 6 percent shorter, so the old comparison silently distorted
    cluster shapes.
    """
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = p2 - p1
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))


def _cluster_by_distance(points: list, radius_m: float) -> list:
    """Single-link spatial clustering, independent of input ordering.

    The previous implementation assigned each point to the first cluster whose
    running centroid was close enough, so the result depended on the order rows came
    back from the database. This transitive-closure grouping returns the same
    clusters for any permutation of the input.
    """
    n = len(points)
    parent = list(range(n))

    def find(i: int) -> int:
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    def union(i: int, j: int) -> None:
        ri, rj = find(i), find(j)
        if ri != rj:
            parent[max(ri, rj)] = min(ri, rj)

    for i in range(n):
        for j in range(i + 1, n):
            d = _haversine_m(
                points[i].latitude, points[i].longitude,
                points[j].latitude, points[j].longitude,
            )
            if d <= radius_m:
                union(i, j)

    groups: dict = {}
    for i in range(n):
        groups.setdefault(find(i), []).append(points[i])
    # Deterministic ordering so equal-scoring clusters do not shuffle between calls.
    return [groups[k] for k in sorted(groups)]



def _to_detection_schema(dto) -> DetectionSchema:
    items_schema = [
        DetectionItemSchema(
            id=item.id,
            class_name=item.class_name,
            waste_group=item.waste_group,
            confidence=item.confidence,
            bbox_x=item.bbox_x,
            bbox_y=item.bbox_y,
            bbox_w=item.bbox_w,
            bbox_h=item.bbox_h,
        )
        for item in dto.items
    ]
    return DetectionSchema(
        id=dto.id,
        image_url=dto.image_url,
        annotated_image_url=dto.annotated_image_url,
        latitude=dto.latitude,
        longitude=dto.longitude,
        location_source=dto.location_source,
        location_confidence=dto.location_confidence,
        captured_at=dto.captured_at,
        model_version=dto.model_version,
        detection_status=dto.detection_status,
        failure_reason=dto.failure_reason,
        items=items_schema,
        created_at=dto.created_at,
        processing_time_ms=dto.processing_time_ms,
        summary=dto.summary,
        segmentation=dto.segmentation,
        features=dto.features,
        risk=dto.risk,
        authenticity_screening=getattr(dto, "authenticity_screening", None),
        user_id=getattr(dto, "user_id", None),
    )


@router.post(
    "/detect",
    response_model=DetectionSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Upload image & run dual-model waste detection/segmentation/risk analysis",
)
@router.post(
    "/analyze",
    response_model=DetectionSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Upload image & run comprehensive waste analysis (alias for /detect)",
)
async def create_detection(
    latitude: Optional[float] = Form(None, ge=-90, le=90, description="Latitude coordinate (-90 to 90)"),
    longitude: Optional[float] = Form(None, ge=-180, le=180, description="Longitude coordinate (-180 to 180)"),
    image: Optional[UploadFile] = File(None, description="Waste image file (JPG, PNG, WEBP, BMP)"),
    file: Optional[UploadFile] = File(None, description="Waste image file (alias)"),
    service: DetectionService = Depends(get_detection_service),
    current_user: Optional[UserProfileModel] = Depends(get_current_user_optional),
    _limited: None = Depends(inference_rate_limit),
):
    upload_file = image or file
    if not upload_file:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Image file is required")
    if (latitude is None) != (longitude is None):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provide both latitude and longitude, or neither",
        )
    user_id = current_user.id if current_user else None
    result = await run_detection(service, upload_file, latitude, longitude, user_id=user_id)
    cache_clear()
    return _to_detection_schema(result)


async def run_detection(service: DetectionService, upload_file: UploadFile, latitude, longitude, user_id: Optional[str] = None):
    """Validate, analyse and persist one upload, mapping failures to safe HTTP errors.

    Client errors (bad file, bad coordinates) return their validation message.
    Anything unexpected is logged in full server-side but returns a generic 500, so
    stack details, file paths and database errors never reach the browser.
    """
    file_bytes = await read_upload_limited(upload_file)
    dto = DetectionCreateDTO(
        latitude=latitude,
        longitude=longitude,
        filename=upload_file.filename or "uploaded_image.jpg",
        content_type=upload_file.content_type or "",
        file_bytes=file_bytes,
        user_id=user_id,
    )
    try:
        return service.create_detection(dto)
    except ModelUnavailableError as err:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(err))
    except ValueError as err:
        logger.warning(f"Rejected upload '{upload_file.filename}': {err}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))
    except Exception as err:
        logger.error(f"Unexpected error in create_detection: {err}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The server could not process this image. Please try again.",
        )


@router.post(
    "/detect/batch",
    response_model=BatchDetectResponseSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Upload multiple images",
)
async def create_batch_detection(
    request: Request,
    latitude: Optional[float] = Form(None, ge=-90, le=90, description="Latitude coordinate"),
    longitude: Optional[float] = Form(None, ge=-180, le=180, description="Longitude coordinate"),
    files: list[UploadFile] = File(..., description="List of images"),
    service: DetectionService = Depends(get_detection_service),
    current_user: Optional[UserProfileModel] = Depends(get_current_user_optional),
    _limited: None = Depends(inference_rate_limit),
):
    if len(files) > settings.MAX_BATCH_FILES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"At most {settings.MAX_BATCH_FILES} images per batch",
        )
    charge_rate_limit(request, len(files) - 1)
    results = []
    user_id = current_user.id if current_user else None
    for upload_file in files:
        try:
            results.append(_to_detection_schema(
                await run_detection(service, upload_file, latitude, longitude, user_id=user_id)
            ))
        except HTTPException as e:
            if e.status_code == status.HTTP_503_SERVICE_UNAVAILABLE:
                raise
            logger.error(f"Failed to process {upload_file.filename} in batch: {e.detail}")
            continue

    cache_clear()
    return BatchDetectResponseSchema(results=results)


@router.get(
    "",
    response_model=PaginatedDetectionEnvelope,
    summary="List detections with pagination",
)
def list_detections(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    my_only: bool = Query(False, description="Filter only reports submitted by the current authenticated user"),
    service: DetectionService = Depends(get_detection_service),
    current_user: Optional[UserProfileModel] = Depends(get_current_user_optional),
):
    user_id_filter = None
    if my_only:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required to view your submitted reports.",
            )
        user_id_filter = current_user.id

    items, total = service.list_detections(page=page, limit=limit, user_id=user_id_filter)
    total_pages = math.ceil(total / limit) if limit > 0 else 1
    meta = PaginationMeta(
        page=page,
        limit=limit,
        total_items=total,
        total_pages=total_pages,
    )
    schema_items = [_to_detection_schema(item) for item in items]
    return PaginatedDetectionEnvelope(data=schema_items, meta=meta, error=None)


from collections import defaultdict
from pydantic import BaseModel


class HotspotItemSchema(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    radius: float
    report_count: int
    total_waste_objects: int
    # Null when no member report carries a risk assessment. Consumers must render
    # "not assessed" rather than substituting a number.
    avg_risk_score: Optional[float] = None
    max_risk_score: Optional[float] = None
    severity: str
    priority: str
    dominant_materials: list[str]
    most_common_material: str
    # Derived from linked cleanup assignments: pending | in_progress | resolved | verified
    status: str
    assigned_team: Optional[str] = None
    assignment_ids: list[str] = []
    last_updated: str
    detection_ids: list[str]


class HotspotsEnvelope(BaseModel):
    hotspots: list[HotspotItemSchema]
    total_hotspots: int
    # Guards against this descriptive endpoint being read as a forecast.
    is_forecast: bool = False
    methodology: str = (
        "Single-link spatial grouping of already-observed reports within "
        f"{int(CLUSTER_RADIUS_M)}m great-circle distance. Descriptive only - "
        "this does not predict future waste accumulation."
    )


@router.get(
    "/map",
    response_model=MapDetectionEnvelope,
    summary="Get detections with valid coordinates for map visualization",
)
def get_map_detections(
    service: DetectionService = Depends(get_detection_service),
):
    cached = cache_get("map_detections")
    if cached:
        return cached

    items = service.list_map_detections()
    schema_items = [_to_detection_schema(item) for item in items]
    res = MapDetectionEnvelope(detections=schema_items)
    cache_set("map_detections", res, ttl_seconds=30)
    return res


@router.get(
    "/hotspots",
    response_model=HotspotsEnvelope,
    summary="Group geolocated reports into OBSERVED waste clusters (not a forecast)",
)
def get_hotspots(
    service: DetectionService = Depends(get_detection_service),
    db: Session = Depends(get_db),
):
    """Spatially group reports that have already been observed.

    This is descriptive, not predictive. It summarises where reports exist today; it
    does NOT forecast where waste will appear. Forecasting would require repeated
    observations of the same locations over time, which this dataset does not contain.
    """
    cached = cache_get("clustered_hotspots")
    if cached:
        return cached
    res = compute_hotspots(service, db)
    cache_set("clustered_hotspots", res, ttl_seconds=30)
    return res


@router.get(
    "/hotspots/{hotspot_id}",
    response_model=HotspotItemSchema,
    summary="Get one observed cluster by id",
)
def get_hotspot(
    hotspot_id: str,
    service: DetectionService = Depends(get_detection_service),
    db: Session = Depends(get_db),
):
    for h in get_hotspots(service, db).hotspots:
        if h.id == hotspot_id:
            return h
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Hotspot not found. Cluster ids are derived from member reports and change when new reports join a cluster.",
    )


_ACTIVE_ASSIGNMENT = {"pending", "assigned", "in_progress"}


def _cluster_status(assignments: list) -> tuple:
    """Hotspot status from its real cleanup assignments; 'pending' when none exist."""
    if not assignments:
        return "pending", None
    active = [a for a in assignments if a.status in _ACTIVE_ASSIGNMENT]
    if active:
        latest = max(active, key=lambda a: a.created_at)
        return "in_progress", latest.ngo_team_name
    statuses = {a.status for a in assignments}
    team = max(assignments, key=lambda a: a.created_at).ngo_team_name
    if "verified" in statuses:
        return "verified", team
    if "completed" in statuses:
        return "resolved", team
    return "pending", None  # only rejected verifications: the site still needs work


def compute_hotspots(service: DetectionService, db: Session) -> "HotspotsEnvelope":
    from app.infrastructure.database.models.assignment_model import CleanupAssignmentModel

    items = service.list_map_detections()
    if not items:
        return HotspotsEnvelope(hotspots=[], total_hotspots=0)

    located = [d for d in items if d.latitude is not None and d.longitude is not None]
    if not located:
        return HotspotsEnvelope(hotspots=[], total_hotspots=0)

    clusters = _cluster_by_distance(located, CLUSTER_RADIUS_M)
    assignments = db.query(CleanupAssignmentModel).all()

    hotspot_list = []
    for idx, cl in enumerate(clusters):
        c_lat = sum(d.latitude for d in cl) / len(cl)
        c_lng = sum(d.longitude for d in cl) / len(cl)
        waste_objects = sum(len(d.items) for d in cl)

        # Risk scores
        risk_scores = []
        for d in cl:
            score = None
            if isinstance(d.risk, dict):
                score = d.risk.get("score")
            elif hasattr(d.risk, "score"):
                score = d.risk.score
            if score is not None:
                try:
                    risk_scores.append(float(score))
                except (ValueError, TypeError):
                    pass

        # A cluster with no scored reports has NO risk score. Previously this
        # defaulted to 50.0, which fabricated a "medium risk" site out of absent
        # data and made it indistinguishable from a genuinely assessed one.
        has_risk_data = bool(risk_scores)
        avg_score = round(sum(risk_scores) / len(risk_scores), 1) if has_risk_data else None
        max_score = round(max(risk_scores), 1) if has_risk_data else None

        if not has_risk_data:
            severity = "unknown"
            priority = "unranked"
        elif max_score >= 75:
            severity = "critical"
            priority = "urgent"
        elif max_score >= 50:
            severity = "high"
            priority = "high"
        elif max_score >= 25:
            severity = "medium"
            priority = "medium"
        else:
            severity = "low"
            priority = "low"

        # Materials
        mat_counts = defaultdict(int)
        for d in cl:
            for it in d.items:
                if it.waste_group:
                    mat_counts[it.waste_group.lower()] += 1
        sorted_mats = sorted(mat_counts.items(), key=lambda x: x[1], reverse=True)
        # No detected materials means no dominant material. Defaulting to "Plastic"
        # previously labelled empty clusters as plastic-dominated with no evidence.
        dominant_mats = [m[0].title() for m in sorted_mats[:3]]
        most_common = dominant_mats[0] if dominant_mats else "Unknown"

        latest_dt = max(d.created_at for d in cl)
        # Spread of the actual member reports, not a count-based guess.
        radius = max(
            150.0,
            max(
                _haversine_m(c_lat, c_lng, d.latitude, d.longitude)
                for d in cl
            ),
        )

        cluster_id = f"CLUSTER-{c_lat:.4f}_{c_lng:.4f}"
        member_ids = {d.id for d in cl}
        linked = [
            a for a in assignments
            if a.detection_id in member_ids or a.hotspot_id == cluster_id
        ]
        cluster_status, assigned_team = _cluster_status(linked)

        hotspot_list.append(HotspotItemSchema(
            id=cluster_id,
            name=f"Observed cluster near {c_lat:.4f}, {c_lng:.4f}",
            latitude=round(c_lat, 6),
            longitude=round(c_lng, 6),
            radius=radius,
            report_count=len(cl),
            total_waste_objects=waste_objects,
            avg_risk_score=avg_score,
            max_risk_score=max_score,
            severity=severity,
            priority=priority,
            dominant_materials=dominant_mats,
            most_common_material=most_common,
            status=cluster_status,
            assigned_team=assigned_team,
            assignment_ids=[a.id for a in linked],
            last_updated=latest_dt.isoformat() if hasattr(latest_dt, "isoformat") else str(latest_dt),
            detection_ids=[d.id for d in cl],
        ))

    # Scored clusters first (highest risk at the top), then unscored ones, which are
    # ranked by how much evidence they carry rather than being dropped or faked.
    hotspot_list.sort(
        key=lambda h: (
            h.max_risk_score is not None,
            h.max_risk_score if h.max_risk_score is not None else 0.0,
            h.report_count,
        ),
        reverse=True,
    )
    return HotspotsEnvelope(hotspots=hotspot_list, total_hotspots=len(hotspot_list))


@router.get(
    "/{detection_id}",
    response_model=SingleDetectionEnvelope,
    summary="Get single detection record",
)
def get_detection(
    detection_id: str,
    service: DetectionService = Depends(get_detection_service),
    current_user: Optional[UserProfileModel] = Depends(get_current_user_optional),
):
    item = service.get_detection(detection_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Detection '{detection_id}' not found")

    # IDOR protection: if the report has an owner, verify caller is owner or admin
    if getattr(item, "user_id", None):
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required to view this private report.",
            )
        verify_report_ownership(item.user_id, current_user)

    schema_data = _to_detection_schema(item)
    return SingleDetectionEnvelope(data=schema_data, meta=None, error=None)


@router.delete(
    "/{detection_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a detection report (Owner or Admin only)",
)
def delete_detection(
    detection_id: str,
    service: DetectionService = Depends(get_detection_service),
    current_user: UserProfileModel = Depends(get_current_user),
):
    item = service.get_detection(detection_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Detection '{detection_id}' not found")

    verify_report_ownership(item.user_id, current_user)
    deleted = service.delete_detection(detection_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete detection",
        )
    cache_clear()
    return {"status": "success", "message": f"Detection '{detection_id}' deleted successfully."}

