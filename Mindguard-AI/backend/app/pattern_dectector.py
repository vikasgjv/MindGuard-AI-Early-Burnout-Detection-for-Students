import numpy as np

def detect_sleep_decline(data):
    sleep_values = [day["sleep"] for day in data]
    return sleep_values[-1] < np.mean(sleep_values[:-1])

def detect_mood_decline(data):
    mood_values = [day["mood"] for day in data]
    return mood_values[-1] < np.mean(mood_values[:-1])

def detect_pressure_spike(data):
    pressure_values = [day["pressure"] for day in data]
    return pressure_values[-1] > np.mean(pressure_values[:-1]) + 1

def behavioral_drift(data):
    alerts = []

    if detect_sleep_decline(data):
        alerts.append("Sleep declining")

    if detect_mood_decline(data):
        alerts.append("Mood declining")

    if detect_pressure_spike(data):
        alerts.append("Pressure increasing")

    drift_score = len(alerts) * 20
    return alerts, drift_score