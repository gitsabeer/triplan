
import asyncio
import json

from fastapi.responses import StreamingResponse
from fastapi import Depends,  HTTPException, Request,APIRouter,status

from logger_util import get_logger
from dotenv import load_dotenv
from google import genai
from google.genai import types
from models import TripPreferences
from security.auth_users import User
from security.auth_dependencies import get_current_user
from logger_util import write_audit

#############################################################################
# This module defines the main travel agent functionality, including the API endpoint to generate a trip plan based on user preferences. 
# It uses the Google GenAI client to generate content based on a detailed prompt that includes the user's travel preferences. The generated content is expected to be a structured JSON response that includes a detailed itinerary, flight suggestions, hotel recommendations, and a budget breakdown.
# The endpoint is protected by authentication, and it logs all incoming requests for auditing purposes. 
#############################################################################

logger = get_logger("Travel-Agent")
load_dotenv()
client = genai.Client()
model = "gemini-3-flash-preview";
trip_sessions = {}


# check API key loaded from .env
try:
    resp = client.models.generate_content(
        model=model,
        contents="ping"
    )
    logger.info("API key is valid and being used.")
    logger.info(resp.text)
except Exception as e:
    logger.error("API key NOT found or invalid.")
    logger.error(str(e))
    # Do not call exit(1) so that the web server can still start and serve other requests (like authentication and status health checks).


router = APIRouter(tags=["travel"])

def getSchema():
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
        } ,       
        "required": ["destination","fromCity", "startDate", "endDate", "summary", "budgetBreakdown","estimatedTotalBudget", "flights", "hotels", "dailyItinerary"]
    }
    return schema    


