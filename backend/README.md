# UMA Sandbox Backend

A VASP implementation for simulating UMA transactions.

## Run the flask server locally

Create a `.env` file with the following environment variables:

```bash
FLASK_SECRET_KEY=
LIGHTSPARK_API_TOKEN_CLIENT_ID=
LIGHTSPARK_API_TOKEN_CLIENT_SECRET=
BITCOIN_NETWORK="REGTEST"
LIGHTSPARK_NODE_ID=
LIGHTSPARK_OSK_NODE_SIGNING_KEY_PASSWORD="1234!@#$"
LIGHTSPARK_UMA_ENCRYPTION_PUBKEY=
LIGHTSPARK_UMA_ENCRYPTION_PRIVKEY=
LIGHTSPARK_UMA_SIGNING_PUBKEY=
LIGHTSPARK_UMA_SIGNING_PRIVKEY=
LIGHTSPARK_UMA_ENCRYPTION_CERT_CHAIN=
LIGHTSPARK_UMA_SIGNING_CERT_CHAIN=
```

`FLASK_SECRET_KEY` is used to sign session cookies: https://flask.palletsprojects.com/en/latest/quickstart/#sessions

Install dependencies:

```bash
pipenv install -d
```

Create the db file if it doesn't already exist:

```bash
mkdir instance
touch instance/vasp.sqlite
```

Run migrations on the db:

```bash
FLASK_CONFIG="local-dev.py" pipenv run alembic upgrade head
```

> The schema is defined with SQLAlchemy ORMs in `vasp/models`

Run the backend:

```bash
sh run_backend.sh
```

Alternatively you could just run the `run_backend.sh` script which sets all the needed env variables for you

## Run black

We use `black` to format python files.

```bash
pipenv run black .
```

## Setup

Modify your /etc/hosts file to include domains for localhost:

```bash
sudo vi /etc/hosts
```

Add localhost domains:

```bash
127.0.0.1 localhost
127.0.0.1 local
...
```

> IMPORTANT: `local` is necessary because the python uma-sdk checks for that string when determining to make certain requests with http vs https.

> Warning: uma-sdk does not currently support Python 3.12, so you will need to downgrade to Python 3.11.
