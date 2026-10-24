"""Sync live schema with ORM models (idempotent, additive, data-preserving).

The local SQLite database was originally created by ``Base.metadata.create_all`` and
then drifted as the ORM models gained columns. ``create_all`` never alters existing
tables, so inserts began failing with "table detections has no column named
annotated_image_url".

This migration is deliberately **idempotent**: it inspects the live schema and adds
only the columns that are actually absent. That makes it safe to run against
databases in any of the historical states (fully migrated, partially migrated, or
create_all-generated), which is the situation on developer machines here.

No column is dropped and no row is deleted. Existing ``detection_items`` rows are
backfilled from the legacy ``waste_type`` column so historical detections keep
meaningful labels instead of the 'unknown' placeholder.

Revision ID: b1f4c7a2d9e0
Revises: 6d878019c7c3
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b1f4c7a2d9e0"
down_revision: Union[str, None] = "6d878019c7c3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# table -> list of (column_name, column_factory)
ADDITIONS = {
    "detections": [
        ("annotated_image_url", lambda: sa.Column("annotated_image_url", sa.String(512), nullable=True)),
        ("location_source", lambda: sa.Column("location_source", sa.String(50), nullable=True)),
        ("location_confidence", lambda: sa.Column("location_confidence", sa.Float(), nullable=True)),
        ("processing_time_ms", lambda: sa.Column("processing_time_ms", sa.Float(), nullable=True)),
    ],
    "detection_items": [
        # NOT NULL additions need a server_default so SQLite can backfill existing rows.
        ("class_name", lambda: sa.Column("class_name", sa.String(128), nullable=False, server_default="unknown")),
        ("waste_group", lambda: sa.Column("waste_group", sa.String(64), nullable=False, server_default="unknown")),
    ],
}


def _existing_columns(bind, table: str) -> set:
    inspector = sa.inspect(bind)
    if table not in inspector.get_table_names():
        return set()
    return {c["name"] for c in inspector.get_columns(table)}


def upgrade() -> None:
    bind = op.get_bind()

    for table, columns in ADDITIONS.items():
        present = _existing_columns(bind, table)
        if not present:
            # Table absent entirely; create_all / earlier revisions own its creation.
            continue
        for name, factory in columns:
            if name not in present:
                op.add_column(table, factory())

    # Backfill legacy rows: the old schema stored a single coarse 'waste_type'.
    # Use it for both the display name and the material group rather than leaving
    # historical detections labelled 'unknown'.
    present_items = _existing_columns(bind, "detection_items")
    if {"class_name", "waste_group", "waste_type"} <= present_items:
        bind.execute(
            sa.text(
                "UPDATE detection_items "
                "SET class_name = waste_type "
                "WHERE class_name = 'unknown' AND waste_type IS NOT NULL AND waste_type != ''"
            )
        )
        bind.execute(
            sa.text(
                "UPDATE detection_items "
                "SET waste_group = waste_type "
                "WHERE waste_group = 'unknown' AND waste_type IS NOT NULL AND waste_type != ''"
            )
        )


def downgrade() -> None:
    bind = op.get_bind()
    for table, columns in ADDITIONS.items():
        present = _existing_columns(bind, table)
        for name, _ in columns:
            if name in present:
                op.drop_column(table, name)
