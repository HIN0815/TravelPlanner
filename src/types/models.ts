export type LocaleCode = 'zh-HK' | 'en'

export interface UserProfile {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
  locale: LocaleCode
}

export interface Trip {
  id: string
  ownerId: string
  title: string
  destination: string
  startDate: string
  endDate: string
  currency: string
  hkdRate: number
  budgetTotal: number
  shareId: string | null
  createdAt: number
  updatedAt: number
}

export interface TripDay {
  id: string
  date: string
  order: number
}

export interface Spot {
  id: string
  name: string
  placeId: string | null
  lat: number | null
  lng: number | null
  time: string
  notes: string
  order: number
}

export type TransportMode = 'DRIVE' | 'WALK' | 'BICYCLE' | 'TRANSIT'

export interface Transport {
  id: string
  fromSpotId: string
  toSpotId: string
  dayId: string
  mode: TransportMode
  durationSeconds: number
  distanceMeters: number
  polyline: string
}

export interface Expense {
  id: string
  amount: number
  category: string
  note: string
  date: string
  createdAt: number
}

export interface WishlistItem {
  id: string
  name: string
  price: number
  where: string
  note: string
  bought: boolean
  createdAt: number
}

export interface ShareDoc {
  tripId: string
  createdAt: number
}
