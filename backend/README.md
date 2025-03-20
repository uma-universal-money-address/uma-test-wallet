# UMA Sandbox Backend

A VASP (Virtual Asset Service Provider) implementation for simulating UMA transactions. This backend serves as the server component of the UMA Test Wallet, handling UMA protocol interactions, user authentication, and payment processing.

## Features

- Complete UMA protocol implementation (both sending and receiving VASP functionality)
- User management and authentication
- Wallet and transaction management
- Push notification support
- Compliance service integration

## Prerequisites

- Python 3.11 (UMA SDK does not currently support Python 3.12)
- `pipenv` for dependency management
- SQLite for local development

## Setup and Installation

### 1. Clone the repository (if you haven't already)

```bash
git clone https://github.com/uma-universal-money-address/uma-test-wallet.git
cd uma-test-wallet/backend
```

### 2. Set up host configuration

Modify your `/etc/hosts` file to include domains for localhost:

```bash
sudo vi /etc/hosts
```

Add localhost domains:

```
127.0.0.1 localhost
127.0.0.1 local
```

> **IMPORTANT**: `local` is necessary because the Python UMA SDK checks for that string when determining whether to make certain requests with HTTP vs HTTPS.

### 3. Configure environment variables

Create a `.env` file with the following environment variables:

```bash
FLASK_SECRET_KEY=
LIGHTSPARK_API_TOKEN_CLIENT_ID=
LIGHTSPARK_API_TOKEN_CLIENT_SECRET=
LIGHTSPARK_WEBHOOK_SIGNING_KEY=
BITCOIN_NETWORK="REGTEST"
LIGHTSPARK_NODE_ID=
LIGHTSPARK_OSK_NODE_SIGNING_KEY_PASSWORD="1234!@#$"
LIGHTSPARK_UMA_ENCRYPTION_PUBKEY=
LIGHTSPARK_UMA_ENCRYPTION_PRIVKEY=
LIGHTSPARK_UMA_SIGNING_PUBKEY=
LIGHTSPARK_UMA_SIGNING_PRIVKEY=
LIGHTSPARK_UMA_ENCRYPTION_CERT_CHAIN=
LIGHTSPARK_UMA_SIGNING_CERT_CHAIN=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_CLAIM_EMAIL=
```

`FLASK_SECRET_KEY` is used to sign session cookies. See the [Flask documentation](https://flask.palletsprojects.com/en/latest/quickstart/#sessions) for more details.

### 4. Install dependencies

```bash
pipenv install -d
```

### 5. Set up the database

Create the database file if it doesn't already exist:

```bash
mkdir -p instance
touch instance/vasp.sqlite
```

Run migrations on the database:

```bash
FLASK_CONFIG="config/local-dev.py" pipenv run alembic upgrade head
```

> The schema is defined with SQLAlchemy ORMs in `vasp/models`

## Running the Application

### Using the convenience script

The easiest way to run the backend is with the provided script, which sets all the needed environment variables for you:

```bash
sh run_backend.sh
```

### Manually running the server

Alternatively, you can run the server manually:

```bash
FLASK_CONFIG="config/local-dev.py" FLASK_APP=vasp pipenv run flask run --host=0.0.0.0 --port=5000
```

## Development

### Code Formatting

We use `black` to format Python files:

```bash
pipenv run black .
```

### Running Tests

```bash
pipenv run pytest
```

### API Documentation

The backend provides several API endpoints:

- UMA protocol endpoints (`/.well-known/lnurlp/<username>`, `/api/uma/payreq/...`)
- User management endpoints (`/user`, `/login`, `/logout`)
- Wallet management endpoints (`/wallets`, `/transactions`)
- Webhook endpoints for handling payments (`/webhooks/transaction`)

## Troubleshooting

### Common Issues

1. **UMA SDK Python version compatibility**: 
   - The UMA SDK doesn't support Python 3.12, so make sure to use Python 3.11.

2. **Certificate errors**:
   - If you encounter SSL certificate validation errors, check that your local domain configuration is correct.

3. **Database migration issues**:
   - If you encounter database migration issues, you may need to delete the database file and recreate it.

## Architecture

The backend implements several key services:

- **User Service**: Manages user accounts and authentication
- **Ledger Service**: Handles wallet balances and transactions
- **Currency Service**: Manages supported currencies and exchange rates
- **Compliance Service**: Handles compliance checks for transactions
- **Sending VASP**: Implements the sending side of UMA transactions
- **Receiving VASP**: Implements the receiving side of UMA transactions

These services interact with Lightspark for Lightning Network operations.
