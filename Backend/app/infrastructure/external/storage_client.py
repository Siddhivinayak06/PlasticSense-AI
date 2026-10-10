import os
import uuid
import logging
from typing import Tuple
from app.core.config import settings
from supabase import create_client, Client

logger = logging.getLogger(__name__)

class StorageClient:
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        self.use_supabase = bool(settings.SUPABASE_URL and settings.SUPABASE_KEY)
        
        if self.use_supabase:
            self.supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            self.bucket_name = settings.SUPABASE_BUCKET_NAME
        else:
            os.makedirs(self.upload_dir, exist_ok=True)

    def save_file(self, file_bytes: bytes, original_filename: str) -> str:
        ext = os.path.splitext(original_filename)[1].lower()
        if not ext:
            ext = ".jpg"
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        
        if self.use_supabase:
            try:
                # Upload to Supabase
                response = self.supabase.storage.from_(self.bucket_name).upload(
                    file=file_bytes,
                    path=unique_filename,
                    file_options={"content-type": f"image/{ext.lstrip('.')}"}
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
        file_path = os.path.join(self.upload_dir, unique_filename)
        with open(file_path, "wb") as f:
            f.write(file_bytes)
        # Return relative URL path for serving statically
        return f"/static/uploads/{unique_filename}"

storage_client = StorageClient()
