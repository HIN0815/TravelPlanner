import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { TripMap } from '../features/map/TripMap'
import {
  getShare,
  getTrip,
  listDays,
  listExpenses,
  listSpots,
  listTransports,
  listTripWishlist,
} from '../features/trips/tripService'
import { formatDistance, formatDuration } from '../lib/maps'
import { formatMoney, toHkd } from '../lib/dates'
import type { Expense, Spot, Transport, Trip, TripDay, WishlistItem } from '../types/models'

export function SharePage() {
  const { shareId = '' } = useParams()
  const { t, i18n } = useTranslation()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [days, setDays] = useState<TripDay[]>([])
  const [activeDayId, setActiveDayId] = useState('')
  const [spots, setSpots] = useState<Spot[]>([])
  const [transports, setTransports] = useState<Transport[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const share = await getShare(shareId)
        if (!share) {
          setNotFound(true)
          return
        }
        const [tData, dData, trData, eData, wData] = await Promise.all([
          getTrip(share.tripId),
          listDays(share.tripId),
          listTransports(share.tripId),
          listExpenses(share.tripId),
          listTripWishlist(share.tripId),
        ])
        if (!tData || tData.shareId !== shareId) {
          setNotFound(true)
          return
        }
        setTrip(tData)
        setDays(dData)
        setTransports(trData)
        setExpenses(eData)
        setWishlist(wData)
        setActiveDayId(dData[0]?.id || '')
      } catch (e) {
        console.error(e)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [shareId])

  useEffect(() => {
    if (!trip || !activeDayId) return
    void listSpots(trip.id, activeDayId).then(setSpots)
  }, [trip, activeDayId])

  const dayTransports = useMemo(
    () => transports.filter((tr) => tr.dayId === activeDayId),
    [transports, activeDayId],
  )

  const spent = expenses.reduce((s, e) => s + e.amount, 0)

  if (loading) return <p>{t('app.loading')}</p>
  if (notFound || !trip) {
    return (
      <section className="page">
        <h1>{t('share.notFound')}</h1>
        <Link to="/">{t('common.back')}</Link>
      </section>
    )
  }

  return (
    <section className="page">
      <p className="banner ok">{t('share.readonly')}</p>
      <h1>{trip.title}</h1>
      <p className="muted">
        {trip.destination} · {trip.startDate} → {trip.endDate}
      </p>

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

      <div className="split">
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
                <strong>
                  {spot.time} · {spot.name}
                </strong>
                {leg && (
                  <div className="muted">
                    {t('transport.label')}: {formatDuration(leg.durationSeconds)} ·{' '}
                    {formatDistance(leg.distanceMeters)}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
        <TripMap spots={spots} transports={dayTransports} />
      </div>

      <h2>{t('budget.title')}</h2>
      <p>
        {t('budget.spent')}: {formatMoney(spent, trip.currency, i18n.language)} /{' '}
        {formatMoney(toHkd(spent, trip.hkdRate), 'HKD', i18n.language)} HKD
      </p>

      <h2>{t('wishlist.trip')}</h2>
      {wishlist.length === 0 ? (
        <p className="muted">{t('wishlist.empty')}</p>
      ) : (
        <ul className="simple-list">
          {wishlist.map((item) => (
            <li key={item.id}>
              <strong>{item.name}</strong>
              <span className="muted">
                {formatMoney(item.price, trip.currency, i18n.language)} · {item.where}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="muted">{t('share.loginToEdit')}</p>
    </section>
  )
}
