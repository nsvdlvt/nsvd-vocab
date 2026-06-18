import { notFound } from "next/navigation"
import SuccessClient from "./success-client"
import { isSubscriptionPlan } from "@/lib/subscription"

export default async function UpgradeSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string
    plan?: string
    orderCode?: string
  }>
}) {
  const params = await searchParams
  const plan = params.plan || ""
  const orderCode = params.orderCode || ""

  if (!isSubscriptionPlan(plan) || !orderCode.trim()) {
    notFound()
  }

  return <SuccessClient plan={plan} orderCode={orderCode} />
}
