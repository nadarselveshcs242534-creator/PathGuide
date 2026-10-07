import os
import certifi
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Loads environment variables from the .env file
load_dotenv()

MONGO_DETAILS = os.getenv("MONGO_DETAILS")

# Connect using the secure certificates
client = AsyncIOMotorClient(MONGO_DETAILS, tlsCAFile=certifi.where())
database = client.digital_carrier