import type { MetadataRoute } from "next"

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://vocab.nsvd.io.vn"

const staticRoutes = [
  "",
  "/login",
  "/upgrade",
  "/community",
  "/document",
  "/documents",
  "/review",
  "/study",
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }))
}
