"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Volume2, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import {
  MASTERED_LEVEL,
  buildMasteryTimestampUpdate,
  calculateSrsReviewUpdate,
} from "@/lib/spaced-repetition"
import { getEffectiveReviewDate, isDueForReviewToday } from "@/lib/review-due"

type ReviewSessionProps = {
  setId?: string
}

type ReviewWord = {
  id: string
  word: string
  meaning: string
  ipa?: string
  example?: string
  word_type?: string
  audio_url?: string
  review_id: string
  interval_days: number
  repetitions: number
  ease_factor: number
  review_at?: string | null
  mastered_at?: string | null
  proficient_at?: string | null
  fluent_at?: string | null
  level_changed_at?: string | null
  set_id: string
  set_title: string
}

type ReviewRow = {
  id: string
  repetitions?: number | null
  interval_days?: number | null
  ease_factor?: number | null
  review_at?: string | null
  last_reviewed_at?: string | null
  mastered_at?: string | null
  proficient_at?: string | null
  fluent_at?: string | null
  level_changed_at?: string | null
  vocab_words?: ReviewRowWord | ReviewRowWord[] | null
}

type AnswerState = "idle" | "showing"

type ReviewRowWord = {
  id: string
  word: string
  meaning: string
  ipa?: string | null
  example?: string | null
  word_type?: string | null
  audio_url?: string | null
  set_id: string
  vocab_sets?: { title?: string | null } | { title?: string | null }[] | null
}

const shuffleWords = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5)

const getLoginRedirectUrl = () => {
  const redirectTo = `${window.location.pathname}${window.location.search}`
  return `/login?redirectTo=${encodeURIComponent(redirectTo)}`
}

const first = <T,>(value: T | T[] | null | undefined) =>
  Array.isArray(value) ? value[0] : value

