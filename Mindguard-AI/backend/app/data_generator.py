import numpy as np
import pandas as pd

def generate_synthetic_data(n=1000):
    np.random.seed(42)

    sleep = np.random.normal(7, 1.5, n)
    study = np.random.normal(6, 2, n)
    screen = np.random.normal(5, 2, n)
    mood = np.random.normal(6, 2, n)
    pressure = np.random.normal(5, 2, n)
    activity = np.random.normal(30, 15, n)

    burnout_score = (
        (sleep < 6).astype(int) * 2 +
        (study > 8).astype(int) * 2 +
        (screen > 8).astype(int) * 1 +
        (mood < 4).astype(int) * 3 +
        (pressure > 7).astype(int) * 2 +
        (activity < 20).astype(int) * 1
    )

    burnout = (burnout_score >= 4).astype(int)

    df = pd.DataFrame({
        "sleep": sleep,
        "study": study,
        "screen": screen,
        "mood": mood,
        "pressure": pressure,
        "activity": activity,
        "burnout": burnout
    })

    # Rolling trend simulation
    df["sleep_trend"] = df["sleep"].rolling(window=7, min_periods=1).mean()
    df["mood_trend"] = df["mood"].rolling(window=7, min_periods=1).mean()
    df["pressure_trend"] = df["pressure"].rolling(window=7, min_periods=1).mean()

    df["sleep_deviation"] = df["sleep"] - df["sleep_trend"]
    df["mood_deviation"] = df["mood"] - df["mood_trend"]
    df["pressure_deviation"] = df["pressure"] - df["pressure_trend"]

    df.drop(columns=["sleep_trend", "mood_trend", "pressure_trend"], inplace=True)

    return df