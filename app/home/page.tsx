"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function HomePage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState("")

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/")
        return
      }

      setUserName(
        user.user_metadata.full_name ||
          user.email ||
          "Người dùng"
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
      <main className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold">Loading...</h1>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f5f9ff]">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400" />

            <h1 className="font-black text-xl">NSVD Vocab</h1>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 transition text-white px-5 py-2 rounded-xl font-bold"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-10">
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <h1 className="text-4xl font-black">
            Xin chào, {userName} 👋
          </h1>

          <p className="text-gray-500 mt-4 text-lg">
            Chào mừng quay trở lại với NSVD Vocab.
          </p>

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
            <div className="bg-[#f5f9ff] rounded-3xl p-6">
              <h2 className="text-5xl font-black text-blue-600">77</h2>

              <p className="text-gray-500 mt-3">
                từ đã học hôm nay
              </p>
            </div>

            <div className="bg-orange-400 text-white rounded-3xl p-6">
              <h2 className="text-5xl font-black">17</h2>

              <p className="text-orange-100 mt-3">
                ngày streak
              </p>
            </div>

            <div className="bg-violet-500 text-white rounded-3xl p-6">
              <h2 className="text-5xl font-black">92%</h2>

              <p className="text-violet-100 mt-3">
                độ ghi nhớ
              </p>
            </div>
          </div>

          {/* FLASHCARD */}
          <div className="mt-10 bg-gray-50 rounded-[32px] p-8 border border-gray-100">
            <p className="text-gray-400 text-sm">Flashcard hôm nay</p>

            <h1 className="text-5xl font-black mt-4">
              dissemination
            </h1>

            <p className="text-xl text-gray-600 mt-4">
              sự lan truyền
            </p>

            <div className="grid grid-cols-3 gap-3 mt-8">
              <button className="bg-white hover:bg-blue-50 transition rounded-2xl p-4 font-bold border border-gray-100">
                AI
              </button>

              <button className="bg-white hover:bg-blue-50 transition rounded-2xl p-4 font-bold border border-gray-100">
                Quiz
              </button>

              <button className="bg-white hover:bg-blue-50 transition rounded-2xl p-4 font-bold border border-gray-100">
                SRS
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}