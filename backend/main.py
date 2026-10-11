import os
import asyncio
import certifi
import bcrypt
import json
import re
from collections import Counter
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient

# Machine Learning Imports
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Groq SDK
from groq import AsyncGroq

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Connection
client = AsyncIOMotorClient(
    os.getenv("MONGO_URI") or os.getenv("MONGO_DETAILS"),
    tlsCAFile=certifi.where()
)
db = client.digital_carrier

# Groq AI Client
groq_client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))

# ==========================================
# PYDANTIC MODELS
# ==========================================
class UserAuth(BaseModel):
    email: str
    password: str
    fullName: str | None = None
    academicYear: str | None = None
    familyIncome: str | None = None
    category: str | None = None

class ProfileUpdate(BaseModel):
    email: str
    fullName: str
    academicYear: str
    familyIncome: str
    category: str

class StudentProfile(BaseModel):
    fullName: str
    academicYear: str
    familyIncome: str
    category: str
    careerInterest: str

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    prompt: str
    history: list[ChatMessage] = []
    userProfile: dict | None = None  # Added for personalized context

class RoadmapEvalRequest(BaseModel):
    courseTitle: str
    currentModule: int
    totalModules: int
    userAnswer: str

# ==========================================
# ML CLASSIFICATION & INTENT ENGINE
# ==========================================
def clean_text(text: str) -> str:
    """Normalizes text for better TF-IDF matching."""
    return re.sub(r'[^a-zA-Z0-9\s]', '', str(text).lower())

def rank_items_by_ml(user_interest: str, items: list, text_field: str, top_n: int = 5, min_score: float = 2.0):
    if not items or not user_interest.strip():
        return []
        
    clean_user_interest = clean_text(user_interest)
    corpus = [f"{clean_text(item.get('name', ''))} {clean_text(item.get(text_field, ''))}" for item in items]
    corpus.append(clean_user_interest)
    
    vectorizer = TfidfVectorizer(stop_words='english')
    try:
        tfidf_matrix = vectorizer.fit_transform(corpus)
        user_vector = tfidf_matrix[-1]
        item_vectors = tfidf_matrix[:-1]
        similarities = cosine_similarity(user_vector, item_vectors).flatten()
        
        ranked_items = []
        for i, item in enumerate(items):
            score = round(float(similarities[i]) * 100, 2)
            if score >= min_score:
                item['ml_match_score'] = score
                ranked_items.append(item)
                
        ranked_items = sorted(ranked_items, key=lambda x: x.get('ml_match_score', 0), reverse=True)
        return ranked_items[:top_n]
    except Exception as e:
        print(f"ML Ranking Error: {e}")
        return []

def detect_query_intent(prompt: str) -> str:
    """Fast heuristic check to decide what data to retrieve."""
    prompt_lower = prompt.lower()
    scholarship_keywords = ['scholarship', 'fund', 'financial aid', 'money', 'grant', 'fee']
    course_keywords = ['course', 'learn', 'tutorial', 'study', 'certif', 'roadmap', 'skill']
    
    wants_scholarship = any(k in prompt_lower for k in scholarship_keywords)
    wants_course = any(k in prompt_lower for k in course_keywords)
    
    if wants_scholarship and not wants_course:
        return "scholarship"
    elif wants_course and not wants_scholarship:
        return "course"
    return "mixed"

# ==========================================
# AUTHENTICATION & PROFILE ENDPOINTS
# ==========================================
@app.post("/api/register")
async def register_user(user: UserAuth):
    # Enforce strictly @gmail.com validation
    if not user.email.lower().endswith("@gmail.com"):
        raise HTTPException(status_code=400, detail="Registration restricted: Only @gmail.com addresses are allowed.")

    existing_user = await db.users.find_one({"email": user.email.lower()})
    if existing_user:
        raise HTTPException(status_code=400, detail="This email is already registered.")
    
    password_bytes = user.password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password_bytes, salt)
    
    user_document = {
        "email": user.email.lower(),
        "password": hashed_password, 
        "createdAt": asyncio.get_event_loop().time(),
        "profile": {
            "fullName": user.fullName or "",
            "academicYear": user.academicYear or "Third Year (TY)",
            "familyIncome": user.familyIncome or "Below ₹1 Lakh",
            "category": user.category or "Open/General"
        }
    }
    
    await db.users.insert_one(user_document)
    return {"message": "Account created successfully", "email": user.email.lower()}
    
