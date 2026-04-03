import json
from pathlib import Path
from typing import Any, Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

try:
    from ..ai_model import predict_burnout, train_model
    from ..data_generator import generate_synthetic_data
except Exception:
    predict_burnout = None
    train_model = None
    generate_synthetic_data = None

router = APIRouter()


class AnalyzeRequest(BaseModel):
    studyHours: float = Field(..., ge=0, le=24)
    extracurricularHours: float = Field(..., ge=0, le=24)
    screenHours: float = Field(..., ge=0, le=24)
    physicalHours: float = Field(..., ge=0, le=24)
    sleepHours: float = Field(..., ge=0, le=24)
    mood: Literal["excellent", "good", "average", "bad"] = "average"
    useTemplateRecommendations: bool = False


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _load_templates() -> list[dict[str, Any]]:
    templates_path = Path(__file__).resolve().parents[1] / "recommendation_templates.json"
    if not templates_path.exists():
        return []
    with templates_path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    return data if isinstance(data, list) else []


def _init_ai_model() -> tuple[Any | None, list[str], dict[str, float]]:
    if not (generate_synthetic_data and train_model):
        return None, [], {}
    try:
        df = generate_synthetic_data(2000)
        model, _ = train_model(df)
        feature_names = [c for c in df.columns if c != "burnout"]
        baseline = {
            "sleep": float(df["sleep"].mean()),
            "mood": float(df["mood"].mean()),
            "pressure": float(df["pressure"].mean()),
        }
        return model, feature_names, baseline
    except Exception:
        return None, [], {}


def _predict_ai_risk(request: "AnalyzeRequest", *, mood_score: float, academic_pressure: float) -> float | None:
    if AI_MODEL is None or not AI_FEATURES or not predict_burnout:
        return None
    try:
        values = {
            "sleep": float(request.sleepHours),
            "study": float(request.studyHours),
            "screen": float(request.screenHours),
            "mood": float(mood_score),
            "pressure": float(academic_pressure),
            "activity": float(request.physicalHours) * 60.0,
        }
        values["sleep_deviation"] = values["sleep"] - AI_BASELINE.get("sleep", values["sleep"])
        values["mood_deviation"] = values["mood"] - AI_BASELINE.get("mood", values["mood"])
        values["pressure_deviation"] = values["pressure"] - AI_BASELINE.get("pressure", values["pressure"])

        input_data = [values.get(name, 0.0) for name in AI_FEATURES]
        risk = float(predict_burnout(AI_MODEL, input_data, AI_FEATURES))
        return _clamp(risk, 0.0, 100.0)
    except Exception:
        return None


def _matches_triggers(
    template: dict[str, Any],
    *,
    risk_score: float,
    sleep_hours: float,
    study_hours: float,
    screen_hours: float,
    mood_score: float,
    academic_pressure: float,
    physical_hours: float = 0.0,
    extracurricular_hours: float = 0.0,
    trend: str = "none",
) -> bool:
    tc = template.get("trigger_conditions", {})
    if not isinstance(tc, dict):
        return False

    # New template schema keys (plus backward compatibility for legacy keys)
    min_risk = tc.get("min_risk_score")
    max_risk = tc.get("max_risk_score")
    sleep_max = tc.get("sleep_hours_max", tc.get("sleep_threshold"))
    sleep_min = tc.get("sleep_hours_min")
    study_min = tc.get("study_hours_min", tc.get("study_threshold"))
    study_max = tc.get("study_hours_max")
    screen_min = tc.get("screen_time_min", tc.get("screen_threshold"))
    screen_max = tc.get("screen_time_max")
    mood_max = tc.get("mood_max", tc.get("mood_threshold"))
    mood_min = tc.get("mood_min")
    physical_max = tc.get("physical_activity_max", tc.get("physical_threshold"))
    physical_min = tc.get("physical_activity_min")
    extracurricular_min = tc.get("extracurricular_hours_min", tc.get("extracurricular_threshold"))
    extracurricular_max = tc.get("extracurricular_hours_max")
    academic_pressure_threshold = tc.get("academic_pressure_threshold")
    trend_required = str(tc.get("trend_required", "none"))

    if min_risk is not None and risk_score < float(min_risk):
        return False
    if max_risk is not None and risk_score > float(max_risk):
        return False
    if sleep_max is not None and sleep_hours > float(sleep_max):
        return False
    if sleep_min is not None and sleep_hours < float(sleep_min):
        return False
    if study_min is not None and study_hours < float(study_min):
        return False
    if study_max is not None and study_hours > float(study_max):
        return False
    if screen_min is not None and screen_hours < float(screen_min):
        return False
    if screen_max is not None and screen_hours > float(screen_max):
        return False
    if mood_max is not None and mood_score > float(mood_max):
        return False
    if mood_min is not None and mood_score < float(mood_min):
        return False
    if academic_pressure_threshold is not None and academic_pressure < float(academic_pressure_threshold):
        return False
    # physical_activity_max fires when physical activity is LOW (below threshold target)
    if physical_max is not None and physical_hours > float(physical_max):
        return False
    if physical_min is not None and physical_hours < float(physical_min):
        return False
    if extracurricular_min is not None and extracurricular_hours < float(extracurricular_min):
        return False
    if extracurricular_max is not None and extracurricular_hours > float(extracurricular_max):
        return False
    if trend_required != "none" and trend_required != trend:
        return False

    return True


