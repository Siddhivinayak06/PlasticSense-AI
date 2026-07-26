"""initial detection schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-07-26 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'detections',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('image_url', sa.String(length=512), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('model_version', sa.String(length=64), nullable=False),
        sa.Column('detection_status', sa.String(length=32), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table(
        'detection_items',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('detection_id', sa.String(length=36), nullable=False),
        sa.Column('waste_type', sa.String(length=64), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('bbox_x', sa.Float(), nullable=False),
        sa.Column('bbox_y', sa.Float(), nullable=False),
        sa.Column('bbox_w', sa.Float(), nullable=False),
        sa.Column('bbox_h', sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(['detection_id'], ['detections.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('detection_items')
    op.drop_table('detections')
