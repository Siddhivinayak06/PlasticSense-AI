"""Lock down application tables against Supabase's public Data API.

Supabase exposes every table in the ``public`` schema through PostgREST to the
``anon`` and ``authenticated`` roles. The frontend never talks to Supabase
directly - all access goes through the FastAPI backend, which connects as the
``postgres`` role (that role bypasses RLS). So the correct posture is:

* RLS enabled on every application table, including ``alembic_version`` which
  Alembic creates without it, with no permissive policies (deny-all), and
* table privileges revoked from ``anon``/``authenticated`` as defence in depth.
  RLS does not govern TRUNCATE, so revoking privileges closes that gap too.

No data is touched. Skipped entirely on SQLite and on PostgreSQL servers that
have no ``anon`` role (i.e. not Supabase).

Revision ID: e7c1a9d24f50
Revises: d3b9f6c04e18
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e7c1a9d24f50"
down_revision: Union[str, None] = "d3b9f6c04e18"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLES = (
    "detections",
    "detection_items",
    "risk_assessments",
    "ngo_teams",
    "cleanup_assignments",
    "alembic_version",
)
API_ROLES = ("anon", "authenticated")


def _is_supabase(bind) -> bool:
    if bind.dialect.name != "postgresql":
        return False
    return bool(bind.execute(sa.text("SELECT 1 FROM pg_roles WHERE rolname = 'anon'")).scalar())


def _present(bind) -> list:
    existing = set(sa.inspect(bind).get_table_names(schema="public"))
    return [t for t in TABLES if t in existing]


def upgrade() -> None:
    bind = op.get_bind()
    if not _is_supabase(bind):
        return
    for table in _present(bind):
        op.execute(f'ALTER TABLE public."{table}" ENABLE ROW LEVEL SECURITY')
        for role in API_ROLES:
            op.execute(f'REVOKE ALL ON TABLE public."{table}" FROM {role}')


def downgrade() -> None:
    bind = op.get_bind()
    if not _is_supabase(bind):
        return
    # Restore Supabase's default grants. RLS stays enabled: with no policies it
    # still denies API access, which was the pre-existing state for these tables.
    for table in _present(bind):
        for role in API_ROLES:
            op.execute(f'GRANT ALL ON TABLE public."{table}" TO {role}')
