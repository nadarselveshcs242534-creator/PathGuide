import os
import asyncio
import certifi
import pandas as pd
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

async def seed_database():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(
        os.getenv("MONGO_URI") or os.getenv("MONGO_DETAILS"),
        tlsCAFile=certifi.where()
    )
    db = client.digital_carrier

    courses = []
    scholarships = []

    # ==========================================
    # 1. OFFICIAL OPENAI ACADEMY COURSES & CREDENTIALS
    # ==========================================
    openai_academy_data = [
        {
            "name": "AI Foundations",
            "provider": "OpenAI Academy",
            "description": "Domain: AI / GenAI / LLM / Prompting. Covers AI, LLMs, ChatGPT, prompting + assessment + official badge. FREE.",
            "url": "https://academy.openai.com/public/courses/ai-foundations-dnq5w"
        },
        {
            "name": "Applied AI Foundations",
            "provider": "OpenAI Academy",
            "description": "Domain: AI Workflows / Prompt Engineering. Practical AI workflows, prompting techniques, repeatable productivity workflows + badge. FREE.",
            "url": "https://academy.openai.com/pages/courses"
        },
        {
            "name": "Agents & Workflows",
            "provider": "OpenAI Academy",
            "description": "Domain: AI Agents / Automation. Design, deploy, and manage AI agents and automated workflows + badge. FREE.",
            "url": "https://academy.openai.com/pages/courses"
        },
        {
            "name": "Get Started with Codex",
            "provider": "OpenAI Academy",
            "description": "Domain: AI Development / Coding. Foundations of AI-assisted software development and code generation with Codex. FREE.",
            "url": "https://academy.openai.com/pages/courses"
        },
        {
            "name": "Extend Codex Workflows",
            "provider": "OpenAI Academy",
            "description": "Domain: AI Development / Advanced Engineering. Advanced developer workflows, refactoring, and integration using Codex. FREE.",
            "url": "https://academy.openai.com/pages/courses"
        },
        {
            "name": "Scope AI Solutions",
            "provider": "OpenAI Academy",
            "description": "Domain: AI Architecture / Solution Design. Frameworks to identify high-impact enterprise problems and architect AI solutions. FREE.",
            "url": "https://academy.openai.com/pages/courses"
        },
        {
            "name": "Evaluate AI Applications",
            "provider": "OpenAI Academy",
            "description": "Domain: AI Evaluation / LLMOps. Benchmarking, output quality assessment, and evaluation metrics for AI applications. FREE.",
            "url": "https://academy.openai.com/pages/courses"
        },
        {
            "name": "Design & Build Agentic Systems",
            "provider": "OpenAI Academy",
            "description": "Domain: Agentic Systems / Autonomous AI. Building complex multi-agent architectures, reasoning loops, and autonomous tool use. FREE.",
            "url": "https://academy.openai.com/pages/courses"
        },
        {
            "name": "Build with Retrieval-Augmented Generation",
            "provider": "OpenAI Academy",
            "description": "Domain: RAG / Vector Search / LLMs. Design and production RAG systems connecting LLMs to external vector databases. FREE.",
            "url": "https://academy.openai.com/pages/courses"
        },
        {
            "name": "Optimize AI Application Performance",
            "provider": "OpenAI Academy",
            "description": "Domain: AI Performance / Optimization. Latency reduction, context window caching, rate-limit management, and cost optimization. FREE.",
            "url": "https://academy.openai.com/pages/courses"
        },
        {
            "name": "AI for College Students",
            "provider": "OpenAI Academy",
            "description": "Domain: AI Literacy / Career Prep. Using AI tools for academic research, conceptual learning, study planning, and career preparation. FREE.",
            "url": "https://academy.openai.com/pages/courses"
        },
        {
            "name": "AI for Educators",
            "provider": "OpenAI Academy",
            "description": "Domain: AI in Education. Integrating AI into teaching, personalized curriculum building, and classroom learning strategies. FREE.",
            "url": "https://academy.openai.com/pages/courses"
        },
        {
            "name": "OpenAI Academy Course Badge",
            "provider": "OpenAI Academy",
            "description": "Official Digital Credential: Earned upon completing an Academy course and passing the final assessment with 80%+ score. FREE.",
            "url": "https://help.openai.com/en/articles/20001270-openai-academy-courses"
        },
        {
            "name": "OpenAI Academy Pathway Certificate of Completion",
            "provider": "OpenAI Academy",
            "description": "Official Verified Pathway Credential: Awarded upon completing all core courses and assessments in an eligible career track. FREE.",
            "url": "https://help.openai.com/en/articles/20001270-openai-academy-courses"
        }
    ]

    for item in openai_academy_data:
        courses.append({
            "name": item["name"],
            "provider": item["provider"],
            "description": item["description"],
            "url": item["url"]
        })

    # ==========================================
    # 2. ROCKTHEIT FREE COURSES
    # ==========================================
    rock_the_it_data = [
        {"name": "Artificial Intelligence", "tags": "#AI #ArtificialIntelligence"},
        {"name": "Mastering Prompt Engineering using LLM", "tags": "#AI #LLM #GenerativeAI"},
        {"name": "Big Data Analytics", "tags": "#DataScience #BigData #Analytics"},
        {"name": "Data Visualization with Power BI and Tableau", "tags": "#DataVisualization #PowerBI #Tableau"},
        {"name": "Advanced Web Development", "tags": "#FullStack #WebDevelopment"},
        {"name": "Operating System", "tags": "#ComputerScience #IT"},
        {"name": "Artificial Intelligence – Question Bank", "tags": "#AI #ExamPreparation"},
        {"name": "Computer Networks", "tags": "#Networking #IT"},
        {"name": "Database Management System", "tags": "#DBMS #SoftwareDevelopment"},
        {"name": "Machine Learning", "tags": "#ML #AI"},
        {"name": "Python Programming", "tags": "#Python #Programming"},
        {"name": "Java Programming", "tags": "#Java #Programming"},
        {"name": "Web Technology", "tags": "#WebDevelopment #FullStack"},
        {"name": "Data Structures", "tags": "#DSA #Programming"},
        {"name": "Cloud Computing", "tags": "#Cloud #IT"},
        {"name": "Cyber Security", "tags": "#CyberSecurity #InformationSecurity"},
        {"name": "Software Engineering", "tags": "#SoftwareDevelopment"},
        {"name": "Computer Graphics", "tags": "#Graphics #ComputerScience"},
        {"name": "Internet of Things", "tags": "#IoT #EmergingTech"},
        {"name": "Natural Language Processing", "tags": "#NLP #AI #ML"}
    ]

    for item in rock_the_it_data:
        courses.append({
            "name": item["name"],
            "provider": "RockTheIT",
            "description": f"Domain: {item['tags']}. FREE - Enroll Now.",
            "url": "https://rocktheit.com"
        })

    # ==========================================
    # 3. ANTHROPIC COURSES & CREDENTIALS
    # ==========================================
    anthropic_data = [
        {
            "name": "AI Fluency Course",
            "provider": "Anthropic",
            "description": "Domain: AI, GenAI, AI literacy. Type: Course. Cost: FREE.",
            "url": "https://www.anthropic.com"
        },
        {
            "name": "Building Agents with Claude",
            "provider": "Anthropic",
            "description": "Domain: AI Agents, LLM, GenAI. Type: Course. Cost: FREE.",
            "url": "https://www.anthropic.com"
        },
        {
            "name": "Claude / Claude Code learning",
            "provider": "Anthropic",
            "description": "Domain: AI, Coding, Software Development. Type: Training. Cost: FREE.",
            "url": "https://www.anthropic.com"
        },
        {
            "name": "Anthropic Academy",
            "provider": "Anthropic",
            "description": "Domain: AI, Claude, API, Agents. Type: Learning platform. Cost: FREE.",
            "url": "https://www.anthropic.com"
        },
        {
            "name": "Claude Certified Architect, Foundations",
            "provider": "Anthropic",
            "description": "Domain: AI engineering, Claude API, solution architecture. Type: Certification. Cost: Partner program.",
            "url": "https://www.anthropic.com"
        },
        {
            "name": "Claude Frontier Deployed Engineer",
            "provider": "Anthropic",
            "description": "Domain: Advanced AI engineering / enterprise AI. Type: Professional credential. Cost: Program-based.",
            "url": "https://www.anthropic.com"
        }
    ]

    for item in anthropic_data:
        courses.append({
            "name": item["name"],
            "provider": item["provider"],
            "description": item["description"],
            "url": item["url"]
        })

    # ==========================================
    # 4. EXCEL FILE DATASET (Courses & Scholarships)
    # ==========================================
    excel_file = "India_Student_Scholarship_and_Course_Resources.xlsx"
    if os.path.exists(excel_file):
        print(f"Reading data from {excel_file}...")
        try:
            # Parse Courses Sheet
            df_courses = pd.read_excel(excel_file, sheet_name='Courses 50')
            for _, row in df_courses.iterrows():
                if pd.isna(row.get('Course Site')):
                    continue
                courses.append({
                    "name": str(row.get('Course Site', '')).strip(),
                    "provider": str(row.get('Provider / Institution', '')).strip(),
                    "description": f"Fields: {row.get('Relevant Fields', '')} | Access: {row.get('Access / Fee', '')}",
                    "url": str(row.get('Official Link', '')).strip()
                })
            
            # Parse Scholarships Sheet
            df_sch = pd.read_excel(excel_file, sheet_name='Scholarships 50')
            for _, row in df_sch.iterrows():
                if pd.isna(row.get('Scholarship / Portal')):
                    continue
                
                docs_str = str(row.get('Common Documents / Evidence', ''))
                docs_list = [d.strip() for d in docs_str.split(',')] if docs_str and docs_str.lower() != 'nan' else []

                scholarships.append({
                    "name": str(row.get('Scholarship / Portal', '')).strip(),
                    "provider": str(row.get('Provider', '')).strip(),
                    "description": f"Eligibility: {row.get('Eligibility / Target', '')} | Fields: {row.get('Relevant Fields', '')}",
                    "url": str(row.get('Official Link', '')).strip(),
                    "documentsRequired": docs_list,
                    "eligibleCategories": ["Open/General", "OBC", "SC/ST", "Minority"],
                    "eligibleIncomes": ["Below ₹1 Lakh", "₹1 Lakh – ₹2.5 Lakhs", "₹2.5 Lakhs – ₹8 Lakhs", "Above ₹8 Lakhs"]
                })
        except Exception as e:
            print(f"Error reading Excel file: {e}")
    else:
        print(f"Excel file '{excel_file}' not found. Skipping file-based entries.")

    # ==========================================
    # 5. SAFE DATABASE INSERTION (Deduplicated, Non-Destructive)
    # ==========================================
    print(f"\n--- Processing {len(courses)} Total Candidate Courses ---")
    courses_added = 0
    courses_skipped = 0
    for course in courses:
        existing_course = await db.courses.find_one({"name": course["name"]})
        if not existing_course:
            await db.courses.insert_one(course)
            courses_added += 1
            print(f"Added Course: {course['name']} ({course['provider']})")
        else:
            courses_skipped += 1

    print(f"\n--- Processing {len(scholarships)} Total Candidate Scholarships ---")
    scholarships_added = 0
    scholarships_skipped = 0
    for sch in scholarships:
        existing_sch = await db.scholarships.find_one({"name": sch["name"]})
        if not existing_sch:
            await db.scholarships.insert_one(sch)
            scholarships_added += 1
            print(f"Added Scholarship: {sch['name']} ({sch['provider']})")
        else:
            scholarships_skipped += 1

    print("\n==========================================")
    print("Database Seeding Finished!")
    print(f"Courses Added: {courses_added} | Skipped (Existing/Duplicate): {courses_skipped}")
    print(f"Scholarships Added: {scholarships_added} | Skipped (Existing/Duplicate): {scholarships_skipped}")
    print("==========================================")

if __name__ == "__main__":
    asyncio.run(seed_database())