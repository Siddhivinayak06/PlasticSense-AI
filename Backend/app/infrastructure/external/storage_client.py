import os
import uuid
import logging
from typing import Optional, Tuple
from app.core.config import settings

# Supabase is optional: the local deployment stores uploads on disk. Importing it
# unconditionally made the whole backend fail to start when the package was absent.
try:
    from supabase import create_client, Client  # type: ignore
    HAS_SUPABASE = True
except ImportError:  # pragma: no cover - depends on local environment
    create_client = None  # type: ignore
    Client = None  # type: ignore
    HAS_SUPABASE = False

logger = logging.getLogger(__name__)

SAFE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

class StorageClient:
    def __init__(self, upload_dir: Optional[str] = None, url_prefix: Optional[str] = None):
        """
        upload_dir: directory bytes are written to.
        url_prefix: public path those bytes are served from. It MUST correspond to
            the static mount for upload_dir. Previously _save_local always returned
            "/static/uploads/..." no matter which directory it wrote to, and callers
            string-rewrote the prefix afterwards - so annotated images reported
            /media/results/<file> while the file sat in the uploads directory, and
            every annotated image URL 404'd.
        """
        self.upload_dir = upload_dir or settings.UPLOAD_DIR
        self.url_prefix = (url_prefix or "/media/uploads").rstrip("/")
        self.use_supabase = bool(settings.SUPABASE_URL and settings.SUPABASE_KEY)

        if self.use_supabase and not HAS_SUPABASE:
            logger.warning(
                "SUPABASE_URL/KEY are set but the 'supabase' package is not installed; "
                "falling back to local disk storage at %s",
                self.upload_dir,
            )
            self.use_supabase = False

        if self.use_supabase:
            self.supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            self.bucket_name = settings.SUPABASE_BUCKET_NAME
        else:
            os.makedirs(self.upload_dir, exist_ok=True)
    def save_file(self, file_bytes: bytes, original_filename: str) -> str:
        # Only the basename's extension is used and the name itself is a fresh UUID,
        # so client input can never choose the path (no traversal) or a servable
        # non-image type (e.g. .html/.svg) under the static media mounts.
        ext = os.path.splitext(os.path.basename(original_filename or ""))[1].lower()
        if not ext:
            ext = ".jpg"
        if ext not in SAFE_EXTENSIONS:
            raise ValueError(f"Refusing to store file with extension '{ext}'")
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        
        if self.use_supabase:
            try:
                # Upload to Supabase
                response = self.supabase.storage.from_(self.bucket_name).upload(
                    file=file_bytes,
                    path=unique_filename,
                    file_options={"content-type": {".jpg": "image/jpeg", ".jpeg": "image/jpeg"}.get(ext, f"image/{ext.lstrip('.')}")}
                )
                
                # Get public URL
                url = self.supabase.storage.from_(self.bucket_name).get_public_url(unique_filename)
                return url
            except Exception as e:
                logger.error(f"Failed to upload to Supabase: {e}")
                # Fallback to local
                return self._save_local(file_bytes, unique_filename)
        else:
            return self._save_local(file_bytes, unique_filename)

    def _save_local(self, file_bytes: bytes, unique_filename: str) -> str:
        os.makedirs(self.upload_dir, exist_ok=True)
        file_path = os.path.join(self.upload_dir, unique_filename)
        with open(file_path, "wb") as f:
            f.write(file_bytes)
        # URL matching the static mount for this instance's directory.
        return f"{self.url_prefix}/{unique_filename}"

storage_client = StorageClient()
LocalStorageClient = StorageClient
