"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowRight,
  BookOpen,
  Brain,
  CalendarDays,
  ChartColumn,
  Clock3,
  FolderOpen,
  Plus,
  Sparkles,
  Target,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getEffectiveReviewDate, startOfDay } from "@/lib/review-due"
import { MASTERED_LEVEL } from "@/lib/spaced-repetition"

type Role = "ADMIN" | "PREMIUM" | "MEMBER" | string

type DashboardSet = {
  id: string
  title: string
  description?: string | null
  tag?: string | null
  icon?: string | null
  created_at: string
  total_words: number
}

type SupabaseSetRow = {
  id: string
  title: string
  description?: string | null
  tag?: string | null
  icon?: string | null
  created_at: string
  vocab_words?: {
    count: number
  }[]
}

type DashboardSession = {
  set_id: string
  updated_at: string
  all_words?: {
    memoryStrength?: number
  }[] | null
}

type ReviewForecastRow = {
  id: string
  review_at?: string | null
  repetitions?: number | null
  last_reviewed_at?: string | null
  mastered_at?: string | null
  proficient_at?: string | null
  fluent_at?: string | null
  level_changed_at?: string | null
  vocab_words?: { id: string } | { id: string }[] | null
}

type ReviewForecastPoint = {
  key: string
  label: string
  fullLabel: string
  count: number
  isToday: boolean
}

const getRoleBadgeClass = (role: Role) => {
  if (role === "ADMIN") return "bg-[#7e2a26] text-white"
  if (role === "PREMIUM") return "bg-[#f2c96d] text-[#2d211a]"
  return "bg-[#efe1cf] text-[#7b5d44]"
}