export default function ReviewSession({ setId }: ReviewSessionProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [queue, setQueue] = useState<ReviewWord[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answerState, setAnswerState] = useState<AnswerState>("idle")
  const [sessionDone, setSessionDone] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null)
  const [sessionTitle, setSessionTitle] = useState("")

  const currentWord = queue[currentIndex]
  const totalCards = queue.length
  const progressPercent =
    totalCards > 0 ? Math.round((currentIndex / totalCards) * 100) : 0
  const accuracy =
    currentIndex > 0 ? Math.round((correctCount / currentIndex) * 100) : 0
  const dueCountText = loading ? "..." : `${totalCards} thẻ đến hạn`
  const isReviewAll = !setId

  useEffect(() => {
    const fetchReviewSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push(getLoginRedirectUrl())
        return
      }

      if (setId) {
        const { data: setData } = await supabase
          .from("vocab_sets")
          .select("title")
          .eq("id", setId)
          .single()

        setSessionTitle(setData?.title || "Học ngắt quãng")
      } else {
        setSessionTitle("Tất cả bộ từ")
      }

      let query = supabase
        .from("user_word_progress")
        .select(`
          id,
          repetitions,
          interval_days,
          ease_factor,
          review_at,
          last_reviewed_at,
          mastered_at,
          proficient_at,
          fluent_at,
          level_changed_at,
          vocab_words!inner(
            id,
            word,
            meaning,
            ipa,
            example,
            word_type,
            audio_url,
            set_id,
            vocab_sets(title)
          )
        `)
        .eq("user_id", user.id)
        .gte("repetitions", MASTERED_LEVEL)
        .order("level_changed_at", { ascending: true })

      if (setId) {
        query = query.eq("vocab_words.set_id", setId)
      }

      const { data: progressRows, error } = await query

      if (error) {
        console.log(error)
        setLoading(false)
        return
      }

      const reviewWords: ReviewWord[] = ((progressRows || []) as unknown as ReviewRow[])
        .filter((row) => isDueForReviewToday(row) && first(row.vocab_words))
        .sort(
          (a, b) =>
            getEffectiveReviewDate(a).getTime() -
            getEffectiveReviewDate(b).getTime()
        )
        .map((row) => {
          const word = first(row.vocab_words)!
          const setInfo = first(word.vocab_sets)

          return {
            id: word.id,
            word: word.word,
            meaning: word.meaning,
            ipa: word.ipa || undefined,
            example: word.example || undefined,
            word_type: word.word_type || undefined,
            audio_url: word.audio_url || undefined,
            review_id: row.id,
            interval_days: row.interval_days || 1,
            repetitions: row.repetitions || 0,
            ease_factor: row.ease_factor || 2.5,
            review_at: row.review_at,
            mastered_at: row.mastered_at,
            proficient_at: row.proficient_at,
            fluent_at: row.fluent_at,
            level_changed_at: row.level_changed_at,
            set_id: word.set_id,
            set_title: setInfo?.title || "Bo tu",
          }
        })

      setQueue(shuffleWords(reviewWords))
      setLoading(false)
    }

    fetchReviewSession()
  }, [router, setId])

  const playAudio = () => {
    if (!currentWord) return

    speechSynthesis.cancel()

    if (currentWord.audio_url) {
      const audio = new Audio(currentWord.audio_url)
      audio.play().catch(() => {
        const utterance = new SpeechSynthesisUtterance(currentWord.word)
        utterance.lang = "en-US"
        speechSynthesis.speak(utterance)
      })
      return
    }

    const utterance = new SpeechSynthesisUtterance(currentWord.word)
    utterance.lang = "en-US"
    speechSynthesis.speak(utterance)
  }

  const updateSpacedProgress = async (word: ReviewWord, correct: boolean) => {
    const nextReview = calculateSrsReviewUpdate(
      word.repetitions,
      correct
    )
    const now = new Date()

    await supabase
      .from("user_word_progress")
      .update({
        repetitions: nextReview.level,
        interval_days: nextReview.intervalDays,
        ease_factor: word.ease_factor,
        review_at: nextReview.reviewAt,
        last_reviewed_at: now.toISOString(),
        updated_at: now.toISOString(),
        ...buildMasteryTimestampUpdate(
          word.repetitions,
          nextReview.level,
          now
        ),
      })
      .eq("id", word.review_id)
  }

  const handleRate = async (correct: boolean) => {
    if (!currentWord) return

    if (answerState === "idle") {
      setAnswerState("showing")
      setLastResult(correct ? "correct" : "wrong")
      await updateSpacedProgress(currentWord, correct)

      if (correct) setCorrectCount((prev) => prev + 1)
      else setWrongCount((prev) => prev + 1)

      return
    }

    const nextIndex = currentIndex + 1
    setAnswerState("idle")
    setLastResult(null)

    if (nextIndex >= totalCards) {
      setSessionDone(true)
      return
    }

    setCurrentIndex(nextIndex)
  }

  if (loading) {
    return (
      <section className="dashboard-shell min-h-screen flex items-center justify-center">
        <div className="dashboard-loading">
          <div className="dashboard-spinner" />
          <p className="dashboard-loading-text">
            {isReviewAll ? "Đang tải ôn tập tổng hợp" : "Đang tải học ngắt quãng"}
          </p>
        </div>
      </section>
    )
  }

  if (sessionDone || totalCards === 0) {
    return (
      <section className="dashboard-shell min-h-screen flex items-center justify-center">
        <div className="relative w-full max-w-3xl overflow-hidden rounded-[2.5rem] border border-[#e6d5c4] bg-[#fffaf3] p-8 text-center shadow-[0_30px_90px_rgba(84,58,33,0.12)] md:p-10">
          <div className="absolute left-[-4rem] top-[-4rem] h-40 w-40 rounded-full bg-[#f5c86f]/25 blur-3xl" />
          <div className="absolute bottom-[-5rem] right-[-3rem] h-48 w-48 rounded-full bg-[#d96d32]/12 blur-3xl" />

          <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,#e3f9e7_0%,#c8f1d1_70%,#b5e8c3_100%)] shadow-[0_18px_40px_rgba(63,166,92,0.18)]">
            <div className="absolute inset-0 rounded-full border border-white/60 animate-ping" />
            <Check className="relative h-14 w-14 text-green-600" />
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.28em] text-[#9a6d48]">
            {isReviewAll ? "Phiên ôn tập tổng hợp đã xong" : "Phiên ôn tập đã xong"}
          </p>
          <h1 className="mt-3 text-4xl font-black text-[#241c17] md:text-5xl">
            {totalCards === 0 ? "Chưa có thẻ đến hạn" : "Hoàn thành!"}
          </h1>
          <p className="mt-4 text-lg leading-8 text-[#66584b]">
            {totalCards === 0
              ? isReviewAll
                ? "Hiện chưa có từ nào cần ôn ngay trên toàn bộ kho từ của bạn."
                : "Hiện chưa có từ nào cần ôn ngay. Hãy quay lại sau theo lịch SRS."
              : isReviewAll
                ? "Bạn đã hoàn thành buổi học ngắt quãng cho tất cả bộ từ đến hạn."
                : "Bạn đã hoàn thành buổi học ngắt quãng cho bộ từ này."}
          </p>

          {totalCards > 0 && (
            <>
              <div className="relative mt-8 rounded-[2rem] border border-[#eadccf] bg-[linear-gradient(180deg,#fff7ef_0%,#fffaf3_100%)] p-6">
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#9a6d48]">
                  Tỷ lệ đúng
                </p>
                <div className="mt-3 flex items-end justify-center gap-3">
                  <p className="text-6xl font-black tracking-[-0.05em] text-[#241c17]">
                    {accuracy}
                  </p>
                  <span className="pb-2 text-2xl font-black text-[#c96d35]">%</span>
                </div>
                <div className="mx-auto mt-5 h-4 max-w-md overflow-hidden rounded-full bg-[#efe2d3]">
                  <div
                    className="relative h-full rounded-full bg-[linear-gradient(90deg,#d96d32_0%,#f0be64_100%)] transition-all duration-700 ease-out"
                    style={{ width: `${accuracy}%` }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.38)_40%,transparent_80%)] animate-[pulse_1.8s_ease-in-out_infinite]" />
                  </div>
                </div>
              </div>

              <div className="relative mt-6 grid gap-4 sm:grid-cols-3">
                <div className="dashboard-soft-card">
                  <p className="dashboard-card-label">Đúng</p>
                  <p className="mt-3 text-3xl font-black text-[#2f7a55]">{correctCount}</p>
                </div>
                <div className="dashboard-soft-card">
                  <p className="dashboard-card-label">Sai</p>
                  <p className="mt-3 text-3xl font-black text-[#c96d35]">{wrongCount}</p>
                </div>
                <div className="dashboard-soft-card">
                  <p className="dashboard-card-label">Đã ôn</p>
                  <p className="mt-3 text-3xl font-black text-[#226f8a]">{totalCards}</p>
                </div>
              </div>
            </>
          )}

          <button
            onClick={() => router.push(setId ? `/vocabsets/${setId}` : "/home")}
            className="relative mt-10 inline-flex h-14 items-center justify-center rounded-3xl bg-[#1f1a17] px-8 text-lg font-bold text-white transition hover:scale-[1.03] active:scale-[0.98]"
          >
            {setId ? "Quay về bộ từ" : "Quay về trang chủ"}
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="dashboard-shell">
      <div className="mx-auto max-w-4xl">
        <div className="dashboard-card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 font-bold text-[#6b5b4d] transition hover:text-[#241c17]"
            >
              <ArrowLeft className="h-5 w-5" />
              Quay lại
            </button>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#f1e4d6] px-4 py-2 text-sm font-bold text-[#8d6542]">
                {dueCountText}
              </span>
              <span className="rounded-full bg-[#f3eadf] px-4 py-2 text-sm font-bold text-[#8d6542]">
                Đúng: {accuracy}%
              </span>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="dashboard-card-label">
                  {isReviewAll ? "Học ngắt quãng tổng hợp" : "Học ngắt quãng"}
                </p>
                <h1 className="mt-2 text-3xl font-black text-[#241c17]">
                  {sessionTitle}
                </h1>
              </div>
              <p className="text-sm font-bold text-[#8d6542]">
                {currentIndex + 1}/{totalCards}
              </p>
            </div>
            <div className="relative h-4 overflow-hidden rounded-full bg-[#eee2d6]">
              <div
                className="relative h-full rounded-full bg-[linear-gradient(90deg,#d96d32_0%,#f0be64_100%)] transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.38)_40%,transparent_80%)] animate-[pulse_1.8s_ease-in-out_infinite]" />
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[2rem] bg-[linear-gradient(180deg,#231b18_0%,#352820_100%)] p-8 text-[#f8f1e8]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#ddb897]">
                  Thẻ đến hạn ôn tập
                </p>
                <h2 className="mt-2 text-4xl font-black">{currentWord.word}</h2>
                {isReviewAll ? (
                  <p className="mt-2 text-sm font-semibold text-[#f1d4bb]">
                    Thuộc bộ: {currentWord.set_title}
                  </p>
                ) : null}
                <div className="mt-3 flex items-center gap-3">
                  {currentWord.word_type ? (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase text-[#f1d4bb]">
                      {currentWord.word_type}
                    </span>
                  ) : null}
                  {currentWord.ipa ? (
                    <span className="text-sm font-medium text-[#d8c9ba]">
                      {currentWord.ipa}
                    </span>
                  ) : null}
                </div>
              </div>

              <button
                onClick={playAudio}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white transition duration-200 hover:bg-white/15 active:scale-95"
              >
                <Volume2 className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 rounded-[1.75rem] bg-[#fff8ef] p-6 text-[#241b16]">
              <p className="text-sm font-semibold text-[#966740]">Nghĩa</p>
              <p className="mt-2 text-3xl font-black">{currentWord.meaning}</p>

              {currentWord.example ? (
                <div className="mt-5 rounded-2xl bg-white px-4 py-3">
                  <p className="mb-2 text-sm font-bold text-gray-400">Ví dụ</p>
                  <p className="italic leading-relaxed text-gray-700">{currentWord.example}</p>
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-[#8b6a50]">
                <span className="rounded-full bg-[#f3e7da] px-4 py-2">
                  Lặp lại: {currentWord.repetitions}
                </span>
                <span className="rounded-full bg-[#f3e7da] px-4 py-2">
                  Chu kỳ: {currentWord.interval_days} ngày
                </span>
              </div>
            </div>

            {answerState === "showing" && (
              <div
                className={`mt-6 rounded-[1.75rem] p-5 ${
                  lastResult === "correct"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  {lastResult === "correct" ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <X className="h-6 w-6" />
                  )}
                  <p className="text-lg font-black">
                    {lastResult === "correct"
                      ? "Tuyệt, từ này sẽ được đẩy lịch ôn xa hơn."
                      : "Chưa ổn, mình sẽ đưa từ này quay lại sớm hơn."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {answerState === "idle" ? (
              <>
                <button
                  onClick={() => handleRate(false)}
                  className="flex h-14 items-center justify-center rounded-3xl bg-[#f3e7da] text-base font-bold text-[#8b5e3c] transition hover:bg-[#ead8c5]"
                >
                  Chưa nhớ
                </button>
                <button
                  onClick={() => handleRate(true)}
                  className="flex h-14 items-center justify-center rounded-3xl bg-[#d96d32] text-base font-bold text-white transition hover:bg-[#c25f29]"
                >
                  Nhớ rồi
                </button>
              </>
            ) : (
              <button
                onClick={() => handleRate(lastResult === "correct")}
                className="flex h-14 items-center justify-center rounded-3xl bg-[#1f1a17] text-base font-bold text-white transition hover:bg-[#2d241f] sm:col-span-2"
              >
                Thẻ tiếp theo
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

