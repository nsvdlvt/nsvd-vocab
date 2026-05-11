"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  return (
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
          <button
            onClick={() => router.push("/new")}
            className="bg-blue-600 hover:bg-blue-700 transition text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-blue-200"
          >
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
  )
}