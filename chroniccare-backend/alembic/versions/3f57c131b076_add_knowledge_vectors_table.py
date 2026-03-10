"""add knowledge vectors table

Revision ID: 3f57c131b076
Revises: 432c26749211
Create Date: 2026-02-27

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# ↓ 이 두 줄이 핵심!
revision = '3f57c131b076'
down_revision = '432c25749211'
branch_labels = None
depends_on = None


def upgrade():
    # pgvector 확장 활성화
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        'knowledge_vectors',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('tags', JSONB, nullable=True),
        sa.Column('severity', sa.String(20), nullable=True),
        sa.Column('embedding', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('knowledge_vectors')
