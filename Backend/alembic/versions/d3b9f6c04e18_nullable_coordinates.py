"""Make detections.latitude/longitude nullable.

The original table declared both NOT NULL. That makes a perfectly valid report -
a photo with no EXIF GPS, no readable coordinate overlay, and no coordinates typed
by the operator - impossible to store, so analysis failed with a 500 instead of
succeeding without a location.

Revision ae2e0de342a7 intended this change but had never been applied to the local
SQLite database (alembic_version was empty and the schema came from create_all).
This revision performs it idempotently so databases in either state converge.

SQLite cannot ALTER a column's nullability, so batch_alter_table recreates the
table and copies the rows. A backup is strongly advised before running - see
docs/ROLLBACK.md.

Revision ID: d3b9f6c04e18
Revises: c2a8e5b31f47
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d3b9f6c04e18"
down_revision: Union[str, None] = "c2a8e5b31f47"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _nullable_map(bind, table: str) -> dict:
    inspector = sa.inspect(bind)
    if table not in inspector.get_table_names():
        return {}
    return {c["name"]: c["nullable"] for c in inspector.get_columns(table)}


def upgrade() -> None:
    bind = op.get_bind()
    nullable = _nullable_map(bind, "detections")
    needs = [c for c in ("latitude", "longitude") if nullable.get(c) is False]
    if not needs:
        return

    with op.batch_alter_table("detections") as batch:
        for col in needs:
            batch.alter_column(col, existing_type=sa.Float(), nullable=True)


def downgrade() -> None:
    # Deliberately not reinstating NOT NULL: rows with NULL coordinates are valid
    # under the current model and restoring the constraint would fail on them.
    pass
