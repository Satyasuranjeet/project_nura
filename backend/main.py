from __future__ import annotations

import hashlib
import hmac
import json
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

import razorpay
import uvicorn
from bson import ObjectId
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google import genai
from google.genai import errors as genai_errors
from google.genai import types as genai_types
import bcrypt
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

load_dotenv()

# ---------------------------------------------------------------------------
# MongoDB
# ---------------------------------------------------------------------------
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGODB_DB", "neurogoals")

_mongo: AsyncIOMotorClient | None = None
_db = None


# ---------------------------------------------------------------------------
# JWT + Password hashing
# ---------------------------------------------------------------------------
JWT_SECRET = os.getenv("JWT_SECRET", "change_this_in_production_please")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 30

bearer = HTTPBearer()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS)
    return jwt.encode({"sub": user_id, "exp": expire}, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
) -> str:
    try:
        payload = jwt.decode(
            credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM]
        )
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ---------------------------------------------------------------------------
# Razorpay
# ---------------------------------------------------------------------------
_razorpay = razorpay.Client(
    auth=(
        os.getenv("VITE_RAZORPAY_KEY_ID", "rzp_test_placeholder"),
        os.getenv("RAZORPAY_KEY_SECRET", "placeholder_secret"),
    )
)

# ---------------------------------------------------------------------------
# Gemini
# ---------------------------------------------------------------------------
_gemini = genai.Client(api_key=os.getenv("GEMINI_API_KEY", ""))
GEMINI_MODEL = "gemini-2.5-flash"


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    global _mongo, _db
    _mongo = AsyncIOMotorClient(MONGO_URI)
    _db = _mongo[MONGO_DB]
    await _db.users.create_index("email", unique=True)
    await _db.goals.create_index([("userId", 1), ("createdAt", -1)])
    await _db.tasks.create_index([("goalId", 1), ("userId", 1)])
    await _db.transactions.create_index([("userId", 1), ("createdAt", -1)])
    print(f"[NeuroGoals] MongoDB connected: {MONGO_URI}/{MONGO_DB}")
    yield
    if _mongo:
        _mongo.close()


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="NeuroGoals API", lifespan=lifespan)

import os as _os
_raw_origins = _os.getenv("ALLOWED_ORIGINS", "")
_extra = [o.strip() for o in _raw_origins.split(",") if o.strip()]
_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:4173",
    "https://project-nura.vercel.app",
] + _extra

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def serialize(doc: dict) -> dict:
    out = dict(doc)
    out["id"] = str(out.pop("_id"))
    for k, v in list(out.items()):
        if isinstance(v, ObjectId):
            out[k] = str(v)
    return out


def serialize_user(doc: dict) -> dict:
    out = serialize(doc)
    out["uid"] = out["id"]   # UserProfile.uid alias
    out.pop("password", None)
    return out


def now_str() -> str:
    return datetime.now(timezone.utc).isoformat()


def today_str() -> str:
    return datetime.now(timezone.utc).date().isoformat()


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.get("/api/health")
async def health():
    mongo_ok = False
    if _db is not None:
        try:
            await _db.command("ping")
            mongo_ok = True
        except Exception:
            pass
    return {"status": "ok", "mongodb": mongo_ok}


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class RegisterRequest(BaseModel):
    email: str
    password: str
    displayName: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class UpdateProfileRequest(BaseModel):
    displayName: str | None = None
    freeChatsToday: int | None = None
    lastLoginDate: str | None = None
    credits: int | None = None
    xp: int | None = None
    streak: int | None = None
    level: int | None = None


@app.post("/api/auth/register", status_code=201)
async def register(req: RegisterRequest):
    if _db is None:
        raise HTTPException(500, "Database not ready")
    existing = await _db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(400, "Email already registered")
    today = today_str()
    doc = {
        "email": req.email.lower(),
        "password": hash_password(req.password),
        "displayName": req.displayName.strip() or req.email.split("@")[0],
        "xp": 0,
        "streak": 0,
        "level": 1,
        "credits": 10,
        "freeChatsToday": 3,
        "lastLoginDate": today,
        "lastActive": now_str(),
        "createdAt": now_str(),
    }
    result = await _db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    token = create_token(str(result.inserted_id))
    return {"token": token, "user": serialize_user(doc)}


