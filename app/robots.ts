import type { MetadataRoute } from "next"
import { getDefaultSiteUrl } from "@/lib/site-url"

const siteUrl = getDefaultSiteUrl()

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
