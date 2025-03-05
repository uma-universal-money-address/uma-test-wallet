# flask environment variables
export FLASK_CONFIG="config/local-dev.py"
export FLASK_APP=vasp
export FLASK_ENV=development
export FLASK_DEBUG=True
export FLASK_RUN_PORT=4000

pipenv run flask run --host=127.0.0.1