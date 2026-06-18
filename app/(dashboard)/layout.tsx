"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ClipboardCheck,
  DollarSign,
  Folder,
  FolderPlus,
  Globe,
  Home,
  Layers3,
  Menu,
  PlusSquare,
  Settings,
  Sparkles,
  X,
} from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getEffectiveRole } from "@/lib/subscription"
import ProfileModal from "./profile-modal"

type ProfileUser = {
  id?: string
  email?: string
  user_metadata?: {
    full_name?: string | null
    avatar_url?: string | null
    [key: string]: unknown
  }
  full_name?: string | null
  avatar_url?: string | null
  role?: string | null
  premium_expires_at?: string | null
  [key: string]: unknown
}

const getRoleBadgeClass = (role?: string | null) => {
  const normalized = role?.toUpperCase() || "MEMBER"

  if (normalized === "ADMIN") return "bg-[#7e2a26] text-white"
  if (normalized === "PREMIUM") return "bg-[#f2c96d] text-[#2d211a]"
  return "bg-[#efe1cf] text-[#7b5d44]"
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<ProfileUser | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        const redirectTo = `${window.location.pathname}${window.location.search}`
        router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`)
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, role, premium_expires_at")
        .eq("id", session.user.id)
        .maybeSingle()

      const effectiveRole = getEffectiveRole(
        profile?.role,
        profile?.premium_expires_at
      )

      setUser({
        ...session.user,
        full_name: profile?.username || session.user.user_metadata?.full_name || "",
        avatar_url: profile?.avatar_url || session.user.user_metadata?.avatar_url || "",
        role: effectiveRole,
        premium_expires_at: profile?.premium_expires_at || null,
      })

      setLoading(false)
    }

    getSession()
  }, [router])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#fff8e8_0%,#f7f1e8_38%,#efe7da_100%)]">
        <div className="dashboard-loading">
          <div className="dashboard-loading-logo-wrap">
            <div className="dashboard-spinner" />
            <img
              src="/logo.png"
              alt="NSVD Vocab logo"
              className="dashboard-loading-logo"
            />
          </div>
          <p className="dashboard-loading-text">Đang tải không gian học tập</p>
        </div>
      </main>
    )
  }

  const menuItems = [
    { title: "Home", icon: Home, path: "/home" },
    { title: "Thêm từ vựng", icon: PlusSquare, path: "/new" },
    { title: "Kho lưu trữ", icon: Folder, path: "/folders" },
    { title: "Nhóm từ vựng", icon: Layers3, path: "/groups" },
    { title: "Community", icon: Globe, path: "/community" },
    { title: "Nâng cấp", icon: DollarSign, path: "/upgrade" },
    { title: "Cài đặt", icon: Settings, path: "/settings" },
  ]

  return (
    <div className="dashboard-frame">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#1a120d]/45 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r border-white/40 bg-[#f8f1e6]/90 backdrop-blur-xl transition-all duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div className="border-b border-[#ddccba] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="NSVD Vocab logo"
                className="h-12 w-12 rounded-2xl object-cover shadow-[0_16px_30px_rgba(31,26,23,0.14)]"
              />

              <div>
                <h1 className="text-2xl font-black text-[#241c17]">NSVD Vocab</h1>
                <p className="text-sm text-[#7a6859]">Learn smart</p>
              </div>
            </div>

            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X size={28} className="text-[#2b211b]" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          <div className="mb-4 rounded-[1.75rem] border border-[#e5d6c6] bg-[#fff9f2] p-4">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-[#9a6d48]">
              <Sparkles className="h-4 w-4" />
              Study flow
            </div>
            <p className="mt-3 text-sm leading-6 text-[#6e5d50]">
              Học tập hiệu quả hơn với NSVDVocab
            </p>
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.path

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-4 rounded-2xl px-5 py-4 font-bold transition
                  ${active ? "bg-[#1f1a17] text-[#fff8f0] shadow-[0_16px_30px_rgba(31,26,23,0.16)]" : "text-[#5d4d3f] hover:bg-[#fff9f2]"}
                `}
              >
                <Icon size={24} />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </div>

        <div className="border-t border-[#ddccba] p-4">
          <div
            onClick={() => setProfileOpen(true)}
            className="cursor-pointer rounded-3xl border border-[#e6d5c4] bg-[#fff9f2] p-4"
          >
            <div className="mb-4 flex items-center gap-3">
              {user?.avatar_url || user?.user_metadata?.avatar_url ? (
                <img
                  src={user?.avatar_url || user?.user_metadata?.avatar_url || ""}
                  alt="avatar"
                  className="h-14 w-14 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1f1a17] text-xl font-black text-[#fff8f0]">
                  {user?.email?.[0]?.toUpperCase()}
                </div>
              )}

              <div>
                <div
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getRoleBadgeClass(
                    user?.role
                  )}`}
                >
                  {user?.role || "MEMBER"}
                </div>

                <h2 className="line-clamp-1 text-lg font-black text-[#241c17]">
                  {user?.full_name || user?.user_metadata?.full_name || user?.email}
                </h2>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {profileOpen && (
        <ProfileModal
          user={user}
          onClose={() => setProfileOpen(false)}
          onUserChange={(next) => setUser(next)}
        />
      )}

      <div className="min-w-0 flex-1 lg:ml-[280px]">
        <header className="sticky top-0 z-30 border-b border-[#decebd] bg-[#f6efe4]/88 px-5 py-4 backdrop-blur-xl lg:hidden">
          <div className="relative flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center"
            >
            <Menu size={30} className="text-[#241c17]" />
            </button>

            <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-center text-xl font-black text-[#241c17]">
              NSVD Vocab
            </h1>

            <div className="h-10 w-10 shrink-0" />
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  )
}
