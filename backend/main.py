import os
import asyncio
import certifi
import bcrypt
import json
import re
import time
from collections import Counter
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient

# Machine Learning Imports
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Groq SDK
from groq import AsyncGroq

load_dotenv()
app = FastAPI(title="PathGuide Backend API", version="2.1.0")

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
# IN-MEMORY CACHE FOR PERFORMANCE OPTIMIZATION
# ==========================================
CATALOG_CACHE = {
    "courses": [],
    "scholarships": [],
    "last_fetched": 0
}
CACHE_TTL_SECONDS = 300  # 5 minutes

async def get_cached_catalog():
    now = time.time()
    if now - CATALOG_CACHE["last_fetched"] > CACHE_TTL_SECONDS or not CATALOG_CACHE["courses"]:
        courses = await db.courses.find({}).to_list(length=1000)
        scholarships = await db.scholarships.find({}).to_list(length=1000)
        for c in courses:
            c['_id'] = str(c['_id'])
        for s in scholarships:
            s['_id'] = str(s['_id'])
        CATALOG_CACHE["courses"] = courses
        CATALOG_CACHE["scholarships"] = scholarships
        CATALOG_CACHE["last_fetched"] = now
    return CATALOG_CACHE["courses"], CATALOG_CACHE["scholarships"]

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
    prompt: str = Field(..., min_length=1, max_length=2000)
    history: list[ChatMessage] = []
    userEmail: str | None = None
    userProfile: dict | None = None

class RoadmapEvalRequest(BaseModel):
    courseTitle: str
    currentModule: int
    totalModules: int
    userAnswer: str

class RoadmapSaveRequest(BaseModel):
    userEmail: str
    careerGoal: str
    roadmap: dict

class MilestoneToggleRequest(BaseModel):
    userEmail: str
    careerGoal: str
    stageIndex: int
    milestoneIndex: int
    completed: bool

# ==========================================
# ML CLASSIFICATION & INTENT ENGINE
# ==========================================
def clean_text(text: str) -> str:
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
                item_copy = dict(item)
                item_copy['ml_match_score'] = score
                ranked_items.append(item_copy)
                
        ranked_items = sorted(ranked_items, key=lambda x: x.get('ml_match_score', 0), reverse=True)
        return ranked_items[:top_n]
    except Exception as e:
        print(f"ML Ranking Error: {e}")
        return []

def detect_query_intent(prompt: str) -> str:
    prompt_lower = prompt.lower()
    scholarship_kw = ['scholarship', 'fund', 'financial aid', 'grant', 'fee', 'stipend', 'money']
    course_kw = ['course', 'learn', 'tutorial', 'study', 'certif', 'skill', 'class']
    roadmap_kw = ['roadmap', 'plan', 'step by step', 'pathway', 'curriculum', 'how to become']
    
    wants_sch = any(k in prompt_lower for k in scholarship_kw)
    wants_crs = any(k in prompt_lower for k in course_kw)
    wants_rdm = any(k in prompt_lower for k in roadmap_kw)
    
    if wants_rdm:
        return "roadmap"
    if wants_sch and not wants_crs:
        return "scholarship"
    if wants_crs and not wants_sch:
        return "course"
    return "mixed"

def evaluate_scholarship_eligibility(scholarship: dict, profile: dict | None) -> str:
    """Categorizes verification status accurately to prevent misleading advice."""
    if not profile or not profile.get("category") or not profile.get("familyIncome"):
        return "Eligibility: Requires Verification (Profile incomplete)"
    
    eligible_cats = scholarship.get("eligibleCategories", [])
    eligible_incomes = scholarship.get("eligibleIncomes", [])
    
    if not eligible_cats and not eligible_incomes:
        return "Eligibility: Open / Generic Verification Required"
        
    cat_match = profile.get("category") in eligible_cats if eligible_cats else True
    inc_match = profile.get("familyIncome") in eligible_incomes if eligible_incomes else True
    
    if cat_match and inc_match:
        return "Eligibility: Appears Eligible (Matched by Category & Income)"
    return "Eligibility: Further Verification Required (Criteria mismatch or unconfirmed)"

# ==========================================
# AUTHENTICATION & PROFILE ENDPOINTS
# ==========================================
@app.post("/api/register")
async def register_user(user: UserAuth):
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
    courses, _ = await get_cached_catalog()
    return {"courses": courses}

