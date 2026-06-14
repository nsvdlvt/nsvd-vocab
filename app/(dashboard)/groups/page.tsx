"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Copy, Layers3, Link2, Search, Share2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

type VocabSet = {
  id: string
  title: string
  description?: string | null
  tag?: string | null
  created_at: string
  vocab_words?: { count: number }[]
}

type CreatedGroup = {
  id: string
  name: string
}

const getShareUrl = (groupId: string) => {
  if (typeof window === "undefined") return `/groups/${groupId}`
  return `${window.location.origin}/groups/${groupId}`
}

export default function GroupsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [search, setSearch] = useState("")
  const [sets, setSets] = useState<VocabSet[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [createdGroup, setCreatedGroup] = useState<CreatedGroup | null>(null)
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    const loadSets = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const user = session?.user
      if (!user) {
        const redirectTo = `${window.location.pathname}${window.location.search}`
        router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`)
        return
      }

      const { data, error } = await supabase
        .from("vocab_sets")
        .select(`
          id,
          title,
          description,
          tag,
          created_at,
          vocab_words(count)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        setMessage("Không thể tải bộ từ của bạn. Vui lòng thử lại.")
      } else {
        setSets((data || []) as VocabSet[])
      }

      setLoading(false)
    }

    void loadSets()
  }, [router])

  const selectedSets = useMemo(
    () => sets.filter((set) => selectedIds.includes(set.id)),
    [sets, selectedIds]
  )

  const filteredSets = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return sets

    return sets.filter((set) =>
      [set.title, set.description || "", set.tag || ""]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    )
  }, [sets, search])

  const totalWords = selectedSets.reduce(
    (sum, set) => sum + (set.vocab_words?.[0]?.count || 0),
    0
  )

  const toggleSet = (setId: string) => {
    setCreatedGroup(null)
    setCopied(false)
    setSelectedIds((prev) =>
      prev.includes(setId)
        ? prev.filter((id) => id !== setId)
        : [...prev, setId]
    )
  }

  const createGroup = async () => {
    if (!name.trim()) {
      setMessage("Nhập tên nhóm từ vựng trước nhé.")
      return
    }

    if (selectedIds.length === 0) {
      setMessage("Chọn ít nhất một bộ từ vựng để chia sẻ.")
      return
    }

    setSaving(true)
    setMessage("")
    setCopied(false)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const user = session?.user
    if (!user) {
      const redirectTo = `${window.location.pathname}${window.location.search}`
      router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`)
      return
    }

    const { data: group, error: groupError } = await supabase
      .from("vocab_groups")
      .insert({
        owner_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        owner_name: user.user_metadata?.full_name || user.email || "Người dùng",
        owner_avatar: user.user_metadata?.avatar_url || "",
      })
      .select("id, name")
      .single()

    if (groupError || !group) {
      setMessage("Không thể tạo nhóm. Vui lòng thử lại.")
      setSaving(false)
      return
    }

    const { error: itemError } = await supabase.from("vocab_group_sets").insert(
      selectedIds.map((setId, index) => ({
        group_id: group.id,
        set_id: setId,
        position: index,
      }))
    )

    if (itemError) {
      setMessage("Nhóm đã tạo nhưng chưa lưu được danh sách bộ từ.")
      setSaving(false)
      return
    }

    setCreatedGroup(group)
    setMessage("Đã tạo nhóm. Copy link bên dưới để chia sẻ.")
    setSaving(false)
  }

  const copyLink = async () => {
    if (!createdGroup) return

    await navigator.clipboard.writeText(getShareUrl(createdGroup.id))
    setCopied(true)
  }

  if (loading) {
    return (
      <section className="dashboard-shell min-h-[calc(100vh-5rem)]">
        <div className="dashboard-loading">
          <div className="dashboard-spinner" />
          <p className="dashboard-loading-text">Đang tải nhóm từ vựng</p>
        </div>
      </section>
    )
  }

  return (
    <section className="dashboard-shell">
      <div className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="dashboard-pill">Nhóm từ vựng</p>
          <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] text-[#211914] md:text-6xl">
            Gom nhiều bộ từ
            <span className="block text-[#c96d35]">vào một link chia sẻ.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#66584b]">
            Tạo một nhóm riêng, chọn các bộ từ của bạn, rồi gửi link cho người khác lưu toàn bộ vào tài khoản của họ.
          </p>
        </div>

        <div className="dashboard-hero-panel">
          <div className="dashboard-panel-dark">
            <div className="flex items-center justify-between rounded-[1.5rem] bg-white/10 px-4 py-4">
              <div>
                <p className="text-sm text-[#d9bba0]">Đã chọn</p>
                <p className="mt-1 text-3xl font-black">{selectedIds.length}</p>
              </div>
              <Layers3 className="h-10 w-10 text-[#f2c96d]" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-[1.5rem] bg-white/8 p-4">
                <p className="text-sm text-[#d9bba0]">Bộ từ</p>
                <p className="mt-2 text-3xl font-black">{sets.length}</p>
              </div>
              <div className="rounded-[1.5rem] bg-white/8 p-4">
                <p className="text-sm text-[#d9bba0]">Từ sẽ chia sẻ</p>
                <p className="mt-2 text-3xl font-black">{totalWords}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="dashboard-card h-fit">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1dd] text-[#c96d35]">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#9a6a45]">
                Tạo nhóm
              </p>
              <h2 className="text-2xl font-black text-[#241c17]">Thông tin chia sẻ</h2>
            </div>
          </div>

          <label className="mt-6 block">
            <span className="font-bold text-[#3d3026]">Tên nhóm</span>
            <input
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setCreatedGroup(null)
              }}
              placeholder="Ví dụ: IELTS Writing Pack"
              className="mt-3 w-full rounded-2xl border border-transparent bg-[#f7efe5] p-4 font-semibold outline-none transition focus:border-[#c96d35]"
            />
          </label>

          <label className="mt-5 block">
            <span className="font-bold text-[#3d3026]">Mô tả</span>
            <textarea
              value={description}
              onChange={(event) => {
                setDescription(event.target.value)
                setCreatedGroup(null)
              }}
              placeholder="Ghi chú ngắn cho người nhận link..."
              className="mt-3 min-h-[120px] w-full resize-none rounded-2xl border border-transparent bg-[#f7efe5] p-4 font-semibold outline-none transition focus:border-[#c96d35]"
            />
          </label>

          {message ? (
            <p className="mt-5 rounded-2xl bg-[#fff1dd] px-4 py-3 text-sm font-bold text-[#9a4f22]">
              {message}
            </p>
          ) : null}

          <button
            type="button"
            disabled={saving}
            onClick={createGroup}
            className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#1f1a17] font-black text-[#fff8f0] transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Link2 className="h-5 w-5" />
            {saving ? "Đang tạo..." : "Tạo link chia sẻ"}
          </button>

          {createdGroup ? (
            <div className="mt-5 rounded-[1.5rem] border border-[#e2d2bf] bg-[#fffaf3] p-4">
              <p className="text-sm font-bold text-[#66584b]">Link chia sẻ</p>
              <p className="mt-2 break-all text-sm font-bold text-[#241c17]">
                {getShareUrl(createdGroup.id)}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={copyLink}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#d96d32] font-bold text-white transition hover:bg-[#c25f29]"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Đã copy" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/groups/${createdGroup.id}`)}
                  className="h-11 rounded-xl border border-[#e2d2bf] bg-white font-bold text-[#3d3026] transition hover:border-[#c96d35]"
                >
                  Mở nhóm
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="dashboard-card">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#9a6a45]">
                Chọn bộ từ
              </p>
              <h2 className="mt-1 text-2xl font-black text-[#241c17]">
                {selectedIds.length} bộ đang được chọn
              </h2>
            </div>
            <div className="flex min-h-12 items-center gap-3 rounded-2xl bg-[#f7efe5] px-4">
              <Search className="h-5 w-5 text-[#9a6a45]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm bộ từ..."
                className="w-full min-w-[220px] bg-transparent font-semibold outline-none placeholder:text-[#a8917b]"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {filteredSets.length === 0 ? (
              <div className="col-span-full rounded-[1.5rem] border border-dashed border-[#e2d2bf] bg-[#fffaf3] p-8 text-center">
                <p className="font-bold text-[#66584b]">Chưa có bộ từ phù hợp.</p>
              </div>
            ) : (
              filteredSets.map((set) => {
                const selected = selectedIds.includes(set.id)

                return (
                  <button
                    key={set.id}
                    type="button"
                    onClick={() => toggleSet(set.id)}
                    className={`rounded-[1.5rem] border p-5 text-left transition ${
                      selected
                        ? "border-[#d96d32] bg-[#fff1dd] shadow-[0_14px_34px_rgba(217,109,50,0.12)]"
                        : "border-[#ead8c4] bg-[#fffaf3] hover:border-[#d96d32]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-black text-[#241c17]">{set.title}</p>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#66584b]">
                          {set.description || "Bộ từ vựng sẵn sàng để chia sẻ."}
                        </p>
                      </div>
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                          selected
                            ? "border-[#d96d32] bg-[#d96d32] text-white"
                            : "border-[#d7c4af] bg-white text-transparent"
                        }`}
                      >
                        <Check className="h-4 w-4" />
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm font-bold text-[#9a6a45]">
                      <span>{set.tag || "Tổng hợp"}</span>
                      <span>{set.vocab_words?.[0]?.count || 0} từ</span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
