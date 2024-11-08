import os

DATABASE_URI: str = "sqlite+pysqlite:///" + os.path.join(
    os.getcwd(), "instance", "vasp.sqlite"
)

VASP_DOMAIN: str = "local:5000"

NWC_SERVER_DOMAIN: str = "localhost:8080"
