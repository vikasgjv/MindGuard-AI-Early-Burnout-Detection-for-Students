import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import numpy as np

def train_model(df):
    X = df.drop("burnout", axis=1)
    y = df["burnout"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=6,
        random_state=42
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)

    return model, acc

def predict_burnout(model, input_data, feature_names):
    input_df = pd.DataFrame([input_data], columns=feature_names)
    probability = model.predict_proba(input_df)[0][1]
    return probability * 100

def show_feature_importance(model, feature_names):
    import plotly.graph_objects as go

    importances = model.feature_importances_
    fig = go.Figure()
    for i, feature in enumerate(feature_names):
        fig.add_trace(go.Scatter3d(
            x=[feature, feature],
            y=[0, 0],
            z=[0, importances[i]],
            mode='lines',
            line=dict(width=10,color='royalblue')
        ))
        fig.add_trace(go.Scatter3d(
            x=[feature],
            y=[0],
            z=[importances[i]],
            mode='markers+text',
            marker=dict(size=6),
            text=[feature],
            textposition="top center"
        ))
    fig.update_layout(
        title="3D Feature Importance - Burnout Prediction",
        scene=dict(
            xaxis_title="Features",
            yaxis_title="Depth",
            zaxis_title="Importance Score"
        ),
        showlegend=False
    )
    fig.show()

