"use client"

import { use, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Bookmark, CalendarDays, Layers3, UserRound } from "lucide-react"
import { supabase } from "@/lib/supabase"

type WordRow = {
  word?: string | null
  meaning?: string | null
  ipa?: string | null
  word_type?: string | null
  example?: string | null
  synonyms?: string | null
  audio_url?: string | null
}

type GroupSetRow = {
  position?: number | null
  vocab_sets?: {
    id: string
    title: string
    description?: string | null
    tag?: string | null
    icon?: string | null
    author_name?: string | null
    vocab_words?: WordRow[]
  } | {
    id: string
    title: string
    description?: string | null
    tag?: string | null
    icon?: string | null
    author_name?: string | null
    vocab_words?: WordRow[]
  }[] | null
}

type VocabSetInGroup = {
  id: string
  title: string
  description?: string | null
  tag?: string | null
  icon?: string | null
  author_name?: string | null
  words: WordRow[]
}

type VocabGroup = {
  id: string
  name: string
  description?: string | null
  owner_name?: string | null
  owner_avatar?: string | null
  created_at: string
}

const first = <T,>(value: T | T[] | null | undefined) =>
  Array.isArray(value) ? value[0] : value

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [group, setGroup] = useState<VocabGroup | null>(null)
  const [sets, setSets] = useState<VocabSetInGroup[]>([])
  const [message, setMessage] = useState("")

  useEffect(() => {
    const loadGroup = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/login")
        return
      }

      const { data: groupData, error: groupError } = await supabase
        .from("vocab_groups")
        .select("id, name, description, owner_name, owner_avatar, created_at")
        .eq("id", id)
        .single()

      if (groupError || !groupData) {
        setMessage("Không tìm thấy nhóm từ vựng này.")
        setLoading(false)
        return
      }

      const { data: groupSetRows, error: setsError } = await supabase
        .from("vocab_group_sets")
        .select(`
          position,
          vocab_sets(
            id,
            title,
            description,
            tag,
            icon,
            author_name,
            vocab_words(
              word,
              meaning,
              ipa,
              word_type,
              example,
              synonyms,
              audio_url
            )
          )
        `)
        .eq("group_id", id)
        .order("position", { ascending: true })

      if (setsError) {
        setMessage("Không thể tải danh sách bộ từ trong nhóm.")
      }

      setGroup(groupData as VocabGroup)
      setSets(
        ((groupSetRows || []) as unknown as GroupSetRow[])
          .map((row) => first(row.vocab_sets))
          .filter(Boolean)
          .map((set) => ({
            id: set!.id,
            title: set!.title,
            description: set!.description,
            tag: set!.tag,
            icon: set!.icon,
            author_name: set!.author_name,
            words: set!.vocab_words || [],
          }))
      )
      setLoading(false)
    }

    void loadGroup()
  }, [id, router])

  const totalWords = useMemo(
    () => sets.reduce((sum, set) => sum + set.words.length, 0),
    [sets]
  )

  const saveAllSets = async () => {
    if (!group || sets.length === 0) return

    setConfirmOpen(false)
    setSaving(true)
    setMessage("")

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const user = session?.user
    if (!user) {
      router.push("/login")
      return
    }

    for (const set of sets) {
      const { data: newSet, error: setError } = await supabase
        .from("vocab_sets")
        .insert({
          user_id: user.id,
          title: set.title,
          description: set.description,
          tag: set.tag,
          icon: set.icon || "📘",
          is_public: false,
          author_name: user.user_metadata?.full_name || user.email || "Người dùng",
          author_avatar: user.user_metadata?.avatar_url || "",
        })
        .select("id")
        .single()

      if (setError || !newSet) {
        setMessage(`Không thể lưu bộ "${set.title}". Vui lòng thử lại.`)
        setSaving(false)
        return
      }

      if (set.words.length > 0) {
        const { error: wordsError } = await supabase.from("vocab_words").insert(
          set.words.map((word) => ({
            set_id: newSet.id,
            word: word.word,
            meaning: word.meaning,
            ipa: word.ipa,
            word_type: word.word_type,
            example: word.example,
            synonyms: word.synonyms,
            audio_url: word.audio_url,
          }))
        )

        if (wordsError) {
          setMessage(`Đã tạo "${set.title}" nhưng chưa lưu được từ bên trong.`)
          setSaving(false)
          return
        }
      }
    }

    setMessage(`Đã lưu ${sets.length} bộ từ vào kho của bạn.`)
    setSaving(false)
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

  if (!group) {
    return (
      <section className="dashboard-shell">
        <div className="dashboard-card text-center">
          <h1 className="text-3xl font-black text-[#241c17]">Không tìm thấy nhóm</h1>
          <p className="mt-3 font-semibold text-[#66584b]">{message}</p>
          <button
            onClick={() => router.push("/groups")}
            className="mt-6 rounded-2xl bg-[#1f1a17] px-6 py-3 font-bold text-white"
          >
            Về trang nhóm
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="dashboard-shell">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-[#e2d2bf] bg-[#fffaf3] px-4 py-3 font-bold text-[#3d3026] transition hover:border-[#c96d35]"
      >
        <ArrowLeft className="h-5 w-5" />
        Quay lại
      </button>

      <div className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="dashboard-pill">Nhóm từ vựng được chia sẻ</p>
          <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] text-[#211914] md:text-6xl">
            {group.name}
          </h1>
          {group.description ? (
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#66584b]">
              {group.description}
            </p>
          ) : null}

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-[#ead8c4] bg-[#fffaf3] p-4">
              <UserRound className="h-5 w-5 text-[#c96d35]" />
              <p className="mt-3 text-sm font-bold text-[#9a6a45]">Chủ sở hữu</p>
              <p className="mt-1 font-black text-[#241c17]">
                {group.owner_name || "Người dùng"}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-[#ead8c4] bg-[#fffaf3] p-4">
              <CalendarDays className="h-5 w-5 text-[#c96d35]" />
              <p className="mt-3 text-sm font-bold text-[#9a6a45]">Ngày tạo</p>
              <p className="mt-1 font-black text-[#241c17]">
                {formatDate(group.created_at)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-[#ead8c4] bg-[#fffaf3] p-4">
              <Layers3 className="h-5 w-5 text-[#c96d35]" />
              <p className="mt-3 text-sm font-bold text-[#9a6a45]">Tổng quan</p>
              <p className="mt-1 font-black text-[#241c17]">
                {sets.length} bộ · {totalWords} từ
              </p>
            </div>
          </div>
        </div>

        <div className="dashboard-hero-panel">
          <div className="dashboard-panel-dark">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d9bba0]">
              Lưu vào tài khoản
            </p>
            <h2 className="mt-3 text-3xl font-black">
              Nhận toàn bộ nhóm từ này
            </h2>
            <p className="mt-4 leading-7 text-[#d9bba0]">
              Hệ thống sẽ copy từng bộ từ và toàn bộ từ vựng bên trong vào kho của người đang đăng nhập.
            </p>
            <button
              type="button"
              disabled={saving || sets.length === 0}
              onClick={() => setConfirmOpen(true)}
              className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#f2c96d] font-black text-[#241c17] transition hover:bg-[#ffd979] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Bookmark className="h-5 w-5" />
              {saving ? "Đang lưu..." : "Lưu toàn bộ"}
            </button>
            {message ? (
              <p className="mt-4 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-[#fff8f0]">
                {message}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sets.map((set) => (
          <article
            key={set.id}
            className="rounded-[2rem] border border-[#ead8c4] bg-[#fffaf3] p-6 shadow-[0_18px_48px_rgba(84,58,33,0.08)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="inline-flex rounded-full bg-[#fff1dd] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#c96d35]">
                  {set.tag || "Tổng hợp"}
                </p>
                <h2 className="mt-4 text-2xl font-black text-[#241c17]">{set.title}</h2>
              </div>
              <span className="rounded-full bg-[#1f1a17] px-3 py-1 text-sm font-black text-[#fff8f0]">
                {set.words.length} từ
              </span>
            </div>
            <p className="mt-4 line-clamp-3 leading-7 text-[#66584b]">
              {set.description || "Bộ từ vựng trong nhóm chia sẻ."}
            </p>
          </article>
        ))}
      </div>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f1a17]/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-[#ead8c4] bg-[#fffaf3] p-6 shadow-[0_28px_80px_rgba(31,26,23,0.22)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff1dd] text-[#c96d35]">
                <Bookmark className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#241c17]">
                  Lưu toàn bộ nhóm này?
                </h2>
                <p className="mt-2 leading-7 text-[#66584b]">
                  Hệ thống sẽ copy {sets.length} bộ từ với tổng {totalWords} từ vào kho của bạn. Các bộ từ hiện có sẽ không bị xóa hay ghi đè.
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="h-12 rounded-2xl border border-[#e2d2bf] bg-white font-bold text-[#3d3026] transition hover:border-[#c96d35]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void saveAllSets()}
                className="h-12 rounded-2xl bg-[#1f1a17] font-bold text-[#fff8f0] transition hover:bg-black"
              >
                Xác nhận lưu
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