@app.get("/api/scholarships")
async def get_all_scholarships():
    _, scholarships = await get_cached_catalog()
    return {"scholarships": scholarships}

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

    all_courses, all_scholarships = await get_cached_catalog()

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
# RAG CAREER GUIDANCE CHATBOT (SECTIONS 6, 8, 10, 11)
# ==========================================
@app.post("/api/career-guidance")
async def get_career_guidance(chat: ChatRequest):
    if not chat.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")
        
    intent = detect_query_intent(chat.prompt)
    all_courses, all_scholarships = await get_cached_catalog()
    
    top_courses = []
    top_scholarships = []
    user_category = chat.userProfile.get("category") if chat.userProfile else None

    # Filtered Intent-aware retrieval
    if intent in ["course", "roadmap", "mixed"]:
        top_courses = rank_items_by_ml(chat.prompt, all_courses, "description", top_n=5, min_score=2.0)

    if intent in ["scholarship", "mixed"]:
        eligible_candidates = all_scholarships
        if user_category:
            eligible_candidates = [
                s for s in all_scholarships
                if not s.get("eligibleCategories") or user_category in s.get("eligibleCategories", [])
            ]
        top_scholarships = rank_items_by_ml(chat.prompt, eligible_candidates, "description", top_n=5, min_score=2.0)

    # Build Verified Source Citations context
    rag_context = "DATABASE RETRIEVED RESOURCES:\n"
    if top_courses:
        rag_context += "\n[VERIFIED COURSES]\n"
        for c in top_courses:
            url = c.get('url', '#')
            rag_context += f"- Title: {c.get('name')} | Platform: {c.get('provider')} | Desc: {c.get('description')} | Link: {url}\n"
    
    if top_scholarships:
        rag_context += "\n[VERIFIED SCHOLARSHIPS]\n"
        for s in top_scholarships:
            status = evaluate_scholarship_eligibility(s, chat.userProfile)
            docs = ", ".join(s.get('documentsRequired', ['Marksheet', 'Income Proof']))
            url = s.get('url', '#')
            rag_context += f"- Title: {s.get('name')} | Provider: {s.get('provider')} | {status} | Required Docs: {docs} | Link: {url}\n"
            
    if not top_courses and not top_scholarships:
        rag_context += "No direct database records matched this query with sufficient relevance.\n"

    # Personalized Student Context
    student_context = "STUDENT CONTEXT:"
    if chat.userProfile:
        student_context += f"""
- Academic Year: {chat.userProfile.get('academicYear', 'Not specified')}
- Category: {chat.userProfile.get('category', 'Not specified')}
- Family Income: {chat.userProfile.get('familyIncome', 'Not specified')}
"""
    else:
        student_context += " Profile not configured yet."

    system_instruction = f"""
You are the AI Career & Financial Aid Advisor for PathGuide.

{student_context}

{rag_context}

STRICT BEHAVIOR RULES:
1. CITATIONS & TRANSPARENCY:
   - For every course/scholarship recommended, state its Title, Relevance Explanation, and original official Markdown link [Official Portal](URL).
   - For scholarships, explicitly state eligibility as: [Appears Eligible], [Requires Verification], or [Undetermined]. Never claim eligibility is guaranteed.
   - NEVER invent or synthesize links, fees, or deadlines not present in the verified records.
2. ROADMAP FORMATTING:
   - When generating roadmaps, provide: Career Objective, Stages (Beginner -> Advanced), Key Skills, Recommended Courses (from Verified Courses above), Practical Projects, and Timelines.
   - Append `[+ Add to Roadmap](#add-roadmap:Exact_Course_Name)` for verified course additions.
3. CONVERSATIONAL REASONING:
   - Present balanced alternatives rather than asserting a single "best" path.
   - If user asks follow-up questions (e.g., "give me free options for this"), retain the previous career context.
   - If database has no matches, state: "I currently do not have verified records in the database for this specific request" and provide high-level methodology instead of inventing courses.
"""

    messages_payload = [{"role": "system", "content": system_instruction}]
    
    # Prune history to last 6 messages to stay within token limits and prevent context leakage
    for msg in chat.history[-6:]:
        if "Welcome to PathGuide" in msg.content:
            continue
        role = "assistant" if msg.role == "ai" else "user"
        messages_payload.append({"role": role, "content": msg.content})
        
    messages_payload.append({"role": "user", "content": chat.prompt})

    try:
        chat_completion = await groq_client.chat.completions.create(
            messages=messages_payload,
            model="openai/gpt-oss-120b",
            temperature=0.4,
            max_tokens=2500,
            top_p=0.9
        )
        return {"reply": chat_completion.choices[0].message.content}
    except Exception as e:
        print("Groq API Error:", str(e))
        return {
            "reply": "PathGuide AI is experiencing temporary latency. Please verify your internet connection or rephrase your question."
        }

