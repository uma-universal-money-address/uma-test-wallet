# flask environment variables
export FLASK_CONFIG="config/local-dev.py"
export FLASK_APP=vasp
export FLASK_ENV=development
export FLASK_DEBUG=True
export FLASK_RUN_PORT=4000

# Create a Python script to run the SocketIO server
cat > run_socketio.py << 'EOF'
from vasp import create_app
from vasp.websocket import socketio

app = create_app()
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=4000, debug=True, allow_unsafe_werkzeug=True)
EOF

# Run the SocketIO server
pipenv run python run_socketio.py