@app.post("/api/auth/login")
async def login(req: LoginRequest):
    if _db is None:
        raise HTTPException(500, "Database not ready")
    user = await _db.users.find_one({"email": req.email.lower()})
    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(401, "Invalid email or password")
    today = today_str()
    update: dict = {"lastActive": now_str(), "lastLoginDate": today}
    if user.get("lastLoginDate") != today:
        update["freeChatsToday"] = 3
    await _db.users.update_one({"_id": user["_id"]}, {"$set": update})
    user.update(update)
    token = create_token(str(user["_id"]))
    return {"token": token, "user": serialize_user(user)}


@app.get("/api/auth/me")
async def get_me(user_id: str = Depends(get_current_user_id)):
    if _db is None:
        raise HTTPException(500, "Database not ready")
    user = await _db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(404, "User not found")
    return serialize_user(user)


@app.patch("/api/auth/me")
async def update_me(req: UpdateProfileRequest, user_id: str = Depends(get_current_user_id)):
    if _db is None:
        raise HTTPException(500, "Database not ready")
    updates = req.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(400, "No fields to update")
    await _db.users.update_one({"_id": ObjectId(user_id)}, {"$set": updates})
    user = await _db.users.find_one({"_id": ObjectId(user_id)})
    return serialize_user(user)


# ---------------------------------------------------------------------------
# Goals CRUD
# ---------------------------------------------------------------------------
class GoalCreate(BaseModel):
    title: str
    description: str = ""
    deadline: str
    priority: str = "medium"
    category: str = "personal"


class GoalUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    deadline: str | None = None
    priority: str | None = None
    category: str | None = None
    progress: int | None = None
    status: str | None = None


@app.get("/api/goals")
async def get_goals(user_id: str = Depends(get_current_user_id)):
    if _db is None:
        raise HTTPException(500, "Database not ready")
    cursor = _db.goals.find({"userId": user_id}).sort("createdAt", -1)
    return [serialize(g) async for g in cursor]


@app.post("/api/goals", status_code=201)
async def create_goal(req: GoalCreate, user_id: str = Depends(get_current_user_id)):
    if _db is None:
        raise HTTPException(500, "Database not ready")
    doc = {
        **req.model_dump(),
        "userId": user_id,
        "progress": 0,
        "status": "active",
        "createdAt": now_str(),
        "updatedAt": now_str(),
    }
    result = await _db.goals.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize(doc)