# ==========================================
# STRUCTURED ROADMAP STORAGE & MANAGEMENT (SECTION 7)
# ==========================================
@app.post("/api/roadmaps/save")
async def save_user_roadmap(req: RoadmapSaveRequest):
    if not req.userEmail or not req.userEmail.endswith("@gmail.com"):
        raise HTTPException(status_code=400, detail="Invalid student session.")
        
    record = {
        "userEmail": req.userEmail.lower(),
        "careerGoal": req.careerGoal,
        "roadmap": req.roadmap,
        "updatedAt": asyncio.get_event_loop().time()
    }
    
    await db.user_roadmaps.update_one(
        {"userEmail": req.userEmail.lower(), "careerGoal": req.careerGoal},
        {"$set": record},
        upsert=True
    )
    return {"message": "Roadmap progress saved successfully."}

@app.get("/api/roadmaps/{email}")
async def get_user_roadmaps(email: str):
    if not email.endswith("@gmail.com"):
        raise HTTPException(status_code=400, detail="Invalid session email.")
    cursor = db.user_roadmaps.find({"userEmail": email.lower()})
    roadmaps = await cursor.to_list(length=20)
    for r in roadmaps:
        r["_id"] = str(r["_id"])
    return {"roadmaps": roadmaps}

@app.post("/api/roadmaps/milestone")
async def toggle_roadmap_milestone(req: MilestoneToggleRequest):
    doc = await db.user_roadmaps.find_one({"userEmail": req.userEmail.lower(), "careerGoal": req.careerGoal})
    if not doc:
        raise HTTPException(status_code=404, detail="Roadmap not found.")
        
    roadmap = doc.get("roadmap", {})
    stages = roadmap.get("stages", [])
    try:
        stages[req.stageIndex]["milestones"][req.milestoneIndex]["completed"] = req.completed
        await db.user_roadmaps.update_one(
            {"_id": doc["_id"]},
            {"$set": {"roadmap.stages": stages, "updatedAt": asyncio.get_event_loop().time()}}
        )
        return {"message": "Milestone updated."}
    except IndexError:
        raise HTTPException(status_code=400, detail="Invalid milestone coordinates.")

# ==========================================
# RAG EVALUATOR (EXISTING ROADMAP EVAL)
# ==========================================
@app.post("/api/roadmap-eval")
async def evaluate_roadmap_progress(req: RoadmapEvalRequest):
    regex_title = re.escape(req.courseTitle.strip())
    db_course = await db.courses.find_one({"name": {"$regex": f"^{regex_title}$", "$options": "i"}})
    if not db_course:
        db_course = await db.courses.find_one({"name": {"$regex": regex_title, "$options": "i"}})

    course_name = db_course.get("name", req.courseTitle) if db_course else req.courseTitle
    course_desc = db_course.get("description", "Standard curriculum") if db_course else f"Curriculum for {req.courseTitle}"
    remaining_modules = req.totalModules - req.currentModule + 1

    prompt = f"""
    You are an expert Course Evaluator. Respond ONLY in valid JSON.
    Course: {course_name}
    Curriculum: {course_desc}
    Current Module: {req.currentModule} / {req.totalModules}
    Answer: "{req.userAnswer}"

    Rules:
    - Assess depth. Award 1 to {remaining_modules} modules.
    - Provide concise 'skillVerified' (3-6 words).
    - Keys: "passed", "modulesToAdd", "skillVerified", "feedback", "nextQuestion".
    """

    try:
        chat_completion = await groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You evaluate student submissions. Respond in JSON only."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.1,
            max_tokens=600,
            response_format={"type": "json_object"}
        )
        result = json.loads(chat_completion.choices[0].message.content)
        modules = min(max(int(result.get("modulesToAdd", 1)), 1), remaining_modules)
        return {
            "passed": result.get("passed", True),
            "modulesToAdd": modules,
            "skillVerified": result.get("skillVerified", "Verified Module"),
            "feedback": result.get("feedback", "Good progress recorded."),
            "nextQuestion": result.get("nextQuestion", "What will you build next?")
        }
    except Exception as e:
        print("Roadmap Eval Fallback:", e)
        return {
            "passed": True,
            "modulesToAdd": 1,
            "skillVerified": "Module Progress",
            "feedback": "Your progress has been recorded.",
            "nextQuestion": "Proceed to the next module."
        }
