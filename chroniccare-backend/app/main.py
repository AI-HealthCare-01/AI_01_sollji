from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import get_settings
from app.core.database import engine
from app.routers import auth, documents, analysis, chat, rehab, profile, feedback
from fastapi.security import HTTPBearer

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"🚀 AI Health API 시작 - 환경: {settings.app_env}")
    yield
    await engine.dispose()
    print("👋 AI Health API 종료")

app = FastAPI(
    title="AI Health API",
    description="AI 기반 맞춤형 건강 관리 서비스",
    version="0.1.0",
    debug=settings.debug,
    lifespan=lifespan,
    swagger_ui_init_oauth={},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1️⃣ 인증
app.include_router(auth.router,      prefix="/api/v1/auth",      tags=["1. Auth"])

# 2️⃣ 프로필 (온보딩)
app.include_router(profile.router,   prefix="/api/v1/profile",   tags=["2. Profile"])

# 3️⃣ 처방전 업로드
app.include_router(documents.router, prefix="/api/v1/documents", tags=["3. Documents"])

# 4️⃣ AI 분석
app.include_router(analysis.router,  prefix="/api/v1/analysis",  tags=["4. Analysis"])

# 5️⃣ 재활 운동
app.include_router(rehab.router,     prefix="/api/v1/rehab",     tags=["5. Rehab"])

# 6️⃣ AI 채팅
app.include_router(chat.router,      prefix="/api/v1/chat",      tags=["6. Chat"])

# 7️⃣ 피드백
app.include_router(feedback.router,  prefix="/api/v1/feedback",  tags=["7. Feedback"])


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "env": settings.app_env, "version": "0.1.0"}

@app.get("/", tags=["Root"])
async def root():
    return {"message": "AI Health API에 오신 것을 환영합니다 🏃"}
