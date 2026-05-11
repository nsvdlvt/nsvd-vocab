"use client"

import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const handleGoogleLogin = async () => {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo:
        window.location.origin + "/home",
    },
  })
  }

  return (
    <main className="min-h-screen bg-[#f5f9ff] flex items-center justify-center px-5">
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-xl border border-gray-100 p-8">
        {/* LOGO */}
        <div className="flex flex-col items-center">
          <img
            src="/logo.png"
            alt="logo"
            className="w-12 h-12 rounded-2xl object-cover"
          />

          <h1 className="text-3xl font-black mt-5">NSVD Vocab</h1>

          <p className="text-gray-500 mt-3 text-center">
            Đăng nhập để tiếp tục học từ vựng
          </p>
        </div>

        {/* BUTTON */}
        <button
          onClick={handleGoogleLogin}
          className="w-full mt-10 bg-blue-600 hover:bg-blue-700 transition text-white font-bold py-4 rounded-2xl text-lg shadow-lg shadow-blue-200"
        >
          Đăng nhập với Google
        </button>

        <p className="text-center text-gray-400 text-sm mt-6">
          Học từ vựng thông minh bằng hệ thống AI 🚀
        </p>
      </div>
    </main>
  )
}