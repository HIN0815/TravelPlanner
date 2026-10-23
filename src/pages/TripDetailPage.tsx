import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../features/auth/AuthContext'
import { PlaceSearch } from '../features/map/PlaceSearch'
import { TripMap } from '../features/map/TripMap'
import {
  addExpense,
  deleteExpense,
  deleteSpot,
  deleteTripWishlistItem,
  disableShare,
  enableShare,
  getTrip,
  listDays,
  listExpenses,
  listSpots,
  listTransports,
  listTripWishlist,
  updateTrip,
  upsertSpot,
  upsertTransport,
  upsertTripWishlistItem,
} from '../features/trips/tripService'
import {
  fetchRouteBetween,
  formatDistance,
  formatDuration,
  travelModeOptions,
  type TravelModeKey,
} from '../lib/maps'
import { formatMoney, toHkd } from '../lib/dates'
import type { Expense, Spot, Transport, Trip, TripDay, WishlistItem } from '../types/models'

type Tab = 'itinerary' | 'budget' | 'wishlist'

export function TripDetailPage() {
  const { tripId = '' } = useParams()
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [days, setDays] = useState<TripDay[]>([])
  const [activeDayId, setActiveDayId] = useState<string>('')
  const [spots, setSpots] = useState<Spot[]>([])
  const [transports, setTransports] = useState<Transport[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [tab, setTab] = useState<Tab>('itinerary')
  const [loading, setLoading] = useState(true)
  const [routeBusy, setRouteBusy] = useState<string | null>(null)
  const [shareMsg, setShareMsg] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const loadCore = useCallback(async () => {
    if (!tripId) return
    setLoading(true)
    try {
      const [tData, dData, trData, eData, wData] = await Promise.all([
        getTrip(tripId),
        listDays(tripId),
        listTransports(tripId),
        listExpenses(tripId),
        listTripWishlist(tripId),
      ])
      setTrip(tData)
      setDays(dData)
      setTransports(trData)
      setExpenses(eData)
      setWishlist(wData)
      setActiveDayId((prev) => prev || dData[0]?.id || '')
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    void loadCore()
  }, [loadCore])

  useEffect(() => {
    if (!tripId || !activeDayId) return
    void listSpots(tripId, activeDayId).then(setSpots)
  }, [tripId, activeDayId])

  const dayTransports = useMemo(
    () => transports.filter((tr) => tr.dayId === activeDayId),
    [transports, activeDayId],
  )

  const spent = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  )

  async function onAddPlace(place: {
    name: string
    placeId: string | null
    lat: number | null
    lng: number | null
  }) {
    if (!tripId || !activeDayId || !place.name) return
    const created = await upsertSpot(tripId, activeDayId, {
      name: place.name,
      placeId: place.placeId,
      lat: place.lat,
      lng: place.lng,
      time: '10:00',
      notes: '',
      order: spots.length,
    })
    setSpots((prev) => [...prev, created])
  }

  async function estimateLeg(
    from: Spot,
    to: Spot,
    mode: TravelModeKey,
  ) {
    if (!tripId || from.lat == null || from.lng == null || to.lat == null || to.lng == null) {
      return
    }
    const key = `${from.id}_${to.id}`
    setRouteBusy(key)
    try {
      const result = await fetchRouteBetween(
        { lat: from.lat, lng: from.lng },
        { lat: to.lat, lng: to.lng },
        mode,
      )
      if (!result) return
      const saved = await upsertTransport(tripId, {
        fromSpotId: from.id,
        toSpotId: to.id,
        dayId: activeDayId,
        mode: result.mode,
        durationSeconds: result.durationSeconds,
        distanceMeters: result.distanceMeters,
        polyline: result.polyline,
      })
      setTransports((prev) => {
        const rest = prev.filter((x) => x.id !== saved.id)
        return [...rest, saved]
      })
    } finally {
      setRouteBusy(null)
    }
  }

  async function onShare() {
    if (!tripId || !trip) return
    const shareId = await enableShare(tripId)
    const url = `${window.location.origin}${import.meta.env.BASE_URL}share/${shareId}`.replace(
      /([^:]\/)\/+/g,
      '$1',
    )
    await navigator.clipboard.writeText(url)
    setShareMsg(t('trips.shareCopied'))
    setTrip({ ...trip, shareId })
  }

  async function onUnshare() {
    if (!tripId || !trip) return
    await disableShare(tripId)
    setTrip({ ...trip, shareId: null })
    setShareMsg('')
  }

  async function onSaveSettings(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!tripId || !trip) return
    const fd = new FormData(e.currentTarget)
    const patch = {
      title: String(fd.get('title') || trip.title),
      destination: String(fd.get('destination') || trip.destination),
      currency: String(fd.get('currency') || trip.currency).toUpperCase(),
      hkdRate: Number(fd.get('hkdRate') || trip.hkdRate),
      budgetTotal: Number(fd.get('budgetTotal') || trip.budgetTotal),
    }
    await updateTrip(tripId, patch)
    setTrip({ ...trip, ...patch })
    setSettingsOpen(false)
  }

  async function onAddExpense(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!tripId) return
    const fd = new FormData(e.currentTarget)
    const created = await addExpense(tripId, {
      amount: Number(fd.get('amount') || 0),
      category: String(fd.get('category') || ''),
      note: String(fd.get('note') || ''),
      date: String(fd.get('date') || trip?.startDate || ''),
    })
    setExpenses((prev) => [created, ...prev])
    e.currentTarget.reset()
  }

  async function onAddWish(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!tripId) return
    const fd = new FormData(e.currentTarget)
    const created = await upsertTripWishlistItem(tripId, {
      name: String(fd.get('name') || ''),
      price: Number(fd.get('price') || 0),
      where: String(fd.get('where') || ''),
      note: String(fd.get('note') || ''),
      bought: false,
    })
    setWishlist((prev) => [created, ...prev])
    e.currentTarget.reset()
  }

  if (loading) return <p>{t('app.loading')}</p>
  if (!trip || !user || trip.ownerId !== user.uid) {
    return <p>{t('common.error')}</p>
  }

  const locale = i18n.language

  return (
    <section className="page trip-detail">
      <div className="page-head">
        <div>
          <Link to="/trips" className="back-link">
            ← {t('common.back')}
          </Link>
          <h1>{trip.title}</h1>
          <p className="muted">
            {trip.destination} · {trip.startDate} → {trip.endDate}
          </p>
        </div>
        <div className="row-actions">
          <button type="button" className="btn ghost" onClick={() => setSettingsOpen((v) => !v)}>
            {t('trips.edit')}
          </button>
          {trip.shareId ? (
            <button type="button" className="btn ghost" onClick={() => void onUnshare()}>
              {t('trips.unshare')}
            </button>
          ) : null}
          <button type="button" className="btn primary" onClick={() => void onShare()}>
            {t('trips.share')}
          </button>
        </div>
      </div>
      {shareMsg && <p className="banner ok">{shareMsg}</p>}

      {settingsOpen && (
        <form className="panel form-grid" onSubmit={(e) => void onSaveSettings(e)}>
          <label>
            Title
            <input className="input" name="title" defaultValue={trip.title} />
          </label>
          <label>
            {t('trips.destination')}
            <input className="input" name="destination" defaultValue={trip.destination} />
          </label>
          <label>
            {t('trips.currency')}
            <input className="input" name="currency" defaultValue={trip.currency} />
          </label>
          <label>
            {t('trips.hkdRate')}
            <input
              className="input"
              name="hkdRate"
              type="number"
              step="0.0001"
              defaultValue={trip.hkdRate}
            />
          </label>
          <label>
            {t('trips.budgetTotal')}
            <input
              className="input"
              name="budgetTotal"
              type="number"
              defaultValue={trip.budgetTotal}
            />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn primary">
              {t('trips.save')}
            </button>
          </div>
        </form>
      )}

      <div className="tabs">
        {(['itinerary', 'budget', 'wishlist'] as Tab[]).map((key) => (
          <button
            key={key}
            type="button"
            className={tab === key ? 'tab active' : 'tab'}
            onClick={() => setTab(key)}
          >
            {key === 'itinerary'
              ? t('trips.days')
              : key === 'budget'
                ? t('budget.title')
                : t('wishlist.trip')}
          </button>
        ))}
      </div>

      {tab === 'itinerary' && (
        <div className="split">
          <div className="split-main">
            <div className="day-chips">
              {days.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={d.id === activeDayId ? 'chip active' : 'chip'}
                  onClick={() => setActiveDayId(d.id)}
                >
                  {d.date}
                </button>
              ))}
            </div>

            <div className="panel">
              <PlaceSearch onSelect={(p) => void onAddPlace(p)} />
            </div>

            {spots.length === 0 ? (
              <p className="muted">{t('trips.noSpots')}</p>
            ) : (
              <ol className="timeline">
                {spots.map((spot, idx) => {
                  const next = spots[idx + 1]
                  const leg = next
                    ? dayTransports.find(
                        (tr) => tr.fromSpotId === spot.id && tr.toSpotId === next.id,
                      )
                    : undefined
                  return (
                    <li key={spot.id} className="timeline-item">
                      <div className="timeline-spot">
                        <div>
                          <strong>{spot.name}</strong>
                          <div className="muted">{spot.time}</div>
                        </div>
                        <div className="row-actions">
                          <input
                            className="input time-input"
                            type="time"
                            value={spot.time}
                            onChange={(e) => {
                              const time = e.target.value
                              setSpots((prev) =>
                                prev.map((s) => (s.id === spot.id ? { ...s, time } : s)),
                              )
                              void upsertSpot(tripId, activeDayId, { ...spot, time })
                            }}
                          />
                          <button
                            type="button"
                            className="btn ghost"
                            onClick={() => {
                              if (confirm(t('common.confirmDelete'))) {
                                void deleteSpot(tripId, activeDayId, spot.id).then(() =>
                                  setSpots((prev) => prev.filter((s) => s.id !== spot.id)),
                                )
                              }
                            }}
                          >
                            {t('common.delete')}
                          </button>
                        </div>
                      </div>
                      {next && (
                        <div className="transport-row">
                          <span>{t('transport.label')}</span>
                          <select
                            className="input"
                            defaultValue={leg?.mode ?? 'TRANSIT'}
                            id={`mode-${spot.id}`}
                          >
                            {travelModeOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {t(opt.labelKey)}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="btn ghost"
                            disabled={routeBusy === `${spot.id}_${next.id}`}
                            onClick={() => {
                              const el = document.getElementById(
                                `mode-${spot.id}`,
                              ) as HTMLSelectElement | null
                              const mode = (el?.value ?? 'TRANSIT') as TravelModeKey
                              void estimateLeg(spot, next, mode)
                            }}
                          >
                            {routeBusy === `${spot.id}_${next.id}`
                              ? t('transport.fetching')
                              : t('transport.fetch')}
                          </button>
                          <span className="muted">
                            {leg
                              ? `${formatDuration(leg.durationSeconds)} · ${formatDistance(leg.distanceMeters)}`
                              : t('transport.none')}
                          </span>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ol>
            )}
          </div>
          <aside className="split-side">
            <TripMap spots={spots} transports={dayTransports} height="420px" />
          </aside>
        </div>
      )}

      {tab === 'budget' && (
        <div className="budget-panel">
          <div className="stat-row">
            <div>
              <div className="muted">{t('budget.total')}</div>
              <strong>
                {formatMoney(trip.budgetTotal, trip.currency, locale)}{' '}
                <span className="muted">
                  / {formatMoney(toHkd(trip.budgetTotal, trip.hkdRate), 'HKD', locale)}
                </span>
              </strong>
            </div>
            <div>
              <div className="muted">{t('budget.spent')}</div>
              <strong>
                {formatMoney(spent, trip.currency, locale)}{' '}
                <span className="muted">
                  / {formatMoney(toHkd(spent, trip.hkdRate), 'HKD', locale)}
                </span>
              </strong>
            </div>
            <div>
              <div className="muted">{t('budget.remaining')}</div>
              <strong>
                {formatMoney(trip.budgetTotal - spent, trip.currency, locale)}
              </strong>
            </div>
          </div>

          <form className="panel form-grid" onSubmit={(e) => void onAddExpense(e)}>
            <label>
              {t('budget.amount')}
              <input className="input" name="amount" type="number" step="0.01" required />
            </label>
            <label>
              {t('budget.category')}
              <input className="input" name="category" />
            </label>
            <label>
              {t('budget.date')}
              <input className="input" name="date" type="date" defaultValue={trip.startDate} />
            </label>
            <label>
              {t('budget.note')}
              <input className="input" name="note" />
            </label>
            <div className="form-actions">
              <button type="submit" className="btn primary">
                {t('budget.add')}
              </button>
            </div>
          </form>

          {expenses.length === 0 ? (
            <p className="muted">{t('budget.empty')}</p>
          ) : (
            <ul className="simple-list">
              {expenses.map((exp) => (
                <li key={exp.id}>
                  <div>
                    <strong>
                      {formatMoney(exp.amount, trip.currency, locale)}
                    </strong>{' '}
                    <span className="muted">
                      ({t('budget.inHkd')}:{' '}
                      {formatMoney(toHkd(exp.amount, trip.hkdRate), 'HKD', locale)})
                    </span>
                    <div className="muted">
                      {exp.category} · {exp.date} · {exp.note}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() =>
                      void deleteExpense(tripId, exp.id).then(() =>
                        setExpenses((prev) => prev.filter((x) => x.id !== exp.id)),
                      )
                    }
                  >
                    {t('common.delete')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'wishlist' && (
        <div>
          <form className="panel form-grid" onSubmit={(e) => void onAddWish(e)}>
            <label>
              {t('wishlist.name')}
              <input className="input" name="name" required />
            </label>
            <label>
              {t('wishlist.price')}
              <input className="input" name="price" type="number" step="0.01" />
            </label>
            <label>
              {t('wishlist.where')}
              <input className="input" name="where" />
            </label>
            <label>
              {t('wishlist.note')}
              <input className="input" name="note" />
            </label>
            <div className="form-actions">
              <button type="submit" className="btn primary">
                {t('wishlist.add')}
              </button>
            </div>
          </form>
          {wishlist.length === 0 ? (
            <p className="muted">{t('wishlist.empty')}</p>
          ) : (
            <ul className="simple-list">
              {wishlist.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <div className="muted">
                      {formatMoney(item.price, trip.currency, locale)} · {item.where} ·{' '}
                      {item.note}
                    </div>
                  </div>
                  <div className="row-actions">
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={item.bought}
                        onChange={(e) => {
                          const bought = e.target.checked
                          setWishlist((prev) =>
                            prev.map((w) => (w.id === item.id ? { ...w, bought } : w)),
                          )
                          void upsertTripWishlistItem(tripId, { ...item, bought })
                        }}
                      />
                      {t('wishlist.bought')}
                    </label>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() =>
                        void deleteTripWishlistItem(tripId, item.id).then(() =>
                          setWishlist((prev) => prev.filter((w) => w.id !== item.id)),
                        )
                      }
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
