"""Add detections.captured_at (EXIF capture time, distinct from upload time).

created_at records when the image reached the server. For waste reporting the time
the photograph was actually taken matters independently: a site photographed days
earlier may be uploaded in a batch later, and cleanup prioritisation should reason
about observation time, not ingest time.

Idempotent and additive, for the same reasons described in b1f4c7a2d9e0.

Revision ID: c2a8e5b31f47
Revises: b1f4c7a2d9e0
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c2a8e5b31f47"
down_revision: Union[str, None] = "b1f4c7a2d9e0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _columns(bind, table: str) -> set:
    inspector = sa.inspect(bind)
    if table not in inspector.get_table_names():
        return set()
    return {c["name"] for c in inspector.get_columns(table)}


def upgrade() -> None:
    bind = op.get_bind()
    present = _columns(bind, "detections")
    if present and "captured_at" not in present:
        op.add_column(
            "detections",
            sa.Column("captured_at", sa.DateTime(timezone=True), nullable=True),
        )


def downgrade() -> None:
    bind = op.get_bind()
    if "captured_at" in _columns(bind, "detections"):
        op.drop_column("detections", "captured_at")
