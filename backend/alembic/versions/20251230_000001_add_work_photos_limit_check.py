"""Add CHECK constraints for work_photos_before and work_photos_after (max 30)

Revision ID: 20251230_000001
Revises: 20251229_000005
Create Date: 2025-12-30
"""
from alembic import op


# revision identifiers
revision = '20251230_000001'
down_revision = '20251229_000005'
branch_labels = None
depends_on = None


def upgrade():
    """Add CHECK constraints to limit work photos to 30 per type"""
    # 시공 전 사진 30장 제한
    op.execute("""
        ALTER TABLE application_partner_assignments
        ADD CONSTRAINT check_work_photos_before_limit
        CHECK (jsonb_array_length(COALESCE(work_photos_before, '[]'::jsonb)) <= 30);
    """)

    # 시공 후 사진 30장 제한
    op.execute("""
        ALTER TABLE application_partner_assignments
        ADD CONSTRAINT check_work_photos_after_limit
        CHECK (jsonb_array_length(COALESCE(work_photos_after, '[]'::jsonb)) <= 30);
    """)


def downgrade():
    """Remove CHECK constraints"""
    op.execute("""
        ALTER TABLE application_partner_assignments
        DROP CONSTRAINT IF EXISTS check_work_photos_before_limit;
    """)
    op.execute("""
        ALTER TABLE application_partner_assignments
        DROP CONSTRAINT IF EXISTS check_work_photos_after_limit;
    """)
