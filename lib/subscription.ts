export type SubscriptionPlan = "monthly" | "quarterly" | "yearly"
export type AppRole = "ADMIN" | "PREMIUM" | "MEMBER" | string

export const SUBSCRIPTION_PLANS: Record<
  SubscriptionPlan,
  {
    label: string
    amount: number
    durationMonths: number
  }
> = {
  monthly: {
    label: "1 tháng",
    amount: 49000,
    durationMonths: 1,
  },
  quarterly: {
    label: "3 tháng",
    amount: 130000,
    durationMonths: 3,
  },
  yearly: {
    label: "1 năm",
    amount: 500000,
    durationMonths: 12,
  },
}

export const isSubscriptionPlan = (value: string): value is SubscriptionPlan =>
  value === "monthly" || value === "quarterly" || value === "yearly"

export const addMonths = (date: Date, months: number) => {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

export const getEffectiveRole = (
  role?: string | null,
  premiumExpiresAt?: string | null
) => {
  const normalized = (role || "MEMBER").toUpperCase()

  if (normalized === "ADMIN") {
    return "ADMIN"
  }

  if (normalized === "PREMIUM" && premiumExpiresAt) {
    return new Date(premiumExpiresAt).getTime() > Date.now()
      ? "PREMIUM"
      : "MEMBER"
  }

  return normalized === "PREMIUM" ? "PREMIUM" : "MEMBER"
}

export const formatPremiumExpiry = (value?: string | null) => {
  if (!value) return ""
  return new Date(value).toLocaleDateString("vi-VN")
}
