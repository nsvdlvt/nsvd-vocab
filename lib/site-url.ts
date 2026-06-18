const DEFAULT_SITE_URL = "https://nsvd.io.vn"

const normalizeUrl = (value: string | undefined | null) => {
  const trimmed = value?.trim()

  if (!trimmed) {
    return null
  }

  try {
    return new URL(trimmed).toString().replace(/\/$/, "")
  } catch {
    return null
  }
}

export const getDefaultSiteUrl = () =>
  normalizeUrl(process.env.NEXT_PUBLIC_APP_URL) || DEFAULT_SITE_URL

export const getSiteUrlFromHost = (
  host: string | null | undefined,
  protocol?: string | null
) => {
  if (!host) {
    return getDefaultSiteUrl()
  }

  const normalizedProtocol =
    protocol === "http" || protocol === "https"
      ? protocol
      : host.startsWith("localhost") || host.startsWith("127.0.0.1")
        ? "http"
        : "https"

  return `${normalizedProtocol}://${host}`
}
