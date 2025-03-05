from flask import Flask
from vasp import create_app
from vasp.websocket import socketio

app: Flask = create_app()

# This is used when running with gunicorn or other WSGI servers
# For development, we use the socketio.run() method in run_backend.sh
