"""Create user_profiles table for Supabase Auth and Google OAuth integration.

Additive and idempotent migration:
* Creates user_profiles table with id, email, full_name, avatar_url, role, created_at, updated_at
* Enables RLS on user_profiles if running on Supabase PostgreSQL

Revision ID: g4e3a7b8c2d1
Revises: f3d2b8c61a07
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "g4e3a7b8c2d1"
down_revision: Union[str, None] = "f3d2b8c61a07"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _is_supabase(bind) -> bool:
    if bind.dialect.name != "postgresql":
        return False
    return bool(bind.execute(sa.text("SELECT 1 FROM pg_roles WHERE rolname = 'anon'")).scalar())


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "user_profiles" not in tables:
        op.create_table(
            "user_profiles",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("email", sa.String(255), nullable=False, unique=True, index=True),
            sa.Column("full_name", sa.String(255), nullable=True),
            sa.Column("avatar_url", sa.String(512), nullable=True),
            sa.Column("role", sa.String(32), nullable=False, server_default="user"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )

    if _is_supabase(bind):
        op.execute('ALTER TABLE public."user_profiles" ENABLE ROW LEVEL SECURITY')


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())
    if "user_profiles" in tables:
        op.drop_table("user_profiles")
