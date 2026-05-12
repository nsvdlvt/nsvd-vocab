"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Home,
  PlusSquare,
  Folder,
  Brain,
  Settings,
  Menu,
  Globe,
  X,
  LogOut,
  DollarSign,
} from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const router = useRouter()

  const [sidebarOpen, setSidebarOpen] =
    useState(false)

  const [loading, setLoading] =
    useState(true)

  const [user, setUser] = useState<any>(null)

  // CHECK SESSION
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/login")
      } else {
        setUser(session.user)
      }

      setLoading(false)
    }

    getSession()
  }, [])

  // LOADING SCREEN
if (loading) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f5f9ff]">
      <div className="flex flex-col items-center">
        {/* LOGO */}
        <img
          src="/logo.png"
          alt="logo"
          className="w-24 h-24 rounded-[28px] object-cover shadow-2xl"
        />

        {/* SPINNER */}
        <div className="mt-8 relative flex items-center justify-center">
          <div className="w-14 h-14 rounded-full border-4 border-blue-100"></div>

          <div className="absolute w-14 h-14 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
        </div>

        {/* TEXT */}
        <p className="mt-6 text-gray-500 font-semibold text-lg">
          Loading NSVD Vocab...
        </p>
      </div>
    </main>
  )
}

  const menuItems = [
    {
      title: "Home",
      icon: Home,
      path: "/home",
    },
    {
      title: "Thêm từ vựng",
      icon: PlusSquare,
      path: "/new",
    },
    {
      title: "Kho lưu trữ",
      icon: Folder,
      path: "/folders",
    },
    {
      title: "Community",
      icon: Globe,
      path: "/community",
    },
    {
      title: "Pricing",
      icon: DollarSign,
      path: "/pricing",
    },
    {
      title: "Cài đặt",
      icon: Settings,
      path: "/settings",
    },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()

    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-[#f5f9ff] flex">
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
        fixed top-0 left-0 h-screen w-[280px]
        bg-white border-r border-gray-100
        z-50 transition-all duration-300
        flex flex-col
        ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }
        lg:translate-x-0
      `}
      >
        {/* TOP */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            {/* LOGO */}
            <div className="flex items-center gap-3">
            <img
                src="/logo.png"
                alt="logo"
                className="w-12 h-12 rounded-2xl object-cover shadow-lg"
            />

            <div>
                <h1 className="text-2xl font-black">
                NSVD Vocab
                </h1>

                <p className="text-sm text-gray-500">
                Vocabulary Platform
                </p>
            </div>
            </div>

            {/* CLOSE */}
            <button
              className="lg:hidden"
              onClick={() =>
                setSidebarOpen(false)
              }
            >
              <X size={28} />
            </button>
          </div>
        </div>

        {/* MENU */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon

            const active =
              pathname === item.path

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() =>
                  setSidebarOpen(false)
                }
                className={`
                  flex items-center gap-4
                  px-5 py-4 rounded-2xl
                  transition font-bold
                  ${
                    active
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                      : "hover:bg-blue-50 text-gray-700"
                  }
                `}
              >
                <Icon size={24} />

                <span>{item.title}</span>
              </Link>
            )
          })}
        </div>

        {/* USER */}
        <div className="p-4 border-t border-gray-100">
          <div className="bg-[#f5f9ff] rounded-3xl p-4">
            <div className="flex items-center gap-3 mb-4">
              {user?.user_metadata
                ?.avatar_url ? (
                <img
                  src={
                    user.user_metadata
                      .avatar_url
                  }
                  alt="avatar"
                  className="w-14 h-14 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white font-black text-xl">
                  {user?.email?.[0]?.toUpperCase()}
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500">
                  Logged in as
                </p>

                <h2 className="font-black text-lg line-clamp-1">
                  {user?.user_metadata
                    ?.full_name ||
                    user?.email}
                </h2>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full bg-red-500 hover:bg-red-600 transition text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2"
            >
              <LogOut size={20} />
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 lg:ml-[280px]">
        {/* MOBILE TOPBAR */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-5 py-4 flex items-center justify-between lg:hidden">
          <button
            onClick={() =>
              setSidebarOpen(true)
            }
          >
            <Menu size={30} />
          </button>

          <h1 className="text-xl font-black">
            NSVD Vocab
          </h1>

          <div className="w-8" />
        </header>

        {/* PAGE */}
        <main>{children}</main>
      </div>
    </div>
  )
}