from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, chatbot, crops, pest, yield_pred, market, dashboard, gamification, upload, weather
from database import engine, Base
from routers import market
from routers import admin
from routers import auth, chatbot, crops, pest, yield_pred, market, dashboard, gamification, upload
from routers import report
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Kerala Farmer Companion API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["Chatbot"])
app.include_router(crops.router, prefix="/api/crops", tags=["Crops"])
app.include_router(pest.router, prefix="/api/pest", tags=["Pest Detection"])
app.include_router(yield_pred.router, prefix="/api/yield", tags=["Yield Prediction"])
app.include_router(market.router, prefix="/api/market", tags=["Market"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(gamification.router, prefix="/api/gamification", tags=["Gamification"])
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(weather.router, prefix="/api/weather", tags=["Weather"])
app.include_router(market.router)
app.include_router(report.router)
app.include_router(admin.router)
@app.get("/")
def root():
    return {"message": "Kerala Farmer Companion API is running!"}






