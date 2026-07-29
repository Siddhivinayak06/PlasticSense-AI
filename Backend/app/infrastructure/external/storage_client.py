import os
import uuid
from typing import Tuple
from app.core.config import settings


class LocalStorageClient:
    def __init__(self, upload_dir: str = settings.UPLOAD_DIR):
        self.upload_dir = upload_dir
        os.makedirs(self.upload_dir, exist_ok=True)

    def save_file(self, file_bytes: bytes, original_filename: str) -> str:
        ext = os.path.splitext(original_filename)[1].lower()
        if not ext:
            ext = ".jpg"
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(self.upload_dir, unique_filename)
        
        with open(file_path, "wb") as f:
            f.write(file_bytes)
            
        # Return relative URL path for serving statically
        return f"/static/uploads/{unique_filename}"


storage_client = LocalStorageClient()
