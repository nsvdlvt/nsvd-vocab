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

export const metadata: Metadata = {
  title: "NSVD Vocab",
  description:
    "Learn vocabulary smarter with AI",
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