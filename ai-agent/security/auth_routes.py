
from fastapi import APIRouter, HTTPException, Depends,status
from fastapi.security import  OAuth2PasswordRequestForm

from security.auth_config import (
    create_access_token,
    create_refresh_token,
    decode_token
)
from models import  TokenPair,RefreshRequest
from security.auth_users import authenticate_user,get_user,isVisitorUser

#############################################################################
# This module defines the authentication routes for the FastAPI application. 
# It includes endpoints for user login (which returns access and refresh tokens) and token refreshing.  
#############################################################################

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenPair)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(  status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")


    access_token = create_access_token( subject=user.username )
    refresh_token = create_refresh_token(subject=user.username)

    return TokenPair(access_token=access_token,  refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenPair)
def refresh_tokens(body: RefreshRequest):
    try:
        token_data = decode_token(body.refresh_token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    if token_data.type != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is not a refresh token",
        )

    user = get_user(token_data.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists",
        )
    
    if isVisitorUser(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have permission to refresh tokens",
        )

    new_access = create_access_token(user.username)
    new_refresh = create_refresh_token(user.username)

    return TokenPair(
        access_token=new_access,
        refresh_token=new_refresh)
    
