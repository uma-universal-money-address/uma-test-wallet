from quart import current_app
from cryptography.hazmat.primitives.asymmetric import ec
from OpenSSL import crypto


def get_vasp_domain() -> str:
    return current_app.config.get("VASP_DOMAIN", "localhost")


def cert_gen(
    private_key: ec.EllipticCurvePrivateKey,
    emailAddress: str,
    countryName: str = "US",
    localityName: str = "LA",
    stateOrProvinceName: str = "CA",
    organizationName: str = "Test Org",
    validityStartInSeconds: int = 0,
    validityEndInSeconds: int = 10 * 365 * 24 * 60 * 60,
) -> str:
    k = crypto.PKey.from_cryptography_key(private_key)

    # create a self-signed cert
    cert = crypto.X509()
    cert.get_subject().C = countryName  # pyre-ignore [16]
    cert.get_subject().ST = stateOrProvinceName  # pyre-ignore [16]
    cert.get_subject().L = localityName  # pyre-ignore [16]
    cert.get_subject().O = organizationName  # pyre-ignore [16]
    cert.get_subject().emailAddress = emailAddress  # pyre-ignore [16]
    cert.gmtime_adj_notBefore(validityStartInSeconds)
    cert.gmtime_adj_notAfter(validityEndInSeconds)
    cert.set_issuer(cert.get_subject())
    cert.set_pubkey(k)
    cert.sign(k, "sha256")
    return crypto.dump_certificate(crypto.FILETYPE_PEM, cert).decode("utf-8")
