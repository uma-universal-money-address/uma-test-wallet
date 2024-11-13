import os
from typing import Optional

from lightspark import ComplianceProvider
from uma import is_domain_local

BASE_URL = "https://api.lightspark.com/graphql/server/rc"


class Config:
    """Constructs config instance from registered vasp in db and exposes them to the rest of the app."""

    @classmethod
    def get(cls) -> "Config":
        return Config(
            api_token_client_id=require_env("LIGHTSPARK_API_TOKEN_CLIENT_ID"),
            api_token_client_secret=require_env("LIGHTSPARK_API_TOKEN_CLIENT_SECRET"),
            node_id=require_env("LIGHTSPARK_NODE_ID"),
            encryption_cert_chain=require_env("LIGHTSPARK_UMA_ENCRYPTION_CERT_CHAIN"),
            encryption_pubkey_hex=require_env("LIGHTSPARK_UMA_ENCRYPTION_PUBKEY"),
            encryption_privkey_hex=require_env("LIGHTSPARK_UMA_ENCRYPTION_PRIVKEY"),
            signing_cert_chain=require_env("LIGHTSPARK_UMA_SIGNING_CERT_CHAIN"),
            signing_pubkey_hex=require_env("LIGHTSPARK_UMA_SIGNING_PUBKEY"),
            signing_privkey_hex=require_env("LIGHTSPARK_UMA_SIGNING_PRIVKEY"),
            base_url=BASE_URL,
            bitcoin_network=require_env("BITCOIN_NETWORK"),
            osk_node_signing_key_password=require_env(
                "LIGHTSPARK_OSK_NODE_SIGNING_KEY_PASSWORD"
            ),
        )

    def __init__(
        self,
        api_token_client_id: str,
        api_token_client_secret: str,
        node_id: str,
        encryption_cert_chain: str,
        encryption_pubkey_hex: str,
        encryption_privkey_hex: str,
        signing_cert_chain: str,
        signing_pubkey_hex: str,
        signing_privkey_hex: str,
        bitcoin_network: str,
        base_url: Optional[str] = None,
        osk_node_signing_key_password: Optional[str] = None,
        remote_signing_node_master_seed: Optional[str] = None,
        compliance_provider: Optional[ComplianceProvider] = None,
    ) -> None:
        self.api_token_client_id = api_token_client_id
        self.api_token_client_secret = api_token_client_secret
        self.node_id = node_id
        self.encryption_cert_chain = encryption_cert_chain
        self.encryption_pubkey_hex = encryption_pubkey_hex
        self.encryption_privkey_hex = encryption_privkey_hex
        self.signing_cert_chain = signing_cert_chain
        self.signing_pubkey_hex = signing_pubkey_hex
        self.signing_privkey_hex = signing_privkey_hex
        self.bitcoin_network = bitcoin_network
        self.base_url = base_url
        self.osk_node_signing_key_password = osk_node_signing_key_password
        self.remote_signing_node_master_seed = remote_signing_node_master_seed
        self.compliance_provider = compliance_provider

    def get_encryption_privkey(self) -> bytes:
        return bytes.fromhex(self.encryption_privkey_hex)

    def get_signing_privkey(self) -> bytes:
        return bytes.fromhex(self.signing_privkey_hex)

    def get_remote_signing_node_master_seed(self) -> Optional[bytes]:
        return (
            bytes.fromhex(self.remote_signing_node_master_seed)
            if self.remote_signing_node_master_seed
            else None
        )

    def get_complete_url(self, domain: str, path: str) -> str:
        protocol = "http" if is_domain_local(domain) else "https"
        return f"{protocol}://{domain}{path}"


def require_env(env_var_name: str) -> str:
    value = os.getenv(env_var_name)
    if value is None:
        raise MissingEnvironmentVariableException(
            f"Missing required environment variable: {env_var_name}"
        )
    return value


def get_http_host() -> str:
    protocol_and_host = BASE_URL.split("://")
    if len(protocol_and_host) == 1:
        return protocol_and_host[0].split("/")[0]

    return protocol_and_host[1].split("/")[0]


class MissingEnvironmentVariableException(Exception):
    pass
