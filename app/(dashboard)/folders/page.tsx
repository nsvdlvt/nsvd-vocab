"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Clock3, Search, SlidersHorizontal, User } from "lucide-react"
import { supabase } from "@/lib/supabase"

type VocabSet = {
  id: string
  title: string
  created_at: string
  total_words?: number
  icon?: string
  tag?: string
  description?: string
  mastered_words: number
  learning_words: number
  unlearned_words: number
  author?: string
  last_studied_at?: string | null
}

type SupabaseVocabSet = {
  id: string
  title: string
  created_at: string
  icon?: string | null
  tag?: string | null
  description?: string | null
  author_name?: string | null
  vocab_words?: {
    count: number
  }[]
}

type LearningSession = {
  set_id: string
  updated_at: string
  all_words?: LearningWordProgress[] | null
}

type LearningWordProgress = {
  memoryStrength?: number
}

type SortBy = "az" | "za" | "modified"

const formatRelativeTime = (value?: string | null) => {
  if (!value) return "Chưa học"

  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return "Chưa học"

  const diffMinutes = Math.max(0, Math.floor((Date.now() - time) / 60000))
  if (diffMinutes < 1) return "Vừa xong"
  if (diffMinutes < 60) return `${diffMinutes} phút trước`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays} ngày trước`

  return new Date(value).toLocaleDateString("vi-VN")
}

const getLearningStats = (
  session: LearningSession | undefined,
  totalWords: number
) => {
  const words = session?.all_words || []

  if (words.length === 0) {
    return {
      mastered: 0,
      learning: 0,
      unlearned: totalWords,
    }
  }

  const mastered = words.filter((word) => (word.memoryStrength || 0) >= 4).length
  const learning = words.filter((word) => {
    const strength = word.memoryStrength || 0
    return strength >= 1 && strength < 4
  }).length

  return {
    mastered,
    learning,
    unlearned: Math.max(0, totalWords - mastered - learning),
  }
}

export default function ArchivePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [sets, setSets] = useState<VocabSet[]>([])
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortBy>("az")
  const [filterTag, setFilterTag] = useState("all")
  const [sortOpen, setSortOpen] = useState(false)

  useEffect(() => {
    const loadSets = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const user = session?.user
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("vocab_sets")
        .select(`
          id,
          title,
          created_at,
          icon,
          tag,
          description,
          author_name,
          vocab_words(count)
        `)
        .eq("user_id", user.id)

      if (error) {
        console.log(error)
        setLoading(false)
        return
      }

      const setIds = (data || []).map((item: SupabaseVocabSet) => item.id)

      const { data: sessions } =
        setIds.length > 0
          ? await supabase
              .from("learning_sessions")
              .select(`
                set_id,
                updated_at,
                all_words
              `)
              .eq("user_id", user.id)
              .in("set_id", setIds)
          : { data: [] }

      const sessionBySetId = new Map(
        ((sessions as LearningSession[] | null) || []).map((learningSession) => [
          learningSession.set_id,
          learningSession,
        ])
      )

      const formatted = (data || []).map((item: SupabaseVocabSet) => {
        const totalWords = item.vocab_words?.[0]?.count || 0
        const stats = getLearningStats(sessionBySetId.get(item.id), totalWords)

        return {
          id: item.id,
          title: item.title,
          icon: item.icon || undefined,
          tag: item.tag || undefined,
          created_at: item.created_at,
          total_words: totalWords,
          description: item.description || "",
          mastered_words: stats.mastered,
          learning_words: stats.learning,
          unlearned_words: stats.unlearned,
          author: item.author_name || user.email || "Unknown",
          last_studied_at: sessionBySetId.get(item.id)?.updated_at || null,
        }
      })

      setSets(formatted)
      setLoading(false)
    }

    loadSets()
  }, [])

  useEffect(() => {
    const closeMenu = () => setSortOpen(false)
    window.addEventListener("click", closeMenu)
    return () => window.removeEventListener("click", closeMenu)
  }, [])

  const tags = useMemo(
    () => Array.from(new Set(sets.map((s) => s.tag || "Tổng hợp"))),
    [sets]
  )

  const filteredSets = useMemo(() => {
    return [...sets]
      .filter((set) => set.title.toLowerCase().includes(search.toLowerCase()))
      .filter((set) => (filterTag === "all" ? true : (set.tag || "Tổng hợp") === filterTag))
      .sort((a, b) => {
        if (sortBy === "az") return a.title.localeCompare(b.title)
        if (sortBy === "za") return b.title.localeCompare(a.title)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [sets, search, filterTag, sortBy])

  if (loading) {
    return (
      <section className="dashboard-shell min-h-[calc(100vh-5rem)]">
        <div className="dashboard-loading">
          <div className="dashboard-spinner" />
          <p className="dashboard-loading-text">Đang tải kho từ vựng</p>
        </div>
      </section>
    )
  }

  return (
    <section className="dashboard-shell">
      <div className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="dashboard-pill">Kho từ vựng cá nhân của bạn</p>
          <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] text-[#211914] md:text-6xl">
            Kho lưu trữ
            <span className="block text-[#c96d35]">đồng bộ với trang Home.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#66584b]">
            Tìm bộ từ nhanh, lọc theo chủ đề và mở tiếp buổi học gần nhất trong cùng một giao diện.
          </p>
          <button
            onClick={() => router.push("/new")}
            className="mt-8 inline-flex h-14 items-center justify-center rounded-full bg-[#d96d32] px-6 font-black text-white transition hover:bg-[#c25f29]"
          >
            + Tạo bộ từ
          </button>
        </div>

        <div className="dashboard-hero-panel">
          <div className="dashboard-panel-dark">
            <div className="flex items-center gap-3 rounded-[1.5rem] bg-white/10 px-4 py-4">
              <Search className="h-5 w-5 text-[#e1c5ab]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm bộ từ..."
                className="w-full bg-transparent text-white outline-none placeholder:text-[#cfb39a]"
              />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-[1.5rem] bg-white/8 p-4">
                <p className="text-sm text-[#d9bba0]">Tổng bộ</p>
                <p className="mt-2 text-3xl font-black">{sets.length}</p>
              </div>
              <div className="rounded-[1.5rem] bg-white/8 p-4">
                <p className="text-sm text-[#d9bba0]">Tổng từ</p>
                <p className="mt-2 text-3xl font-black">
                  {sets.reduce((sum, set) => sum + (set.total_words || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setFilterTag("all")}
            className={`rounded-full px-4 py-2 text-sm font-bold ${filterTag === "all" ? "bg-[#1f1a17] text-[#fff8f0]" : "bg-[#fffaf3] text-[#66584b] border border-[#e2d2bf]"}`}
          >
            Tất cả
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(tag)}
              className={`rounded-full px-4 py-2 text-sm font-bold ${filterTag === tag ? "bg-[#1f1a17] text-[#fff8f0]" : "bg-[#fffaf3] text-[#66584b] border border-[#e2d2bf]"}`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSortOpen((prev) => !prev)
            }}
            className="inline-flex items-center gap-2 rounded-full border border-[#e2d2bf] bg-[#fffaf3] px-4 py-3 text-sm font-bold text-[#3d3026]"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Sắp xếp
          </button>

          {sortOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 z-20 mt-3 w-48 rounded-3xl border border-[#e2d2bf] bg-[#fffaf3] p-2 shadow-[0_18px_40px_rgba(84,58,33,0.08)]"
            >
              {[
                { value: "az", label: "A đến Z" },
                { value: "za", label: "Z đến A" },
                { value: "modified", label: "Mới nhất" },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => {
                    setSortBy(item.value as SortBy)
                    setSortOpen(false)
                  }}
                  className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left font-bold text-[#3d3026] transition hover:bg-[#f7efe5]"
                >
                  {item.label}
                  {sortBy === item.value && <Check className="h-4 w-4 text-[#c96d35]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        {filteredSets.length === 0 ? (
          <div className="dashboard-empty-state xl:col-span-2">
            <h2 className="text-3xl font-black text-[#241c17]">Chưa có bộ từ phù hợp</h2>
            <p className="mt-3 max-w-xl text-[#66584b]">
              Thử từ khóa khác hoặc tạo một bộ từ mới để bắt đầu.
            </p>
          </div>
        ) : (
          filteredSets.map((set) => (
            <button
              key={set.id}
              onClick={() => router.push(`/vocabsets/${set.id}`)}
              className="dashboard-card text-left transition hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#231b18] text-2xl text-[#f8f1e8]">
                    {set.icon || "A"}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-[#241c17]">{set.title}</h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#66584b]">
                      {set.description || "Bộ từ vựng sẵn sàng để bạn tiếp tục học và ôn tập."}
                    </p>
                  </div>
                </div>

                <div className="rounded-full bg-[#f1e4d6] px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#8d6542]">
                  {set.tag || "Tổng hợp"}
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <div className="dashboard-soft-card">
                  <p className="dashboard-card-label">Đã nhớ</p>
                  <p className="mt-3 text-3xl font-black text-[#2f7a55]">{set.mastered_words}</p>
                </div>
                <div className="dashboard-soft-card">
                  <p className="dashboard-card-label">Đang học</p>
                  <p className="mt-3 text-3xl font-black text-[#7d56d6]">{set.learning_words}</p>
                </div>
                <div className="dashboard-soft-card">
                  <p className="dashboard-card-label">Chưa học</p>
                  <p className="mt-3 text-3xl font-black text-[#c96d35]">{set.unlearned_words}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-[#66584b]">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {set.author}
                </div>
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4" />
                  {formatRelativeTime(set.last_studied_at)}
                </div>
                <div className="font-bold text-[#241c17]">{set.total_words || 0} từ</div>
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  )
}
