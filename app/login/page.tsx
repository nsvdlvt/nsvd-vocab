"use client"

import { supabase } from "../../lib/supabase"

export default function LoginPage() {

  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    })
  }

  return (
    <main className="min-h-screen bg-[#f4f7ff] flex items-center justify-center px-6">

      <div className="w-full max-w-6xl grid lg:grid-cols-2 bg-white rounded-[40px] overflow-hidden shadow-2xl">

        {/* LEFT */}
        <div className="bg-gradient-to-br from-blue-600 via-cyan-500 to-emerald-400 p-14 text-white flex flex-col justify-between">

          <div>
            <p className="text-2xl font-black mb-10">
              NSVD Vocab
            </p>

            <h1 className="text-6xl font-black leading-tight mb-8">
              Learn smarter with AI
            </h1>

            <p className="text-xl text-white/80 leading-relaxed">
              Flashcards, AI explanations, quizzes,
              SRS reminders and progress tracking —
              all in one place.
            </p>
          </div>

          <div className="flex gap-5">

            <div className="bg-white/20 backdrop-blur rounded-3xl px-6 py-5">
              <p className="text-4xl font-black">
                100K+
              </p>

              <p className="text-white/70">
                vocabulary
              </p>
            </div>

            <div className="bg-white/20 backdrop-blur rounded-3xl px-6 py-5">
              <p className="text-4xl font-black">
                AI
              </p>

              <p className="text-white/70">
                generated learning
              </p>
            </div>

          </div>
        </div>

        {/* RIGHT */}
        <div className="p-14 flex flex-col justify-center">

          <div className="max-w-md w-full mx-auto">

            <p className="text-blue-600 font-bold mb-3">
              Welcome back 👋
            </p>

            <h2 className="text-5xl font-black text-zinc-900 mb-5">
              Sign in
            </h2>

            <p className="text-zinc-500 text-lg mb-10">
              Continue learning your vocabulary journey.
            </p>

            <button
              onClick={loginWithGoogle}
              className="w-full bg-zinc-900 hover:bg-black transition text-white rounded-2xl py-5 text-lg font-bold flex items-center justify-center gap-4 shadow-xl"
            >

              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="26"
                height="26"
                viewBox="0 0 48 48"
              >
                <path
                  fill="#FFC107"
                  d="M43.611 20.083H42V20H24v8h11.303C33.655 32.657 29.195 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.27 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                />

                <path
                  fill="#FF3D00"
                  d="M6.306 14.691l6.571 4.819C14.655 16.108 19.008 13 24 13c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.27 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                />

                <path
                  fill="#4CAF50"
                  d="M24 44c5.117 0 9.799-1.957 13.355-5.145l-6.166-5.215C29.135 35.091 26.715 36 24 36c-5.176 0-9.624-3.316-11.083-7.946l-6.522 5.025C9.72 39.556 16.365 44 24 44z"
                />

                <path
                  fill="#1976D2"
                  d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.114 5.64.001-.001 6.166 5.215 6.166 5.215C36.917 39.169 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                />
              </svg>

              Continue with Google
            </button>

            <p className="text-center text-zinc-400 mt-8">
              By continuing, you agree to our Terms & Privacy Policy.
            </p>

          </div>

        </div>

      </div>

    </main>
  )
}