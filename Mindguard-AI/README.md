# MindGuard AI

> Early burnout detection for students, powered by behavioral analytics.

![Python](https://img.shields.io/badge/Python-3.8+-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?logo=fastapi&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-ML-orange?logo=scikit-learn&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

MindGuard AI continuously analyzes student behavioral patterns — sleep, study hours, screen time, mood, and academic pressure — to generate a dynamic burnout risk score (0–100) and deliver personalized wellness recommendations before a crisis occurs.

---

## The Problem

Students suffer silently while institutions lack tools to detect or prevent burnout early.

- No early warning systems exist to identify at-risk students in time
- Current wellness solutions are reactive — they respond only after a crisis
- Burnout damages mental health, academic performance, and retention

---

## How It Works

```
1. Daily Check-In       Students log sleep, study hours, screen time, and mood
2. Pattern Analysis     Random Forest model detects behavioral trends and stress signals
3. Risk Score           Dynamic score from 0–100, updated in real time
4. Recommendations      Personalized interventions delivered via student dashboard
```

---

## Features

- JWT-based authentication (register / login)
- Daily behavioral check-in form
- Real-time burnout risk score with trend graphs
- Personalized recommendation engine with relevance scoring
- Behavioral drift detection (sleep decline, mood decline, pressure spikes)
- 3D feature importance visualization
- Batch processing API for institutional use
- Privacy-first — no sensitive data shared externally

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Backend    | FastAPI, Python 3.8+                    |
| AI / ML    | scikit-learn (Random Forest), NumPy, pandas |
| Database   | SQLite + SQLAlchemy                     |
| Auth       | Passlib (bcrypt hashing), JWT           |
| Frontend   | Vanilla HTML, CSS, JavaScript           |

---

## Project Structure

```
mindguard-ai/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI entry point
│   │   ├── database.py           # SQLAlchemy setup
│   │   ├── models.py             # DB models
│   │   ├── schemas.py            # Pydantic schemas
│   │   ├── ai_model.py           # Random Forest training & prediction
│   │   ├── data_generator.py     # Synthetic training data
│   │   ├── pattern_dectector.py  # Behavioral drift detection
│   │   ├── auth.py               # Auth utilities
│   │   └── routes/
│   │       ├── auth.py           # Auth routes
│   │       └── analyze.py        # Analysis routes
│   └── requirements.txt
├── frontend/
│   ├── index.html                # Single-page app
│   ├── styles.css
│   └── main.js
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.8+
- pip

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API runs at `http://localhost:8000`  
Interactive docs at `http://localhost:8000/docs`

### Frontend

Open `frontend/index.html` in a browser, or serve it locally:

```bash
npx serve frontend
```

---

## API Reference

### Auth

| Method | Endpoint             | Description          |
|--------|----------------------|----------------------|
| POST   | `/api/auth/register` | Create a new account |
| POST   | `/api/auth/login`    | Sign in, get token   |

### Analysis

| Method | Endpoint        | Description                                      |
|--------|-----------------|--------------------------------------------------|
| POST   | `/api/analyze/` | Submit behavioral data, get risk score + recommendations |

---

## Risk Score Categories

| Score   | Category | Meaning                          |
|---------|----------|----------------------------------|
| 0 – 39  | Low      | Healthy behavioral patterns      |
| 40 – 59 | Moderate | Early warning signs present      |
| 60 – 79 | High     | Significant burnout risk         |
| 80 – 100| Critical | Immediate intervention needed    |

---

## Environment Variables

Create a `.env` file in `backend/`:

```env
SECRET_KEY=your_jwt_secret_key
DATABASE_URL=sqlite:///./mindguard.db
```

---

## License

MIT License — see `LICENSE` for details.

---

> © 2026 MindGuard AI · Built for Student Mental Wellness
