# UMA Sandbox Backend

A VASP implementation for simulating UMA transactions.

## Run the quart server locally

Create a `.quartenv` file:

```bash
QUART_APP=sandbox_vasp
QUART_DEBUG=True
QUART_RUN_PORT=8080
QUART_ENV=development
```

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
QUART_CONFIG="local-dev.py" pipenv run alembic upgrade head
```

> The schema is defined with SQLAlchemy ORMs in `vasp/models`

Run the backend:

```bash
QUART_CONFIG="local-dev.py" pipenv run quart run
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