@app.post("/api/login")
async def login_user(user: UserAuth):
    db_user = await db.users.find_one({"email": user.email.lower()})
    if not db_user:
        raise HTTPException(status_code=404, detail="No account registered with this email.")
    
    password_bytes = user.password.encode('utf-8')
    stored_hash = db_user["password"]
    
    if not bcrypt.checkpw(password_bytes, stored_hash):
        raise HTTPException(status_code=401, detail="Invalid password.")
        
    return {"message": "Login successful", "email": db_user["email"]}

@app.post("/api/profile")
async def save_profile(profile: ProfileUpdate):
    await db.users.update_one(
        {"email": profile.email.lower()},
        {"$set": {
            "profile": {
                "fullName": profile.fullName,
                "academicYear": profile.academicYear,
                "familyIncome": profile.familyIncome,
                "category": profile.category
            }
        }}
    )
    return {"message": "Profile updated successfully"}

@app.get("/api/profile/{email}")
async def get_profile(email: str):
    user = await db.users.find_one({"email": email.lower()})
    if user and "profile" in user:
        return {"profile": user["profile"]}
    return {"profile": None}

# ==========================================
# OPPORTUNITY & CATALOG ENDPOINTS
# ==========================================
@app.get("/api/courses")
async def get_all_courses():
    cursor = db.courses.find({})
    all_courses = await cursor.to_list(length=1000)
    for c in all_courses:
        c['_id'] = str(c['_id'])
    return {"courses": all_courses}

@app.get("/api/scholarships")
async def get_all_scholarships():
    cursor = db.scholarships.find({})
    all_scholarships = await cursor.to_list(length=1000)
    for s in all_scholarships:
        s['_id'] = str(s['_id'])
    return {"scholarships": all_scholarships}

# ==========================================
# STUDENT MATCHING & DEMAND TRACKING
# ==========================================
@app.post("/api/students")
async def register_student_and_match(profile: StudentProfile):
    if profile.careerInterest.strip():
        await db.search_trends.insert_one({
            "fullName": profile.fullName,
            "query": profile.careerInterest.strip().lower()
        })

    scholarships_cursor = db.scholarships.find({})
    courses_cursor = db.courses.find({})
    
    all_scholarships = await scholarships_cursor.to_list(length=1000)
    all_courses = await courses_cursor.to_list(length=1000)
    
    for s in all_scholarships:
        s['_id'] = str(s['_id'])
    for c in all_courses:
        c['_id'] = str(c['_id'])

    ranked_courses = rank_items_by_ml(profile.careerInterest, all_courses, "description", top_n=30, min_score=2.0)
    
    eligible_scholarships = [
        s for s in all_scholarships 
        if profile.category in s.get("eligibleCategories", []) 
        and profile.familyIncome in s.get("eligibleIncomes", [])
    ]
    
    ranked_scholarships = rank_items_by_ml(profile.careerInterest, eligible_scholarships, "description", top_n=30, min_score=2.0)

    return {
        "message": "AI matching complete",
        "matches": ranked_scholarships,
        "courses": ranked_courses
    }

@app.get("/api/demand-trends")
async def get_demand_trends():
    cursor = db.search_trends.find({})
    searches = await cursor.to_list(length=1000)
    
    if not searches:
        return {"trends": []}
    
    categories = {
        "AI & Machine Learning": ["ai", "machine learning", "ml", "deep learning", "neural", "vision", "nlp", "llm"],
        "Cybersecurity": ["cyber", "security", "hacking", "ethical hacking", "network", "firewall", "cryptography"],
        "Software Engineering": ["web", "full stack", "react", "python", "javascript", "developer", "backend", "frontend", "software"],
        "Data Science & Analytics": ["data", "analytics", "sql", "tableau", "statistics", "pandas", "bi"],
        "Digital Marketing & SEO": ["marketing", "seo", "social media", "ads", "content"],
        "Commerce & Finance": ["commerce", "finance", "accounting", "tax", "b.com", "bms", "bba"],
        "Medical & Healthcare": ["medical", "mbbs", "nursing", "pharmacy", "health", "biology"]
    }
    
    counts = Counter()
    total_matches = 0
    
    for entry in searches:
        query_text = entry.get("query", "").lower()
        matched = False
        for cat, keywords in categories.items():
            if any(k in query_text for k in keywords):
                counts[cat] += 1
                matched = True
                total_matches += 1
                break
        if not matched:
            counts["General Computing"] += 1
            total_matches += 1

    colors = {
        "AI & Machine Learning": "#3b82f6",
        "Cybersecurity": "#10b981",
        "Software Engineering": "#8b5cf6",
        "Data Science & Analytics": "#f59e0b",
        "Digital Marketing & SEO": "#ef4444",
        "Commerce & Finance": "#14b8a6",
        "Medical & Healthcare": "#ec4899",
        "General Computing": "#64748b"
    }

    trends = []
    for field, count in counts.most_common():
        percentage = round((count / total_matches) * 100) if total_matches > 0 else 0
        trends.append({
            "field": field,
            "percentage": percentage,
            "count": f"{count} searches",
            "color": colors.get(field, "#3b82f6")
        })
        
    return {"trends": trends}

