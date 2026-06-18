import type { Metadata } from "next"
import { Be_Vietnam_Pro } from "next/font/google"
import "./globals.css"
import { Toaster } from "react-hot-toast"

const font = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: [
    "400",
    "500",
    "600",
    "700",
    "800",
    "900",
  ],
})

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://vocab.nsvd.io.vn"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NSVD Vocab | Học từ vựng tiếng Anh thông minh",
    template: "%s | NSVD Vocab",
  },
  description:
    "NSVD Vocab giúp bạn học từ vựng tiếng Anh bằng flashcard, quiz, spaced repetition và AI để nhớ lâu hơn, học có lộ trình hơn.",
  keywords: [
    "học từ vựng tiếng Anh",
    "flashcard tiếng Anh",
    "spaced repetition",
    "quiz từ vựng",
    "ứng dụng học tiếng Anh",
    "NSVD Vocab",
  ],
  applicationName: "NSVD Vocab",
  authors: [{ name: "NSVD Vocab" }],
  creator: "NSVD Vocab",
  publisher: "NSVD Vocab",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: siteUrl,
    siteName: "NSVD Vocab",
    title: "NSVD Vocab | Học từ vựng tiếng Anh thông minh",
    description:
      "Học từ vựng tiếng Anh bằng flashcard, quiz, spaced repetition và AI trong một lộ trình rõ ràng.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "NSVD Vocab",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NSVD Vocab | Học từ vựng tiếng Anh thông minh",
    description:
      "Học từ vựng bằng flashcard, quiz, spaced repetition và AI để nhớ lâu hơn.",
    images: ["/logo.png"],
  },
  category: "education",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi">
      <body className={font.className}>
        {children}

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: "20px",
              padding: "16px",
              fontWeight: "700",
            },
          }}
        />
      </body>
    </html>
  )
}
