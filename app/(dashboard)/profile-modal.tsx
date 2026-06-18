"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { X, LogOut, Pencil, ImagePlus, Upload, Crown } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { formatPremiumExpiry, getEffectiveRole } from "@/lib/subscription"

type ProfileUser = {
  id?: string
  email?: string
  full_name?: string | null
  avatar_url?: string | null
  role?: string | null
  premium_expires_at?: string | null
  user_metadata?: {
    full_name?: string | null
    avatar_url?: string | null
    [key: string]: unknown
  }
}

type ProfileRow = {
  id: string
  username?: string | null
  avatar_url?: string | null
  role?: string | null
  premium_expires_at?: string | null
}

type Props = {
  user: ProfileUser | null
  onClose: () => void
  onUserChange: (next: ProfileUser) => void
}

export default function ProfileModal({
  user,
  onClose,
  onUserChange,
}: Props) {
  const getRoleBadgeClass = (role?: string | null) => {
    const normalized = role?.toUpperCase() || "MEMBER"

    if (normalized === "ADMIN") {
      return "bg-red-50 text-red-600"
    }

    if (normalized === "PREMIUM") {
      return "bg-blue-50 text-blue-600"
    }

    return "bg-amber-50 text-amber-600"
  }

  const router = useRouter()
  const [name, setName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [rank, setRank] = useState("MEMBER")
  const [premiumExpiresAt, setPremiumExpiresAt] = useState("")
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return

      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, role, premium_expires_at")
        .eq("id", user.id)
        .maybeSingle()

      const profile = data as ProfileRow | null

      setName(
        profile?.username ||
          user?.user_metadata?.full_name ||
          ""
      )
      setAvatarUrl(
        profile?.avatar_url ||
          user?.user_metadata?.avatar_url ||
          ""
      )
      setRank(getEffectiveRole(profile?.role, profile?.premium_expires_at))
      setPremiumExpiresAt(profile?.premium_expires_at || "")
    }

    loadProfile()
  }, [user])

  const syncProfile = async (next: {
    username: string
    avatar_url: string
    role: string
  }) => {
    if (!user?.id) return

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email,
        username: next.username,
        avatar_url: next.avatar_url,
        role: user?.role === "ADMIN" ? "ADMIN" : next.role,
      })

    if (!error) {
      onUserChange({
        ...user,
        full_name: next.username,
        avatar_url: next.avatar_url,
        role: user?.role === "ADMIN" ? "ADMIN" : next.role,
        premium_expires_at: premiumExpiresAt || null,
        user_metadata: {
          ...(user.user_metadata || {}),
          full_name: next.username,
          avatar_url: next.avatar_url,
        },
      })
    }
  }

  const handleSave = async () => {
    if (!user?.id) return

    setSaving(true)

    const nextMetadata = {
      ...(user.user_metadata || {}),
      full_name: name,
      avatar_url: avatarUrl,
    }

    const { error } = await supabase.auth.updateUser({
      data: nextMetadata,
    })

    if (!error) {
      await syncProfile({
        username: name,
        avatar_url: avatarUrl,
        role: rank,
      })

      onUserChange({
        ...user,
        full_name: name,
        avatar_url: avatarUrl,
        role: rank,
        premium_expires_at: premiumExpiresAt || null,
        user_metadata: nextMetadata,
      })
      onClose()
    }

    setSaving(false)
  }

  const handleAvatarPick = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    setUploadingAvatar(true)

    const fileExt = file.name.split(".").pop() || "jpg"
    const filePath = `${user.id}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        upsert: true,
        cacheControl: "3600",
      })

    if (!uploadError) {
      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath)

      setAvatarUrl(data.publicUrl)

      if (user?.id) {
        await syncProfile({
          username: name,
          avatar_url: data.publicUrl,
          role: rank,
        })
      }
    }

    setUploadingAvatar(false)
    event.target.value = ""
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[32px] bg-white p-6 shadow-[0_20px_80px_rgba(0,0,0,0.18)]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
              Thong tin user
            </p>
            <h2 className="mt-2 text-3xl font-black text-gray-950">
              Profile
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex items-center gap-4 rounded-[28px] bg-[#f5f9ff] p-5">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="avatar"
                className="h-20 w-20 rounded-3xl object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-400 text-2xl font-black text-white">
                {name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border border-white bg-blue-600 text-white shadow-lg transition hover:bg-blue-700"
            >
              <Upload className="h-4 w-4" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarPick}
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-gray-500">
                Member
              </p>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${getRoleBadgeClass(
                  rank
                )}`}
              >
                <Crown className="h-3.5 w-3.5" />
                {rank}
              </span>
            </div>
            <h3 className="truncate text-2xl font-black text-gray-950">
              {name || user?.email || "User"}
            </h3>
            <p className="mt-1 truncate text-sm text-gray-500">
              {user?.email}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-600">
              Tên hiển thị
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-[#f5f9ff] px-4 py-3">
              <Pencil className="h-4 w-4 text-gray-400" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên"
                className="w-full bg-transparent outline-none"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-[#f5f9ff] px-4 py-4">
            <label className="mb-2 block text-sm font-bold text-gray-600">
              Avatar
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 font-bold text-gray-900 shadow-sm transition hover:bg-gray-50"
            >
              <ImagePlus className="h-4 w-4" />
              {uploadingAvatar ? "Đang upload..." : "Chọn ảnh để đổi avt"}
            </button>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-[#f5f9ff] px-4 py-4">
            <div>
              <p className="text-sm font-bold text-gray-600">Nâng cấp</p>
              <p className="text-xs text-gray-500">
                Mở thêm quyền và tính năng cho tài khoản
              </p>
            </div>
            <button
              onClick={() => router.push("/upgrade")}
              className="rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700"
            >
              Nâng cấp
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-4 font-bold text-red-600 transition hover:bg-red-100"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-2xl bg-blue-600 px-4 py-4 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
