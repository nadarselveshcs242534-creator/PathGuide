import os
import asyncio
import certifi
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

async def check():
    client = AsyncIOMotorClient(
        os.getenv("MONGO_URI") or os.getenv("MONGO_DETAILS"),
        tlsCAFile=certifi.where()
    )
    db = client.digital_carrier
    
    courses_count = await db.courses.count_documents({})
    scholarships_count = await db.scholarships.count_documents({})
    
    print(f"📊 Database Name: digital_carrier")
    print(f"📚 Total Courses: {courses_count}")
    print(f"🎓 Total Scholarships: {scholarships_count}")

if __name__ == "__main__":
    asyncio.run(check())