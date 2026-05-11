"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

export default function HomePage() {

  const router = useRouter()

  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/")
      } else {
        setUser(user)
      }
    }

    getUser()
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f3f7ff]">
        <p className="text-2xl font-bold">
          Loading...
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f3f7ff] text-zinc-900">

      {/* NAVBAR */}
      <nav className="w-full border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400" />

            <p className="font-black text-2xl">
              NSVD Vocab
            </p>

          </div>

          <div className="flex items-center gap-5">

            <img
              src={user.user_metadata.avatar_url}
              className="w-12 h-12 rounded-full"
            />

            <div className="hidden md:block">

              <p className="font-bold">
                {user.user_metadata.full_name}
              </p>

              <p className="text-sm text-zinc-500">
                {user.email}
              </p>

            </div>

            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 transition text-white px-5 py-3 rounded-2xl font-semibold"
            >
              Logout
            </button>

          </div>

        </div>
      </nav>

      {/* CONTENT */}
      <section className="max-w-7xl mx-auto px-6 py-10">

        {/* GREETING */}
        <div className="mb-10">

          <p className="text-zinc-500 text-lg mb-3">
            Welcome back 👋
          </p>

          <h1 className="text-6xl font-black leading-tight">
            Ready to continue
            <br />

            your vocabulary journey?
          </h1>

        </div>

        {/* STATS */}
        <div className="grid lg:grid-cols-4 gap-6 mb-10">

          <div className="bg-white rounded-[30px] p-7 shadow-sm border border-zinc-100">

            <p className="text-zinc-500 mb-3">
              Words learned
            </p>

            <h2 className="text-5xl font-black">
              274
            </h2>

          </div>

          <div className="bg-orange-400 text-white rounded-[30px] p-7 shadow-sm">

            <p className="opacity-80 mb-3">
              Learning streak
            </p>

            <h2 className="text-5xl font-black">
              17
            </h2>

          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-400 text-white rounded-[30px] p-7 shadow-sm">

            <p className="opacity-80 mb-3">
              AI quizzes
            </p>

            <h2 className="text-5xl font-black">
              42
            </h2>

          </div>

          <div className="bg-white rounded-[30px] p-7 shadow-sm border border-zinc-100">

            <p className="text-zinc-500 mb-3">
              Accuracy
            </p>

            <h2 className="text-5xl font-black">
              92%
            </h2>

          </div>

        </div>

        {/* MAIN GRID */}
        <div className="grid lg:grid-cols-3 gap-8">

          {/* FLASHCARD */}
          <div className="lg:col-span-2 bg-white rounded-[40px] p-8 shadow-sm border border-zinc-100">

            <div className="flex items-center justify-between mb-8">

              <div>
                <p className="text-zinc-500 mb-2">
                  Flashcard of the day
                </p>

                <h2 className="text-5xl font-black">
                  dissemination
                </h2>
              </div>

              <div className="bg-blue-100 text-blue-700 px-5 py-3 rounded-2xl font-bold">
                C1
              </div>

            </div>

            <div className="bg-[#f3f7ff] rounded-[30px] p-10 mb-6">

              <p className="text-3xl font-bold mb-5">
                sự lan truyền
              </p>

              <p className="text-zinc-600 text-xl leading-relaxed">
                The dissemination of information is important
                in modern education systems.
              </p>

            </div>

            <div className="flex gap-5">

              <button className="bg-blue-600 hover:bg-blue-700 transition text-white px-7 py-4 rounded-2xl font-bold">
                Study now
              </button>

              <button className="bg-white border border-zinc-200 hover:bg-zinc-50 transition px-7 py-4 rounded-2xl font-bold">
                Generate AI Quiz
              </button>

            </div>

          </div>

          {/* RIGHT SIDE */}
          <div className="space-y-6">

            <div className="bg-white rounded-[30px] p-7 shadow-sm border border-zinc-100">

              <p className="text-zinc-500 mb-4">
                Today's progress
              </p>

              <div className="w-full h-4 bg-zinc-100 rounded-full overflow-hidden mb-4">

                <div className="w-[72%] h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" />

              </div>

              <p className="font-bold text-lg">
                72% completed
              </p>

            </div>

            <div className="bg-white rounded-[30px] p-7 shadow-sm border border-zinc-100">

              <p className="text-zinc-500 mb-5">
                Quick actions
              </p>

              <div className="grid grid-cols-2 gap-4">

                <button className="bg-[#f3f7ff] hover:bg-blue-100 transition rounded-2xl p-5 font-bold">
                  Add word
                </button>

                <button className="bg-[#f3f7ff] hover:bg-blue-100 transition rounded-2xl p-5 font-bold">
                  AI quiz
                </button>

                <button className="bg-[#f3f7ff] hover:bg-blue-100 transition rounded-2xl p-5 font-bold">
                  Flashcards
                </button>

                <button className="bg-[#f3f7ff] hover:bg-blue-100 transition rounded-2xl p-5 font-bold">
                  Progress
                </button>

              </div>

            </div>

          </div>

        </div>

      </section>

    </main>
  )
}