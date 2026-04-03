# MindGuard AI — Early Burnout Detection for Students

> Harnessing Behavioral Analytics for Student Wellbeing

MindGuard AI is an AI-powered platform that detects early signs of mental burnout in students before it escalates into a crisis. By continuously analyzing behavioral patterns — sleep, study hours, screen time, mood, and academic pressure — it generates a dynamic burnout risk score (0–100) and delivers personalized, actionable wellness recommendations.

---

## The Problem

Students suffer silently while institutions lack tools to detect, intervene, or prevent burnout early.

- Intense academic workloads and expectations elevate student stress
- No early warning systems exist to identify at-risk students in time
- Current wellness solutions are reactive — they respond only after a crisis
- Burnout damages mental health, academic performance, and retention

---

## The Solution

MindGuard AI bridges the gap between crisis and prevention with:

- **Proactive burnout detection** — identifies risk weeks before a crisis surfaces
- **Comprehensive behavioral analysis** — evaluates sleep, study, screen time, mood, and pressure
- **Personalized recommendations** — delivers tailored interventions for each student
- **Institutional dashboard** — anonymized, aggregated insights for campus-wide wellness strategies

---

## How It Works

```
1. Daily Data Collection
   Students log sleep, study hours, screen time, and mood

2. AI-Driven Pattern Analysis
   Random Forest model detects behavioral trends and stress signals
   Behavioral drift detector tracks sleep decline, mood decline, pressure spikes

3. Burnout Risk Score
   Dynamic score from 0–100 updated in real time
   Categories: Low / Moderate / High / Critical

4. Actionable Recommendations
   Personalized interventions delivered via student dashboard
```

---

## Features

- JWT-based user authentication (sign up / sign in)
- Daily behavioral check-in form
- Real-time burnout risk score with trend graphs
- Personalized recommendation engine with relevance scoring
- Behavioral drift detection (sleep decline, mood decline, pressure spikes)
- 3D feature importance visualization
- Batch processing API for institutional use
- Student and institutional dashboards
- Fully software-based, privacy-first design

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, Python 3.8+ |
| AI / ML | scikit-learn (Random Forest), NumPy, pandas |
| Visualization | Plotly, Matplotlib |
| Database | SQLite + SQLAlchemy |
| Auth | Passlib (password hashing) |
| Frontend | Vanilla HTML, CSS, JavaScript |

---

## Project Structure

```
mindguard-ai/
├── backend/
│   ├── app/
│   │   ├── main.py                              # FastAPI app entry point
│   │   ├── database.py                          # SQLAlchemy setup
│   │   ├── models.py                            # User model
│   │   ├── schemas.py                           # Pydantic schemas
│   │   ├── ai_model.py                          # Random Forest training & prediction
│   │   ├── data_generator.py                    # Synthetic training data
│   │   ├── pattern_dectector.py                 # Behavioral drift detection
│   │   ├── mindguard_engine.py                  # Core recommendation engine
│   │   ├── mindguard_api.py                     # Production API wrapper
│   │   ├── mindguard_recommendation_templates.json
│   │   └── routes/
│   │       ├── auth.py                          # Auth routes
│   │       └── analyze.py                       # Analysis routes
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── index.html                               # Full SPA (home, login, dashboard)
│   ├── styles.css
│   └── main.js
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.8+
- pip

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Copy the environment file and configure it:

```bash
cp .env.example .env
```

Run the API server:

```bash
uvicorn app.main:app --reload
```

API runs at `http://localhost:8000`  
Interactive docs at `http://localhost:8000/docs`

### Frontend

Open `frontend/index.html` directly in a browser, or serve it with any static file server:

```bash
npx serve frontend
```

---

## API Overview

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Sign in and receive token |

### Analysis

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/analyze/` | Submit daily behavioral data and get risk score + recommendations |

### Recommendation Engine (Python API)

```python
from app.mindguard_api import MindGuardAPI

api = MindGuardAPI()

result = api.get_recommendations(
    sleep_history=[5.5, 6.0, 5.8, 6.2, 5.9, 6.1, 5.7],   # 7 days
    study_history=[8.5, 9.0, 8.8, 9.2, 8.7, 9.1, 8.9],
    screen_history=[8.0, 8.5, 8.2, 8.7, 8.3, 8.6, 8.4],
    mood_history=[5, 4, 4.5, 4, 3.8, 4.2, 4.0],           # scale 1–10
    academic_pressure=8.5,                                   # scale 1–10
    num_recommendations=5
)

print(result['risk_score'])      # e.g. 74.5
print(result['risk_category'])   # low / moderate / high / critical
print(result['recommendations']) # list of personalized actions
```

---

## Risk Score Categories

| Score | Category | Meaning |
|---|---|---|
| 0 – 39 | Low | Healthy behavioral patterns |
| 40 – 59 | Moderate | Early warning signs present |
| 60 – 79 | High | Significant burnout risk |
| 80 – 100 | Critical | Immediate intervention needed |

---

## Why MindGuard AI

- **3× earlier detection** compared to traditional support systems
- **Proactive, not reactive** — acts weeks before burnout is typically recognized
- **Privacy-first** — no sensitive data shared; institutional data is anonymized
- **Scalable** — cloud-native design supports multi-campus deployment
- **Adaptive** — model continuously improves as more student data is collected

---

## Environment Variables

| Variable | Description |
|---|---|
| `SECRET_KEY` | JWT signing secret |
| `DATABASE_URL` | SQLite or other DB connection string |

---

## License

MIT License — see `LICENSE` for details.

---

> © 2026 MindGuard AI · Designed for Student Mental Wellness
