"""Flag seeded demonstration records as samples.

Earlier versions seeded fictional NGO teams (invented contacts and performance
figures) and assignments (e.g. a "drone survey" that never happened) at startup,
indistinguishable from real records. Rather than delete anyone's data, this adds an
``is_sample`` flag, marks the rows that exactly match the seed fixtures, and lets the
UI label them. Additive and idempotent; real records default to false.

Revision ID: f3d2b8c61a07
Revises: e7c1a9d24f50
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f3d2b8c61a07"
down_revision: Union[str, None] = "e7c1a9d24f50"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SEED_NGO_EMAILS = (
    "rajiv@cleanocean.org",
    "priya@greenearth.org",
    "mario@coastalcare.org",
    "deb@riverwatch.org",
    "ananya@ecowarriors.in",
)
SEED_ASSIGNMENT_TITLES = (
    "Shoreline High-Density Plastic Cleanup",
    "Coastal Buffer Debris Removal",
    "Beachfront Recyclable Materials Extraction",
    "Riparian Zone Surface Cleanup",
)


def _columns(bind, table: str) -> set:
    inspector = sa.inspect(bind)
    if table not in inspector.get_table_names():
        return set()
    return {c["name"] for c in inspector.get_columns(table)}


def upgrade() -> None:
    bind = op.get_bind()
    for table in ("ngo_teams", "cleanup_assignments"):
        cols = _columns(bind, table)
        if cols and "is_sample" not in cols:
            op.add_column(
                table,
                sa.Column("is_sample", sa.Boolean(), nullable=False, server_default=sa.false()),
            )

    if _columns(bind, "ngo_teams"):
        bind.execute(
            sa.text("UPDATE ngo_teams SET is_sample = :t WHERE email IN :emails").bindparams(
                sa.bindparam("emails", expanding=True)
            ),
            {"t": True, "emails": list(SEED_NGO_EMAILS)},
        )
    if _columns(bind, "cleanup_assignments"):
        bind.execute(
            sa.text("UPDATE cleanup_assignments SET is_sample = :t WHERE title IN :titles").bindparams(
                sa.bindparam("titles", expanding=True)
            ),
            {"t": True, "titles": list(SEED_ASSIGNMENT_TITLES)},
        )


def downgrade() -> None:
    bind = op.get_bind()
    for table in ("ngo_teams", "cleanup_assignments"):
        if "is_sample" in _columns(bind, table):
            with op.batch_alter_table(table) as batch:
                batch.drop_column("is_sample")
