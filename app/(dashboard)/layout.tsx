"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState("")
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/")
        return
      }

      setUser(user)

      setUserName(
        user.user_metadata.full_name ||
          user.email ||
          "User"
      )

      setLoading(false)
    }

    checkUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f5f9ff]">
        <h1 className="text-3xl font-black">
          Loading...
        </h1>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f5f9ff] flex">
      <>
        {/* OVERLAY */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          />
        )}

        {/* SIDEBAR */}
        <aside
          className={`
            fixed top-0 left-0 z-50
            w-[280px] bg-white border-r border-gray-100
            min-h-screen p-6 flex flex-col justify-between
            transition-all duration-300

            ${
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full"
            }

            lg:translate-x-0 lg:flex
          `}
        >
          <div>
            {/* TOP */}
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="logo"
                  className="w-12 h-12 rounded-2xl object-cover"
                />

                <div>
                  <h1 className="text-2xl font-black">
                    NSVD Vocab
                  </h1>

                  <p className="text-gray-500 text-sm">
                    AI Vocabulary Platform
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-3xl font-black"
              >
                ✕
              </button>
            </div>

            {/* MENU */}
            <div className="space-y-2">
              {[
                {
                  name: "Home",
                  path: "/home",
                },
                {
                  name: "Thêm từ vựng",
                  path: "/new",
                },
                {
                  name: "Kho lưu trữ",
                  path: "/folders",
                },
                {
                  name: "AI Quiz",
                  path: "/aiquiz",
                },
                {
                  name: "Cài đặt",
                  path: "/settings",
                },
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => router.push(item.path)}
                  className={`w-full text-left px-5 py-4 rounded-2xl font-bold transition ${
                    pathname === item.path
                      ? "bg-blue-600 text-white"
                      : "hover:bg-[#f5f9ff] text-gray-600"
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* PROFILE */}
          <div className="bg-[#f5f9ff] rounded-3xl p-5">
            <div className="flex items-center gap-4">
              <img
                src={
                  user?.user_metadata?.avatar_url ||
                  "https://ui-avatars.com/api/?name=User"
                }
                alt="avatar"
                className="w-16 h-16 rounded-2xl object-cover"
              />

              <div className="min-w-0">
                <p className="text-gray-500 text-sm">
                  Logged in as
                </p>

                <h2 className="font-black text-xl truncate">
                  {userName}
                </h2>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full mt-5 bg-red-500 hover:bg-red-600 transition text-white font-bold py-3 rounded-2xl"
            >
              Logout
            </button>
          </div>
        </aside>
      </>

      {/* MAIN */}
      <div className="flex-1 min-w-0 lg:ml-[280px]">
        {/* MOBILE HEADER */}
        <header className="lg:hidden bg-white border-b border-gray-100 px-5 h-16 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-3xl font-black"
            >
              ☰
            </button>

            <img
              src="/logo.png"
              alt="logo"
              className="w-10 h-10 rounded-xl object-cover"
            />

            <h1 className="font-black text-xl">
              NSVD Vocab
            </h1>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-xl font-bold"
          >
            Logout
          </button>
        </header>

        {children}
      </div>
    </main>
  )
}