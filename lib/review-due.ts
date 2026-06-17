import {
  FLUENT_LEVEL,
  MASTERED_LEVEL,
  PROFICIENT_LEVEL,
  SRS_REVIEW_LEVEL,
} from "@/lib/spaced-repetition"
import { parseSupabaseTimestamp } from "@/lib/time"

export const startOfDay = (date: Date) => {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

export type ReviewDueInput = {
  repetitions?: number | null
  review_at?: string | null
  last_reviewed_at?: string | null
  mastered_at?: string | null
  proficient_at?: string | null
  fluent_at?: string | null
  level_changed_at?: string | null
}

const parseDateOnly = (value: string) =>
  startOfDay(parseSupabaseTimestamp(value) || new Date(value))

const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const getReferenceDate = (row: ReviewDueInput, baseDate: Date) => {
  const candidates = [
    startOfDay(baseDate),
    row.last_reviewed_at ? parseDateOnly(row.last_reviewed_at) : null,
  ].filter(Boolean) as Date[]

  return candidates.reduce((latest, date) => (date > latest ? date : latest))
}

const getLevelAnchor = (row: ReviewDueInput) => {
  const level = row.repetitions ?? 0

  if (level >= FLUENT_LEVEL) {
    return row.fluent_at || row.level_changed_at || row.review_at
  }

  if (level >= PROFICIENT_LEVEL) {
    return row.proficient_at || row.level_changed_at || row.review_at
  }

  if (level >= MASTERED_LEVEL) {
    return row.mastered_at || row.level_changed_at || row.review_at
  }

  if (level >= SRS_REVIEW_LEVEL) {
    return row.level_changed_at || row.last_reviewed_at || row.review_at
  }

  return null
}

const getSrsIntervalDays = (level: number) => {
  if (level >= PROFICIENT_LEVEL) {
    return 7
  }

  if (level >= SRS_REVIEW_LEVEL) {
    return 3
  }

  return 0
}

export const getEffectiveReviewDate = (
  input: ReviewDueInput | string | null | undefined,
  baseDate = new Date()
) => {
  const row =
    typeof input === "string" || input === null || input === undefined
      ? { review_at: input }
      : input
  const today = getReferenceDate(row, baseDate)
  const level = row.repetitions ?? 0
  const anchor = getLevelAnchor(row)
  const explicitReviewDate = row.review_at ? parseDateOnly(row.review_at) : null

  if (explicitReviewDate) {
    return explicitReviewDate < today ? today : explicitReviewDate
  }

  if (level >= SRS_REVIEW_LEVEL && anchor) {
    const dueDate = startOfDay(addDays(parseDateOnly(anchor), getSrsIntervalDays(level)))
    return dueDate < today ? today : dueDate
  }

  const reviewDate = today
  return reviewDate < today ? today : reviewDate
}

export const isDueForReviewToday = (
  input: ReviewDueInput | string | null | undefined,
  baseDate = new Date()
) => {
  const today = startOfDay(baseDate)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  return getEffectiveReviewDate(input, baseDate) < tomorrow
}
