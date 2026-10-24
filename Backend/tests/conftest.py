"""Keep in-process tests away from real cloud resources.

The app uses Supabase Storage whenever SUPABASE_URL/KEY are configured in .env.
Environment variables take precedence over .env in pydantic-settings, so blanking
them here makes every StorageClient created during tests write to a temp dir
instead of uploading test images into the real bucket.
"""
import os

os.environ["SUPABASE_URL"] = ""
os.environ["SUPABASE_KEY"] = ""
