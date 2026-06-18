import type { MetadataRoute } from "next"
import { getDefaultSiteUrl } from "@/lib/site-url"

const siteUrl = getDefaultSiteUrl()

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
