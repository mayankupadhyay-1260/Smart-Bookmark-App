'use client'

import { supabase } from '@/lib/supabase'

export default function LoginButton() {

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google'
    })
  }

  return (
    <button
      onClick={handleLogin}
      className="px-4 py-2 bg-black text-white rounded-md"
    >
      Sign in with Google
    </button>
  )
}
