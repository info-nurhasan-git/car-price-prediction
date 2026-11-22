from __future__ import annotations

import os
import pickle
import warnings
from pathlib import Path
from typing import Any, Dict, Tuple

import pandas as pd
from flask import Flask, jsonify, request
from sklearn.exceptions import InconsistentVersionWarning

# The model was pickled with scikit-learn 1.6.1. Newer 1.x releases load it
# safely; suppress only that version-mismatch notice to keep API logs clean.
warnings.filterwarnings("ignore", category=InconsistentVersionWarning)

# ---------------------------------------------------------------------------
# Paths / configuration
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR.parent / "model" / "car_price_predictor_model.pkl"

# The training pipeline derived Car_Age from a "current year". Change this via
# the CAR_REFERENCE_YEAR environment variable if a different year was used.
REFERENCE_YEAR = int(os.environ.get("CAR_REFERENCE_YEAR", "2020"))

# Exact order expected by the pickled RandomForestRegressor. Never reorder.
EXPECTED_FEATURES: Tuple[str, ...] = (
    "Present_Price",
    "Kms_Driven",
    "Owner",
    "Car_Age",
    "Fuel_Type_Diesel",
    "Fuel_Type_Petrol",
    "Seller_Type_Individual",
    "Transmission_Manual",
)

FUEL_TYPES = ("Petrol", "Diesel", "CNG")
SELLER_TYPES = ("Dealer", "Individual")
TRANSMISSIONS = ("Manual", "Automatic")

FEATURE_CONFIG: Dict[str, Dict[str, Any]] = {
    "present_price": {
        "label": "Present Price",
        "unit": "₹ Lakh",
        "min": 0.1,
        "max": 100.0,
        "step": 0.01,
        "hint": "Current ex-showroom price of the car (in lakhs).",
    },
    "kms_driven": {
        "label": "Kilometres Driven",
        "unit": "km",
        "min": 0,
        "max": 1_000_000,
        "step": 1,
        "hint": "Total distance travelled by the car.",
    },
    "year": {
        "label": "Manufacturing Year",
        "unit": "year",
        "min": 1990,
        "max": REFERENCE_YEAR,
        "step": 1,
        "hint": f"Car age is calculated against {REFERENCE_YEAR} (training reference).",
    },
    "owner": {
        "label": "Previous Owners",
        "unit": "count",
        "min": 0,
        "max": 3,
        "step": 1,
        "hint": "Number of previous owners (0 for first owner).",
    },
}


# ---------------------------------------------------------------------------
# Model loading
# ---------------------------------------------------------------------------
def load_model() -> Tuple[Any, str | None]:
    if not MODEL_PATH.exists():
        return None, f"Model file not found at {MODEL_PATH}"
    try:
        with MODEL_PATH.open("rb") as file:
            model = pickle.load(file)
        names = getattr(model, "feature_names_in_", None)
        if names is not None and tuple(names) != EXPECTED_FEATURES:
            return None, (
                "Model feature order does not match the expected order. "
                f"Expected {EXPECTED_FEATURES}, got {tuple(names)}"
            )
        return model, None
    except Exception as exc:  # pragma: no cover - defensive startup guard
        return None, f"Could not load model: {exc}"


MODEL, MODEL_ERROR = load_model()

app = Flask(__name__)

# The Vite dev server proxies /api, so CORS is only needed when the frontend is
# served from a different origin. It stays dependency-free on purpose.
ALLOWED_ORIGIN = os.environ.get("CORS_ALLOW_ORIGIN", "*")


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGIN
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


# ---------------------------------------------------------------------------
# Validation / encoding
# ---------------------------------------------------------------------------
def _number(payload: Dict[str, Any], key: str, *, integer: bool = False) -> float | int:
    if key not in payload or payload[key] in (None, ""):
        raise ValueError(f"'{key}' is required.")
    value = payload[key]
    if isinstance(value, bool):
        raise ValueError(f"'{key}' must be a number.")
    try:
        number = int(value) if integer else float(value)
    except (TypeError, ValueError):
        raise ValueError(f"'{key}' must be a valid number.")
    if integer and float(value) != number:
        raise ValueError(f"'{key}' must be a whole number.")
    return number


def _choice(payload: Dict[str, Any], key: str, choices: Tuple[str, ...]) -> str:
    value = payload.get(key)
    if not isinstance(value, str) or value.strip() not in choices:
        raise ValueError(f"'{key}' must be one of: {', '.join(choices)}.")
    return value.strip()


