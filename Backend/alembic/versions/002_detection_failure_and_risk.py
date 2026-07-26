"""add detection failure reason and risk assessments

Revision ID: 002_detection_failure_and_risk
Revises: 001_initial_schema
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "002_detection_failure_and_risk"
down_revision = "001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("detections", sa.Column("failure_reason", sa.String(length=512), nullable=True))
    op.create_table(
        "risk_assessments",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("detection_id", sa.String(length=36), nullable=False, unique=True),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("level", sa.String(length=16), nullable=False),
        sa.Column("strategy_breakdown", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("computed_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["detection_id"], ["detections.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_risk_assessments_detection_id", "risk_assessments", ["detection_id"])


def downgrade() -> None:
    op.drop_index("ix_risk_assessments_detection_id", table_name="risk_assessments")
    op.drop_table("risk_assessments")
    op.drop_column("detections", "failure_reason")
