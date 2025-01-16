FROM python:3.11-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1000 web && \
    adduser --system --uid 1000 --ingroup web --home /home/web web

WORKDIR /app

COPY Pipfile Pipfile.lock /app/
RUN pip install --upgrade pip wheel setuptools && \
    pip install --no-cache-dir --user pipenv && \
    /root/.local/bin/pipenv install --system --deploy --ignore-pipfile --extra-pip-args=--ignore-installed && \
    rm -rf /root/.cache

COPY . /app

ENV FLASK_CONFIG="config/local-dev.py"
ENV FLASK_SECRET_KEY=""
ENV LIGHTSPARK_API_TOKEN_CLIENT_ID=""
ENV LIGHTSPARK_API_TOKEN_CLIENT_SECRET=""
ENV LIGHTSPARK_WEBHOOK_SIGNING_KEY=
ENV BITCOIN_NETWORK="REGTEST"
ENV LIGHTSPARK_NODE_ID=
ENV LIGHTSPARK_OSK_NODE_SIGNING_KEY_PASSWORD="1234!@#$"
ENV LIGHTSPARK_UMA_ENCRYPTION_PUBKEY=
ENV LIGHTSPARK_UMA_ENCRYPTION_PRIVKEY=
ENV LIGHTSPARK_UMA_SIGNING_PUBKEY=
ENV LIGHTSPARK_UMA_SIGNING_PRIVKEY=
ENV LIGHTSPARK_UMA_ENCRYPTION_CERT_CHAIN=
ENV LIGHTSPARK_UMA_SIGNING_CERT_CHAIN=
ENV VAPID_PUBLIC_KEY=
ENV VAPID_PRIVATE_KEY=
ENV VAPID_CLAIM_EMAIL=

RUN alembic upgrade head

RUN chmod -R 777 /tmp

EXPOSE 8000
USER web
ENTRYPOINT ["gunicorn"]
CMD ["-b", "0.0.0.0:8000", "vasp.wsgi:app"]

# -----------------------
# ENTRYPOINT ["flask"]
# ENV FLASK_APP=vasp/app.py
# CMD ["run", "--host=0.0.0.0", "--port=5000"]

