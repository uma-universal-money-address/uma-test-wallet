WORKDIR /build

FROM python:3.11-slim-bookworm

RUN apt-get update && apt-get install -y git
RUN addgroup --system --gid 1000 web && adduser --system --uid 1000 --ingroup web --home /home/web web
RUN echo "Package: *\nPin: release a=stable-updates\nPin-Priority: 50" > /etc/apt/preferences

WORKDIR /app

COPY backend/Pipfile backend/Pipfile.lock /app/
RUN pip install --upgrade pip wheel setuptools && \
    pip install --user --no-warn-script-location pipenv && \
    ~/.local/bin/pipenv install --system --deploy --ignore-pipfile --extra-pip-args=--ignore-installed && \
    rm -rf ~/.cache ~/.local

EXPOSE 8000
ENTRYPOINT ["gunicorn"]
CMD ["-b", "0.0.0.0:8000", "vasp.wsgi:app"]

COPY backend/alembic.ini /app
COPY backend/alembic /app/alembic
COPY backend/vasp /app/vasp

# Install security updates
RUN apt-get update && apt-get -y upgrade && apt-get clean && rm -rf /var/lib/apt/lists

# TMP