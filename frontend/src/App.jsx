import { useEffect, useMemo, useState } from 'react'

const REFERENCE_YEAR = 2020

const DEFAULT_FORM = {
  present_price: '5.59',
  kms_driven: '27000',
  year: '2014',
  owner: '0',
  fuel_type: 'Petrol',
  seller_type: 'Dealer',
  transmission: 'Manual',
}

const FUEL_OPTIONS = ['Petrol', 'Diesel', 'CNG']
const SELLER_OPTIONS = ['Dealer', 'Individual']
const TRANSMISSION_OPTIONS = ['Manual', 'Automatic']

function CarLogo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 15.5h16M5.5 15.5V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2.5M20.5 15.5V18a1 1 0 0 1-1 1h-.5a1 1 0 0 1-1-1v-2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M3 15.5v-3.2c0-.7.3-1.4.9-1.8L6.5 8.6A2 2 0 0 1 7.6 8.2h8.8a2 2 0 0 1 1.1.4l2.6 1.9c.6.4.9 1.1.9 1.8v3.2H3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M7 11.8h10M8 14h.01M16 14h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function CarShowcase() {
  return (
    <div className="car-showcase" aria-hidden="true">
      <div className="showcase-glow" />
      <div className="showcase-tag">
        <span className="tag-dot" /> Model ready · Random Forest
      </div>
      <svg className="car-svg" viewBox="0 0 640 300" role="img">
        <defs>
          <linearGradient id="bodyGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="55%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
          <linearGradient id="glassGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#7dd3fc" />
          </linearGradient>
          <radialGradient id="wheelGradient">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
        </defs>
        <ellipse cx="320" cy="268" rx="235" ry="14" fill="rgba(15, 23, 42, 0.18)" />
        <path d="M62 186c2-13 11-19 24-21l52-7 52-48c7-7 16-11 26-11h180c11 0 20 4 27 12l51 47 60 11c16 3 25 12 25 27v18c0 9-6 15-15 15H77c-9 0-15-6-15-15v-28Z" fill="url(#bodyGradient)" />
        <path d="M196 112c4-4 9-6 15-6h70v52H150l46-46Z" fill="url(#glassGradient)" opacity="0.92" />
        <path d="M295 106h152c8 0 15 3 20 9l40 43H295v-52Z" fill="url(#glassGradient)" opacity="0.92" />
        <path d="M290 106v52" stroke="#1e3a8a" strokeWidth="6" opacity="0.55" />
        <path d="M70 194h500" stroke="rgba(255,255,255,0.35)" strokeWidth="3" strokeLinecap="round" />
        <path d="M92 213h70M480 213h62" stroke="rgba(15,23,42,0.25)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="170" cy="232" r="34" fill="url(#wheelGradient)" />
        <circle cx="170" cy="232" r="17" fill="#cbd5e1" />
        <circle cx="170" cy="232" r="7" fill="#64748b" />
        <circle cx="472" cy="232" r="34" fill="url(#wheelGradient)" />
        <circle cx="472" cy="232" r="17" fill="#cbd5e1" />
        <circle cx="472" cy="232" r="7" fill="#64748b" />
        <rect x="74" y="178" width="18" height="11" rx="5" fill="#fde68a" />
        <rect x="552" y="180" width="16" height="10" rx="5" fill="#fca5a5" />
      </svg>
      <div className="showcase-caption">
        <span>Present price</span>
        <span>KM driven</span>
        <span>Fuel &amp; owner</span>
      </div>
    </div>
  )
}

function TextField({ id, label, unit, hint, value, min, max, step, onChange, error }) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {unit && <span className="unit">{unit}</span>}
      </label>
      <input
        id={id}
        name={id}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className={error ? 'input invalid' : 'input'}
        placeholder={label}
      />
      {hint && <small className="hint">{hint}</small>}
    </div>
  )
}