# ==========================================
# RAG CAREER GUIDANCE CHATBOT
# ==========================================
@app.post("/api/career-guidance")
async def get_career_guidance(chat: ChatRequest):
    intent = detect_query_intent(chat.prompt)
    top_courses = []
    top_scholarships = []
    
    user_category = chat.userProfile.get("category") if chat.userProfile else None

    # Retrieve & Rank based on intent
    if intent in ["course", "mixed"]:
        all_courses = await db.courses.find({}).to_list(length=1000)
        top_courses = rank_items_by_ml(chat.prompt, all_courses, "description", top_n=6, min_score=2.0)

    if intent in ["scholarship", "mixed"]:
        # MongoDB Pre-Filtering based on Metadata
        if user_category:
            scholarship_query = {
                "$or": [
                    {"eligibleCategories": {"$in": [user_category]}},
                    {"eligibleCategories": {"$size": 0}},
                    {"eligibleCategories": {"$exists": False}}
                ]
            }
        else:
            scholarship_query = {}
            
        all_scholarships = await db.scholarships.find(scholarship_query).to_list(length=1000)
        top_scholarships = rank_items_by_ml(chat.prompt, all_scholarships, "description", top_n=6, min_score=2.0)

    # Build DB Context
    rag_context = "DATABASE RETRIEVED RESOURCES (Use these to make recommendations):\n\n"
    if top_courses:
        rag_context += "Matched Courses in Database:\n"
        for c in top_courses:
            rag_context += f"- **{c.get('name')}** | Platform: {c.get('provider')} | Desc: {c.get('description')} | Link: {c.get('url', '#')}\n"
    
    if top_scholarships:
        rag_context += "\nMatched Scholarships in Database:\n"
        for s in top_scholarships:
            docs = ", ".join(s.get('documentsRequired', []))
            rag_context += f"- **{s.get('name')}** | Provider: {s.get('provider')} | Desc: {s.get('description')} | Documents: {docs} | Link: {s.get('url', '#')}\n"
            
    if not top_courses and not top_scholarships:
        rag_context += "No highly relevant database matches found for this specific query."

    # Build Personalized Student Context
    student_context = ""
    if chat.userProfile:
        student_context = f"""
STUDENT PROFILE (Do not ask for these details again):
- Name: {chat.userProfile.get('fullName', 'Student')}
- Academic Year: {chat.userProfile.get('academicYear', 'Not specified')}
- Category: {chat.userProfile.get('category', 'Not specified')}
- Family Income: {chat.userProfile.get('familyIncome', 'Not specified')}
"""

    system_instruction = f"""
You are the official AI Career & Financial Aid Advisor for PathGuide.

{student_context}

LIVE DATABASE CATALOG (RAG RETRIEVED):
{rag_context}

STRICT GROUNDING RULES:
1. NO HALLUCINATION: You must NEVER invent, guess, or generate fake course names, scholarships, application links, deadlines, or fees. 
2. EXCLUSIVE RECOMMENDATIONS: If a student asks for a course or scholarship, you may ONLY recommend items explicitly listed in the "LIVE DATABASE CATALOG" above.
3. INSUFFICIENT DATA FALLBACK: If the retrieved catalog does not contain relevant courses or scholarships for their query, explicitly state: "I currently do not have verified opportunities for this specific request in the PathGuide database." Do not substitute with external internet links.
4. CAREER ADVICE VS. RESOURCES: You may use your general knowledge to explain career concepts (e.g., "What is a Data Analyst?"), but you must rely solely on the database when recommending specific actionable resources.
5. FORMATTING: Use Markdown tables for comparisons. When recommending a verified database course, append the exact interactive button: [+ Add to Roadmap](#add-roadmap:Exact_Course_Name).
"""
    
    messages_payload = [{"role": "system", "content": system_instruction}]
    
    for msg in chat.history[-8:]:
        if "Welcome to PathGuide's Digital Career Navigator" in msg.content:
            continue
        role = "assistant" if msg.role == "ai" else "user"
        messages_payload.append({"role": role, "content": msg.content})
        
    messages_payload.append({"role": "user", "content": chat.prompt})

    try:
        chat_completion = await groq_client.chat.completions.create(
            messages=messages_payload,
            model="openai/gpt-oss-120b",
            temperature=0.6,
            max_tokens=4096,
            top_p=0.9
        )
        
        reply_text = chat_completion.choices[0].message.content
        return {"reply": reply_text}
        
    except Exception as e:
        print("Groq API Error:", str(e))
        return {
            "reply": "The AI Career Guide service is currently experiencing high demand. Please try asking your question again in a moment."
        }

