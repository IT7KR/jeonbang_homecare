"""Add applications and partners tables

Revision ID: 20251126_000002
Revises: 20251126_000001
Create Date: 2025-11-26 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20251126_000002"
down_revision: Union[str, None] = "20251126_000001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create applications table
    op.create_table(
        "applications",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("application_number", sa.String(12), nullable=False),
        sa.Column("customer_name", sa.String(500), nullable=False),
        sa.Column("customer_phone", sa.String(500), nullable=False),
        sa.Column("address", sa.String(1000), nullable=False),
        sa.Column("address_detail", sa.String(500), nullable=True),
        sa.Column("selected_services", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("photos", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="new"),
        sa.Column("assigned_partner_id", sa.BigInteger(), nullable=True),
        sa.Column("assigned_admin_id", sa.BigInteger(), nullable=True),
        sa.Column("scheduled_date", sa.Date(), nullable=True),
        sa.Column("scheduled_time", sa.String(20), nullable=True),
        sa.Column("estimated_cost", sa.Integer(), nullable=True),
        sa.Column("final_cost", sa.Integer(), nullable=True),
        sa.Column("admin_memo", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_applications_application_number"), "applications", ["application_number"], unique=True)
    op.create_index(op.f("ix_applications_status"), "applications", ["status"], unique=False)
    op.create_index(op.f("ix_applications_assigned_partner_id"), "applications", ["assigned_partner_id"], unique=False)

    # Create partners table
    op.create_table(
        "partners",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("company_name", sa.String(200), nullable=False),
        sa.Column("representative_name", sa.String(500), nullable=False),
        sa.Column("business_number", sa.String(100), nullable=True),
        sa.Column("contact_phone", sa.String(500), nullable=False),
        sa.Column("contact_email", sa.String(500), nullable=True),
        sa.Column("address", sa.String(1000), nullable=False),
        sa.Column("address_detail", sa.String(500), nullable=True),
        sa.Column("service_areas", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("work_regions", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("introduction", sa.Text(), nullable=True),
        sa.Column("experience", sa.Text(), nullable=True),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("approved_by", sa.BigInteger(), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("admin_memo", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_partners_status"), "partners", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_partners_status"), table_name="partners")
    op.drop_table("partners")

    op.drop_index(op.f("ix_applications_assigned_partner_id"), table_name="applications")
    op.drop_index(op.f("ix_applications_status"), table_name="applications")
    op.drop_index(op.f("ix_applications_application_number"), table_name="applications")
    op.drop_table("applications")