function Segmented({ legend, options, value, onChange, name }) {
  return (
    <fieldset className="field">
      <legend>{legend}</legend>
      <div className="segmented">
        {options.map((option) => (
          <label key={option} className={value === option ? 'segment active' : 'segment'}>
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={onChange}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function ResultPanel({ result, loading, onReset }) {
  return (
    <div className="card result-card">
      <div className="result-head">
        <span className="result-kicker">Prediction result</span>
        <span className={loading ? 'status-pill working' : 'status-pill'}>
          <span className="pill-dot" /> {loading ? 'Predicting' : 'Ready'}
        </span>
      </div>

      {loading ? (
        <div className="result-loading" aria-live="polite">
          <div className="spinner" />
          <p>Analysing your car details…</p>
        </div>
      ) : result ? (
        <div className="result-body" aria-live="polite">
          <span className="result-label">Estimated selling price</span>
          <div className="price">{result.formatted_price}</div>
          <div className="price-inr">≈ ₹ {Number(result.predicted_price_inr).toLocaleString('en-IN')}</div>
          <div className="result-chips">
            <span>{result.car_age} yr old</span>
            <span>{result.fuel_type}</span>
            <span>{result.seller_type}</span>
            <span>{result.transmission}</span>
          </div>
          <button type="button" className="btn secondary full" onClick={onReset}>
            Reset form
          </button>
          <p className="disclaimer">
            Estimate from the trained Random Forest model. Actual resale value may vary with condition and location.
          </p>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon"><CarLogo size={42} /></div>
          <h3>Your estimate will appear here</h3>
          <p>Fill in the car details and hit <strong>Predict Price</strong> to see the result.</p>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [backend, setBackend] = useState('checking')

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/health', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => setBackend(data.status === 'ok' ? 'online' : 'error'))
      .catch((err) => {
        if (err.name !== 'AbortError') setBackend('offline')
      })
    return () => controller.abort()
  }, [])

  const carAge = useMemo(() => {
    const year = Number(form.year)
    return Number.isFinite(year) ? Math.max(REFERENCE_YEAR - year, 0) : null
  }, [form.year])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
    setFieldErrors((previous) => ({ ...previous, [name]: undefined }))
    setError('')
  }

  const validate = () => {
    const problems = {}
    const checks = [
      ['present_price', 'Present price', 0.1, 100],
      ['kms_driven', 'Kilometres driven', 0, 1000000],
      ['year', 'Manufacturing year', 1990, REFERENCE_YEAR],
      ['owner', 'Number of owners', 0, 3],
    ]
    checks.forEach(([key, label, min, max]) => {
      const value = Number(form[key])
      if (form[key] === '' || !Number.isFinite(value)) problems[key] = `${label} is required.`
      else if (value < min || value > max) problems[key] = `${label} must be between ${min} and ${max}.`
    })
    if (form.year && Number(form.year) > REFERENCE_YEAR) {
      problems.year = `Year must be ${REFERENCE_YEAR} or earlier (training reference).`
    }
    setFieldErrors(problems)
    return Object.keys(problems).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) {
      setError('Please fix the highlighted fields and try again.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          present_price: Number(form.present_price),
          kms_driven: Number(form.kms_driven),
          year: Number(form.year),
          owner: Number(form.owner),
          fuel_type: form.fuel_type,
          seller_type: form.seller_type,
          transmission: form.transmission,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Prediction request failed.')
      setResult(data)
      setBackend('online')
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Cannot reach the Flask backend. Is it running on port 5000?' : err.message)
      setBackend('offline')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setForm(DEFAULT_FORM)
    setResult(null)
    setError('')
    setFieldErrors({})
  }

  const backendText = {
    checking: 'Checking backend…',
    online: 'Backend online',
    offline: 'Backend offline',
    error: 'Model unavailable',
  }[backend]

  return (
    <div className="app-shell" id="top">
      <header className="site-header">
        <div className="container nav-inner">
          <a className="brand" href="#top">
            <span className="brand-icon"><CarLogo /></span>
            <span>CarPrice <strong>AI</strong></span>
          </a>
          <nav className="main-nav" aria-label="Main navigation">
            <a href="#predict">Predict</a>
            <a href="#model">How it works</a>
            <a href="#about">About</a>
          </nav>
          <a className="nav-cta" href="#predict">Get estimate</a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-inner">
            <div className="hero-copy">
              <span className="eyebrow"><span className="eyebrow-dot" /> Machine Learning · Random Forest</span>
              <h1>Know your car's <span className="gradient-text">true worth</span> in seconds.</h1>
              <p>
                Enter a few details about your car and get an instant, data-driven resale price
                from a trained machine learning model.
              </p>
              <div className="hero-actions">
                <a href="#predict" className="btn primary">Predict price <span aria-hidden="true">→</span></a>
                <a href="#model" className="btn ghost">See how it works</a>
              </div>
              <div className="hero-meta">
                <span><strong>8</strong> model features</span>
                <span><strong>1</strong> trained model</span>
                <span><strong>100%</strong> local inference</span>
              </div>
            </div>
            <CarShowcase />
          </div>
        </section>

        <section className="section" id="predict">
          <div className="container">
            <div className="section-heading">
              <span className="section-kicker">Prediction studio</span>
              <h2>Tell us about your car</h2>
              <p>Every field below is passed to the model in the exact training order.</p>
            </div>

            {backend === 'offline' && (
              <div className="alert" role="alert">
                Flask backend is not reachable. Start it with <code>python app.py</code> inside <code>backend/</code>, then refresh.
              </div>
            )}

            <div className="workspace">
              <form className="card form-card" onSubmit={handleSubmit} noValidate>
                <div className="card-head">
                  <div>
                    <h3>Car details</h3>
                    <p>All fields are required</p>
                  </div>
                  <span className="model-badge">Random Forest</span>
                </div>

                <div className="form-group">
                  <h4>Basics</h4>
                  <div className="field-grid">
                    <TextField id="present_price" label="Present price" unit="₹ Lakh" hint="Current showroom price" value={form.present_price} min="0.1" max="100" step="0.01" onChange={handleChange} error={fieldErrors.present_price} />
                    <TextField id="year" label="Manufacturing year" hint={`Age used by model: ${carAge} year${carAge === 1 ? '' : 's'}`} value={form.year} min="1990" max={REFERENCE_YEAR} step="1" onChange={handleChange} error={fieldErrors.year} />
                    <TextField id="kms_driven" label="Kilometres driven" unit="km" hint="Total distance travelled" value={form.kms_driven} min="0" max="1000000" step="1" onChange={handleChange} error={fieldErrors.kms_driven} />
                    <TextField id="owner" label="Previous owners" hint="0 for first owner" value={form.owner} min="0" max="3" step="1" onChange={handleChange} error={fieldErrors.owner} />
                  </div>
                </div>

                <div className="form-group">
                  <h4>Configuration</h4>
                  <div className="option-grid">
                    <Segmented legend="Fuel type" name="fuel_type" options={FUEL_OPTIONS} value={form.fuel_type} onChange={handleChange} />
                    <Segmented legend="Seller type" name="seller_type" options={SELLER_OPTIONS} value={form.seller_type} onChange={handleChange} />
                    <Segmented legend="Transmission" name="transmission" options={TRANSMISSION_OPTIONS} value={form.transmission} onChange={handleChange} />
                  </div>
                </div>

                {error && <div className="form-error" role="alert">{error}</div>}

                <div className="form-actions">
                  <button type="submit" className="btn primary" disabled={loading}>
                    {loading ? <><span className="btn-spinner" /> Predicting…</> : <>Predict price <span aria-hidden="true">→</span></>}
                  </button>
                  <button type="button" className="btn text" onClick={handleReset}>Clear</button>
                </div>
              </form>

              <aside className="result-column">
                <ResultPanel result={result} loading={loading} onReset={handleReset} />
                <div className="card info-card">
                  <span className="info-label">System status</span>
                  <div className={backend === 'online' ? 'info-value ok' : 'info-value'}>
                    <span className="pill-dot" /> {backendText}
                  </div>
                  <p>Car age is derived from the manufacturing year using {REFERENCE_YEAR} as the training reference.</p>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="section soft" id="model">
          <div className="container">
            <div className="section-heading">
              <span className="section-kicker">Under the hood</span>
              <h2>How the prediction works</h2>
              <p>A simple, transparent pipeline from your input to the final estimate.</p>
            </div>
            <div className="steps">
              <div className="step-card">
                <span className="step-number">01</span>
                <h3>Enter details</h3>
                <p>Price, mileage, year, owner count and configuration — 8 training features in total.</p>
              </div>
              <div className="step-card">
                <span className="step-number">02</span>
                <h3>Encode &amp; predict</h3>
                <p>Flask encodes categories exactly like training and runs the saved Random Forest model.</p>
              </div>
              <div className="step-card">
                <span className="step-number">03</span>
                <h3>Read the estimate</h3>
                <p>The result is returned in lakhs and shown instantly in the React interface.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer" id="about">
        <div className="container footer-inner">
          <a className="brand" href="#top">
            <span className="brand-icon"><CarLogo size={24} /></span>
            <span>CarPrice <strong>AI</strong></span>
          </a>
          <p>React + Flask interface for a scikit-learn car price prediction model.</p>
        </div>
      </footer>
    </div>
  )
}
