from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic_settings import BaseSettings
from typing import Optional


class AuthSettings(BaseSettings):
    keycloak_server_url: str = "http://localhost:8080"
    keycloak_realm: str = "ledgerly"
    keycloak_client_id: str = "ledgerly-backend"
    keycloak_enabled: bool = False

    model_config = {"env_file": ".env", "extra": "ignore"}


auth_settings = AuthSettings()
security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    """
    Validate JWT token from Keycloak.
    If KEYCLOAK_ENABLED is False, returns a mock user for development.
    """
    if not auth_settings.keycloak_enabled:
        return {
            "sub": "dev-user",
            "email": "dev@ledgerly.com",
            "preferred_username": "developer",
            "realm_access": {"roles": ["admin"]},
        }

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        # In production, you would fetch and cache the public key from Keycloak
        # For now, we'll decode without verification for development
        payload = jwt.decode(
            token,
            options={"verify_signature": False},
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_role(required_role: str):
    """
    Dependency to check if user has a specific role.
    """

    def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_roles = current_user.get("realm_access", {}).get("roles", [])
        if required_role not in user_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{required_role}' required",
            )
        return current_user

    return role_checker
