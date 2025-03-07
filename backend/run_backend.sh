# flask environment variables
export FLASK_CONFIG="config/local-dev.py"
export FLASK_APP=vasp
export FLASK_ENV=development
export FLASK_DEBUG=True
export FLASK_RUN_PORT=4000
export FLASK_RUN_HOST=0.0.0.0

# Create a Python script to run the SocketIO server with proper monkey patching
cat > run_socketio.py << 'EOF'
# IMPORTANT: Monkey patching must happen at the very beginning, before any other imports
import eventlet
eventlet.monkey_patch()

import os
from vasp import create_app
from vasp.websocket import socketio

# Create the Flask app
app = create_app()

if __name__ == '__main__':
    # Run the SocketIO server with eventlet
    port = int(os.environ.get('FLASK_RUN_PORT', 4000))
    debug = os.environ.get('FLASK_DEBUG', 'True').lower() in ('true', '1', 't')
    
    print(f"Starting SocketIO server on port {port} with debug={debug}")
    socketio.run(
        app, 
        host='0.0.0.0', 
        port=port, 
        debug=debug, 
        allow_unsafe_werkzeug=True,
        log_output=True
    )
EOF

# Run the SocketIO server
pipenv run python run_socketio.py
