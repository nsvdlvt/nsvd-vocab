import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  SUBSCRIPTION_PLANS,
  addMonths,
  isSubscriptionPlan,
  type SubscriptionPlan,
} from "@/lib/subscription"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Thiếu cấu hình Supabase trên server." },
      { status: 500 }
    )
  }

  try {
    const body = (await request.json()) as {
      accessToken?: string
      plan?: string
    }

    if (!body.accessToken) {
      return NextResponse.json(
        { error: "Thiếu access token để xác thực người dùng." },
        { status: 400 }
      )
    }

    const requestedPlan = body.plan || ""
    const plan: SubscriptionPlan | null = isSubscriptionPlan(requestedPlan)
      ? requestedPlan
      : null
    if (!plan) {
      return NextResponse.json(
        { error: "Thiếu hoặc sai gói thanh toán." },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${body.accessToken}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: authError?.message || "Không xác thực được người dùng." },
        { status: 401 }
      )
    }

    const { data: currentProfile, error: loadError } = await supabase
      .from("profiles")
      .select("role, premium_expires_at")
      .eq("id", user.id)
      .maybeSingle()

    if (loadError) {
      return NextResponse.json(
        { error: `Không đọc được hồ sơ thành viên: ${loadError.message}` },
        { status: 500 }
      )
    }

    const now = new Date()
    const currentExpiry = currentProfile?.premium_expires_at
      ? new Date(currentProfile.premium_expires_at)
      : null
    const baseDate =
      currentExpiry && currentExpiry.getTime() > now.getTime()
        ? currentExpiry
        : now
    const nextExpiry = addMonths(
      baseDate,
      SUBSCRIPTION_PLANS[plan].durationMonths
    )
    const nextRole =
      (currentProfile?.role || "MEMBER").toUpperCase() === "ADMIN"
        ? "ADMIN"
        : "PREMIUM"

    const { error: updateError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email,
        role: nextRole,
        premium_expires_at: nextExpiry.toISOString(),
      })

    if (updateError) {
      return NextResponse.json(
        {
          error: `Cập nhật Supabase thất bại: ${updateError.message}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      role: nextRole,
      premiumExpiresAt: nextExpiry.toISOString(),
    })
  } catch (error) {
    console.error("PayOS activate error:", error)
    return NextResponse.json(
      { error: "Lỗi không mong muốn khi kích hoạt Premium." },
      { status: 500 }
    )
  }
}
