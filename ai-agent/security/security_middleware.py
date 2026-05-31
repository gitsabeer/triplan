import os
import time
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from dotenv import load_dotenv
from slowapi.util import get_remote_address
from logger_util import get_logger
from logger_util import write_audit
import hashlib
from jose import jwt

#############################################################################
# This module defines a custom security middleware for the FastAPI application.
# The middleware performs several security-related functions:
# 1. It checks if the incoming request is for a public endpoint (like login or docs) and allows it without authentication.
# 2. It checks for the presence of a Bearer token in the Authorization header and allows the request to proceed if it's present (actual JWT validation is handled in route dependencies).
# 3. It implements a simple rate limiting mechanism based on the client's IP address, allowing a certain number of requests within a specified time window.
# 4. It logs all incoming requests along with their IP address, path, and other relevant information for auditing purposes.
# 5. It performs basic sanitization on JSON input to prevent script injection attacks.  
# The middleware is designed to be added to the FastAPI application and will apply these security checks to all incoming requests.
# Note: In a production environment, the rate limiting and IP allowlist should be more robust and possibly backed by a persistent store or external service. The sanitization logic is also very basic and should be enhanced for real-world use cases.
# 
#############################################################################

logger = get_logger("SecurityMiddleware")
load_dotenv()

API_KEY = os.getenv("API_KEY")
API_KEY_HEADER = "x-api-key"
if API_KEY is None:
    logger.error("API_KEY is not set in the environment.")
    raise RuntimeError("API_KEY is not set in the environment")

# Simple in-memory rate limiter
RATE_LIMIT = 30  # requests
WINDOW = 60      # seconds
request_log = {}
ALLOWED_IPS = ["127.0.0.1","localhost"]  # For demo purposes, only allow localhost. In production, this should be more robust.
PUBLIC_PATHS = [
    "/",
    "/auth/login",
    "/auth/refresh",
    "/docs",
    "/health",
    "/openapi.json"
]
class SecurityMiddleware(BaseHTTPMiddleware):
    
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return await call_next(request)


        path = request.url.path

        body_bytes = await request.body()
        body_hash = hashlib.sha256(body_bytes).hexdigest() if body_bytes else None
        
        now = time.time()
         # 1. Skip security for public endpoints
        client_ip = get_remote_address(request)
        if path in PUBLIC_PATHS:
            response =  await call_next(request)
            write_audit({
                "type": "public_request",
                "ip": client_ip,
                "path": path,
                "status": response.status_code,
                "duration_ms": int((time.time() - now) * 1000)
            })
            return response
        
        # 2. Allow JWT-protected routes (Authorization header or token query parameter)
        auth_header = request.headers.get("Authorization")
        query_token = request.query_params.get("token")
        if (auth_header and auth_header.startswith("Bearer ")) or query_token:
            response = await call_next(request)
            write_audit({
                "type": "jwt_request",
                "ip": client_ip,
                "path": path,
                "status": response.status_code,
                "body_hash": body_hash,
                "duration_ms": int((time.time() - now) * 1000)
            })
            return response


        # 3. Rate limiting
        if client_ip not in ALLOWED_IPS:
            write_audit({
                "type": "ip_not_allowed",
                "ip": client_ip,
                "path": path
            })
            raise HTTPException(status_code=403, detail="IP not allowed")

        if client_ip not in request_log:
            request_log[client_ip] = []

        request_log[client_ip] = [
            t for t in request_log[client_ip] if now - t < WINDOW
        ]

        if len(request_log[client_ip]) >= RATE_LIMIT:
            write_audit({
                "type": "rate_limit_block",
                "ip": client_ip,
                "path": path
            })
            raise HTTPException(status_code=429, detail="Too many requests")

        request_log[client_ip].append(now) # when will this remove old timestamps? every request, it filters out timestamps older than WINDOW seconds

        # 4. API Key validation
       

        # 5. Log request
        #logger.info(f"[SECURITY] {client_ip} : {request.url.path}")

        # 6. Sanitize JSON input (if any)
        if request.method in ("POST", "PUT", "PATCH"):
            try:
                body = await request.json()
                if isinstance(body, dict):
                    self._sanitize(body)
            except:
                pass

        # 7. Continue request
        response = await call_next(request)
        write_audit({
            "type": "api_key_request",
            "ip": client_ip,
            "path": path,
            "status": response.status_code,
            "body_hash": body_hash,
            "duration_ms": int((time.time() - now) * 1000)
        })
        return response

    def _sanitize(self, data,client_ip=None,path=None):
        """Basic sanitization to prevent script injection."""
        for key, value in data.items():
            if isinstance(value, str):
                if "<script>" in value.lower():
                    write_audit({
                        "type": "input_sanity_check_failed",
                        "ip": client_ip,
                        "path": path,
                    })
                    raise HTTPException(status_code=400, detail="Invalid input detected")
            if isinstance(value, dict):
                self._sanitize(value, client_ip, path)
            if isinstance(value, list):
                for item in value:
                    if isinstance(item, dict):
                        self._sanitize(item, client_ip, path)
