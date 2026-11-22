# Car Price Prediction — React + Flask UI

A React (Vite) frontend and Flask REST API around the trained
`model/car_price_predictor_model.pkl` Random Forest regressor.

## Project structure

```
carPredPrice/
├── model/
│   └── car_price_predictor_model.pkl   # trained model (8 features)
├── backend/
│   ├── app.py                          # Flask API
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
├── START_APP.bat                       # Windows one-click launcher
└── README.md
```

## Run it

**Terminal 1 — Flask API (http://127.0.0.1:5000)**

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

**Terminal 2 — React UI (http://localhost:5173)**

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser. On Windows you can double-click
`START_APP.bat` to launch both servers in separate windows.

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health` | Model load status and metadata |
| GET | `/api/options` | Valid ranges and category values |
| POST | `/api/predict` | Returns the predicted selling price |

Example request:

```json
{
  "present_price": 5.59,
  "kms_driven": 27000,
  "year": 2014,
  "owner": 0,
  "fuel_type": "Petrol",
  "seller_type": "Dealer",
  "transmission": "Manual"
}
```

Example response:

```json
{
  "predicted_price": 4.16,
  "predicted_price_inr": 416000,
  "formatted_price": "₹ 4.16 Lakh",
  "car_age": 6,
  "fuel_type": "Petrol",
  "seller_type": "Dealer",
  "transmission": "Manual"
}
```

## Model details

The saved estimator expects these 8 columns, in this exact order:

`Present_Price`, `Kms_Driven`, `Owner`, `Car_Age`, `Fuel_Type_Diesel`,
`Fuel_Type_Petrol`, `Seller_Type_Individual`, `Transmission_Manual`.

Categorical fields are one-hot encoded by the Flask API:

- Fuel type: `Diesel` → `Fuel_Type_Diesel=1`, `Petrol` → `Fuel_Type_Petrol=1`,
  `CNG` → both `0` (the dropped baseline category).
- Seller type: `Individual` → `Seller_Type_Individual=1`, `Dealer` → `0`.
- Transmission: `Manual` → `Transmission_Manual=1`, `Automatic` → `0`.

`Car_Age` is derived as `REFERENCE_YEAR - manufacturing_year`. The default
reference year is **2020** (the convention used when this dataset/model was
trained). If your training code used a different year, either set the
environment variable `CAR_REFERENCE_YEAR` before starting Flask or send
`car_age` directly in the request body. The UI reads the same constant from
`frontend/src/App.jsx`, so update it there as well if you change it.

The model was pickled with scikit-learn 1.6.1 and loads cleanly on newer 1.x
versions; the harmless version warning is suppressed in `backend/app.py`.
