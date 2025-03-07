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
