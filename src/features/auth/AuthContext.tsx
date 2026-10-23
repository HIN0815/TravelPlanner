import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db, googleProvider, isFirebaseConfigured } from '../../lib/firebase'
import { getStoredLocale, setStoredLocale } from '../../i18n'
import type { LocaleCode, UserProfile } from '../../types/models'
import i18n from '../../i18n'

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  configured: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  setLocale: (locale: LocaleCode) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function ensureUserProfile(user: User): Promise<UserProfile> {
  if (!db) {
    return {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      locale: getStoredLocale(),
    }
  }

  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    const data = snap.data() as UserProfile
    if (data.locale) {
      setStoredLocale(data.locale)
      await i18n.changeLanguage(data.locale)
    }
    return data
  }

  const profile: UserProfile = {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    locale: getStoredLocale(),
  }
  await setDoc(ref, profile)
  return profile
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    void getRedirectResult(auth).catch(console.error)

    const unsub = onAuthStateChanged(auth, async (next) => {
      setUser(next)
      if (next) {
        try {
          const p = await ensureUserProfile(next)
          setProfile(p)
        } catch (e) {
          console.error(e)
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      configured: isFirebaseConfigured,
      signIn: async () => {
        if (!auth) throw new Error('Firebase not configured')
        try {
          await signInWithPopup(auth, googleProvider)
        } catch {
          await signInWithRedirect(auth, googleProvider)
        }
      },
      signOut: async () => {
        if (!auth) return
        await firebaseSignOut(auth)
      },
      setLocale: async (locale: LocaleCode) => {
        setStoredLocale(locale)
        await i18n.changeLanguage(locale)
        if (user && db) {
          await setDoc(
            doc(db, 'users', user.uid),
            { locale },
            { merge: true },
          )
          setProfile((prev) => (prev ? { ...prev, locale } : prev))
        }
      },
    }),
    [user, profile, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
