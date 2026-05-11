"use client"

import { supabase } from "../lib/supabase"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {

  const router = useRouter()

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        router.push("/home")
      }
    }

    checkUser()
  }, [])

  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    })
  }

  return (
    <main className="min-h-screen bg-[#f3f7ff] text-zinc-900">

      {/* NAVBAR */}
      <nav className="w-full border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400" />

            <div>
              <p className="font-bold text-2xl">
                NSVD Vocab
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-10">

            <button className="relative text-zinc-500 hover:text-zinc-800 transition font-semibold pb-2 after:absolute after:left-0 after:bottom-0 after:h-[3px] after:w-0 hover:after:w-full after:bg-blue-500 after:transition-all">
              Tính năng
            </button>

            <button className="relative text-zinc-500 hover:text-zinc-800 transition font-semibold pb-2 after:absolute after:left-0 after:bottom-0 after:h-[3px] after:w-0 hover:after:w-full after:bg-blue-500 after:transition-all">
              Cách học
            </button>

            <button className="relative text-zinc-500 hover:text-zinc-800 transition font-semibold pb-2 after:absolute after:left-0 after:bottom-0 after:h-[3px] after:w-0 hover:after:w-full after:bg-blue-500 after:transition-all">
              Đánh giá
            </button>

            <button className="relative text-zinc-500 hover:text-zinc-800 transition font-semibold pb-2 after:absolute after:left-0 after:bottom-0 after:h-[3px] after:w-[0px] hover:after:w-full after:bg-blue-500 after:transition-all">
              FAQ
            </button>

          </div>

          <div className="flex items-center gap-4">

            <button
              onClick={() => router.push("/login")}
              className="font-semibold"
            >
              Đăng nhập
            </button>

            <button
              onClick={loginWithGoogle}
              className="bg-blue-600 hover:bg-blue-700 transition text-white px-6 py-3 rounded-2xl font-semibold shadow-lg"
            >
              Bắt đầu miễn phí →
            </button>

          </div>

        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center">

        {/* LEFT */}
        <div>

          <h1 className="text-6xl lg:text-7xl font-black leading-tight mb-8">
            Học từ vựng có lộ trình,
            <br />

            <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">
              nhớ lâu và quay lại đều hơn
            </span>
          </h1>

          <p className="text-2xl text-zinc-600 leading-relaxed mb-10">
            Học flashcard, luyện bằng AI, nhắc ôn bằng SRS
            và theo dõi tiến trình học trong một nơi duy nhất.
          </p>

          <div className="flex gap-5 mb-14">

            <button
              onClick={loginWithGoogle}
              className="bg-blue-600 hover:bg-blue-700 transition text-white px-8 py-5 rounded-3xl text-lg font-bold shadow-xl"
            >
              Bắt đầu học miễn phí →
            </button>

            <button className="bg-white border border-zinc-200 hover:bg-zinc-50 transition px-8 py-5 rounded-3xl text-lg font-semibold">
              Xem demo
            </button>

          </div>

          {/* STATS */}
          <div className="grid grid-cols-3 gap-5">

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100">

              <p className="text-4xl font-black mb-2">
                100K+
              </p>

              <p className="text-zinc-500">
                từ vựng
              </p>

            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100">

              <p className="text-4xl font-black mb-2">
                AI
              </p>

              <p className="text-zinc-500">
                tạo ví dụ
              </p>

            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100">

              <p className="text-4xl font-black mb-2">
                SRS
              </p>

              <p className="text-zinc-500">
                nhắc ôn thông minh
              </p>

            </div>

          </div>

        </div>

        {/* RIGHT */}
        <div className="relative">

          <div className="absolute -top-10 -left-10 bg-white rounded-3xl shadow-xl px-6 py-4 z-20">

            <p className="font-black text-2xl">
              100.000+
            </p>

            <p className="text-zinc-500">
              người học
            </p>

          </div>

          <div className="bg-white border border-zinc-200 rounded-[40px] p-8 shadow-2xl">

            <div className="bg-gradient-to-br from-blue-100 to-cyan-50 rounded-[30px] p-8 min-h-[500px] flex flex-col justify-between">

              <div className="grid grid-cols-2 gap-5">

                <div className="bg-white rounded-3xl p-5 shadow-sm">

                  <p className="text-zinc-500 mb-2">
                    Hôm nay
                  </p>

                  <p className="text-5xl font-black">
                    77
                  </p>

                </div>

                <div className="bg-orange-400 text-white rounded-3xl p-5 shadow-sm">

                  <p className="mb-2 opacity-80">
                    Chuỗi học
                  </p>

                  <p className="text-5xl font-black">
                    17
                  </p>

                </div>

              </div>

              <div className="bg-white rounded-[30px] p-8 shadow-sm">

                <p className="text-zinc-500 mb-3">
                  Flashcard
                </p>

                <h2 className="text-5xl font-black mb-4">
                  dissemination
                </h2>

                <p className="text-2xl text-zinc-600">
                  sự lan truyền
                </p>

              </div>

              <div className="grid grid-cols-3 gap-4">

                <div className="bg-white rounded-2xl p-4 text-center font-bold">
                  AI
                </div>

                <div className="bg-white rounded-2xl p-4 text-center font-bold">
                  Quiz
                </div>

                <div className="bg-white rounded-2xl p-4 text-center font-bold">
                  SRS
                </div>

              </div>

            </div>

          </div>

          <div className="absolute -bottom-8 right-0 bg-white rounded-3xl shadow-xl px-6 py-4">

            <p className="font-black text-xl">
              AI + SRS
            </p>

            <p className="text-zinc-500">
              học không rời rạc
            </p>

          </div>

        </div>

      </section>

    </main>
  )
}