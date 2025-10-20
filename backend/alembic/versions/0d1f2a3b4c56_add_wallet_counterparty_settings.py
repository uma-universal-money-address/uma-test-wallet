"""add wallet counterparty request/provided tables

Revision ID: 0d1f2a3b4c56
Revises: bf91aca96fc9
Create Date: 2025-10-18 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0d1f2a3b4c56"
down_revision: Union[str, None] = "bf91aca96fc9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # wallet_counterparty_request
    op.create_table(
        "wallet_counterparty_request",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column(
            "wallet_id",
            sa.String(),
            sa.ForeignKey("wallet.id"),
            nullable=False,
            unique=True,
        ),
        sa.Column(
            "request_name", sa.Boolean(), nullable=False, server_default=sa.text("0")
        ),
        sa.Column(
            "request_email", sa.Boolean(), nullable=False, server_default=sa.text("0")
        ),
        sa.Column(
            "request_identifier",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("1"),
        ),
        sa.Column(
            "request_account_identifier",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "request_compliance",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("1"),
        ),
        sa.Column(
            "request_postal_address",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "request_phone_number",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "request_country_of_residence",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "request_birth_date",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "request_account_name",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "request_financial_institution_lei",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column("note", sa.String(), nullable=True),
    )

    # wallet_counterparty_provided
    op.create_table(
        "wallet_counterparty_provided",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column(
            "wallet_id",
            sa.String(),
            sa.ForeignKey("wallet.id"),
            nullable=False,
            unique=True,
        ),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("phone_number", sa.String(), nullable=True),
        sa.Column("user_type", sa.String(), nullable=True),
        sa.Column("nationality", sa.String(length=2), nullable=True),
        sa.Column("country_of_residence", sa.String(length=2), nullable=True),
        sa.Column("birth_date", sa.String(), nullable=True),
        sa.Column("account_name", sa.String(), nullable=True),
        sa.Column("financial_institution_lei", sa.String(), nullable=True),
        sa.Column("address_line1", sa.String(), nullable=True),
        sa.Column("address_line2", sa.String(), nullable=True),
        sa.Column("city", sa.String(), nullable=True),
        sa.Column("state", sa.String(), nullable=True),
        sa.Column("postal_code", sa.String(), nullable=True),
        sa.Column("country", sa.String(length=2), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("wallet_counterparty_provided")
    op.drop_table("wallet_counterparty_request")
