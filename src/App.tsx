import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './features/auth/AuthContext'
import { MapsProvider } from './features/map/MapsProvider'
import { HomePage } from './pages/HomePage'
import { SharePage } from './pages/SharePage'
import { TripDetailPage } from './pages/TripDetailPage'
import { TripsPage } from './pages/TripsPage'
import { WishlistPage } from './pages/WishlistPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/TravelPlanner">
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route
              path="share/:shareId"
              element={
                <MapsProvider>
                  <SharePage />
                </MapsProvider>
              }
            />

            <Route
              path="trips"
              element={
                <ProtectedRoute>
                  <TripsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="trips/:tripId"
              element={
                <ProtectedRoute>
                  <MapsProvider>
                    <TripDetailPage />
                  </MapsProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="wishlist"
              element={
                <ProtectedRoute>
                  <WishlistPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
