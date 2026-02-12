'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import LoginButton from './login-button'

export default function Home() {
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const fetchBookmarks = async () => {
    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setBookmarks(data)
  }

  useEffect(() => {
  if (!user) return

  fetchBookmarks()

  const channel = supabase
    .channel('bookmarks-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bookmarks',
        filter: `user_id=eq.${user.id}`
      },
      () => {
        fetchBookmarks()
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [user])


  const addBookmark = async () => {
    if (!title || !url || !user) return

    await supabase.from('bookmarks').insert({
      title,
      url,
      user_id: user.id
    })

    setTitle('')
    setUrl('')
    
  }

  const deleteBookmark = async (id: string) => {
    await supabase.from('bookmarks').delete().eq('id', id)
    
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoginButton />
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md">
        <p className="mb-4 text-center">Logged in as {user.email}</p>

        <div className="flex flex-col gap-2 mb-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bookmark title"
            className="border p-2 rounded"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="border p-2 rounded"
          />
          <button
            onClick={addBookmark}
            className="bg-black text-white py-2 rounded"
          >
            Add Bookmark
          </button>
        </div>

        <div className="space-y-2">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="flex justify-between items-center border p-2 rounded"
            >
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                {bookmark.title}
              </a>
              <button
                onClick={() => deleteBookmark(bookmark.id)}
                className="text-red-500"
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-6 w-full bg-red-500 text-white py-2 rounded"
        >
          Logout
        </button>
      </div>
    </main>
  )
}
