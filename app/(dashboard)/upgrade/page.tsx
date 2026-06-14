"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Crown, Check } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function UpgradePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [currentRank, setCurrentRank] = useState("MEMBER")

  useEffect(() => {
    const loadRank = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const user = session?.user
      if (!user) {
        const redirectTo = `${window.location.pathname}${window.location.search}`
        router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`)
        return
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

      setCurrentRank(data?.role || "MEMBER")
      setLoading(false)
    }

    loadRank()
  }, [router])

  const handleUpgrade = async () => {
    setUpgrading(true)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const user = session?.user
    if (!user) {
      const redirectTo = `${window.location.pathname}${window.location.search}`
      router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`)
      return
    }

    const nextRole = "PREMIUM"

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email,
        role: nextRole,
      })

    if (!error) {
      setCurrentRank(nextRole)

      await supabase.auth.updateUser({
        data: {
          ...(user.user_metadata || {}),
          role: nextRole,
        },
      })
    }

    setUpgrading(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f9ff]">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    )
  }

  return (
    <section className="min-h-screen bg-[#f5f9ff] p-5 md:p-10">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
          Quay lại
        </button>

        <div className="rounded-[36px] bg-white p-8 shadow-[0_20px_80px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-600 text-white">
              <Crown className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">Upgrade</p>
              <h1 className="text-4xl font-black text-gray-950">
                Nâng cấp tài khoản
              </h1>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] bg-[#f5f9ff] p-6">
            <p className="text-sm font-bold text-gray-500">Hạng hiện tại</p>
            <p className="mt-2 text-2xl font-black text-gray-950">
              {currentRank}
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[28px] border border-gray-100 bg-[#f5f9ff] p-6">
              <p className="text-sm font-bold text-gray-500">PREMIUM</p>
              <p className="mt-2 text-4xl font-black text-blue-600">49k/tháng</p>
              <div className="mt-5 space-y-3 text-sm text-gray-700">
                {["Spaced repetition", "Cloud sync", "Unlimited sets"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-blue-100 bg-gradient-to-b from-blue-600 to-purple-600 p-6 text-white">
              <p className="text-sm font-bold text-blue-100">Kích hoạt ngay</p>
              <p className="mt-2 text-3xl font-black">Mở Premium cho tài khoản</p>
              <p className="mt-4 text-sm text-blue-100">
                Đây là upgrade nội bộ: bấm là cập nhật `profiles.role` sang PREMIUM.
              </p>
              <button
                onClick={handleUpgrade}
                disabled={upgrading || currentRank === "PREMIUM"}
                className="mt-6 w-full rounded-2xl bg-white px-4 py-4 font-black text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:bg-gray-200"
              >
                {currentRank === "PREMIUM"
                  ? "Đã là PREMIUM"
                  : upgrading
                  ? "Đang nâng cấp..."
                  : "Nâng cấp ngay"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
