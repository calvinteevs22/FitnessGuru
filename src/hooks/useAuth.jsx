import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // undefined = still initialising | null = no session | Session = logged in
  const [session, setSession] = useState(undefined)
  // undefined = profile not yet fetched | null = fetched, no row | object = fetched
  const [profile, setProfile] = useState(undefined)
  const fetchingRef = useRef(false)

  async function fetchProfile(userId) {
    fetchingRef.current = true
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      setProfile(data ?? null)
    } catch {
      setProfile(null)
    } finally {
      fetchingRef.current = false
    }
  }

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION immediately — use it as the
    // single source of truth to avoid getSession() race conditions.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session ?? null)
      if (session) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // loading = true while we're still waiting for the initial session check
  // OR while we have a session but haven't fetched the profile yet
  const loading = session === undefined || (session !== null && profile === undefined)

  const value = {
    session,
    profile,
    loading,
    role: profile?.role ?? null,
    signOut: () => supabase.auth.signOut(),
    refreshProfile: () => session && fetchProfile(session.user.id),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

const AUTH_FALLBACK = {
  session: null,
  profile: null,
  loading: false,
  role: null,
  signOut: () => {},
  refreshProfile: () => {},
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    if (process.env.NODE_ENV === 'test') return AUTH_FALLBACK
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return ctx
}