@router.post("/getTripPlan")
async def generateTripPlan(request: Request):
    user = get_current_user(request.headers);
    write_audit({
        "type": "trip_plan_request",
        "user": user.username,
        "roles": user.roles,
        "path": "/getTripPlan"
    })
    try:         

        payload = await request.json()
        logger.info(f"Received trip preferences: {payload}")
        try:
            trip_request = TripPreferences(**payload)
        except Exception as e:
            raise HTTPException(status_code=422, detail=e.errors())
        return {
                "status": "success",
                "user": user.username, 
                "message": "Trip plan generated",
                "data":run_query(trip_request)    
        }
    except Exception as e:
        logger.error(f"Error processing trip plan request: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
    

def run_query(prefs: TripPreferences):
    logger.info(f"Generating trip plan from:{prefs.fromCity} to:{prefs.destination}")

    prompt = ''''
        You will stream status updates while generating the itinerary.

        STREAMING FORMAT:
        - Emit messages like: <status>Searching flights...</status>
        - Emit multiple status updates as you progress.
        - After all status updates, output the final JSON ONLY ONCE.
        - The final JSON must strictly follow the provided schema.

        TASK:
            Plan a trip from {prefs.fromCity} to {prefs.destination} 
            from {prefs.startDate.toLocaleDateString()} to {prefs.endDate.toLocaleDateString()}.
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

    schema =  getSchema()
    modelConfig = types.GenerateContentConfig(
        temperature=0.7,
        systemInstruction="You are an expert travel agent. Provide highly detailed, realistic, and inspiring trip plans. Use real locations and restaurants. Ensure the itinerary is logically sequenced for each day.",
        responseMimeType="application/json",
        responseSchema=schema)
    

    
    response =  client.models.generate_content(
            model=model,
            config=modelConfig,
            stream=True,
            contents=f"""User : {prompt}\nAnswer:"""
        )
    
    final_json_buffer = ""
    for chunk in response:
        if not chunk.text:
            continue

        text = chunk.text

        if "<status>" in text:
            # Extract status message
            status_msg = text.replace("<status>", "").replace("</status>", "")
            logger.info("STATUS:", status_msg)
            send_status_update(status_msg)
            # send to frontend
        else:
            final_json_buffer += text

    trip_plan  = getattr(final_json_buffer, "text", None)
    logger.info("Trip plan generated successfully. response: " + trip_plan )

    if trip_plan  is None:
        logger.error("Failed to generate trip plan: Empty response")
        return None
    
    #TODO safe_text = html.escape(trip_plan )
    #trip_plan = json.loads(safe_text)    
    return trip_plan  ;


@router.get("/api/trip/stream-status")
async def stream_status(request: Request):
    logger.info("New stream request")
    token = request.query_params.get('token')
    user: User  = get_current_user(token)
    write_audit({
        "type": "stream_status",
        "user": user.username,
        "roles": user.roles,
        "path": "/stream-status"
    })

    try:
        prefs = trip_sessions.get(token)
        if prefs is not None :

            async def event_generator(prefs):
                # STEP 1 — Stream status updates
                async for status in stream_trip_generation_status(prefs):
                    yield f"data: <status>{status}</status>\n\n"
                    await asyncio.sleep(0.1)

                # STEP 2 — Generate final JSON
                final_json = await generate_final_trip_plan(prefs)
                flat_json = json.dumps(final_json, separators=(',', ':'))
                yield f"data: <final>{flat_json}</final>\n\n"

            return StreamingResponse(
                event_generator(prefs),
                media_type="text/event-stream"
            )
        else :
            logger.error("User not exist with token")        
            return {"status": "Error", "code":"203", "user": user.username, 
                    "message": "Error in streaming Travel Plan status",
                    "data":{ "message":"Straming Error","error":"User not exist with provided token"}   }

       
    except Exception as e:
        logger.error("Error in stream_status")
        logger.error(str(e))        
        return {"status": "Error", "code":"202", "user": user.username, "message": "Error in streaming Travel Plan status","data":{ "message":"Straming Error","error":str(e)}   }

async def stream_trip_generation_status(prefs: TripPreferences):
    # This function can be implemented to yield status updates as the trip plan is being generated
    # It would use the same prompt and configuration but focus on emitting status messages
    prompt = f"""
        You are an expert travel agent.

        Your job in THIS STEP ONLY:
        - Stream status updates as you think.
        - Use the format: <status>...</status>
        - Do NOT output any JSON.
        - Do NOT output the final itinerary.
        - Do NOT output anything except status messages.

        Status examples:
        <status>Analyzing travel dates...</status>
        <status>Searching typical flight routes...</status>
        <status>Estimating hotel prices...</status>
        <status>Building daily itinerary...</status>

        User preferences:
        From: {prefs.fromCity}
        To: {prefs.destination}
        Dates: {prefs.startDate} → {prefs.endDate}
        Budget: {prefs.budget}
        Travelers: {prefs.travelers}
        Interests: {", ".join(prefs.interests)}
    """

    response = client.models.generate_content_stream(
        model=model,
        contents=prompt
    )

    for chunk in response:
        if chunk.text:
            yield chunk.text
            await asyncio.sleep(0.05)  # allow event loop to breathe



async def getPrefFromRequest(request: Request):
    # This function can be implemented to extract and validate trip preferences from the incoming request
    payload = await request.json()
    logger.info(f"Received trip preferences: {payload}")
    prefs = TripPreferences(**payload)  
    return prefs;

@router.post("/api/trip/getTripPlan")
async def getTripPlanRequest(request: Request, user: User  = Depends(get_current_user)):
    logger.info("New Trip plan request")
    write_audit({
        "type": "trip_plan_request",
        "user": user.username,
        "roles": user.roles,
        "path": "/getTripPlan"
    })

    try:
        prefs = await getPrefFromRequest(request)
        trip_sessions[user.token] = prefs
        return {"status": "Success", "code":"0", "user": user.username, "message": "Done","data":{ "message":"done"}} 
    except Exception as e:
        logger.error("Error in generate_final_trip_plan")
        logger.error(str(e))        
        return {"status": "Error", "code":"201", "user": user.username, "message": "Error Generating Travel Plan","data":{ "message":"Error Processing","error":str(e)}   }

async def generate_final_trip_plan(prefs):
    logger.info("generate_final_trip_plan") 

    # This function can be implemented to generate the final trip plan JSON after all status updates have been emitted
    # It would use the same prompt and configuration but focus on generating the final JSON response
    prompt = f"""
        Now produce the FINAL OUTPUT.

        Requirements:
        - Output ONLY valid JSON.
        - Must strictly follow the provided schema.
        - No status messages.
        - No explanations.
        - No extra text.

        Trip request:
        Plan a trip from {prefs.fromCity} to {prefs.destination}
        from {prefs.startDate} to {prefs.endDate}.
        Budget: {prefs.budget}
        Travelers: {prefs.travelers}
        Interests: {", ".join(prefs.interests)}    

       
        For flight suggestions, provide specific details like airline names, flight numbers, departure/arrival times, and typical gate information.
        For hotel recommendations, include specific hotel names, descriptions, estimated price per night, and their locations.
        Ensure the itinerary is logically sequenced and provides a mix of activities that align with the user's interests.  

        Provide a detailed itinerary 
        Include:
        - Flight suggestions (with airline, flight number, times, gate)
        - Hotel recommendations (with price, location, description)
        - Day-by-day itinerary plan with specific places to eat and visit
        - Weather forecast (condition and temperature) based on typical weather for that location and time of year.
        - Budget breakdown for flights, hotels, food, and transportation (taxis/local transit).
    """

    modelConfig = types.GenerateContentConfig(
        temperature=0.7,
        systemInstruction="You are an expert travel agent. Produce only valid JSON.",
        responseMimeType="application/json",
        responseSchema=getSchema()
    )

    response = client.models.generate_content(
        model=model,
        config=modelConfig,
        contents=prompt
        )
    
    return response.text


@router.post("/getTripPlanWithStreaming")
def generate_trip_with_streaming(request: Request, user: User  = Depends(get_current_user)):
    # Step 1: Stream status updates
    stream_status(request)

    # Step 2: Generate final JSON
    final_json = generate_final_trip_plan(request, user)

    return final_json
    
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