def _priority_weight(priority: str) -> int:
    weights = {"high": 3, "medium": 2, "low": 1}
    return weights.get(str(priority).lower(), 1)


def _recommend_from_templates(
    templates: list[dict[str, Any]],
    *,
    risk_score: float,
    request: AnalyzeRequest,
    mood_score: float,
    academic_pressure: float,
    trend: str = "none",
    limit: int = 5,
) -> list[dict[str, Any]]:
    matches: list[dict[str, Any]] = []

    for template in templates:
        if not isinstance(template, dict):
            continue
        if _matches_triggers(
            template,
            risk_score=risk_score,
            sleep_hours=request.sleepHours,
            study_hours=request.studyHours,
            screen_hours=request.screenHours,
            mood_score=mood_score,
            academic_pressure=academic_pressure,
            physical_hours=request.physicalHours,
            extracurricular_hours=request.extracurricularHours,
            trend=trend,
        ):
            matches.append(template)

    matches.sort(
        key=lambda t: (
            _priority_weight(str(t.get("priority", t.get("priority_default", "low")))),
            float((t.get("trigger_conditions") or {}).get("min_risk_score") or 0),
        ),
        reverse=True,
    )

    output: list[dict[str, Any]] = []
    for t in matches[:limit]:
        recommendations = t.get("recommendation", t.get("action_plan", []))
        output.append(
            {
                "id": t.get("id"),
                "title": t.get("title"),
                "category": t.get("category"),
                "priority": t.get("priority", t.get("priority_default", "low")),
                "duration_days": t.get("duration_days"),
                "expected_outcome": t.get("expected_outcome"),
                "action_plan": recommendations if isinstance(recommendations, list) else [],
                "recommendation": recommendations if isinstance(recommendations, list) else [],
            }
        )

    return output


def _recommend_from_ai(
    *,
    request: AnalyzeRequest,
    risk_score: int,
    risk_category: str,
    top_driver: str,
    mood_score: float,
) -> list[dict[str, Any]]:
    recommendations: list[dict[str, Any]] = []

    def add_reco(rid: str, title: str, priority: str, lines: list[str]) -> None:
        recommendations.append(
            {
                "id": rid,
                "title": title,
                "category": "ai",
                "priority": priority,
                "duration_days": 3 if priority != "high" else 5,
                "expected_outcome": "Lower stress and improve daily balance with small consistent actions.",
                "action_plan": lines,
                "recommendation": lines,
            }
        )

    add_reco(
        "AI_TOP_DRIVER",
        f"Start With Your Main Driver: {top_driver}",
        "high" if risk_category == "high" else "medium",
        [
            f"Your biggest pressure right now is {top_driver.lower()}. Start with one small fix today.",
            "Pick the easiest step first so it feels doable, not overwhelming.",
            "Check how you feel tonight and keep what works tomorrow.",
        ],
    )

    if request.sleepHours <= 6.5:
        add_reco(
            "AI_SLEEP",
            "Sleep Reset",
            "high" if request.sleepHours <= 5.5 else "medium",
            [
                "Try to sleep 45-60 minutes earlier tonight.",
                "Keep your phone away for the last 30 minutes before bed.",
                "Use the same wake-up time for the next 3 days.",
            ],
        )

    if request.screenHours >= 6:
        add_reco(
            "AI_SCREEN",
            "Screen-Time Control",
            "high" if request.screenHours >= 9 else "medium",
            [
                "Create one 60-120 minute phone-free block today.",
                "Turn off non-important notifications while studying.",
                "Swap late-night scrolling with a short walk or reading.",
            ],
        )

    if request.physicalHours <= 1.0:
        add_reco(
            "AI_ACTIVITY",
            "Energy Through Movement",
            "high" if request.physicalHours <= 0.5 else "medium",
            [
                "Add 20-30 minutes of light movement today.",
                "Stand and stretch for 3-5 minutes between study blocks.",
                "Treat activity like recovery, not extra work.",
            ],
        )

    if request.studyHours >= 7:
        add_reco(
            "AI_STUDY",
            "Smarter Study Rhythm",
            "high" if request.studyHours >= 9 else "medium",
            [
                "Split long study sessions into focused blocks with short breaks.",
                "Do the hardest task first when your energy is highest.",
                "Stop when output drops, then return after recovery.",
            ],
        )

    if mood_score <= 5:
        add_reco(
            "AI_MOOD",
            "Mood Support Plan",
            "high" if mood_score <= 3 else "medium",
            [
                "Take one short reset break away from work pressure.",
                "Talk to someone you trust today, even briefly.",
                "Write one positive win from your day before sleep.",
            ],
        )

    if risk_category == "high":
        add_reco(
            "AI_HIGH_RISK",
            "High-Strain Safety Plan",
            "high",
            [
                "Reduce non-essential commitments for the next 24 hours.",
                "Focus on sleep, meals, hydration, and one core task only.",
                "Reach out for support if this high strain continues tomorrow.",
            ],
        )

    if not recommendations:
        add_reco(
            "AI_MAINTAIN",
            "Keep Your Healthy Routine",
            "low",
            [
                "Your current pattern looks stable today.",
                "Keep your sleep and activity routine consistent.",
                "Do one short check-in tomorrow to stay on track.",
            ],
        )

    return recommendations[:5]


