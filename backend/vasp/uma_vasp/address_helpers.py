from flask import abort


def get_domain_from_uma_address(uma_address: str) -> str:
    try:
        [_, domain] = uma_address.split("@")
        return domain
    except ValueError as ex:
        abort(
            400,
            {
                "status": "ERROR",
                "reason": f"Invalid UMA address: {ex}",
            },
        )
