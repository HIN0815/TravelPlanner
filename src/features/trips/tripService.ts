import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { eachDateInclusive, randomId } from '../../lib/dates'
import type {
  Expense,
  ShareDoc,
  Spot,
  Transport,
  Trip,
  TripDay,
  WishlistItem,
} from '../../types/models'

function requireDb() {
  if (!db) throw new Error('Firestore not configured')
  return db
}

export async function listTrips(ownerId: string): Promise<Trip[]> {
  const database = requireDb()
  const q = query(collection(database, 'trips'), where('ownerId', '==', ownerId))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Trip, 'id'>) }))
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getTrip(tripId: string): Promise<Trip | null> {
  const database = requireDb()
  const snap = await getDoc(doc(database, 'trips', tripId))
  if (!snap.exists()) return null
  return { id: snap.id, ...(snap.data() as Omit<Trip, 'id'>) }
}

export async function createTrip(
  ownerId: string,
  input: {
    title: string
    destination: string
    startDate: string
    endDate: string
    currency: string
    hkdRate: number
    budgetTotal: number
  },
): Promise<Trip> {
  const database = requireDb()
  const id = randomId('trip')
  const now = Date.now()
  const trip: Trip = {
    id,
    ownerId,
    title: input.title,
    destination: input.destination,
    startDate: input.startDate,
    endDate: input.endDate,
    currency: input.currency,
    hkdRate: input.hkdRate,
    budgetTotal: input.budgetTotal,
    shareId: null,
    createdAt: now,
    updatedAt: now,
  }
  await setDoc(doc(database, 'trips', id), trip)

  const dates = eachDateInclusive(input.startDate, input.endDate)
  const batch = writeBatch(database)
  dates.forEach((date, order) => {
    const dayId = randomId('day')
    const day: TripDay = { id: dayId, date, order }
    batch.set(doc(database, 'trips', id, 'days', dayId), day)
  })
  await batch.commit()
  return trip
}

export async function touchTrip(tripId: string): Promise<void> {
  const database = requireDb()
  await setDoc(doc(database, 'trips', tripId), { updatedAt: Date.now() }, { merge: true })
}

export async function updateTrip(
  tripId: string,
  patch: Partial<
    Pick<
      Trip,
      | 'title'
      | 'destination'
      | 'startDate'
      | 'endDate'
      | 'currency'
      | 'hkdRate'
      | 'budgetTotal'
      | 'shareId'
    >
  >,
): Promise<void> {
  const database = requireDb()
  await setDoc(
    doc(database, 'trips', tripId),
    { ...patch, updatedAt: Date.now() },
    { merge: true },
  )
}

export async function deleteTrip(tripId: string): Promise<void> {
  const database = requireDb()
  // Subcollections cleaned best-effort (Spark has no recursive delete helper in client easily)
  const subcols = ['days', 'transports', 'expenses', 'wishlist'] as const
  for (const name of subcols) {
    const snap = await getDocs(collection(database, 'trips', tripId, name))
    const batch = writeBatch(database)
    for (const d of snap.docs) {
      if (name === 'days') {
        const spots = await getDocs(
          collection(database, 'trips', tripId, 'days', d.id, 'spots'),
        )
        spots.docs.forEach((s) => batch.delete(s.ref))
      }
      batch.delete(d.ref)
    }
    await batch.commit()
  }
  const tripSnap = await getDoc(doc(database, 'trips', tripId))
  const shareId = (tripSnap.data() as Trip | undefined)?.shareId
  if (shareId) {
    await deleteDoc(doc(database, 'shares', shareId))
  }
  await deleteDoc(doc(database, 'trips', tripId))
}

export async function listDays(tripId: string): Promise<TripDay[]> {
  const database = requireDb()
  const q = query(
    collection(database, 'trips', tripId, 'days'),
    orderBy('order', 'asc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TripDay, 'id'>) }))
}

export async function listSpots(tripId: string, dayId: string): Promise<Spot[]> {
  const database = requireDb()
  const q = query(
    collection(database, 'trips', tripId, 'days', dayId, 'spots'),
    orderBy('order', 'asc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Spot, 'id'>) }))
}

export async function upsertSpot(
  tripId: string,
  dayId: string,
  spot: Omit<Spot, 'id'> & { id?: string },
): Promise<Spot> {
  const database = requireDb()
  const id = spot.id ?? randomId('spot')
  const data: Spot = {
    id,
    name: spot.name,
    placeId: spot.placeId,
    lat: spot.lat,
    lng: spot.lng,
    time: spot.time,
    notes: spot.notes,
    order: spot.order,
  }
  await setDoc(doc(database, 'trips', tripId, 'days', dayId, 'spots', id), data)
  await touchTrip(tripId)
  return data
}

export async function deleteSpot(
  tripId: string,
  dayId: string,
  spotId: string,
): Promise<void> {
  const database = requireDb()
  await deleteDoc(doc(database, 'trips', tripId, 'days', dayId, 'spots', spotId))
}

export async function listTransports(tripId: string): Promise<Transport[]> {
  const database = requireDb()
  const snap = await getDocs(collection(database, 'trips', tripId, 'transports'))
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Transport, 'id'>) }))
}

