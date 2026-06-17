const SQL_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/

const padMilliseconds = (value: string) => {
  if (!value.includes(".")) {
    return `${value}.000`
  }

  const [whole, fraction] = value.split(".")
  return `${whole}.${fraction.padEnd(3, "0").slice(0, 3)}`
}

export const parseSupabaseTimestamp = (value?: string | null) => {
  if (!value) return null

  const normalized = value.trim()
  if (!normalized) return null

  if (SQL_TIMESTAMP_PATTERN.test(normalized)) {
    const [datePart, timePart] = normalized.split(/[ T]/)
    const [year, month, day] = datePart.split("-").map(Number)
    const [hours, minutes, secondsWithFraction] = padMilliseconds(timePart).split(":")
    const [seconds, milliseconds] = secondsWithFraction.split(".")

    return new Date(
      year,
      month - 1,
      day,
      Number(hours),
      Number(minutes),
      Number(seconds),
      Number(milliseconds)
    )
  }

  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const getLatestTimestamp = (...values: (string | null | undefined)[]) => {
  const latest = values
    .map((value) => parseSupabaseTimestamp(value)?.getTime() ?? Number.NaN)
    .filter((value) => !Number.isNaN(value))
    .sort((a, b) => b - a)[0]

  return typeof latest === "number" ? new Date(latest).toISOString() : null
}

export const formatRelativeStudyTime = (value?: string | null) => {
  const date = parseSupabaseTimestamp(value)

  if (!date) return "Chưa học"

  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000))
  if (diffMinutes < 1) return "Vừa xong"
  if (diffMinutes < 60) return `${diffMinutes} phút trước`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays} ngày trước`

  return date.toLocaleDateString("vi-VN")
}

export const toUtcIsoString = (value = new Date()) => value.toISOString()