const formatRelativeTime = (value?: string | null) => {
  if (!value) return "Chưa học lần nào"

  const date = new Date(value)
  const diff = Date.now() - date.getTime()

  if (Number.isNaN(date.getTime())) return "Chưa học lần nào"

  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "Vừa xong"
  if (minutes < 60) return `${minutes} phút trước`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} ngày trước`

  return date.toLocaleDateString("vi-VN")
}

const formatShortDayLabel = (date: Date, isToday: boolean) => {
  if (isToday) return "H.nay"

  const day = date.getDay()
  if (day === 0) return "CN"
  return `Th${day + 1}`
}

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("bạn")
  const [role, setRole] = useState<Role>("MEMBER")
  const [sets, setSets] = useState<DashboardSet[]>([])
  const [lastStudyAt, setLastStudyAt] = useState<string | null>(null)
  const [masteredWords, setMasteredWords] = useState(0)
  const [learningWords, setLearningWords] = useState(0)
  const [totalWords, setTotalWords] = useState(0)
  const [dueReviewCount, setDueReviewCount] = useState(0)
  const [forecast, setForecast] = useState<ReviewForecastPoint[]>([])

  useEffect(() => {
    const loadDashboard = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, role")
        .eq("id", user.id)
        .maybeSingle()

      setName(profile?.username || user.user_metadata?.full_name || user.email || "bạn")
      setRole((profile?.role as Role) || "MEMBER")

      const { data: setsData } = await supabase
        .from("vocab_sets")
        .select(`
          id,
          title,
          description,
          tag,
          icon,
          created_at,
          vocab_words(count)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(4)

      const normalizedSets: DashboardSet[] = ((setsData || []) as SupabaseSetRow[]).map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        tag: item.tag,
        icon: item.icon,
        created_at: item.created_at,
        total_words: item.vocab_words?.[0]?.count || 0,
      }))

      setSets(normalizedSets)
      setTotalWords(normalizedSets.reduce((sum, item) => sum + item.total_words, 0))

      const now = new Date()
      const today = startOfDay(now)
      const next7Days = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(today)
        date.setDate(today.getDate() + index)
        return date
      })

      const { data: reviewRows } = await supabase
        .from("user_word_progress")
        .select(`
          id,
          review_at,
          repetitions,
          last_reviewed_at,
          mastered_at,
          proficient_at,
          fluent_at,
          level_changed_at,
          vocab_words!inner(id)
        `)
        .eq("user_id", user.id)
        .gte("repetitions", MASTERED_LEVEL)

      const rows = (reviewRows || []) as ReviewForecastRow[]
      const buckets = new Map<string, number>(
        next7Days.map((date) => [startOfDay(date).toISOString(), 0])
      )
      const maturedCount = rows.filter((row) => (row.repetitions || 0) >= MASTERED_LEVEL).length

      rows.forEach((row) => {
        if ((row.repetitions ?? 0) < MASTERED_LEVEL) {
          return
        }

        const effectiveDate = getEffectiveReviewDate(row, now)
        const key = effectiveDate.toISOString()

        if (buckets.has(key)) {
          buckets.set(key, (buckets.get(key) || 0) + 1)
        }
      })

      setDueReviewCount(buckets.get(today.toISOString()) || 0)
      setMasteredWords(maturedCount)
      setForecast(
        next7Days.map((date, index) => {
          const key = startOfDay(date).toISOString()
          const isToday = index === 0

          return {
            key,
            label: formatShortDayLabel(date, isToday),
            fullLabel: date.toLocaleDateString("vi-VN"),
            count: buckets.get(key) || 0,
            isToday,
          }
        })
      )

      const setIds = normalizedSets.map((item) => item.id)

      if (setIds.length > 0) {
        const { data: sessions } = await supabase
          .from("learning_sessions")
          .select("set_id, updated_at, all_words")
          .eq("user_id", user.id)
          .in("set_id", setIds)
          .order("updated_at", { ascending: false })

        const sessionList = (sessions || []) as DashboardSession[]
        const latestSession = sessionList[0]

        setLastStudyAt(latestSession?.updated_at || null)

        let learning = 0

        sessionList.forEach((session) => {
          ;(session.all_words || []).forEach((word) => {
            const strength = word.memoryStrength || 0
            if (strength >= 1 && strength < 4) learning += 1
          })
        })

        setLearningWords(learning)
      }

      setLoading(false)
    }

    loadDashboard()
  }, [])

  const reviewProgress =
    totalWords > 0 ? Math.min(100, Math.round(((masteredWords + learningWords) / totalWords) * 100)) : 0

  const maxForecastCount = useMemo(
    () => Math.max(...forecast.map((item) => item.count), 1),
    [forecast]
  )

  if (loading) {
    return (
      <section className="dashboard-shell min-h-[calc(100vh-5rem)]">
        <div className="dashboard-loading">
          <div className="dashboard-spinner" />
          <p className="dashboard-loading-text">Đang tải tổng quan học tập</p>
        </div>
      </section>
    )
  }

  return (
    <section className="dashboard-shell">
      <div className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <div className="dashboard-pill">
            <Sparkles className="h-4 w-4" />
            Tổng quan học tập hôm nay
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#9c6f49]">
              Xin chào, {name}
            </p>
            <span
              className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${getRoleBadgeClass(role)}`}
            >
              {role}
            </span>
          </div>

          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.04em] text-[#211914] md:text-6xl">
            Tiếp tục lộ trình từ vựng
            <span className="block text-[#c96d35]">mà bạn đã bắt đầu.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#66584b]">
            Dashboard mới ưu tiên sự rõ ràng: biết bộ nào cần học, tiến độ đang ở đâu
            và hôm nay nên tiếp tục từ phần nào.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <button
              onClick={() => router.push("/new")}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d96d32] px-7 py-4 text-base font-bold text-white shadow-[0_18px_40px_rgba(217,109,50,0.28)] transition hover:bg-[#c45f29]"
            >
              <Plus className="h-4 w-4" />
              Tạo bộ từ mới
            </button>
            <button
              onClick={() => router.push("/folders")}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#dac5b1] bg-[#fff9f3] px-7 py-4 text-base font-bold text-[#3d3026] transition hover:border-[#c96d35] hover:text-[#c96d35]"
            >
              <FolderOpen className="h-4 w-4" />
              Mở kho từ vựng
            </button>
          </div>
        </div>

        <div className="dashboard-hero-panel">
          <div className="dashboard-panel-dark">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#d6b396]">
                  Học ngắt quãng
                </p>
                <h2 className="mt-2 text-2xl font-black">Dự báo ôn tập 7 ngày tới</h2>
              </div>
              <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
                {dueReviewCount} từ
              </div>
            </div>

            <div className="mt-6 rounded-[1.75rem] bg-[#fff8ef] p-5 text-[#241b16]">
              <div>
                <p className="text-sm font-semibold text-[#966740]">Từ đến hạn hôm nay</p>
                <p className="mt-2 text-3xl font-black">{dueReviewCount}</p>
              </div>

              <div className="mt-6">
                <p className="text-sm font-bold text-[#8e6747] underline decoration-[#e5c7a7] underline-offset-4">
                  Dự báo ôn tập 7 ngày tới
                </p>

                <div className="mt-5">
                  <div className="flex items-end gap-2">
                    {forecast.map((item) => {
                      const height = item.count === 0 ? 6 : Math.max(18, (item.count / maxForecastCount) * 88)

                      return (
                        <div key={item.key} className="flex flex-1 flex-col items-center gap-2">
                          <p
                            className={`text-xs font-bold ${
                              item.isToday ? "text-[#d96d32]" : "text-[#8a7a6c]"
                            }`}
                          >
                            {item.count || ""}
                          </p>
                          <div className="flex h-24 w-full items-end">
                            <div
                              title={`${item.fullLabel}: ${item.count} từ`}
                              className={`w-full rounded-t-md transition-all duration-500 ${
                                item.isToday
                                  ? "bg-[linear-gradient(180deg,#ff7a18_0%,#f0be64_100%)]"
                                  : "bg-[#6c6761]"
                              }`}
                              style={{ height }}
                            />
                          </div>
                          <p
                            className={`text-sm font-medium ${
                              item.isToday ? "text-[#ff7a18]" : "text-[#6f655b]"
                            }`}
                          >
                            {item.label}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <button
                  onClick={() => router.push("/review/all")}
                  className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#050505] font-black text-white transition hover:bg-[#191512]"
                >
                  <CalendarDays className="h-4 w-4" />
                  Lặp lại ngắt quãng
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-stat-grid mt-6">
        {[
          { label: "Tổng số từ", value: totalWords, accent: "text-[#c96d35]", icon: BookOpen },
          { label: "Đã nhớ chắc", value: masteredWords, accent: "text-[#2f7a55]", icon: Brain },
          { label: "Đang học", value: learningWords, accent: "text-[#7d56d6]", icon: Target },
          { label: "Đến hạn ôn", value: dueReviewCount, accent: "text-[#226f8a]", icon: ChartColumn },
        ].map(({ label, value, accent, icon: Icon }) => (
          <article key={label} className="dashboard-card">
            <div className="flex items-center justify-between gap-3">
              <p className="dashboard-card-label">{label}</p>
              <div className="dashboard-icon-wrap">
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className={`mt-5 text-4xl font-black tracking-[-0.04em] ${accent}`}>{value}</p>
          </article>
        ))}
      </div>

      <div className="dashboard-grid mt-6">
        <div className="space-y-6 xl:col-span-2">
          <article className="dashboard-card">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="dashboard-card-label">Tiến độ hôm nay</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#241c17]">
                  Bạn đang đi đúng hướng
                </h2>
              </div>
              <div className="rounded-full bg-[#f2e4d5] px-4 py-2 text-sm font-bold text-[#8f633f]">
                {reviewProgress}% hoàn thành
              </div>
            </div>

            <div className="mt-6 h-4 overflow-hidden rounded-full bg-[#eee2d6]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#d96d32_0%,#f0be64_100%)]"
                style={{ width: `${reviewProgress}%` }}
              />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                ["Đã nhớ", masteredWords],
                ["Đang ôn", learningWords],
                ["Còn lại", Math.max(totalWords - masteredWords - learningWords, 0)],
              ].map(([label, value]) => (
                <div key={label} className="dashboard-soft-card">
                  <p className="dashboard-card-label">{label}</p>
                  <p className="mt-3 text-3xl font-black text-[#241c17]">{value}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-card">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="dashboard-card-label">Bộ từ gần đây</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#241c17]">
                  Chọn một bộ và học tiếp
                </h2>
              </div>
              <Link
                href="/folders"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#c96d35] transition hover:text-[#a95424]"
              >
                Xem tất cả
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {sets.length > 0 ? (
                sets.map((set) => (
                  <button
                    key={set.id}
                    onClick={() => router.push(`/vocabsets/${set.id}`)}
                    className="dashboard-list-row text-left"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#231b18] text-2xl text-[#f8f1e8]">
                        {set.icon || "A"}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-[#221a16]">{set.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-[#66584b]">
                          {set.description || "Bộ từ vựng sẵn sàng để bạn tiếp tục học và ôn tập."}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-[#f1e4d6] px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#8d6542]">
                        {set.tag || "Tổng hợp"}
                      </span>
                      <span className="text-sm font-semibold text-[#766457]">{set.total_words} từ</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="dashboard-empty-state">
                  <p className="text-lg font-bold text-[#281f19]">Bạn chưa có bộ từ nào.</p>
                  <p className="mt-2 text-sm leading-6 text-[#6d5f53]">
                    Tạo bộ đầu tiên để dashboard bắt đầu theo dõi tiến độ cho bạn.
                  </p>
                  <button
                    onClick={() => router.push("/new")}
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#1f1a17] px-5 py-3 text-sm font-bold text-[#fff8f0]"
                  >
                    <Plus className="h-4 w-4" />
                    Tạo bộ mới
                  </button>
                </div>
              )}
            </div>
          </article>
        </div>

        <div className="space-y-6">
          <article className="dashboard-card">
            <p className="dashboard-card-label">Thao tác nhanh</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#241c17]">
              Hôm nay bạn muốn làm gì?
            </h2>

            <div className="mt-6 grid grid-cols-2 gap-4">
              {[
                { label: "Tạo bộ mới", href: "/new" },
                { label: "Mở folders", href: "/folders" },
                { label: "Ôn ngắt quãng", href: "/review/all" },
                { label: "Community", href: "/community" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => router.push(item.href)}
                  className="dashboard-soft-card text-left font-bold text-[#322821] transition hover:border-[#c96d35] hover:text-[#c96d35]"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </article>

          <article className="dashboard-card bg-[linear-gradient(180deg,#231b18_0%,#352820_100%)] text-[#f8f1e8]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#deb996]">
              Nhịp học
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em]">
              {dueReviewCount > 0 ? `${dueReviewCount} từ đang đến hạn ôn` : "Hôm nay chưa có thẻ đến hạn"}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#d8c9ba]">
              Bạn có thể ôn ngắt quãng toàn bộ kho từ hoặc đi vào từng bộ để học theo lịch SRS riêng.
            </p>

            <div className="mt-6 flex items-center gap-3 text-sm font-semibold text-[#f1c86f]">
              <Clock3 className="h-4 w-4" />
              {formatRelativeTime(lastStudyAt)}
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
