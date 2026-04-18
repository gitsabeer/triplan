import os
import time
import json
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from dotenv import load_dotenv
from slowapi.util import get_remote_address

load_dotenv()

API_KEY = os.getenv("API_KEY")
API_KEY_HEADER = "x-api-key"

# Simple in-memory rate limiter
RATE_LIMIT = 30  # requests
WINDOW = 60      # seconds
request_log = {}

class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):

        # 1. Rate limiting
        client_ip = get_remote_address(request)
        now = time.time()

        if client_ip not in request_log:
            request_log[client_ip] = []

        request_log[client_ip] = [
            t for t in request_log[client_ip] if now - t < WINDOW
        ]

        if len(request_log[client_ip]) >= RATE_LIMIT:
            raise HTTPException(status_code=429, detail="Too many requests")

        request_log[client_ip].append(now)

        # 2. API Key validation
        api_key = request.headers.get(API_KEY_HEADER)
        if api_key != API_KEY:
            raise HTTPException(status_code=401, detail="Invalid or missing API key")

        # 3. Log request
        print(f"[SECURITY] {client_ip} → {request.url.path}")

        # 4. Sanitize JSON input (if any)
        if request.method in ("POST", "PUT", "PATCH"):
            try:
                body = await request.json()
                if isinstance(body, dict):
                    self._sanitize(body)
            except:
                pass

        # 5. Continue request
        response = await call_next(request)
        return response

    def _sanitize(self, data):
        """Basic sanitization to prevent script injection."""
        for key, value in data.items():
            if isinstance(value, str):
                if "<script>" in value.lower():
                    raise HTTPException(status_code=400, detail="Invalid input detected")
            if isinstance(value, dict):
                self._sanitize(value)
            if isinstance(value, list):
                for item in value:
                    if isinstance(item, dict):
                        self._sanitize(item)