export async function upsertTransport(
  tripId: string,
  transport: Omit<Transport, 'id'> & { id?: string },
): Promise<Transport> {
  const database = requireDb()
  const id = transport.id ?? `${transport.fromSpotId}_${transport.toSpotId}`
  const data: Transport = { ...transport, id }
  await setDoc(doc(database, 'trips', tripId, 'transports', id), data)
  return data
}

export async function listExpenses(tripId: string): Promise<Expense[]> {
  const database = requireDb()
  const q = query(
    collection(database, 'trips', tripId, 'expenses'),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Expense, 'id'>) }))
}

export async function addExpense(
  tripId: string,
  input: Omit<Expense, 'id' | 'createdAt'>,
): Promise<Expense> {
  const database = requireDb()
  const id = randomId('exp')
  const data: Expense = { ...input, id, createdAt: Date.now() }
  await setDoc(doc(database, 'trips', tripId, 'expenses', id), data)
  return data
}

export async function deleteExpense(tripId: string, expenseId: string): Promise<void> {
  const database = requireDb()
  await deleteDoc(doc(database, 'trips', tripId, 'expenses', expenseId))
}

export async function listTripWishlist(tripId: string): Promise<WishlistItem[]> {
  const database = requireDb()
  const q = query(
    collection(database, 'trips', tripId, 'wishlist'),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<WishlistItem, 'id'>),
  }))
}

export async function upsertTripWishlistItem(
  tripId: string,
  item: Omit<WishlistItem, 'id' | 'createdAt'> & { id?: string; createdAt?: number },
): Promise<WishlistItem> {
  const database = requireDb()
  const id = item.id ?? randomId('wish')
  const data: WishlistItem = {
    id,
    name: item.name,
    price: item.price,
    where: item.where,
    note: item.note,
    bought: item.bought,
    createdAt: item.createdAt ?? Date.now(),
  }
  await setDoc(doc(database, 'trips', tripId, 'wishlist', id), data)
  return data
}

export async function deleteTripWishlistItem(
  tripId: string,
  itemId: string,
): Promise<void> {
  const database = requireDb()
  await deleteDoc(doc(database, 'trips', tripId, 'wishlist', itemId))
}

export async function listPersonalWishlist(uid: string): Promise<WishlistItem[]> {
  const database = requireDb()
  const q = query(
    collection(database, 'wishlists', uid, 'items'),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<WishlistItem, 'id'>),
  }))
}

export async function upsertPersonalWishlistItem(
  uid: string,
  item: Omit<WishlistItem, 'id' | 'createdAt'> & { id?: string; createdAt?: number },
): Promise<WishlistItem> {
  const database = requireDb()
  const id = item.id ?? randomId('wish')
  const data: WishlistItem = {
    id,
    name: item.name,
    price: item.price,
    where: item.where,
    note: item.note,
    bought: item.bought,
    createdAt: item.createdAt ?? Date.now(),
  }
  await setDoc(doc(database, 'wishlists', uid, 'items', id), data)
  return data
}

export async function deletePersonalWishlistItem(
  uid: string,
  itemId: string,
): Promise<void> {
  const database = requireDb()
  await deleteDoc(doc(database, 'wishlists', uid, 'items', itemId))
}

export async function enableShare(tripId: string): Promise<string> {
  const database = requireDb()
  const trip = await getTrip(tripId)
  if (!trip) throw new Error('Trip not found')
  if (trip.shareId) return trip.shareId

  const shareId = randomId('share')
  const share: ShareDoc = { tripId, createdAt: Date.now() }
  await setDoc(doc(database, 'shares', shareId), share)
  await updateTrip(tripId, { shareId })
  return shareId
}

export async function disableShare(tripId: string): Promise<void> {
  const database = requireDb()
  const trip = await getTrip(tripId)
  if (!trip?.shareId) return
  await deleteDoc(doc(database, 'shares', trip.shareId))
  await updateTrip(tripId, { shareId: null })
}

export async function getShare(shareId: string): Promise<ShareDoc | null> {
  const database = requireDb()
  const snap = await getDoc(doc(database, 'shares', shareId))
  if (!snap.exists()) return null
  return snap.data() as ShareDoc
}
