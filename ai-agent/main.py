import os
import uvicorn
from security.security_middleware import SecurityMiddleware
from security.auth_routes import router as auth_router
from travel_agent import router as travel_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from logger_util import get_logger

#############################################################################
# This is the main entry point for the AI Travel Planner application. It sets up the FastAPI application, registers middleware for security and CORS, and includes the authentication and travel planning routes.
# The application is designed to be run with Uvicorn, and it will listen on the specified port (default 8000) for incoming requests. The main function also logs the startup process for auditing purposes. 
# Note: The actual logic for generating travel plans is implemented in the travel_agent module, and the authentication logic is in the auth_routes and auth_dependencies modules. This main file serves as the central point to tie everything together and start the application.  
# 
#############################################################################

logger = get_logger("Travel-Main")
logger.info("Starting AI Travel Planner ...")
app = FastAPI(  
    title="AI Travel Planner",
    version="1.0.0")


# List the specific origins you want to allow
origins = [
    "http://localhost:4200",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.add_middleware(SecurityMiddleware)


# Register authentication routes
app.include_router(auth_router)

# Register travel planning routes
app.include_router(travel_router)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def root():
    return {"message": "AI Travel Planner API is running"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
    logger.info("AI Travel Planner API has started successfully.")