@app.patch("/api/goals/{goal_id}")
async def update_goal(goal_id: str, req: GoalUpdate, user_id: str = Depends(get_current_user_id)):
    if _db is None:
        raise HTTPException(500, "Database not ready")
    updates = req.model_dump(exclude_unset=True)
    updates["updatedAt"] = now_str()
    result = await _db.goals.update_one(
        {"_id": ObjectId(goal_id), "userId": user_id}, {"$set": updates}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Goal not found")
    goal = await _db.goals.find_one({"_id": ObjectId(goal_id)})
    return serialize(goal)


@app.delete("/api/goals/{goal_id}", status_code=204)
async def delete_goal(goal_id: str, user_id: str = Depends(get_current_user_id)):
    if _db is None:
        raise HTTPException(500, "Database not ready")
    await _db.goals.delete_one({"_id": ObjectId(goal_id), "userId": user_id})
    await _db.tasks.delete_many({"goalId": goal_id})


# ---------------------------------------------------------------------------
# Tasks CRUD
# ---------------------------------------------------------------------------
class TaskCreate(BaseModel):
    title: str
    estimatedMinutes: int = 30
    completed: bool = False


class TaskBatchCreate(BaseModel):
    tasks: list[TaskCreate]


class TaskUpdate(BaseModel):
    title: str | None = None
    completed: bool | None = None
    estimatedMinutes: int | None = None


@app.get("/api/goals/{goal_id}/tasks")
async def get_tasks(goal_id: str, user_id: str = Depends(get_current_user_id)):
    if _db is None:
        raise HTTPException(500, "Database not ready")
    cursor = _db.tasks.find({"goalId": goal_id, "userId": user_id}).sort("createdAt", 1)
    return [serialize(t) async for t in cursor]


@app.post("/api/goals/{goal_id}/tasks", status_code=201)
async def create_task(goal_id: str, req: TaskCreate, user_id: str = Depends(get_current_user_id)):
    if _db is None:
        raise HTTPException(500, "Database not ready")
    doc = {**req.model_dump(), "goalId": goal_id, "userId": user_id, "createdAt": now_str()}
    result = await _db.tasks.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize(doc)


@app.post("/api/goals/{goal_id}/tasks/batch", status_code=201)
async def batch_create_tasks(
    goal_id: str, req: TaskBatchCreate, user_id: str = Depends(get_current_user_id)
):
    if _db is None:
        raise HTTPException(500, "Database not ready")
    if not req.tasks:
        return []
    docs = [
        {**t.model_dump(), "goalId": goal_id, "userId": user_id, "createdAt": now_str()}
        for t in req.tasks
    ]
    result = await _db.tasks.insert_many(docs)
    for doc, oid in zip(docs, result.inserted_ids):
        doc["_id"] = oid
    return [serialize(d) for d in docs]


@app.patch("/api/goals/{goal_id}/tasks/{task_id}")
async def update_task(
    goal_id: str,
    task_id: str,
    req: TaskUpdate,
    user_id: str = Depends(get_current_user_id),
):
    if _db is None:
        raise HTTPException(500, "Database not ready")
    updates = req.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(400, "No fields to update")
    result = await _db.tasks.update_one(
        {"_id": ObjectId(task_id), "goalId": goal_id, "userId": user_id},
        {"$set": updates},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Task not found")
    task = await _db.tasks.find_one({"_id": ObjectId(task_id)})
    return serialize(task)


@app.delete("/api/goals/{goal_id}/tasks/{task_id}", status_code=204)
async def delete_task(
    goal_id: str, task_id: str, user_id: str = Depends(get_current_user_id)
):
    if _db is None:
        raise HTTPException(500, "Database not ready")
    await _db.tasks.delete_one(
        {"_id": ObjectId(task_id), "goalId": goal_id, "userId": user_id}
    )


# ---------------------------------------------------------------------------
# Transactions
# ---------------------------------------------------------------------------
@app.get("/api/transactions")
async def get_transactions(user_id: str = Depends(get_current_user_id)):
    if _db is None:
        raise HTTPException(500, "Database not ready")
    cursor = _db.transactions.find({"userId": user_id}).sort("createdAt", -1).limit(20)
    return [serialize(t) async for t in cursor]


# ---------------------------------------------------------------------------
# AI endpoints
# ---------------------------------------------------------------------------
class SubtaskRequest(BaseModel):
    goalTitle: str
    goalDescription: str


class ChatRequest(BaseModel):
    message: str
    context: str = ""


@app.post("/api/ai/subtasks")
async def ai_subtasks(req: SubtaskRequest, user_id: str = Depends(get_current_user_id)):
    prompt = (
        f"Goal: {req.goalTitle}\nDescription: {req.goalDescription}\n\n"
        "Suggest 5-8 actionable subtasks for this goal. For each subtask provide a title and "
        "estimated time in minutes. Also include a brief motivational quote and a summary "
        "timeline estimate."
    )
    response_schema = {
        "type": "object",
        "properties": {
            "subtasks": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "estimatedMinutes": {"type": "number"},
                    },
                    "required": ["title", "estimatedMinutes"],
                },
            },
            "motivation": {"type": "string"},
            "timelineEstimate": {"type": "string"},
        },
        "required": ["subtasks", "motivation", "timelineEstimate"],
    }
    try:
        result = _gemini.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=response_schema,
            ),
        )
        return json.loads(result.text)
    except genai_errors.ClientError as exc:
        if exc.status_code == 429:
            raise HTTPException(status_code=503, detail="AI quota exceeded. Please try again later.")
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/ai/chat")
async def ai_chat(req: ChatRequest, user_id: str = Depends(get_current_user_id)):
    if _db is None:
        raise HTTPException(500, "Database not ready")
    user = await _db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(404, "User not found")

    free_chats = user.get("freeChatsToday", 0)
    credits = user.get("credits", 0)
    if free_chats <= 0 and credits < 0.25:
        raise HTTPException(402, "Insufficient credits")

    # Fetch the user's active goals for personalised context
    user_goals = await _db.goals.find(
        {"userId": user_id, "status": "active"}
    ).sort("createdAt", -1).limit(10).to_list(10)

    goals_summary = ""
    if user_goals:
        lines = []
        for g in user_goals:
            prog = g.get("progress", 0)
            dl = g.get("deadline", "no deadline")
            pri = g.get("priority", "medium")
            lines.append(f'• "{g["title"]}" — {prog}% done, priority: {pri}, deadline: {dl}')
        goals_summary = "User's current active goals:\n" + "\n".join(lines)

    system_prompt = (
        "You are NeuroAssistant, a futuristic AI productivity coach inside NeuroGoals app.\n"
        "Rules:\n"
        "- Always reply in **Markdown**: use **bold** for key points, bullet lists for steps/tips, "
        "and `##` or `###` headings only when the response is long enough to need sections.\n"
        "- Keep answers concise and actionable — no fluff.\n"
        "- Be motivating and forward-looking.\n"
        "- Reference the user's specific goals by name when relevant to give personalised advice.\n"
        f"{goals_summary}"
    )

    contents = f"Context: {req.context}\n\nUser: {req.message}" if req.context else req.message
    try:
        result = _gemini.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config=genai_types.GenerateContentConfig(
                system_instruction=system_prompt
            ),
        )
        response_text = result.text
    except genai_errors.ClientError as exc:
        if exc.status_code == 429:
            raise HTTPException(status_code=503, detail="AI quota exceeded. Please try again later.")
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    if free_chats > 0:
        await _db.users.update_one({"_id": ObjectId(user_id)}, {"$inc": {"freeChatsToday": -1}})
        free_chats -= 1
    else:
        char_count = len(response_text)
        if char_count < 200:
            cost = 0.25
        elif char_count < 400:
            cost = 0.5
        else:
            cost = 1.0
        await _db.users.update_one({"_id": ObjectId(user_id)}, {"$inc": {"credits": -cost}})
        credits = round(credits - cost, 2)

    # Persist exchange to MongoDB for history
    await _db.chat_messages.insert_many([
        {"userId": user_id, "role": "user",      "content": req.message,   "createdAt": now_str()},
        {"userId": user_id, "role": "assistant", "content": response_text, "createdAt": now_str()},
    ])

    return {"response": response_text, "freeChatsToday": free_chats, "credits": credits}


