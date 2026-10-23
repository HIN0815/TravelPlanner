import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../features/auth/AuthContext'
import {
  deletePersonalWishlistItem,
  listPersonalWishlist,
  listTrips,
  upsertPersonalWishlistItem,
  upsertTripWishlistItem,
} from '../features/trips/tripService'
import { formatMoney } from '../lib/dates'
import type { Trip, WishlistItem } from '../types/models'

export function WishlistPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    void Promise.all([listPersonalWishlist(user.uid), listTrips(user.uid)])
      .then(([w, tr]) => {
        setItems(w)
        setTrips(tr)
      })
      .finally(() => setLoading(false))
  }, [user])

  async function onAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!user) return
    const fd = new FormData(e.currentTarget)
    const created = await upsertPersonalWishlistItem(user.uid, {
      name: String(fd.get('name') || ''),
      price: Number(fd.get('price') || 0),
      where: String(fd.get('where') || ''),
      note: String(fd.get('note') || ''),
      bought: false,
    })
    setItems((prev) => [created, ...prev])
    e.currentTarget.reset()
  }

  async function addToTrip(item: WishlistItem, tripId: string) {
    if (!tripId) return
    await upsertTripWishlistItem(tripId, {
      name: item.name,
      price: item.price,
      where: item.where,
      note: item.note,
      bought: false,
    })
  }

  if (loading) return <p>{t('app.loading')}</p>

  return (
    <section className="page">
      <div className="page-head">
        <h1>{t('wishlist.personal')}</h1>
      </div>

      <form className="panel form-grid" onSubmit={(e) => void onAdd(e)}>
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

      {items.length === 0 ? (
        <p className="muted">{t('wishlist.empty')}</p>
      ) : (
        <ul className="simple-list">
          {items.map((item) => (
            <li key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <div className="muted">
                  {formatMoney(item.price, 'HKD', i18n.language)} · {item.where} · {item.note}
                </div>
              </div>
              <div className="row-actions">
                <select
                  className="input"
                  defaultValue=""
                  onChange={(e) => {
                    const tripId = e.target.value
                    if (tripId) void addToTrip(item, tripId)
                    e.target.value = ''
                  }}
                >
                  <option value="">{t('wishlist.addToTrip')}</option>
                  {trips.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.title}
                    </option>
                  ))}
                </select>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={item.bought}
                    onChange={(e) => {
                      if (!user) return
                      const bought = e.target.checked
                      setItems((prev) =>
                        prev.map((w) => (w.id === item.id ? { ...w, bought } : w)),
                      )
                      void upsertPersonalWishlistItem(user.uid, { ...item, bought })
                    }}
                  />
                  {t('wishlist.bought')}
                </label>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => {
                    if (!user) return
                    void deletePersonalWishlistItem(user.uid, item.id).then(() =>
                      setItems((prev) => prev.filter((w) => w.id !== item.id)),
                    )
                  }}
                >
                  {t('common.delete')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
