"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Check, Crown, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase"
import {
  SUBSCRIPTION_PLANS,
  formatPremiumExpiry,
  getEffectiveRole,
  type SubscriptionPlan,
} from "@/lib/subscription"

const planOrder: SubscriptionPlan[] = ["monthly", "quarterly", "yearly"]

type ProfileState = {
  role: string
  premium_expires_at: string | null
}

export default function UpgradePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [openingCheckout, setOpeningCheckout] = useState<SubscriptionPlan | null>(null)
  const [checkoutError, setCheckoutError] = useState("")
  const [profile, setProfile] = useState<ProfileState>({
    role: "MEMBER",
    premium_expires_at: null,
  })

  const paymentStatus = searchParams.get("status") || ""

  const effectiveRole = useMemo(
    () => getEffectiveRole(profile.role, profile.premium_expires_at),
    [profile.role, profile.premium_expires_at]
  )

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
        .select("role, premium_expires_at")
        .eq("id", user.id)
        .maybeSingle()

      setProfile({
        role: data?.role || "MEMBER",
        premium_expires_at: data?.premium_expires_at || null,
      })
      setLoading(false)
    }

    void loadRank()
  }, [router])

  const openPayosCheckout = async (plan: SubscriptionPlan) => {
    setOpeningCheckout(plan)
    setCheckoutError("")

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const response = await fetch("/api/payos/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: session?.user?.id,
        email: session?.user?.email,
        plan,
      }),
    })

    const payload = (await response.json().catch(() => null)) as
      | {
          checkoutUrl?: string
          error?: string
        }
      | null

    if (!response.ok || !payload?.checkoutUrl) {
      setCheckoutError(
        payload?.error || "Không tạo được link thanh toán PayOS."
      )
      setOpeningCheckout(null)
      return
    }

    window.location.href = payload.checkoutUrl
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
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
          Quay lại
        </button>

        <div className="rounded-[36px] bg-white p-8 shadow-[0_20px_80px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[#d27a38] text-white">
              <Crown className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">Nâng cấp</p>
              <h1 className="text-4xl font-black text-gray-950">
                Nâng cấp tài khoản
              </h1>
            </div>
          </div>

          {paymentStatus === "cancelled" ? (
            <div className="mt-6 rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-700">
              Thanh toán đã bị hủy. Bạn có thể thử lại bất cứ lúc nào.
            </div>
          ) : null}

          <div className="mt-8 rounded-[28px] bg-[#f5f9ff] p-6">
            <p className="text-sm font-bold text-gray-500">Danh hiệu hiện tại</p>
            <p className="mt-2 text-2xl font-black text-gray-950">
              {effectiveRole}
            </p>
            {profile.premium_expires_at ? (
              <p className="mt-2 text-sm font-semibold text-[#c96d35]">
                Hiệu lực đến {formatPremiumExpiry(profile.premium_expires_at)}
              </p>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[28px] border border-gray-100 bg-[#f5f9ff] p-6">
              <p className="text-sm font-bold text-gray-500">Quyền lợi Premium</p>
              <div className="mt-5 space-y-3 text-sm text-gray-700">
                {[
                  "Spaced repetition",
                  "Cloud sync",
                  "Unlimited sets",
                  "Advanced analytics",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-[#e6cfb7] bg-[linear-gradient(180deg,#fff9f1_0%,#fff1df_100%)] p-6 text-[#2b211b]">
              <p className="text-sm font-bold text-[#c96d35]">Thanh toán qua PayOS</p>
              <p className="mt-2 text-3xl font-black">Chọn gói Premium</p>
              <div className="mt-5 grid gap-3">
                {planOrder.map((plan) => {
                  const item = SUBSCRIPTION_PLANS[plan]

                  return (
                    <button
                      key={plan}
                      onClick={() => openPayosCheckout(plan)}
                      disabled={openingCheckout !== null}
                      className="flex items-center justify-between rounded-2xl border border-[#ebd6c3] bg-white px-4 py-4 text-left transition hover:border-[#d9a67e] hover:bg-[#fff8f1] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <div>
                        <p className="font-black text-[#241c17]">{item.label}</p>
                        <p className="mt-1 text-sm text-[#6f5b4b]">
                          Hiệu lực {item.durationMonths} tháng
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-right">
                        <span className="text-xl font-black text-[#d27a38]">
                          {(item.amount / 1000).toFixed(0)}k
                        </span>
                        <ExternalLink className="h-4 w-4 text-[#c96d35]" />
                      </div>
                    </button>
                  )
                })}
              </div>

              {checkoutError ? (
                <p className="mt-4 text-sm font-semibold text-red-600">
                  {checkoutError}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
