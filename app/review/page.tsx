"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Clock3,
  Layers3,
  Play,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { isDueForReviewToday } from "@/lib/review-due"
import { MASTERED_LEVEL } from "@/lib/spaced-repetition"

type SetInfo = {
  title?: string | null
  description?: string | null
}

type DueReviewWord = {
  set_id: string
  vocab_sets?: SetInfo | SetInfo[] | null
}

type DueReviewRow = {
  review_at?: string | null
  repetitions?: number | null
  last_reviewed_at?: string | null
  mastered_at?: string | null
  proficient_at?: string | null
  fluent_at?: string | null
  level_changed_at?: string | null
  vocab_words?: DueReviewWord | DueReviewWord[] | null
}

type DueSetSummary = {
  id: string
  title: string
  description: string
  dueCount: number
}

const first = <T,>(value: T | T[] | null | undefined) =>
  Array.isArray(value) ? value[0] : value

export default function ReviewLandingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [dueSets, setDueSets] = useState<DueSetSummary[]>([])

  useEffect(() => {
    const loadDueReviews = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const { data, error } = await supabase
        .from("user_word_progress")
        .select(`
          review_at,
          repetitions,
          last_reviewed_at,
          mastered_at,
          proficient_at,
          fluent_at,
          level_changed_at,
          vocab_words!inner(
            set_id,
            vocab_sets(
              title,
              description
            )
          )
        `)
        .eq("user_id", user.id)
        .gte("repetitions", MASTERED_LEVEL)
        .order("level_changed_at", { ascending: true })

      if (error) {
        console.log(error)
        setLoading(false)
        return
      }

      const grouped = new Map<string, DueSetSummary>()

      ;((data || []) as unknown as DueReviewRow[]).forEach((row) => {
        if (!isDueForReviewToday(row)) {
          return
        }

        const word = first(row.vocab_words)
        if (!word) {
          return
        }

        const setInfo = first(word.vocab_sets)
        const current = grouped.get(word.set_id)

        if (current) {
          current.dueCount += 1
          return
        }

        grouped.set(word.set_id, {
          id: word.set_id,
          title: setInfo?.title || "Bo tu chua dat ten",
          description:
            setInfo?.description ||
            "Cac tu trong bo nay dang den han on theo lich hoc ngat quang.",
          dueCount: 1,
        })
      })

      setDueSets(
        [...grouped.values()].sort((a, b) => b.dueCount - a.dueCount)
      )
      setLoading(false)
    }

    loadDueReviews()
  }, [router])

  const totalDueWords = useMemo(
    () => dueSets.reduce((sum, item) => sum + item.dueCount, 0),
    [dueSets]
  )

  if (loading) {
    return (
      <section className="dashboard-shell min-h-[calc(100vh-5rem)]">
        <div className="dashboard-loading">
          <div className="dashboard-spinner" />
          <p className="dashboard-loading-text">Dang tai danh sach on tap</p>
        </div>
      </section>
    )
  }

  return (
    <section className="dashboard-shell">
      <div className="mx-auto max-w-6xl">
        <div className="dashboard-card overflow-hidden">
          <div className="relative">
            <div className="absolute left-[-4rem] top-[-4rem] h-40 w-40 rounded-full bg-[#f5c86f]/25 blur-3xl" />
            <div className="absolute right-[-3rem] top-8 h-36 w-36 rounded-full bg-[#d96d32]/12 blur-3xl" />

            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 font-bold text-[#6b5b4d] transition hover:text-[#241c17]"
              >
                <ArrowLeft className="h-5 w-5" />
                Quay lai
              </button>

              <button
                onClick={() => router.push("/review/all")}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-3xl bg-[#d96d32] px-6 text-base font-bold text-white transition hover:bg-[#c25f29]"
              >
                <Play className="h-4 w-4" />
                On tat ca ngay
              </button>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#9a6d48]">
                  Hoc ngat quang
                </p>
                <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.04em] text-[#241c17] md:text-5xl">
                  Vao la thay ngay cac tu den han on tap hom nay.
                </h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-[#66584b]">
                  Chon hoc toan bo hoac bat dau tu tung bo tu co the dang den
                  han theo lich SRS.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <div className="dashboard-soft-card">
                  <div className="flex items-center gap-2 text-[#8d6542]">
                    <Clock3 className="h-4 w-4" />
                    <p className="dashboard-card-label">Den han hom nay</p>
                  </div>
                  <p className="mt-3 text-3xl font-black text-[#241c17]">
                    {totalDueWords}
                  </p>
                </div>
                <div className="dashboard-soft-card">
                  <div className="flex items-center gap-2 text-[#8d6542]">
                    <Layers3 className="h-4 w-4" />
                    <p className="dashboard-card-label">So bo can on</p>
                  </div>
                  <p className="mt-3 text-3xl font-black text-[#241c17]">
                    {dueSets.length}
                  </p>
                </div>
                <div className="dashboard-soft-card">
                  <div className="flex items-center gap-2 text-[#8d6542]">
                    <CalendarDays className="h-4 w-4" />
                    <p className="dashboard-card-label">Che do</p>
                  </div>
                  <p className="mt-3 text-xl font-black text-[#241c17]">
                    Review SRS
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          {dueSets.length === 0 ? (
            <div className="dashboard-card text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f7eadb] text-[#c96d35]">
                <BookOpen className="h-9 w-9" />
              </div>
              <h2 className="mt-5 text-3xl font-black text-[#241c17]">
                Chua co tu nao den han
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-lg leading-8 text-[#66584b]">
                Hom nay ban chua co the on tap nao can xu ly. Khi den lich, cac
                tu se tu hien o day.
              </p>
              <button
                onClick={() => router.push("/home")}
                className="mt-8 inline-flex h-12 items-center justify-center rounded-3xl bg-[#1f1a17] px-6 text-base font-bold text-white transition hover:bg-[#2d241f]"
              >
                Quay ve trang chu
              </button>
            </div>
          ) : (
            <div className="grid gap-5">
              {dueSets.map((set) => (
                <div
                  key={set.id}
                  className="dashboard-card flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-[#f3e7da] px-4 py-2 text-sm font-bold text-[#8d6542]">
                        {set.dueCount} the den han
                      </span>
                      <span className="rounded-full bg-[#eef5ff] px-4 py-2 text-sm font-bold text-[#2b6cb0]">
                        San sang on ngay
                      </span>
                    </div>
                    <h2 className="mt-4 text-3xl font-black text-[#241c17]">
                      {set.title}
                    </h2>
                    <p className="mt-3 text-base leading-7 text-[#66584b]">
                      {set.description}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={() => router.push(`/vocabsets/${set.id}`)}
                      className="inline-flex h-12 items-center justify-center rounded-3xl border border-[#dac5b1] bg-[#fff9f3] px-5 text-sm font-bold text-[#3d3026] transition hover:border-[#c96d35] hover:text-[#c96d35]"
                    >
                      Xem bo tu
                    </button>
                    <button
                      onClick={() => router.push(`/review/${set.id}`)}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-3xl bg-[#1f1a17] px-5 text-sm font-bold text-white transition hover:bg-[#2d241f]"
                    >
                      <Play className="h-4 w-4" />
                      Bat dau on
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
