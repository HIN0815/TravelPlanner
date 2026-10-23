import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../features/auth/AuthContext'
import { createTrip, deleteTrip, listTrips } from '../features/trips/tripService'
import type { Trip } from '../types/models'

export function TripsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    currency: 'JPY',
    hkdRate: 0.052,
    budgetTotal: 0,
  })

  async function refresh() {
    if (!user) return
    setLoading(true)
    try {
      setTrips(await listTrips(user.uid))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [user])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    await createTrip(user.uid, {
      ...form,
      title: form.title || form.destination,
      hkdRate: Number(form.hkdRate),
      budgetTotal: Number(form.budgetTotal),
    })
    setShowForm(false)
    setForm({
      title: '',
      destination: '',
      startDate: '',
      endDate: '',
      currency: 'JPY',
      hkdRate: 0.052,
      budgetTotal: 0,
    })
    await refresh()
  }

  if (loading) return <p>{t('app.loading')}</p>

  return (
    <section className="page">
      <div className="page-head">
        <h1>{t('trips.title')}</h1>
        <button type="button" className="btn primary" onClick={() => setShowForm((v) => !v)}>
          {t('trips.new')}
        </button>
      </div>

      {showForm && (
        <form className="panel form-grid" onSubmit={(e) => void onSubmit(e)}>
          <label>
            {t('trips.destination')}
            <input
              className="input"
              required
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value, title: e.target.value })}
            />
          </label>
          <label>
            {t('trips.startDate')}
            <input
              className="input"
              type="date"
              required
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </label>
          <label>
            {t('trips.endDate')}
            <input
              className="input"
              type="date"
              required
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </label>
          <label>
            {t('trips.currency')}
            <input
              className="input"
              required
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
            />
          </label>
          <label>
            {t('trips.hkdRate')}
            <input
              className="input"
              type="number"
              step="0.0001"
              required
              value={form.hkdRate}
              onChange={(e) => setForm({ ...form, hkdRate: Number(e.target.value) })}
            />
          </label>
          <label>
            {t('trips.budgetTotal')}
            <input
              className="input"
              type="number"
              min="0"
              value={form.budgetTotal}
              onChange={(e) => setForm({ ...form, budgetTotal: Number(e.target.value) })}
            />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn primary">
              {t('trips.save')}
            </button>
            <button type="button" className="btn ghost" onClick={() => setShowForm(false)}>
              {t('trips.cancel')}
            </button>
          </div>
        </form>
      )}

      {trips.length === 0 ? (
        <p className="muted">{t('trips.empty')}</p>
      ) : (
        <ul className="trip-list">
          {trips.map((trip) => (
            <li key={trip.id} className="trip-row">
              <div>
                <h2>{trip.title}</h2>
                <p className="muted">
                  {trip.destination} · {trip.startDate} → {trip.endDate} · {trip.currency}
                </p>
              </div>
              <div className="row-actions">
                <Link className="btn primary" to={`/trips/${trip.id}`}>
                  {t('trips.open')}
                </Link>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => {
                    if (confirm(t('common.confirmDelete'))) {
                      void deleteTrip(trip.id).then(refresh)
                    }
                  }}
                >
                  {t('trips.delete')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
