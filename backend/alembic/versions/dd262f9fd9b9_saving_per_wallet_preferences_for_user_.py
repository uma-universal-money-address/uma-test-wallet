"""saving per wallet preferences for user data and counterparty requirements

Revision ID: dd262f9fd9b9
Revises: 65731fa8f965
Create Date: 2025-11-13 11:13:54.591171

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "dd262f9fd9b9"
down_revision: Union[str, None] = "65731fa8f965"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    kyc_status_enum = sa.Enum(
        "VERIFIED", "NOT_VERIFIED", "PENDING", "UNKNOWN", name="kycstatus"
    )

    # Add columns to wallet
    op.add_column(
        "wallet",
        sa.Column("country_of_residence", sa.String(length=2), nullable=True),
    )
    op.add_column("wallet", sa.Column("birthday", sa.Date(), nullable=True))
    op.add_column(
        "wallet",
        sa.Column(
            "kyc_status", kyc_status_enum, nullable=False, server_default="VERIFIED"
        ),
    )
    op.add_column("wallet", sa.Column("email_address", sa.String(), nullable=True))
    op.add_column("wallet", sa.Column("full_name", sa.String(), nullable=True))

    # Backfill wallet fields from user table for existing rows
    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
            UPDATE wallet
            SET
                country_of_residence = (
                    SELECT "user".country_of_residence
                    FROM "user"
                    WHERE "user".id = wallet.user_id
                ),
                birthday = (
                    SELECT "user".birthday
                    FROM "user"
                    WHERE "user".id = wallet.user_id
                ),
                kyc_status = (
                    SELECT "user".kyc_status
                    FROM "user"
                    WHERE "user".id = wallet.user_id
                ),
                email_address = (
                    SELECT "user".email_address
                    FROM "user"
                    WHERE "user".id = wallet.user_id
                ),
                full_name = (
                    SELECT "user".full_name
                    FROM "user"
                    WHERE "user".id = wallet.user_id
                )
        """
        )
    )

    with op.batch_alter_table("wallet", schema=None) as batch_op:
        batch_op.alter_column("kyc_status", server_default=None)

    # Drop redundant columns from user table
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.drop_column("birthday")
        batch_op.drop_column("country_of_residence")
        batch_op.drop_column("full_name")
        batch_op.drop_column("email_address")
        batch_op.drop_column("kyc_status")


def downgrade() -> None:
    kyc_status_enum = sa.Enum(
        "VERIFIED", "NOT_VERIFIED", "PENDING", "UNKNOWN", name="kycstatus"
    )

    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c["name"] for c in inspector.get_columns("user")]

    if "kyc_status" not in columns:
        op.add_column(
            "user",
            sa.Column(
                "kyc_status",
                kyc_status_enum,
                nullable=False,
                server_default="VERIFIED",
            ),
        )
    if "email_address" not in columns:
        op.add_column("user", sa.Column("email_address", sa.String(), nullable=True))
    if "full_name" not in columns:
        op.add_column("user", sa.Column("full_name", sa.String(), nullable=True))
    if "country_of_residence" not in columns:
        op.add_column(
            "user",
            sa.Column("country_of_residence", sa.String(length=2), nullable=True),
        )
    if "birthday" not in columns:
        op.add_column("user", sa.Column("birthday", sa.Date(), nullable=True))

    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
            UPDATE "user"
            SET
                kyc_status = wallet_data.kyc_status,
                email_address = wallet_data.email_address,
                full_name = wallet_data.full_name,
                country_of_residence = wallet_data.country_of_residence,
                birthday = wallet_data.birthday
            FROM (
                SELECT wallet.user_id,
                       wallet.kyc_status,
                       wallet.email_address,
                       wallet.full_name,
                       wallet.country_of_residence,
                       wallet.birthday
                FROM wallet
                JOIN uma ON uma.wallet_id = wallet.id
                WHERE uma."default" = 1
            ) AS wallet_data
            WHERE wallet_data.user_id = "user".id
        """
        )
    )

    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.alter_column("kyc_status", server_default="VERIFIED")

    # Remove columns from wallet
    with op.batch_alter_table("wallet", schema=None) as batch_op:
        batch_op.drop_column("full_name")
        batch_op.drop_column("email_address")
        batch_op.drop_column("kyc_status")
        batch_op.drop_column("birthday")
        batch_op.drop_column("country_of_residence")
