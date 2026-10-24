from collections import Counter, defaultdict
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.dependencies import get_db, get_detection_service
from app.application.services.detection_service import DetectionService
from app.core.cache import cache_get, cache_set
from app.infrastructure.database.models.detection_model import DetectionModel, DetectionItemModel
from app.infrastructure.database.models.risk_assessment_model import RiskAssessmentModel
from app.infrastructure.database.models.ngo_model import NGOTeamModel
from app.infrastructure.database.models.assignment_model import CleanupAssignmentModel

router = APIRouter(prefix="/statistics", tags=["Statistics"])

_DONE = ("completed", "verified")
# Every write path (detections, assignments, NGOs) calls cache_clear(), so a longer
# TTL never serves stale data written through the API; it only bounds staleness
# from writes made directly in the database.
CACHE_TTL_SECONDS = 120
_MAX_SERIES_DAYS = 90


def _as_date(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        if value.tzinfo is not None:
            value = value.astimezone(timezone.utc)
        return value.date()
    return value


def _date_range(first, last, min_days: int = 7):
    if (last - first).days < min_days - 1:
        first = last - timedelta(days=min_days - 1)
    if (last - first).days > _MAX_SERIES_DAYS - 1:
        first = last - timedelta(days=_MAX_SERIES_DAYS - 1)
    cur = first
    while cur <= last:
        yield cur
        cur += timedelta(days=1)


def _daily_series(db: Session) -> list:
    created = [_as_date(r[0]) for r in db.query(DetectionModel.created_at).all()]
    if not created:
        return []
    resolved = Counter(
        _as_date(r[0]) for r in db.query(CleanupAssignmentModel.completed_date).filter(
            CleanupAssignmentModel.status.in_(_DONE),
            CleanupAssignmentModel.completed_date.isnot(None),
        ).all()
    )
    critical = Counter(
        _as_date(r[0]) for r in db.query(RiskAssessmentModel.computed_at).filter(
            RiskAssessmentModel.level.in_(["high", "critical"])
        ).all()
    )
    totals = Counter(created)
    today = datetime.now(timezone.utc).date()
    return [
        {
            "date": d.strftime("%b %d"),
            "iso_date": d.isoformat(),
            "total": totals.get(d, 0),
            "resolved": resolved.get(d, 0),
            "critical": critical.get(d, 0),
        }
        for d in _date_range(min(created), today)
    ]


@router.get("", summary="Get global statistics")
def get_statistics(db: Session = Depends(get_db)):
    cached = cache_get("global_statistics")
    if cached:
        return cached

    total_detections = db.query(func.count(DetectionModel.id)).scalar() or 0

    # Aggregate waste groups
    groups = db.query(
        DetectionItemModel.waste_group,
        func.count(DetectionItemModel.id).label('count')
    ).group_by(DetectionItemModel.waste_group).all()

    waste_breakdown = {group: count for group, count in groups}

    res = {
        "total_detections": total_detections,
        "waste_breakdown": waste_breakdown
    }
    cache_set("global_statistics", res, ttl_seconds=CACHE_TTL_SECONDS)
    return res


@router.get("/dashboard/summary", summary="Dashboard summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    cached = cache_get("dashboard_summary")
    if cached:
        return cached

    stats = get_statistics(db)


    total_objects = sum(stats["waste_breakdown"].values())
    recyclable_groups = {"plastic", "glass", "metal", "paper", "cardboard"}
    recyclable_count = sum(count for group, count in stats["waste_breakdown"].items() if group in recyclable_groups)

    recyclable_percentage = round((recyclable_count / total_objects * 100), 2) if total_objects > 0 else 0

    # Count high/critical risk detections
    critical_count = db.query(func.count(RiskAssessmentModel.id)).filter(
        RiskAssessmentModel.level.in_(["critical", "high"])
    ).scalar() or 0

    # Cleanup counts
    pending_cleanups = db.query(func.count(CleanupAssignmentModel.id)).filter(
        CleanupAssignmentModel.status.in_(["pending", "assigned", "in_progress"])
    ).scalar() or 0

    completed_cleanups = db.query(func.count(CleanupAssignmentModel.id)).filter(
        CleanupAssignmentModel.status.in_(["completed", "verified"])
    ).scalar() or 0

    verified_cleanups = db.query(func.count(CleanupAssignmentModel.id)).filter(
        CleanupAssignmentModel.status == "verified"
    ).scalar() or 0

    # Active NGO teams
    active_ngos = db.query(func.count(NGOTeamModel.id)).filter(
        NGOTeamModel.availability != "unavailable"
    ).scalar() or 0

    res = {
        "total_detections": stats["total_detections"],
        "total_objects_detected": total_objects,
        "recyclable_percentage": recyclable_percentage,
        "breakdown": stats["waste_breakdown"],
        "critical_hotspots": critical_count,
        "pending_cleanups": pending_cleanups,
        "active_ngos": active_ngos,
        "completed_cleanups": completed_cleanups,
        "verified_cleanups": verified_cleanups,
    }
    cache_set("dashboard_summary", res, ttl_seconds=CACHE_TTL_SECONDS)
    return res


@router.get("/analytics", summary="Detailed analytics metrics and time series")
def get_analytics(db: Session = Depends(get_db)):
    cached = cache_get("dashboard_analytics")
    if cached:
        return cached
    # 1. Daily time series. Every series is counted from real rows:
    #    total    = reports received that day
    #    resolved = cleanups completed/verified that day (by completed_date)
    #    critical = risk assessments rated high/critical that day
    # (Previously resolved/critical were total*0.7 and total*0.3 - invented ratios.)
    time_series = _daily_series(db)

    # 2. Severity Breakdown from RiskAssessmentModel
    risk_levels = db.query(
        RiskAssessmentModel.level,
        func.count(RiskAssessmentModel.id).label("count")
    ).group_by(RiskAssessmentModel.level).all()

    severity_breakdown = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    for level, count in risk_levels:
        lvl = (level or "medium").lower()
        if lvl in severity_breakdown:
            severity_breakdown[lvl] = count
        elif lvl == "moderate":
            severity_breakdown["medium"] += count

    # 3. Risk Score Distribution buckets: 0-25, 26-50, 51-75, 76-100
    scores = db.query(RiskAssessmentModel.score).all()
    risk_distribution = {
        "0-25 (Low)": 0,
        "26-50 (Medium)": 0,
        "51-75 (High)": 0,
        "76-100 (Critical)": 0,
    }
    for (score,) in scores:
        if score <= 25:
            risk_distribution["0-25 (Low)"] += 1
        elif score <= 50:
            risk_distribution["26-50 (Medium)"] += 1
        elif score <= 75:
            risk_distribution["51-75 (High)"] += 1
        else:
            risk_distribution["76-100 (Critical)"] += 1

    # 4. Waste composition
    stats = get_statistics(db)
    total_objects = sum(stats["waste_breakdown"].values()) or 1
    waste_composition = [
        {
            "type": group.title() if group else "Unknown",
            "count": count,
            "percentage": round((count / total_objects) * 100, 1),
        }
        for group, count in sorted(stats["waste_breakdown"].items(), key=lambda x: x[1], reverse=True)
    ]

    # 5. Dynamic Insights
    insights = []
    if waste_composition:
        top_mat = waste_composition[0]
        insights.append({
            "id": "dominant-waste",
            "title": f"Dominant Material: {top_mat['type']}",
            "description": f"{top_mat['type']} accounts for {top_mat['percentage']}% of all detected waste objects across monitored zones.",
            "type": "warning" if top_mat['type'].lower() in ["plastic", "metal"] else "info",
            "impact": f"{top_mat['count']} items",
        })

    avg_score = round(sum(s[0] for s in scores) / max(len(scores), 1), 1) if scores else 0.0
    insights.append({
        "id": "avg-risk",
        "title": f"Average Risk Score: {avg_score}/100",
        "description": f"Overall pollution severity across surveyed locations averages {avg_score} points.",
        "type": "info",
        "impact": f"{len(scores)} sites assessed",
    })

    verified_count = db.query(func.count(CleanupAssignmentModel.id)).filter(
        CleanupAssignmentModel.status == "verified"
    ).scalar() or 0
    insights.append({
        "id": "verified-cleanups",
        "title": f"{verified_count} Cleanups AI-Verified",
        "description": (
            "Cleanups whose post-cleanup photo showed at least 50% fewer detected objects than the original report."
            if verified_count else
            "No cleanup has been verified yet. Upload an after-cleanup photo on an assignment to verify it."
        ),
        "type": "success",
        "impact": f"{verified_count} verified",
    })

    analytics_res = {
        "time_series": time_series,
        "severity_breakdown": severity_breakdown,
        "risk_distribution": risk_distribution,
        "waste_composition": waste_composition,
        "insights": insights,
    }
    cache_set("dashboard_analytics", analytics_res, ttl_seconds=CACHE_TTL_SECONDS)
    return analytics_res


@router.get("/impact", summary="Measurable environmental impact from real database operations")
def get_impact(db: Session = Depends(get_db)):
    cached = cache_get("dashboard_impact")
    if cached:
        return cached
    total_detections = db.query(func.count(DetectionModel.id)).scalar() or 0

    # Waste objects
    total_objects = db.query(func.count(DetectionItemModel.id)).scalar() or 0

    # High risk sites identified (score >= 50)
    high_risk_sites = db.query(func.count(RiskAssessmentModel.id)).filter(
        RiskAssessmentModel.score >= 50.0
    ).scalar() or 0

    # Cleanups
    completed_cleanups = db.query(func.count(CleanupAssignmentModel.id)).filter(
        CleanupAssignmentModel.status.in_(["completed", "verified"])
    ).scalar() or 0

    verified_cleanups = db.query(func.count(CleanupAssignmentModel.id)).filter(
        CleanupAssignmentModel.status == "verified"
    ).scalar() or 0

    active_ngos = db.query(func.count(NGOTeamModel.id)).filter(
        NGOTeamModel.availability != "unavailable"
    ).scalar() or 0

    # Average waste reduction percent across verified assignments
    avg_reduction = db.query(func.avg(CleanupAssignmentModel.waste_reduction_percent)).filter(
        CleanupAssignmentModel.status == "verified"
    ).scalar()
    # None (not 85.0) when nothing has been verified: there is no measurement.
    avg_waste_reduction = round(float(avg_reduction), 1) if avg_reduction is not None else None

    # Actual material breakdown
    groups = db.query(
        DetectionItemModel.waste_group,
        func.count(DetectionItemModel.id).label('count')
    ).group_by(DetectionItemModel.waste_group).all()

    category_impact = []
    tot = max(total_objects, 1)
    for group, count in sorted(groups, key=lambda x: x[1], reverse=True):
        g_name = (group.title() if group else "Unknown")
        category_impact.append({
            "category": f"{g_name} Waste",
            "collected": count,
            "percentage": round((count / tot) * 100, 1),
        })

    impact_res = {
        "total_detections": total_detections,
        "total_objects_detected": total_objects,
        "high_risk_sites": high_risk_sites,
        "completed_cleanups": completed_cleanups,
        "verified_cleanups": verified_cleanups,
        "avg_waste_reduction": avg_waste_reduction,
        "active_ngos": active_ngos,
        "category_impact": category_impact,
    }
    cache_set("dashboard_impact", impact_res, ttl_seconds=CACHE_TTL_SECONDS)
    return impact_res



def _percentile(sorted_values: list, q: float):
    if not sorted_values:
        return None
    idx = min(len(sorted_values) - 1, max(0, round(q * (len(sorted_values) - 1))))
    return round(float(sorted_values[idx]), 1)


@router.get("/insights", summary="Detailed analytics computed from stored detections and assignments")
def get_insights(
    db: Session = Depends(get_db),
    service: DetectionService = Depends(get_detection_service),
):
    """Backs the Trends, Materials and Performance analytics pages.

    Everything here is counted from stored rows. Model *accuracy* is deliberately
    absent: it needs a labelled evaluation set, which the application does not
    have. Confidence statistics describe what the model reported, not whether it
    was right.
    """
    cached = cache_get("analytics_insights")
    if cached:
        return cached

    # One pass over items and one over detections, instead of a query per metric:
    # each round trip to a remote Supabase pooler costs hundreds of milliseconds.
    item_rows = db.query(
        DetectionItemModel.class_name, DetectionItemModel.waste_group, DetectionItemModel.confidence
    ).all()
    per_class: dict = defaultdict(list)
    per_group: dict = defaultdict(list)
    for name, group, conf in item_rows:
        per_class[(name or "unknown", group or "other")].append(float(conf or 0.0))
        per_group[group or "other"].append(float(conf or 0.0))

    class_distribution = sorted(
        (
            {
                "class_name": name,
                "waste_group": group,
                "count": len(confs),
                "avg_confidence": round(sum(confs) / len(confs), 3),
            }
            for (name, group), confs in per_class.items()
        ),
        key=lambda r: r["count"],
        reverse=True,
    )
    confidence_by_group = sorted(
        (
            {
                "waste_group": group,
                "count": len(confs),
                "avg_confidence": round(sum(confs) / len(confs), 3),
                "min_confidence": round(min(confs), 3),
                "max_confidence": round(max(confs), 3),
            }
            for group, confs in per_group.items()
        ),
        key=lambda r: r["count"],
        reverse=True,
    )

    buckets = [("<0.25", 0.0, 0.25), ("0.25-0.40", 0.25, 0.40), ("0.40-0.60", 0.40, 0.60),
               ("0.60-0.80", 0.60, 0.80), ("0.80-1.00", 0.80, 1.01)]
    confidence_histogram = [
        {"bucket": label, "count": sum(1 for (_, _, c) in item_rows if lo <= (c or 0.0) < hi)}
        for label, lo, hi in buckets
    ]

    det_rows = db.query(
        DetectionModel.processing_time_ms,
        DetectionModel.detection_status,
        DetectionModel.latitude,
        DetectionModel.location_source,
    ).all()
    latencies = sorted(float(r[0]) for r in det_rows if r[0] is not None)
    status_counts = dict(Counter(r[1] for r in det_rows))
    with_location = sum(1 for r in det_rows if r[2] is not None)
    location_sources = dict(Counter((r[3] or "unknown") for r in det_rows))

    model_performance = {
        "has_accuracy_metrics": False,
        "accuracy_note": "Accuracy/precision/recall require a labelled evaluation set and are not computed by the application.",
        "confidence_by_group": confidence_by_group,
        "confidence_histogram": confidence_histogram,
        "latency_ms": {
            "samples": len(latencies),
            "mean": round(sum(latencies) / len(latencies), 1) if latencies else None,
            "p50": _percentile(latencies, 0.5),
            "p95": _percentile(latencies, 0.95),
        },
        "status_counts": status_counts,
        "with_location": with_location,
        "location_sources": location_sources,
    }

    # Monthly cleanup throughput from assignment rows.
    assignments = db.query(CleanupAssignmentModel).all()
    months: dict = defaultdict(lambda: {"created": 0, "completed": 0})
    for a in assignments:
        created_month = _as_date(a.created_at).strftime("%Y-%m")
        months[created_month]["created"] += 1
        if a.status in _DONE and a.completed_date is not None:
            months[_as_date(a.completed_date).strftime("%Y-%m")]["completed"] += 1
    open_now = sum(1 for a in assignments if a.status in ("pending", "assigned", "in_progress"))
    cleanup_performance = [
        {
            "month": datetime.strptime(m, "%Y-%m").strftime("%b %Y"),
            "created": v["created"],
            "completed": v["completed"],
            "completion_rate": round(v["completed"] / v["created"] * 100, 1) if v["created"] else None,
        }
        for m, v in sorted(months.items())
    ]

    # Daily severity mix from risk assessments.
    risk_rows = db.query(RiskAssessmentModel.computed_at, RiskAssessmentModel.level).all()
    severity_by_day: dict = defaultdict(lambda: {"low": 0, "medium": 0, "high": 0, "critical": 0})
    for computed_at, level in risk_rows:
        lvl = (level or "").lower()
        lvl = "medium" if lvl == "moderate" else lvl
        if lvl in ("low", "medium", "high", "critical"):
            severity_by_day[_as_date(computed_at)][lvl] += 1
    severity_timeline = [
        {"date": d.strftime("%b %d"), "iso_date": d.isoformat(), **severity_by_day.get(d, {"low": 0, "medium": 0, "high": 0, "critical": 0})}
        for d in (_date_range(min(severity_by_day), datetime.now(timezone.utc).date()) if severity_by_day else [])
    ]

    # Per observed cluster (same clustering as the Hotspots page).
    from app.api.v1.routers.detection_router import compute_hotspots
    hotspots = compute_hotspots(service, db).hotspots
    by_id = {a.id: a for a in assignments}
    locations = [
        {
            "hotspot_id": h.id,
            "name": h.name,
            "reports": h.report_count,
            "waste_objects": h.total_waste_objects,
            "avg_risk_score": h.avg_risk_score,
            "max_risk_score": h.max_risk_score,
            "severity": h.severity,
            "cleanups_completed": sum(
                1 for aid in h.assignment_ids if by_id.get(aid) and by_id[aid].status in _DONE
            ),
            "status": h.status,
        }
        for h in hotspots
    ]

    res = {
        "class_distribution": class_distribution,
        "model_performance": model_performance,
        "cleanup_performance": cleanup_performance,
        "open_assignments": open_now,
        "severity_timeline": severity_timeline,
        "locations": locations,
    }
    cache_set("analytics_insights", res, ttl_seconds=CACHE_TTL_SECONDS)
    return res
