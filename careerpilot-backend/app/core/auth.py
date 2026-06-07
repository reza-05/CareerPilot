import os
from typing import Optional

from fastapi import Header, HTTPException

from app.core.security import sanitize_user_id


def _verify_firebase_token(token: str) -> str:
    try:
        import firebase_admin
        from firebase_admin import auth, credentials
    except ImportError as exc:
        raise RuntimeError("Firebase Admin SDK is not installed.") from exc

    if not firebase_admin._apps:
        service_account = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
        if service_account:
            firebase_admin.initialize_app(credentials.Certificate(service_account))
        else:
            firebase_admin.initialize_app()

    decoded = auth.verify_id_token(token)
    uid = decoded.get("uid")
    if not uid:
        raise ValueError("Firebase token does not include a user id.")
    return sanitize_user_id(uid)


def get_request_user_id(
    authorization: Optional[str] = Header(default=None),
    x_user_id: str = Header(default="anonymous_user"),
) -> str:
    require_auth = os.getenv("REQUIRE_FIREBASE_AUTH", "false").lower() == "true"

    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        try:
            return _verify_firebase_token(token)
        except Exception:
            if require_auth:
                raise HTTPException(status_code=401, detail="Please sign in again.")

    if require_auth:
        raise HTTPException(status_code=401, detail="Please sign in again.")

    return sanitize_user_id(x_user_id)