TEMPLATES = _load_templates()
AI_MODEL, AI_FEATURES, AI_BASELINE = _init_ai_model()


@router.post("")
def analyze_risk(request: AnalyzeRequest):
    study = _clamp(request.studyHours / 12.0, 0.0, 1.0)
    extracurricular = _clamp(request.extracurricularHours / 6.0, 0.0, 1.0)
    screen = _clamp(request.screenHours / 12.0, 0.0, 1.0)
    physical_low = 1.0 - _clamp(request.physicalHours / 3.0, 0.0, 1.0)
    sleep_low = 1.0 - _clamp(request.sleepHours / 8.0, 0.0, 1.0)

    mood_risk_map = {
        "excellent": 0.10,
        "good": 0.25,
        "average": 0.50,
        "bad": 0.85,
    }
    mood_score_map = {
        "excellent": 9.0,
        "good": 7.0,
        "average": 5.0,
        "bad": 3.0,
    }
    mood_risk = mood_risk_map.get(request.mood, 0.50)
    mood_score = mood_score_map.get(request.mood, 5.0)

    academic_pressure = _clamp(
        (request.studyHours * 0.6)
        + (request.extracurricularHours * 0.35)
        + (screen * 2.0)
        + (sleep_low * 2.0),
        1.0,
        10.0,
    )

    score01 = (
        (0.20 * screen)
        + (0.18 * study)
        + (0.17 * mood_risk)
        + (0.15 * sleep_low)
        + (0.14 * physical_low)
        + (0.16 * extracurricular)
    )
    heuristic_risk = _clamp(score01, 0.0, 1.0) * 100.0
    ai_risk = _predict_ai_risk(request, mood_score=mood_score, academic_pressure=academic_pressure)
    risk_score = round((0.65 * ai_risk) + (0.35 * heuristic_risk)) if ai_risk is not None else round(heuristic_risk)

    if risk_score < 35:
        risk_category = "low"
        summary = "You are currently in a stable zone. Maintain your routine and keep tracking daily."
    elif risk_score < 70:
        risk_category = "moderate"
        summary = "Risk signals are increasing. Consider small adjustments to your daily workload and recovery."
    else:
        risk_category = "high"
        summary = "High strain detected. Prioritize recovery and seek support if this pattern continues."

    drivers = [
        ("Screen time", screen),
        ("Study load", study),
        ("Sleep deficit", sleep_low),
        ("Mood state", mood_risk),
        ("Low physical activity", physical_low),
        ("Extracurricular load", extracurricular),
    ]
    top_driver = max(drivers, key=lambda item: item[1])[0]

    recommendation_source = "ai"
    recommendations: list[dict[str, Any]] = []

    # Templates are optional. They are only used when explicitly requested.
    if request.useTemplateRecommendations and TEMPLATES:
        recommendations = _recommend_from_templates(
            TEMPLATES,
            risk_score=risk_score,
            request=request,
            mood_score=mood_score,
            academic_pressure=academic_pressure,
            trend="none",
            limit=5,
        )
        if recommendations:
            recommendation_source = "template"

    if not recommendations:
        recommendations = _recommend_from_ai(
            request=request,
            risk_score=risk_score,
            risk_category=risk_category,
            top_driver=top_driver,
            mood_score=mood_score,
        )
        recommendation_source = "ai"

    return {
        "risk_score": risk_score,
        "ai_risk_score": round(ai_risk, 2) if ai_risk is not None else None,
        "ai_model_enabled": ai_risk is not None,
        "risk_category": risk_category,
        "top_driver": top_driver,
        "summary": summary,
        "recommendation_source": recommendation_source,
        "recommendations": recommendations,
    }
