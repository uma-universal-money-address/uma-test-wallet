"""add payreq_response table

Revision ID: f3cc7214cccf
Revises: bf91aca96fc9
Create Date: 2024-12-19 14:30:04.713010

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f3cc7214cccf"
down_revision: Union[str, None] = "bf91aca96fc9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "payreq_response",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("uma_id", sa.String(), nullable=False),
        sa.Column("payment_hash", sa.String(), nullable=False),
        sa.Column("amount_in_lowest_denom", sa.Integer(), nullable=False),
        sa.Column("currency_code", sa.String(), nullable=False),
        sa.Column("exchange_fees_msats", sa.Integer(), nullable=False),
        sa.Column("multiplier", sa.Float(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("sender_uma", sa.String(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["uma_id"],
            ["uma.id"],
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["user.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table("payreq_response")
    # ### end Alembic commands ###