@app.get("/api/ai/history")
async def get_chat_history(user_id: str = Depends(get_current_user_id)):
    if _db is None:
        raise HTTPException(500, "Database not ready")
    docs = await _db.chat_messages.find(
        {"userId": user_id}
    ).sort("createdAt", 1).limit(200).to_list(200)
    return [
        {
            "id": str(d["_id"]),
            "role": d["role"],
            "content": d["content"],
            "createdAt": d["createdAt"],
        }
        for d in docs
    ]


@app.delete("/api/ai/history")
async def clear_chat_history(user_id: str = Depends(get_current_user_id)):
    if _db is None:
        raise HTTPException(500, "Database not ready")
    await _db.chat_messages.delete_many({"userId": user_id})
    return {"status": "cleared"}


# ---------------------------------------------------------------------------
# Payment endpoints
# ---------------------------------------------------------------------------
class OrderRequest(BaseModel):
    amount: float
    currency: str = "INR"


class VerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    credits: int
    amount: float


@app.post("/api/payment/order")
async def create_order(req: OrderRequest, user_id: str = Depends(get_current_user_id)):
    try:
        order = _razorpay.order.create(
            {
                "amount": int(round(req.amount * 100)),
                "currency": req.currency,
                "receipt": f"receipt_{os.urandom(4).hex()}",
            }
        )
        return order
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/payment/verify")
async def verify_payment(req: VerifyRequest, user_id: str = Depends(get_current_user_id)):
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "placeholder_secret")
    sign_payload = f"{req.razorpay_order_id}|{req.razorpay_payment_id}"
    expected = hmac.new(
        key_secret.encode(), sign_payload.encode(), hashlib.sha256
    ).hexdigest()
    if req.razorpay_signature != expected:
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    if _db is None:
        raise HTTPException(500, "Database not ready")
    try:
        await _db.users.update_one(
            {"_id": ObjectId(user_id)}, {"$inc": {"credits": req.credits}}
        )
        await _db.transactions.insert_one(
            {
                "userId": user_id,
                "amount": req.amount,
                "credits": req.credits,
                "razorpayOrderId": req.razorpay_order_id,
                "razorpayPaymentId": req.razorpay_payment_id,
                "status": "completed",
                "createdAt": now_str(),
            }
        )
        return {"status": "success"}
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Payment verified but database update failed: {exc}",
        )


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
