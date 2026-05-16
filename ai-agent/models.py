from datetime import date, datetime
from enum import Enum
from typing import List
from pydantic import BaseModel, Field, field_validator, model_validator

class Interest(str, Enum):
    HIKING = "hiking"
    COOKING = "cooking"
    CULTURE = "culture"
    FOOD = "food"
    NATURE = "nature"
    HISTORY = "history"
    SHOPPING = "shopping"
    ADVENTURE = "adventure"
    RELAXATION = "relaxation"

class Activity(BaseModel):
    time: str
    description: str
    location: str
    type: str  # 'activity' | 'restaurant' | 'travel'

class WeatherInfo(BaseModel):
    condition: str
    temperature: str

class DayPlan(BaseModel):
    day: int
    date: str
    title: str

class  WeatherInfo :
  condition: str;
  temperature: str;


class  DayPlan :
  day: int;
  date: str;
  title: str;
  weather: WeatherInfo;
  activities: List[Activity];


class  FlightDetail :
  airline: str;
  flightNumber: str;
  departureTime: str;
  arrivalTime: str;
  gate: str;


class  FlightSuggestion:
  fromCity: str;
  toCity: str;
  estimatedPrice: str;
  duration: str;
  stops: str;
  details: List[FlightDetail];


class  HotelSuggestion :
  name: str;
  description: str;
  estimatedPricePerNight: str;
  location: str;


class  BudgetBreakdown :
  flights: str;
  hotels: str;
  food: str;
  transportation: str;


class  TripPlan :
  destination: str;
  fromCity: str;
  startDate: str;
  endDate: str;
  summary: str;
  estimatedTotalBudget: str;
  budgetBreakdown: BudgetBreakdown;
  flights: List[FlightSuggestion];
  hotels: List[HotelSuggestion];
  dailyItinerary: List[DayPlan];

class TokenData(BaseModel):
    sub: str
    type: str  # "access" or "refresh"

class User(BaseModel):
    username: str
    hashed_password: str
    roles: List[str] = []
    token: str
    is_active: bool = True

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshRequest(BaseModel):
    refresh_token: str

class  TripPreferences(BaseModel):
  fromCity: str = Field(..., min_length=2, description="Origin city")
  destination: str = Field(..., min_length=2, description="Destination city")
  startDate: str = Field(..., description="Trip start date (YYYY-MM-DD)")
  endDate: str = Field(..., description="Trip end date (YYYY-MM-DD)")
  budget: str = Field(..., description="Budget as a string like '$5000'")
  travelers: int = Field(..., ge=1, le=20, description="Number of travelers")
  interests: List[str] = Field(..., min_length=1)

  @field_validator("startDate", "endDate")
  def validate_dates(cls, v):
    if len(v) != 10 or v[4] != "-" or v[7] != "-":
        raise ValueError("Date must be in YYYY-MM-DD format")
    return v

  @field_validator("budget")
  def validate_budget(cls, v):
    if not v.startswith("$"):
        raise ValueError("Budget must start with '$'")
    return v
  
  @model_validator(mode="after")
  def validate_date_order(self):
      start = datetime.strptime(self.startDate, "%Y-%m-%d")
      end = datetime.strptime(self.endDate, "%Y-%m-%d")

      if start >= end:
          raise ValueError("startDate must be earlier than endDate")

      return self
