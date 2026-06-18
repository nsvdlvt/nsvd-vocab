"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, Crown, Home, Sparkles } from "lucide-react"
import { supabase } from "@/lib/supabase"
import {
  SUBSCRIPTION_PLANS,
  formatPremiumExpiry,
  getEffectiveRole,
  type SubscriptionPlan,
} from "@/lib/subscription"

type ActivationState = "loading" | "success" | "error"

const premiumBenefits = [
  "Ôn tập bằng spaced repetition thông minh",
  "Đồng bộ dữ liệu học tập trên cloud",
  "Tạo và lưu bộ từ không giới hạn",
  "Phân tích tiến độ học nâng cao",
]

export default function SuccessClient({
  plan,
  orderCode,
}: {
  plan: SubscriptionPlan
  orderCode: string
}) {
  const router = useRouter()
  const [state, setState] = useState<ActivationState>("loading")
  const [message, setMessage] = useState("")
  const [effectiveRole, setEffectiveRole] = useState("MEMBER")
  const [premiumExpiresAt, setPremiumExpiresAt] = useState<string | null>(null)

  const planLabel = SUBSCRIPTION_PLANS[plan].label

  useEffect(() => {
    const activateSubscription = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const user = session?.user
      if (!user) {
        router.push("/login?redirectTo=/upgrade/success")
        return
      }

      const successKey = `payos-upgrade-success:${orderCode}:${plan}`
      if (typeof window !== "undefined" && window.sessionStorage.getItem(successKey)) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, premium_expires_at")
          .eq("id", user.id)
          .maybeSingle()

        const nextEffectiveRole = getEffectiveRole(
          profile?.role,
          profile?.premium_expires_at
        )
        setEffectiveRole(nextEffectiveRole)
        setPremiumExpiresAt(profile?.premium_expires_at || null)
        setState("success")
        setMessage(
          `Thanh toán thành công gói ${planLabel}. Premium hiệu lực đến ${formatPremiumExpiry(
            profile?.premium_expires_at
          )}.`
        )
        return
      }

      const {
        data: { session: refreshedSession },
      } = await supabase.auth.getSession()

      const accessToken = refreshedSession?.access_token
      if (!accessToken) {
        setState("error")
        setMessage("Thiếu phiên đăng nhập để kích hoạt Premium.")
        return
      }

      const response = await fetch("/api/payos/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          plan,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | {
            role?: string
            premiumExpiresAt?: string
            error?: string
          }
        | null

      if (!response.ok || !payload?.premiumExpiresAt) {
        setState("error")
        setMessage(
          payload?.error ||
            "Thanh toán đã xong nhưng không cập nhật được danh hiệu Premium."
        )
        return
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(successKey, "1")
      }

      setEffectiveRole(
        getEffectiveRole(payload.role, payload.premiumExpiresAt)
      )
      setPremiumExpiresAt(payload.premiumExpiresAt)
      setState("success")
      setMessage(
        `Thanh toán thành công gói ${planLabel}. Premium hiệu lực đến ${formatPremiumExpiry(
          payload.premiumExpiresAt
        )}.`
      )
    }

    void activateSubscription()
  }, [orderCode, plan, planLabel, router])

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#fff8f0_0%,#f5f9ff_100%)] p-5 md:p-10">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[36px] border border-[#ead8c4] bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-[linear-gradient(135deg,#d27a38_0%,#f0be64_100%)] text-white shadow-[0_18px_40px_rgba(210,122,56,0.28)]">
            {state === "success" ? (
              <Check className="h-10 w-10" />
            ) : (
              <Crown className="h-10 w-10" />
            )}
          </div>

          <div className="mt-8 text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#ecd9c5] bg-[#fff8f1] px-4 py-2 text-sm font-bold text-[#c96d35]">
              <Sparkles className="h-4 w-4" />
              Thành viên Premium
            </p>

            <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] text-[#211914] md:text-6xl">
              {state === "loading"
                ? "Đang kích hoạt gói của bạn"
                : state === "success"
                ? "Thanh toán thành công"
                : "Đã thanh toán nhưng còn một bước lỗi"}
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[#66584b]">
              {state === "loading"
                ? "Hệ thống đang xác nhận gói Premium và cập nhật thời hạn cho tài khoản của bạn."
                : message}
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-[28px] border border-[#ead8c4] bg-[#fffaf4] p-6">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#9a6d48]">
                Gói đã thanh toán
              </p>
              <p className="mt-3 text-3xl font-black text-[#241c17]">
                {planLabel}
              </p>
              {premiumExpiresAt ? (
                <p className="mt-3 text-base font-semibold text-[#c96d35]">
                  Hiệu lực đến {formatPremiumExpiry(premiumExpiresAt)}
                </p>
              ) : null}
              <p className="mt-2 text-sm text-[#6f5b4b]">
                Danh hiệu hiện tại: {effectiveRole}
              </p>
            </div>

            <div className="rounded-[28px] border border-[#ead8c4] bg-[#fffaf4] p-6">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#9a6d48]">
                Quyền lợi gói VIP
              </p>
              <div className="mt-4 space-y-3">
                {premiumBenefits.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#2f7a55]" />
                    <span className="text-sm font-medium text-[#3f342c]">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href="/home"
              className="inline-flex items-center gap-2 rounded-full bg-[#d96d32] px-8 py-4 text-base font-black text-white shadow-[0_18px_40px_rgba(217,109,50,0.28)] transition hover:bg-[#c45f29]"
            >
              <Home className="h-4 w-4" />
              Khám phá ngay
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