def prepare_features(payload: Dict[str, Any]) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    if not isinstance(payload, dict):
        raise ValueError("Request body must be a JSON object.")

    present_price = float(_number(payload, "present_price"))
    kms_driven = int(_number(payload, "kms_driven", integer=True))
    owner = int(_number(payload, "owner", integer=True))
    fuel_type = _choice(payload, "fuel_type", FUEL_TYPES)
    seller_type = _choice(payload, "seller_type", SELLER_TYPES)
    transmission = _choice(payload, "transmission", TRANSMISSIONS)

    cfg = FEATURE_CONFIG
    if not cfg["present_price"]["min"] <= present_price <= cfg["present_price"]["max"]:
        raise ValueError("Present price must be between 0.1 and 100 lakhs.")
    if not cfg["kms_driven"]["min"] <= kms_driven <= cfg["kms_driven"]["max"]:
        raise ValueError("Kilometres driven must be between 0 and 1,000,000.")
    if not cfg["owner"]["min"] <= owner <= cfg["owner"]["max"]:
        raise ValueError("Number of owners must be between 0 and 3.")

    # Callers may send car_age directly; otherwise derive it from the year.
    if payload.get("car_age") not in (None, ""):
        car_age = int(_number(payload, "car_age", integer=True))
    else:
        year = int(_number(payload, "year", integer=True))
        if not cfg["year"]["min"] <= year <= cfg["year"]["max"]:
            raise ValueError(f"Manufacturing year must be between {cfg['year']['min']} and {REFERENCE_YEAR}.")
        car_age = REFERENCE_YEAR - year
    if not 0 <= car_age <= 50:
        raise ValueError("Car age must be between 0 and 50 years.")

    encoded = {
        "Present_Price": present_price,
        "Kms_Driven": kms_driven,
        "Owner": owner,
        "Car_Age": car_age,
        "Fuel_Type_Diesel": 1 if fuel_type == "Diesel" else 0,
        "Fuel_Type_Petrol": 1 if fuel_type == "Petrol" else 0,
        "Seller_Type_Individual": 1 if seller_type == "Individual" else 0,
        "Transmission_Manual": 1 if transmission == "Manual" else 0,
    }
    # A named DataFrame keeps scikit-learn's feature-name check happy and makes
    # the exact training order explicit.
    row = pd.DataFrame([[encoded[name] for name in EXPECTED_FEATURES]], columns=EXPECTED_FEATURES)
    info = {
        "fuel_type": fuel_type,
        "seller_type": seller_type,
        "transmission": transmission,
        "car_age": car_age,
        "features": encoded,
    }
    return row, info


def format_price(lakh: float) -> str:
    return f"₹ {lakh:,.2f} Lakh"


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    return jsonify(
        {
            "name": "Car Price Prediction API",
            "status": "running" if MODEL is not None else "model unavailable",
            "endpoints": ["/api/health", "/api/options", "/api/predict"],
        }
    )


@app.route("/api/health")
def health():
    return jsonify(
        {
            "status": "ok" if MODEL is not None else "error",
            "model_loaded": MODEL is not None,
            "model_path": str(MODEL_PATH),
            "model_type": type(MODEL).__name__ if MODEL is not None else None,
            "n_features": int(MODEL.n_features_in_) if MODEL is not None else None,
            "reference_year": REFERENCE_YEAR,
            "error": MODEL_ERROR,
        }
    )


@app.route("/api/options")
def options():
    return jsonify(
        {
            "reference_year": REFERENCE_YEAR,
            "features": FEATURE_CONFIG,
            "fuel_types": list(FUEL_TYPES),
            "seller_types": list(SELLER_TYPES),
            "transmissions": list(TRANSMISSIONS),
        }
    )


@app.route("/api/predict", methods=["POST", "OPTIONS"])
def predict():
    if request.method == "OPTIONS":
        return jsonify({"ok": True})

    if request.content_type and "application/json" not in request.content_type:
        return jsonify(error="Content-Type must be application/json."), 415
    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify(error="Invalid or missing JSON body."), 400

    try:
        row, info = prepare_features(payload)
    except ValueError as exc:
        return jsonify(error=str(exc)), 400

    if MODEL is None:
        return jsonify(error=f"Model is unavailable. {MODEL_ERROR}"), 503

    try:
        value = float(MODEL.predict(row)[0])
    except Exception as exc:  # pragma: no cover - defensive runtime guard
        return jsonify(error=f"Prediction failed: {exc}"), 500

    value = round(max(value, 0.0), 2)
    return jsonify(
        {
            "predicted_price": value,
            "predicted_price_lakh": value,
            "predicted_price_inr": round(value * 100_000),
            "formatted_price": format_price(value),
            **info,
        }
    )


@app.errorhandler(404)
def not_found(_error):
    return jsonify(error="Endpoint not found."), 404


@app.errorhandler(405)
def method_not_allowed(_error):
    return jsonify(error="Method not allowed."), 405


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    if MODEL is None:
        app.logger.warning("Model not loaded: %s", MODEL_ERROR)
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG") == "1")