# ==========================================
# RAG-POWERED AI ROADMAP EVALUATOR (MULTI-MODULE JUMP)
# ==========================================
@app.post("/api/roadmap-eval")
async def evaluate_roadmap_progress(req: RoadmapEvalRequest):
    regex_title = re.escape(req.courseTitle.strip())
    db_course = await db.courses.find_one({"name": {"$regex": f"^{regex_title}$", "$options": "i"}})
    if not db_course:
        db_course = await db.courses.find_one({"name": {"$regex": regex_title, "$options": "i"}})

    course_name = db_course.get("name", req.courseTitle) if db_course else req.courseTitle
    course_description = db_course.get("description", "Comprehensive industry curriculum") if db_course else f"Curriculum covering {req.courseTitle}"

    remaining_modules = req.totalModules - req.currentModule + 1

    prompt = f"""
    You are an expert AI Course Evaluator.
    You MUST respond in valid JSON format. Do NOT wrap the JSON in markdown blocks (no ```json).

    COURSE CONTEXT:
    - Title: {course_name}
    - Curriculum: {course_description}

    STUDENT SUBMISSION:
    - Current Module: {req.currentModule} out of {req.totalModules}
    - Max Modules They Can Jump: {remaining_modules}
    - What They Learned: "{req.userAnswer}"

    EVALUATION RULES:
    1. Assess the depth of their submission. 
       - If they list 1-2 basic concepts -> Award 1 module.
       - If they list 3-5 distinct tools/concepts -> Award 2-3 modules.
       - If they list an extensive syllabus -> Award 4-8 modules (up to the maximum {remaining_modules}).
    2. 'skillVerified' MUST be a highly specific 3-to-6 word summary derived directly from their text. Do not use generic phrases.
    3. Return ONLY a raw JSON object with these exact keys: "passed", "modulesToAdd", "skillVerified", "feedback", "nextQuestion".

    Example Output Format:
    {{
        "passed": true,
        "modulesToAdd": 3,
        "skillVerified": "Dashboards & Custom Calculations",
        "feedback": "Incredible work! You've mastered multiple critical components of visualization in one go.",
        "nextQuestion": "How would you optimize these dashboards for a mobile view?"
    }}
    """

    try:
        chat_completion = await groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system", 
                    "content": "You are a technical tutor. You evaluate student inputs dynamically. Respond in JSON format only."
                },
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.1, 
            max_tokens=1024,
            response_format={"type": "json_object"}
        )
        
        raw_output = chat_completion.choices[0].message.content
        cleaned_json = re.sub(r"^```json\s*", "", raw_output, flags=re.MULTILINE)
        cleaned_json = re.sub(r"^```\s*", "", cleaned_json, flags=re.MULTILINE).strip()
        
        result = json.loads(cleaned_json)
        
        awarded_modules = int(result.get("modulesToAdd", 1))
        if awarded_modules < 1: awarded_modules = 1
        if awarded_modules > remaining_modules: awarded_modules = remaining_modules

        skill = result.get("skillVerified", "Concepts Verified")
        if "Technical Concepts" in skill or len(skill.split()) > 8:
            words = req.userAnswer.split()
            skill = " ".join(words[:5]) + "..." if len(words) > 5 else req.userAnswer

        return {
            "passed": result.get("passed", True),
            "modulesToAdd": awarded_modules,
            "skillVerified": skill,
            "feedback": result.get("feedback", "Excellent explanation of your learning milestones!"),
            "nextQuestion": result.get("nextQuestion", "What practical exercise will you implement next?")
        }
    except Exception as e:
        print("Roadmap Eval Exception Caught:", str(e))
        return {
            "passed": True,
            "modulesToAdd": 1,
            "skillVerified": "Verified Submission",
            "feedback": "Your progress has been successfully recorded to the server.",
            "nextQuestion": "What is the key objective for your next module?"
        }
