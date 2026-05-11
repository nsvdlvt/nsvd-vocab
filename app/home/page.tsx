"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function HomePage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState("")
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/")
        return
      }

      setUser(user)

      setUserName(
        user.user_metadata.full_name ||
          user.email ||
          "User"
      )

      setLoading(false)
    }

    checkUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f5f9ff]">
        <h1 className="text-3xl font-black">
          Loading...
        </h1>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f5f9ff] flex">
      {/* SIDEBAR */}
      <aside className="hidden lg:flex w-[280px] bg-white border-r border-gray-100 min-h-screen p-6 flex-col justify-between sticky top-0">
        <div>
          {/* LOGO */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400" />

            <div>
              <h1 className="text-2xl font-black">
                NSVD Vocab
              </h1>

              <p className="text-gray-500 text-sm">
                AI Vocabulary Platform
              </p>
            </div>
          </div>

          {/* MENU */}
          <div className="space-y-2">
            {[
              "Home",
              "Flashcards",
              "Learn",
              "Write",
              "Test",
              "AI Quiz",
              "Folders",
              "Progress",
              "Settings",
            ].map((item) => (
              <button
                key={item}
                className={`w-full text-left px-5 py-4 rounded-2xl font-bold transition ${
                  item === "Home"
                    ? "bg-blue-600 text-white"
                    : "hover:bg-[#f5f9ff] text-gray-600"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* PROFILE */}
        <div className="bg-[#f5f9ff] rounded-3xl p-5">
          <div className="flex items-center gap-4">
            <img
              src={
                user?.user_metadata?.avatar_url ||
                "https://ui-avatars.com/api/?name=User"
              }
              alt="avatar"
              className="w-16 h-16 rounded-2xl object-cover"
            />

            <div className="min-w-0">
              <p className="text-gray-500 text-sm">
                Logged in as
              </p>

              <h2 className="font-black text-xl truncate">
                {userName}
              </h2>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full mt-5 bg-red-500 hover:bg-red-600 transition text-white font-bold py-3 rounded-2xl"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 min-w-0">
        {/* MOBILE HEADER */}
        <header className="lg:hidden bg-white border-b border-gray-100 px-5 h-16 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400" />

            <h1 className="font-black text-xl">
              NSVD Vocab
            </h1>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-xl font-bold"
          >
            Logout
          </button>
        </header>

        {/* CONTENT */}
        <section className="p-5 md:p-8 pb-28 lg:pb-8">
          {/* TOP BAR */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-10">
            <div>
              <p className="text-gray-500 text-lg">
                Welcome back 👋
              </p>

              <h1 className="text-4xl md:text-5xl font-black mt-2 leading-tight">
                Continue your
                <br />
                vocabulary journey.
              </h1>
            </div>

            <div className="flex gap-3">
              <button className="bg-blue-600 hover:bg-blue-700 transition text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-blue-200">
                + New Set
              </button>

              <button className="bg-white border border-gray-200 hover:bg-gray-100 transition px-6 py-4 rounded-2xl font-bold">
                AI Quiz
              </button>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
            <div className="bg-white rounded-[32px] p-7 shadow-sm border border-gray-100">
              <p className="text-gray-500">
                Words learned
              </p>

              <h2 className="text-5xl font-black mt-4 text-blue-600">
                274
              </h2>
            </div>

            <div className="bg-orange-400 text-white rounded-[32px] p-7 shadow-sm">
              <p className="text-orange-100">
                Current streak
              </p>

              <h2 className="text-5xl font-black mt-4">
                17
              </h2>
            </div>

            <div className="bg-violet-500 text-white rounded-[32px] p-7 shadow-sm">
              <p className="text-violet-100">
                Retention rate
              </p>

              <h2 className="text-5xl font-black mt-4">
                92%
              </h2>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-cyan-400 text-white rounded-[32px] p-7 shadow-sm">
              <p className="text-blue-100">
                AI quizzes
              </p>

              <h2 className="text-5xl font-black mt-4">
                42
              </h2>
            </div>
          </div>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* LEFT */}
            <div className="xl:col-span-2 space-y-6">
              {/* FLASHCARD */}
              <div className="bg-white rounded-[40px] p-6 md:p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between gap-5 flex-wrap">
                  <div>
                    <p className="text-gray-400 text-sm">
                      Flashcard of the day
                    </p>

                    <h1 className="text-4xl md:text-5xl font-black mt-4 break-words">
                      dissemination
                    </h1>
                  </div>

                  <div className="bg-blue-100 text-blue-700 px-5 py-3 rounded-2xl font-black">
                    C1
                  </div>
                </div>

                <div className="mt-6 bg-[#f5f9ff] rounded-[32px] p-8">
                  <p className="text-2xl md:text-3xl font-black">
                    sự lan truyền
                  </p>

                  <p className="text-gray-600 mt-5 text-lg leading-relaxed">
                    The dissemination of fake news spreads rapidly online.
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <button className="bg-blue-600 hover:bg-blue-700 transition text-white rounded-2xl p-4 font-bold">
                    Study
                  </button>

                  <button className="bg-white border border-gray-200 hover:bg-gray-100 transition rounded-2xl p-4 font-bold">
                    AI Explain
                  </button>

                  <button className="bg-white border border-gray-200 hover:bg-gray-100 transition rounded-2xl p-4 font-bold">
                    Quiz
                  </button>

                  <button className="bg-white border border-gray-200 hover:bg-gray-100 transition rounded-2xl p-4 font-bold">
                    Save
                  </button>
                </div>
              </div>

              {/* RECENT SETS */}
              <div className="bg-white rounded-[40px] p-6 md:p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-black">
                    Recent Sets
                  </h2>

                  <Link
                    href="#"
                    className="text-blue-600 font-bold"
                  >
                    View all
                  </Link>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      title: "IELTS Vocabulary",
                      words: 124,
                    },
                    {
                      title: "Biology Terms",
                      words: 67,
                    },
                    {
                      title: "Daily English",
                      words: 89,
                    },
                  ].map((set) => (
                    <div
                      key={set.title}
                      className="bg-[#f5f9ff] hover:bg-blue-50 transition rounded-3xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-5"
                    >
                      <div>
                        <h3 className="text-2xl font-black">
                          {set.title}
                        </h3>

                        <p className="text-gray-500 mt-2">
                          {set.words} words
                        </p>
                      </div>

                      <button className="bg-white hover:bg-gray-100 transition border border-gray-200 px-6 py-3 rounded-2xl font-bold">
                        Open
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="space-y-6">
              {/* PROGRESS */}
              <div className="bg-white rounded-[40px] p-7 shadow-sm border border-gray-100">
                <h2 className="text-3xl font-black">
                  Today's Progress
                </h2>

                <div className="mt-8">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold">
                      72% completed
                    </p>

                    <p className="text-gray-500">
                      72/100 XP
                    </p>
                  </div>

                  <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div className="w-[72%] h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full" />
                  </div>
                </div>
              </div>

              {/* QUICK ACTIONS */}
              <div className="bg-white rounded-[40px] p-7 shadow-sm border border-gray-100">
                <h2 className="text-3xl font-black mb-8">
                  Quick Actions
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    "Add Word",
                    "Create Set",
                    "AI Quiz",
                    "Flashcards",
                    "Review",
                    "Progress",
                  ].map((item) => (
                    <button
                      key={item}
                      className="bg-[#f5f9ff] hover:bg-blue-100 transition rounded-2xl p-5 font-bold"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* DAILY GOAL */}
              <div className="bg-gradient-to-br from-blue-600 to-cyan-400 text-white rounded-[40px] p-7 shadow-xl shadow-blue-200">
                <p className="text-blue-100">
                  Daily Goal
                </p>

                <h2 className="text-5xl font-black mt-4">
                  100 XP
                </h2>

                <p className="mt-5 text-lg text-blue-100 leading-relaxed">
                  Keep your streak alive by reviewing your flashcards today.
                </p>

                <button className="mt-8 bg-white text-blue-700 hover:bg-blue-50 transition font-black px-6 py-4 rounded-2xl">
                  Continue Learning
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* MOBILE NAV */}
        <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 grid grid-cols-5 z-50">
          {[
            "Home",
            "Study",
            "AI",
            "Progress",
            "Profile",
          ].map((item) => (
            <button
              key={item}
              className="py-4 text-sm font-bold text-gray-600 hover:text-blue-600 transition"
            >
              {item}
            </button>
          ))}
        </nav>
      </div>
    </main>
  )
}