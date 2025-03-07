# pyre-strict

import json
import logging
from typing import Dict

from flask import Flask
from flask_login import current_user
from flask_socketio import SocketIO, emit, disconnect

log: logging.Logger = logging.getLogger(__name__)

# Initialize SocketIO instance
socketio = SocketIO()

# This demo uses a simple websocket approach - broadcast to all clients
# and let the client filter based on the wallet ID.  In a production app
# you would only broadcast to the appropriate clients.


def init_app(app: Flask) -> None:
    """Initialize the WebSocket server with the Flask app."""
    socketio.init_app(
        app,
        cors_allowed_origins="*",  # In production, this should be restricted
        async_mode="eventlet", 
    register_handlers()


def register_handlers() -> None:
    """Register WebSocket event handlers."""

    @socketio.on("connect")
    def handle_connect() -> None:
        """Handle client connection."""
        try:
            log.info("Client connected")
        except Exception as e:
            log.error(f"Error in handle_connect: {e}")

    @socketio.on("disconnect")
    def handle_disconnect() -> None:
        """Handle client disconnection."""
        try:
            log.info("Client disconnected")
        except Exception as e:
            log.error(f"Error in handle_disconnect: {e}")


def emit_balance_update(user_id: str, wallet_id: str, new_balance: int, currency_code: str, transaction: Dict) -> None:
    """
    Emit a balance update event to all clients.
    The clients will filter based on the wallet ID.
    
    Args:
        user_id: The ID of the user to send the update to
        wallet_id: The ID of the wallet that was updated
        new_balance: The new balance in lowest denomination
        currency_code: The currency code (e.g., "SAT")
        transaction: Transaction details
    """
    event_data = {
        "event": "balance_update",
        "data": {
            "userId": user_id,
            "walletId": wallet_id,
            "newBalance": new_balance,
            "currency": currency_code,
            "transaction": transaction
        }
    }

    try:
        # Broadcast to all connected clients
        socketio.emit("wallet_event", event_data)
        log.info(f"Broadcast balance update for wallet {wallet_id}")
    except Exception as e:
        log.error(f"Error emitting balance update: {e}")
