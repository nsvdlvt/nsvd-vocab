import { NextResponse } from "next/server"
import crypto from "node:crypto"
import {
  isSubscriptionPlan,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
} from "@/lib/subscription"

const PAYOS_API_URL = "https://api-merchant.payos.vn/v2/payment-requests"
const allowedHosts = new Set([
  "localhost:3000",
  "127.0.0.1:3000",
  "nsvd.io.vn",
  "vocab.nsvd.io.vn",
])

const buildOrderCode = () => {
  const timestamp = Date.now().toString().slice(-10)
  const random = Math.floor(Math.random() * 90 + 10).toString()
  return Number(`${timestamp}${random}`)
}

const createSignature = (input: {
  amount: number
  cancelUrl: string
  description: string
  orderCode: number
  returnUrl: string
}, checksumKey: string) => {
  const rawSignature = [
    `amount=${input.amount}`,
    `cancelUrl=${input.cancelUrl}`,
    `description=${input.description}`,
    `orderCode=${input.orderCode}`,
    `returnUrl=${input.returnUrl}`,
  ].join("&")

  return crypto
    .createHmac("sha256", checksumKey)
    .update(rawSignature)
    .digest("hex")
}

export async function POST(request: Request) {
  const clientId = process.env.PAYOS_CLIENT_ID?.trim()
  const apiKey = process.env.PAYOS_API_KEY?.trim()
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY?.trim()
  const envAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  const requestUrl = new URL(request.url)
  const originHeader =
    request.headers.get("origin") ||
    request.headers.get("referer") ||
    ""
  const headerUrl = originHeader ? new URL(originHeader) : null
  const candidateHost = headerUrl?.host || requestUrl.host
  const appUrl = allowedHosts.has(candidateHost)
    ? `${headerUrl?.protocol || requestUrl.protocol}//${candidateHost}`
    : envAppUrl

  if (!clientId || !apiKey || !checksumKey || !appUrl) {
    return NextResponse.json(
      {
        error:
          "Missing PayOS config. Please set PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY, and NEXT_PUBLIC_APP_URL.",
      },
      { status: 500 }
    )
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      userId?: string
      email?: string
      plan?: string
    }
    const requestedPlan = body.plan || ""
    const plan: SubscriptionPlan = isSubscriptionPlan(requestedPlan)
      ? requestedPlan
      : "monthly"
    const selectedPlan = SUBSCRIPTION_PLANS[plan]

    const orderCode = buildOrderCode()
    const description = `NSVD ${orderCode}`.slice(0, 25)
    const returnUrl = `${appUrl}/upgrade/success?status=success&orderCode=${orderCode}&plan=${plan}`
    const cancelUrl = `${appUrl}/upgrade?status=cancelled&orderCode=${orderCode}&plan=${plan}`
    const signature = createSignature(
      {
        amount: selectedPlan.amount,
        cancelUrl,
        description,
        orderCode,
        returnUrl,
      },
      checksumKey
    )

    const paymentBody = {
      orderCode,
      amount: selectedPlan.amount,
      description,
      returnUrl,
      cancelUrl,
      signature,
      buyerEmail: body.email || undefined,
      buyerName: body.userId ? `User ${body.userId.slice(0, 8)}` : "NSVD user",
      items: [
        {
          name: `NSVD ${selectedPlan.label}`,
          quantity: 1,
          price: selectedPlan.amount,
        },
      ],
    }

    const response = await fetch(PAYOS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": clientId,
        "x-api-key": apiKey,
      },
      body: JSON.stringify(paymentBody),
      cache: "no-store",
    })

    const payload = (await response.json().catch(() => null)) as
      | {
          data?: {
            checkoutUrl?: string
          }
          desc?: string
        }
      | null

    const checkoutUrl = payload?.data?.checkoutUrl

    if (!response.ok || !checkoutUrl) {
      console.error("PayOS create checkout failed:", {
        status: response.status,
        payload,
      })

      return NextResponse.json(
        {
          error:
            payload?.desc ||
            "Could not create a PayOS checkout link from the server.",
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ checkoutUrl })
  } catch (error) {
    console.error("PayOS checkout error:", error)

    return NextResponse.json(
      { error: "Unexpected error while creating PayOS checkout link." },
      { status: 500 }
    )
  }
}
