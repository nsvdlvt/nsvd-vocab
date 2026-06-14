"use client"

import { useEffect, useEffectEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Clock3, MoreHorizontal, Pencil, Search, SlidersHorizontal, Trash2, User } from "lucide-react"
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

type ProgressActivityRow = {
  word_id?: string | null
  last_reviewed_at?: string | null
  updated_at?: string | null
}

type VocabWordSetRow = {
  id: string
  set_id?: string | null
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

const latestDate = (...values: (string | null | undefined)[]) => {
  const latest = values
    .map((value) => (value ? new Date(value).getTime() : Number.NaN))
    .filter((value) => !Number.isNaN(value))
    .sort((a, b) => b - a)[0]

  return latest ? new Date(latest).toISOString() : null
}

export default function ArchivePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [sets, setSets] = useState<VocabSet[]>([])
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortBy>("modified")
  const [filterTag, setFilterTag] = useState("all")
  const [sortOpen, setSortOpen] = useState(false)
  const [openSetMenuId, setOpenSetMenuId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<VocabSet | null>(null)
  const [deleteError, setDeleteError] = useState("")

  const loadSets = useEffectEvent(async (showInitialLoading = false) => {
      if (showInitialLoading) {
        setLoading(true)
      }

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

      const sessionBySetId = new Map<string, LearningSession>()
      ;((sessions as LearningSession[] | null) || []).forEach((learningSession) => {
        const currentSession = sessionBySetId.get(learningSession.set_id)
        const currentTime = currentSession?.updated_at
          ? new Date(currentSession.updated_at).getTime()
          : Number.NaN
        const nextTime = new Date(learningSession.updated_at).getTime()

        if (!currentSession || nextTime > currentTime) {
          sessionBySetId.set(learningSession.set_id, learningSession)
        }
      })

      const { data: wordRows } =
        setIds.length > 0
          ? await supabase
              .from("vocab_words")
              .select("id, set_id")
              .in("set_id", setIds)
          : { data: [] }

      const wordSetById = new Map(
        ((wordRows || []) as VocabWordSetRow[]).map((word) => [word.id, word.set_id || ""])
      )
      const wordIds = Array.from(wordSetById.keys())

      const { data: progressRows } =
        wordIds.length > 0
          ? await supabase
              .from("user_word_progress")
              .select("word_id, last_reviewed_at, updated_at")
              .eq("user_id", user.id)
              .in("word_id", wordIds)
          : { data: [] }

      const latestProgressBySetId = new Map<string, string>()
      ;((progressRows || []) as unknown as ProgressActivityRow[]).forEach((row) => {
        const setId = row.word_id ? wordSetById.get(row.word_id) : null
        if (!setId) return

        const nextLatest = latestDate(row.last_reviewed_at, row.updated_at)
        const currentLatest = latestProgressBySetId.get(setId)
        const latest = latestDate(currentLatest, nextLatest)

        if (latest) {
          latestProgressBySetId.set(setId, latest)
        }
      })

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
          last_studied_at: latestDate(
            sessionBySetId.get(item.id)?.updated_at,
            latestProgressBySetId.get(item.id)
          ),
        }
      })

      setSets(formatted)
      setLoading(false)
  })

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadSets(true)
    }, 0)

    const refreshSets = () => {
      void loadSets(false)
    }
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        refreshSets()
      }
    }

    window.addEventListener("focus", refreshSets)
    window.addEventListener("pageshow", refreshSets)
    document.addEventListener("visibilitychange", refreshWhenVisible)

    return () => {
      window.clearTimeout(initialLoad)
      window.removeEventListener("focus", refreshSets)
      window.removeEventListener("pageshow", refreshSets)
      document.removeEventListener("visibilitychange", refreshWhenVisible)
    }
  }, [])

  const deleteSet = async (setId: string) => {
    const { error } = await supabase
      .from("vocab_sets")
      .delete()
      .eq("id", setId)

    if (error) {
      setDeleteError("Không thể xóa bộ từ. Vui lòng thử lại.")
      return
    }

    setSets((prev) => prev.filter((set) => set.id !== setId))
    setPendingDelete(null)
    setDeleteError("")
  }

  useEffect(() => {
    const closeMenu = () => {
      setSortOpen(false)
      setOpenSetMenuId(null)
    }
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
            <article
              key={set.id}
              onClick={() => router.push(`/vocabsets/${set.id}`)}
              className="dashboard-card relative cursor-pointer text-left transition hover:-translate-y-1"
            >
              <div className="absolute right-5 top-5 z-20">
                <button
                  type="button"
                  title="Mở menu"
                  onClick={(event) => {
                    event.stopPropagation()
                    setDeleteError("")
                    setOpenSetMenuId((prev) => (prev === set.id ? null : set.id))
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#e2d2bf] bg-[#fffaf3] text-[#3d3026] transition hover:border-[#c96d35] hover:text-[#c96d35]"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>

                {openSetMenuId === set.id ? (
                  <div
                    onClick={(event) => event.stopPropagation()}
                    className="absolute right-0 mt-2 w-40 rounded-2xl border border-[#e2d2bf] bg-[#fffaf3] p-2 shadow-[0_18px_40px_rgba(84,58,33,0.14)]"
                  >
                    <button
                      type="button"
                      onClick={() => router.push(`/edit/${set.id}`)}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-[#3d3026] transition hover:bg-[#f7efe5]"
                    >
                      <Pencil className="h-4 w-4" />
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenSetMenuId(null)
                        setDeleteError("")
                        setPendingDelete(set)
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="pr-14">
                  <div>
                    <h2 className="text-2xl font-black text-[#241c17]">{set.title}</h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#66584b]">
                      {set.description || "Bộ từ vựng sẵn sàng để bạn tiếp tục học và ôn tập."}
                    </p>
                  </div>
                </div>

                <div className="mr-14 rounded-full bg-[#f1e4d6] px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#8d6542]">
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
            </article>
          ))
        )}
      </div>

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f1a17]/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-[#ead8c4] bg-[#fffaf3] p-6 shadow-[0_28px_80px_rgba(31,26,23,0.22)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#241c17]">
                  Xóa bộ từ này?
                </h2>
                <p className="mt-2 leading-7 text-[#66584b]">
                  Bộ từ “{pendingDelete.title}” sẽ bị xóa khỏi kho của bạn. Hành động này không thể hoàn tác.
                </p>
                {deleteError ? (
                  <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {deleteError}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setPendingDelete(null)
                  setDeleteError("")
                }}
                className="h-12 rounded-2xl border border-[#e2d2bf] bg-white font-bold text-[#3d3026] transition hover:border-[#c96d35]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void deleteSet(pendingDelete.id)}
                className="h-12 rounded-2xl bg-red-600 font-bold text-white transition hover:bg-red-700"
              >
                Xóa bộ từ
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
