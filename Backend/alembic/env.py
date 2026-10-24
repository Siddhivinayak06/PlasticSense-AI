import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# Add current directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.infrastructure.database.session import (
    Base,
    DB_BACKEND,
    DB_FALLBACK_REASON,
    database_url as resolved_database_url,
)
# Import every model module so Base.metadata is complete for autogenerate.
from app.infrastructure.database import models  # noqa: F401

config = context.config

if config.config_file_name:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url():
    """Use the same URL the application resolved.

    session.py falls back to local SQLite when the configured PostgreSQL server is
    unreachable. Alembic must migrate the database the app actually uses, otherwise
    migrations silently target a server that is not there.

    The reverse is also dangerous: if DATABASE_URL is configured but unreachable, an
    `alembic upgrade` would quietly migrate the SQLite fallback and report success.
    Refuse that case; set DB_FORCE_SQLITE=true to migrate SQLite deliberately.
    """
    if DB_BACKEND == "sqlite-fallback" and os.environ.get("ALEMBIC_ALLOW_FALLBACK") != "1":
        raise SystemExit(
            f"Refusing to migrate: the configured database is unreachable ({DB_FALLBACK_REASON}) "
            "and the app fell back to local SQLite. Fix DATABASE_URL, or set DB_FORCE_SQLITE=true "
            "to migrate SQLite on purpose."
        )
    print(f"[alembic] target database backend: {DB_BACKEND}", file=sys.stderr)
    return resolved_database_url


def run_migrations_offline() -> None:
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = get_url()
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
