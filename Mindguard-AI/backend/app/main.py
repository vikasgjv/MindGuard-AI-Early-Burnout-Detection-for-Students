from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from app.routes import auth, analyze
    from app.database import Base, engine
except ModuleNotFoundError:
    import os
    import sys

    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from app.routes import auth, analyze
    from app.database import Base, engine
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MindGuard AI API v1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(analyze.router, prefix="/api/analyze", tags=["Analyze"])

@app.get("/")
def root():
    return {"message": "MindGuard AI Backend v1 Running"}

def run_ai_demo():
    try:
        from app.data_generator import generate_synthetic_data
        from app.ai_model import train_model, predict_burnout, show_feature_importance
        from app.pattern_dectector import behavioral_drift
    except ModuleNotFoundError:
        import os
        import sys

        sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from app.data_generator import generate_synthetic_data
        from app.ai_model import train_model, predict_burnout, show_feature_importance
        from app.pattern_dectector import behavioral_drift

    df = generate_synthetic_data(2000)
    model, accuracy = train_model(df)

    print(f"Model Accuracy: {accuracy * 100:.2f}%")

    feature_names = df.drop("burnout", axis=1).columns.tolist()
    show_feature_importance(model, feature_names)

    sleep = 5.5
    study = 9
    screen = 8
    mood = 4
    pressure = 8
    activity = 15

    sleep_dev = sleep - df["sleep"].mean()
    mood_dev = mood - df["mood"].mean()
    pressure_dev = pressure - df["pressure"].mean()

    student_input = [
        sleep,
        study,
        screen,
        mood,
        pressure,
        activity,
        sleep_dev,
        mood_dev,
        pressure_dev,
    ]

    risk = predict_burnout(model, student_input, feature_names)
    print("\nPredicted Burnout Risk Probability:", f"{risk:.2f}%")

    if risk > 70:
        print("⚠️ High Risk of Burnout")
    elif risk > 40:
        print("⚠️ Moderate Risk")
    else:
        print("✅ Low Risk")

    sample_data = [
        {"sleep": 7, "mood": 7, "pressure": 5},
        {"sleep": 6.5, "mood": 6, "pressure": 6},
        {"sleep": 6, "mood": 6, "pressure": 7},
        {"sleep": 5.5, "mood": 5, "pressure": 7},
        {"sleep": 5, "mood": 4, "pressure": 8},
    ]

    alerts, drift_score = behavioral_drift(sample_data)
    print("\nBehavior Drift Score:", drift_score)

    for alert in alerts:
        print("⚠️", alert)

    combined_risk = (risk * 0.7) + (drift_score * 0.3)
    print("\nCombined Burnout Risk Score:", round(combined_risk, 2))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
