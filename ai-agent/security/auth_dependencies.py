# auth_dependencies.py
from fastapi import Depends, HTTPException,status
from fastapi.security import OAuth2PasswordBearer

from security.auth_config import decode_token
from security.auth_users import get_user
from logger_util import get_logger

#############################################################################
# This module defines the authentication dependencies for FastAPI routes. 
# It includes a function to get the current user based on the access token provided in the Authorization header. 
# This function will be used as a dependency in protected routes to ensure that only authenticated users can access them.
#############################################################################


logger = get_logger("Auth-Dependency")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Rest routes can use this dependency to get the current user based on the access token
# This will check the token, decode it, and return the user object. If the token is invalid or expired, it will raise an HTTP 401 error.
def get_current_user(token: str = Depends(oauth2_scheme)):
    logger.info("get user")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    
    try:
        token_data = decode_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    if token_data.type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is not an access token",
        )

    user = get_user(token_data.sub)
    user.token = token
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    logger.info("valid user")
    return user