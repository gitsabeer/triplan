import html
import os

from fastapi import FastAPI, HTTPException, Request, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from slowapi import Limiter
from slowapi.util import get_remote_address

from logger_util import get_logger
from dotenv import load_dotenv
from google import genai
from google.genai import types
from models import TripPreferences
import json

logger = get_logger("RAGAgent")
load_dotenv()
client = genai.Client()
model = "gemini-3-flash-preview";

# check API key loaded from .env
try:
    resp = client.models.generate_content(
        model=model,
        contents="ping"
    )
    logger.log("API key is valid and being used.")
    logger.log(resp.text)
    API_KEY = os.getenv("API_KEY")
    API_KEY_NAME = os.getenv("API_KEY_NAME", "x-api-key")
    if API_KEY is None:
        logger.error("API_KEY is not set in the environment.")
        raise RuntimeError("API_KEY is not set in the environment")
except Exception as e:
    logger.error("API key NOT found or invalid.")
    logger.error(e)
    exit(1)



api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

def validate_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        logger.warning("Unauthorized access attempt")
        raise HTTPException(status_code=401, detail="Invalid or missing API Key")
    return api_key

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],    
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter


@app.post("/getTripPlan")
async def generateTripPlan(request: Request, api_key: str = Security(validate_api_key)):
    payload = await request.json()
    logger.info(f"Received trip preferences: {payload}")
    try:
        trip_request = TripPreferences(**payload)
    except Exception as e:
        raise HTTPException(status_code=422, detail=e.errors())
    return run_query(trip_request)    


def run_query(prefs: TripPreferences):
    logger.info(f"Generating trip plan from:{prefs.fromCity} to:{prefs.destination}")

    prompt = ''''
        Plan a trip from {prefs.fromCity} to {prefs.destination} from {prefs.startDate.toLocaleDateString()} to {prefs.endDate.toLocaleDateString()}.
        Budget level: {prefs.budget}.
        Number of travelers: {prefs.travelers}.
        Interests: {prefs.interests.join(", ")}.
        
        Provide a detailed itinerary including flight suggestions, hotel recommendations, and a day-by-day plan with specific places to eat and visit.
        Also provide a realistic budget breakdown for flights, hotels, food, and transportation (taxis/local transit).
        For each day, include a brief weather forecast (condition and temperature) based on typical weather for that location and time of year.
        For flight suggestions, provide specific details like airline names, flight numbers, departure/arrival times, and typical gate information.
        For hotel recommendations, include specific hotel names, descriptions, estimated price per night, and their locations.
        Ensure the itinerary is logically sequenced and provides a mix of activities that align with the user's interests.  
        '''

    schema = {
        "type": "object",
        "properties":  {
            "destination": {"type": "string"},
            "fromCity": {"type": "string"},
            "startDate": {"type": "string"},
            "endDate": {"type": "string"},
            "summary": {"type": "string"},
            "estimatedTotalBudget": {"type": "string"},
            "budgetBreakdown": {
                "type": "object",
                "properties": {
                    "flights": {"type": "string"},
                    "hotels": {"type": "string"},
                    "food": {"type": "string"},
                    "transportation": {"type": "string"}
                },
                "required": ["flights", "hotels", "food", "transportation"]
            },
            "flights": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "fromCity": {"type": "string"},
                        "toCity": {"type": "string"},
                        "estimatedPrice": {"type": "string"},
                        "duration": {"type": "string"},
                        "stops": {"type": "string"},
                        "details": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "airline": {"type": "string"},
                                    "flightNumber": {"type": "string"},
                                    "departureTime": {"type": "string"},
                                    "arrivalTime": {"type": "string"},
                                    "gate": {"type": "string"}
                                },
                                "required": ["airline", "flightNumber", "departureTime", "arrivalTime", "gate"]
                            }
                        }
                    },
                    "required": ["fromCity", "toCity", "estimatedPrice", "duration", "stops", "details"]
                }
            },
            "hotels": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "description": {"type": "string"},
                        "estimatedPricePerNight": {"type": "string"},
                        "location": {"type": "string"}
                    },                
                    "required": ["name", "description", "estimatedPricePerNight", "location"]
                }
            },
            "dailyItinerary": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "day": {"type": "integer"},
                                "date": {"type": "string"},
                                "title": {"type": "string"},
                                "weather": {
                                    "type": "object",
                                    "properties": {
                                        "condition": {"type": "string"},
                                        "temperature": {"type": "string"}
                                    },
                                    "required": ["condition", "temperature"]
                                },
                                "activities": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "name": {"type": "string"},
                                            "time": {"type": "string"},
                                            "description": {"type": "string"},
                                            "location": {"type": "string"},
                                            "estimatedCost": {"type": "string"},
                                            "type": {"type": "string", "enum": ["activity", "restaurant", "travel"]}
                                        },
                                        "required": ["name", "time", "description", "location", "estimatedCost"]
                                    }
                                }
                            },
                            "required": ["day", "date", "title", "weather", "activities"]
                        },
                }
        },            
        "required": ["destination","fromCity", "startDate", "endDate", "summary", "budgetBreakdown","estimatedTotalBudget", "flights", "hotels", "dailyItinerary"]
    }

    modelConfig = types.GenerateContentConfig(
        temperature=0.7,
        systemInstruction="You are an expert travel agent. Provide highly detailed, realistic, and inspiring trip plans. Use real locations and restaurants. Ensure the itinerary is logically sequenced for each day.",
        responseMimeType="application/json",
        responseSchema=schema)
    
    response =  client.models.generate_content(
        model=model,
        config=modelConfig,
        contents=f"""User : {prompt}
                    Answer:
                """
        )
    text = getattr(response, "text", None)
    logger.info("Trip plan generated successfully. response: " + text)

    if text is None:
        logger.error("Failed to generate trip plan: Empty response")
        return None
    
    safe_text = html.escape(text)
    trip_plan = json.loads(safe_text)    
    return trip_plan ;

if __name__ == "__main__":
    json_data = '''
           {"fromCity": "New York",
            "destination": "Tokyo",
            "startDate": "2026-05-01",
            "endDate": "2026-05-15",
            "budget": "$5,000",
            "travelers": 2,
            "interests": ["coding", "hiking", "gaming"]
            }
        '''
    #generateTripPlan(json_data)
