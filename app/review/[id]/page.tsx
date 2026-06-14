"use client"

import { use } from "react"
import ReviewSession from "@/components/review/review-session"

export default function ReviewPage({
  params,
}: {
  params: Promise<{
    id: string
  }>
}) {
  const { id } = use(params)

  return <ReviewSession setId={id} />
}
