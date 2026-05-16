# auth_users.py
from typing import Optional

from passlib.context import CryptContext
from models import User

#############################################################################
# This module defines the user authentication logic, including password hashing, user retrieval, and authentication. 
# It uses Passlib with the Argon2 algorithm for secure password hashing.
#############################################################################

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto" )
hash_password = pwd_context.hash("tESTPASSWORD$123")
visitor_user = User(
    username="visitor",
    token="",
    hashed_password=hash_password,
    roles=["user"]
)

fake_user_db = {
    "visitor":visitor_user
}

def isVisitorUser(user: User) -> bool:
    return user.username == "visitor"

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def get_user(username: str) -> Optional[User]:
    return fake_user_db.get(username)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def authenticate_user(username: str, password: str) -> Optional[User]:
    user = get_user(username)
    if not user:
        return None
    if not verify_password(password, visitor_user.hashed_password):
        return None
    return user
