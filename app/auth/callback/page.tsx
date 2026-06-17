"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

const getSafeRedirectPath = (value: string | null) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/home"
  }

  return value
}

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    let isActive = true

    const completeLogin = async () => {
      const nextPath = getSafeRedirectPath(searchParams.get("next"))
      const code = searchParams.get("code")

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          if (isActive) {
            router.replace(`/login?redirectTo=${encodeURIComponent(nextPath)}`)
          }
          return
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        if (isActive) {
          router.replace(nextPath)
        }
        return
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isActive || !session) {
          return
        }

        if (
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "INITIAL_SESSION"
        ) {
          subscription.unsubscribe()
          router.replace(nextPath)
        }
      })

      window.setTimeout(() => {
        subscription.unsubscribe()

        if (isActive) {
          router.replace(`/login?redirectTo=${encodeURIComponent(nextPath)}`)
        }
      }, 4000)
    }

    void completeLogin()

    return () => {
      isActive = false
    }
  }, [router, searchParams])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f9ff] px-5">
      <div className="rounded-[32px] border border-gray-100 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        <h1 className="mt-6 text-2xl font-black text-[#111827]">
          Đang hoàn tất đăng nhập
        </h1>
        <p className="mt-3 text-gray-500">
          Chờ chút, mình đang đưa bạn về trang trước đó.
        </p>
      </div>
    </main>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f5f9ff] px-5">
          <div className="rounded-[32px] border border-gray-100 bg-white p-8 text-center shadow-xl">
            <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
            <h1 className="mt-6 text-2xl font-black text-[#111827]">
              Đang hoàn tất đăng nhập
            </h1>
          </div>
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}
