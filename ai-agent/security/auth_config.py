import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi import logger
from jose import JWTError, jwt
from models import TokenData
from logger_util import get_logger

#############################################################################
# This module handles JWT token creation and validation for authentication.
# It defines functions to create access and refresh tokens, as well as to decode and validate incoming tokens. 
#############################################################################

logger = get_logger("Auth-Config")
load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7


def decode_token(token: str) -> TokenData:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return TokenData(sub=payload.get("sub"), type=payload.get("type"))
    except JWTError  as e:
        logger.error(f"Token decode error: {str(e)}")
        raise


def create_token(data: dict, expires_delta: timedelta, token_type: str) -> str:
    expire = datetime.utcnow() + expires_delta
    to_encode = data.copy()
    to_encode.update({"exp": expire, "type": token_type})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_access_token(subject: str) -> str:
    logger.info("access tocken request")
    return create_token(
        data={"sub": subject},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        token_type="access",
    )


def create_refresh_token(subject: str) -> str:
    logger.info("refresh tocken request")
    return create_token(
        data={"sub": subject},
        expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        token_type="refresh")
    