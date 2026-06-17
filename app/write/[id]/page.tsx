"use client"

import { use, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Loader2,
  RefreshCcw,
  X,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import LoadingScreen from "@/components/ui/loading-screen"
import {
  fetchDueWordsForCurrentUser,
  isReviewDueSet,
} from "@/lib/review-due-words"
import {
  buildMasteryTimestampUpdate,
  calculateSpacedRepetitionUpdate,
} from "@/lib/spaced-repetition"
import { toUtcIsoString } from "@/lib/time"

type LearningWord = {
  id: string
  word: string
  meaning: string
  ipa?: string | null
  example?: string | null
  word_type?: string | null
  memoryStrength: number
}

type UserWordProgressRow = {
  id: string
  repetitions?: number | null
  ease_factor?: number | null
  total_correct?: number | null
  total_wrong?: number | null
}

type ClozeQuestion = {
  id: string
  wordId: string
  word: string
  meaning: string
  sentence: string
  maskedSentence: string
}

const clampMemoryStrength = (strength: number) =>
  Math.min(Math.max(strength, -1), 4)

const getLoginRedirectUrl = () => {
  const redirectTo = `${window.location.pathname}${window.location.search}`
  return `/login?redirectTo=${encodeURIComponent(redirectTo)}`
}

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()

const shuffleWords = <T,>(items: T[]) =>
  [...items].sort(() => Math.random() - 0.5)

const maskWordInSentence = (sentence: string, word: string) => {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const pattern = new RegExp(`\\b${escaped}\\b`, "i")

  if (pattern.test(sentence)) {
    return sentence.replace(pattern, "_______")
  }

  return sentence
}

const sanitizeExample = (sentence: string, fallbackWord: string) => {
  const trimmed = sentence.trim()
  if (!trimmed) {
    return `${fallbackWord} is used in an everyday situation.`
  }
  return trimmed
}

export default function WritePage({
  params,
}: {
  params: Promise<{
    id: string
  }>
}) {
  const { id } = use(params)
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [started, setStarted] = useState(false)
  const [generatingQuestions, setGeneratingQuestions] = useState(false)
  const [words, setWords] = useState<LearningWord[]>([])
  const [questions, setQuestions] = useState<ClozeQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [input, setInput] = useState("")
  const [showAnswer, setShowAnswer] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [result, setResult] = useState<"idle" | "correct" | "wrong">("idle")
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [sessionCompleted, setSessionCompleted] = useState(false)
  const [questionAmount, setQuestionAmount] = useState("10")
  const [refreshSeed, setRefreshSeed] = useState(0)

  const maxQuestions = words.length
  const parsedAmount = Number(questionAmount)
  const isInvalidAmount =
    parsedAmount > maxQuestions || parsedAmount <= 0 || Number.isNaN(parsedAmount)

  const currentQuestion = questions[currentIndex]
  const progress = questions.length
    ? Math.round((currentIndex / questions.length) * 100)
    : 0

  useEffect(() => {
    const fetchWords = async () => {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push(getLoginRedirectUrl())
        return
      }

      const baseWords = isReviewDueSet(id)
        ? ((await fetchDueWordsForCurrentUser()).words as LearningWord[])
        : (((await supabase
            .from("vocab_words")
            .select("*")
            .eq("set_id", id)).data || []) as LearningWord[])

      const wordIds = baseWords.map((word) => word.id)

      if (wordIds.length > 0) {
        await supabase
          .from("user_word_progress")
          .upsert(
            wordIds.map((wordId) => ({
              user_id: user.id,
              word_id: wordId,
            })),
            {
              onConflict: "user_id,word_id",
              ignoreDuplicates: true,
            }
          )
      }

      const { data: progressRows } =
        wordIds.length > 0
          ? await supabase
              .from("user_word_progress")
              .select("word_id, repetitions")
              .eq("user_id", user.id)
              .in("word_id", wordIds)
          : { data: [] }

      const progressMap = new Map(
        ((progressRows || []) as { word_id: string; repetitions?: number | null }[]).map(
          (row) => [row.word_id, Number(row.repetitions ?? 0)]
        )
      )

      const mergedWords = baseWords.map((word) => ({
        ...word,
        memoryStrength: progressMap.get(word.id) ?? 0,
      }))

      setWords(mergedWords)
      setQuestionAmount(String(Math.min(10, mergedWords.length || 10)))
      setLoading(false)
    }

    void fetchWords()
  }, [id, router])

  const buildQuestions = async () => {
    const amount = Number(questionAmount)
    if (Number.isNaN(amount) || amount <= 0) {
      return
    }

    const selectedWords = shuffleWords(words).slice(0, amount)
    const needsAiExamples = selectedWords.filter((word) => !word.example?.trim())

    const exampleMap = new Map<string, string>()
    selectedWords.forEach((word) => {
      if (word.example?.trim()) {
        exampleMap.set(word.id, sanitizeExample(word.example, word.word))
      }
    })

    if (needsAiExamples.length > 0) {
      setGeneratingQuestions(true)

      try {
        const prompt = `Tạo câu ví dụ tiếng Anh ngắn, tự nhiên cho từng từ sau để làm bài điền khuyết. Chỉ trả JSON array, mỗi phần tử có { "word": "...", "sentence": "..." }. Mỗi câu phải chứa đúng từ đó và đủ ngữ cảnh rõ nghĩa.\n${needsAiExamples
          .map((word) => `- ${word.word}: ${word.meaning}`)
          .join("\n")}`

        const response = await fetch("/api/gemini", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt }),
        })

        const payload = (await response.json()) as { text?: string; error?: string }
        const rawText = payload.text || "[]"
        const jsonText = rawText
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim()

        const generated = JSON.parse(jsonText) as Array<{
          word?: string
          sentence?: string
        }>

        generated.forEach((item) => {
          const matchedWord = needsAiExamples.find(
            (word) => normalize(word.word) === normalize(item.word || "")
          )

          if (matchedWord && item.sentence?.trim()) {
            exampleMap.set(
              matchedWord.id,
              sanitizeExample(item.sentence, matchedWord.word)
            )
          }
        })
      } catch {
        // Fall back to a simple generated sentence below.
      } finally {
        setGeneratingQuestions(false)
      }
    }

    const nextQuestions = selectedWords.map((word) => {
      const sentence =
        exampleMap.get(word.id) ||
        `${word.word} is commonly used in a realistic context.`

      return {
        id: word.id,
        wordId: word.id,
        word: word.word,
        meaning: word.meaning,
        sentence,
        maskedSentence: maskWordInSentence(sentence, word.word),
      } satisfies ClozeQuestion
    })

    setQuestions(nextQuestions)
    setCurrentIndex(0)
    setInput("")
    setShowAnswer(false)
    setShowHint(false)
    setResult("idle")
    setCorrectCount(0)
    setWrongCount(0)
    setStreak(0)
    setSessionCompleted(false)
    setStarted(true)
  }

  useEffect(() => {
    if (!started) return
    void buildQuestions()
  }, [refreshSeed])

  const updateSpacedRepetition = async (wordId: string, correct: boolean) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: progress } = await supabase
      .from("user_word_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("word_id", wordId)
      .single()

    if (!progress) return

    const row = progress as UserWordProgressRow
    const previousLevel = row.repetitions ?? 0
    const nextReview = calculateSpacedRepetitionUpdate(previousLevel, correct)
    const now = toUtcIsoString()

    await supabase
      .from("user_word_progress")
      .update({
        repetitions: nextReview.level,
        interval_days: nextReview.intervalDays,
        ease_factor: row.ease_factor,
        review_at: nextReview.reviewAt,
        last_reviewed_at: now,
        total_correct: correct
          ? (row.total_correct ?? 0) + 1
          : row.total_correct ?? 0,
        total_wrong: !correct
          ? (row.total_wrong ?? 0) + 1
          : row.total_wrong ?? 0,
        updated_at: now,
        ...buildMasteryTimestampUpdate(
          previousLevel,
          nextReview.level,
          new Date(now)
        ),
      })
      .eq("id", row.id)
  }

  const checkAnswer = () => {
    if (!currentQuestion || showAnswer) return

    const correct = normalize(input) === normalize(currentQuestion.word)
    setResult(correct ? "correct" : "wrong")
    setShowAnswer(true)

    void updateSpacedRepetition(currentQuestion.wordId, correct)

    setWords((prev) =>
      prev.map((word) =>
        word.id === currentQuestion.wordId
          ? {
              ...word,
              memoryStrength: correct
                ? word.memoryStrength < 0
                  ? 1
                  : clampMemoryStrength(word.memoryStrength + 1)
                : word.memoryStrength <= 0
                ? -1
                : clampMemoryStrength(word.memoryStrength - 1),
            }
          : word
      )
    )

    if (correct) {
      navigator.vibrate?.(30)
      setCorrectCount((prev) => prev + 1)
      setStreak((prev) => prev + 1)
    } else {
      navigator.vibrate?.([40, 20, 40])
      setWrongCount((prev) => prev + 1)
      setStreak(0)
    }
  }

  const nextQuestion = () => {
    const nextIndex = currentIndex + 1

    if (nextIndex >= questions.length) {
      setSessionCompleted(true)
      return
    }

    setCurrentIndex(nextIndex)
    setInput("")
    setShowAnswer(false)
    setShowHint(false)
    setResult("idle")
  }

  if (loading) {
    return (
      <LoadingScreen
        title="Đang tải bài điền khuyết"
        subtitle="Chuẩn bị câu ví dụ và từ còn thiếu..."
      />
    )
  }

  if (!started) {
    return (
      <section className="dashboard-shell min-h-screen flex items-center justify-center">
        <div className="dashboard-card w-full max-w-3xl">
          <button
            onClick={() =>
              router.push(isReviewDueSet(id) ? "/review" : `/vocabsets/${id}`)
            }
            className="inline-flex items-center gap-2 font-bold text-[#6b5b4d] transition hover:text-[#241c17]"
          >
            <ArrowLeft className="h-5 w-5" />
            Quay lại
          </button>

          <h1 className="mt-6 text-4xl font-black text-[#241c17]">Điền khuyết</h1>
          <p className="mt-3 text-lg leading-8 text-[#66584b]">
            Điền từ còn thiếu dựa trên ngữ cảnh của câu ví dụ. Nếu từ chưa có ví
            dụ, AI sẽ tự tạo câu để bạn luyện tập.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[5, 10, 15, 20].map((amount) => (
              <button
                key={amount}
                onClick={() => setQuestionAmount(String(amount))}
                disabled={amount > maxQuestions}
                className={`h-14 rounded-2xl font-bold transition ${
                  questionAmount === String(amount)
                    ? "bg-[#d96d32] text-white"
                    : "bg-[#f3e8dc] text-[#4b3a2f]"
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {amount}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm font-bold text-[#8c715b]">Tùy chỉnh số câu</p>
            <input
              type="number"
              value={questionAmount}
              onChange={(event) => setQuestionAmount(event.target.value)}
              className={`h-16 w-full rounded-3xl border-2 px-6 text-xl font-black outline-none ${
                isInvalidAmount
                  ? "border-red-400 bg-red-50 text-red-700"
                  : "border-[#e2d2bf] bg-[#fffaf3] text-[#241c17]"
              }`}
            />
            {isInvalidAmount && (
              <p className="mt-3 text-sm font-semibold text-red-500">
                Số lượng không được vượt quá {maxQuestions} từ.
              </p>
            )}
          </div>

          <button
            onClick={() => void buildQuestions()}
            disabled={isInvalidAmount || maxQuestions === 0 || generatingQuestions}
            className="mt-8 flex h-16 w-full items-center justify-center gap-2 rounded-3xl bg-[#1f1a17] text-lg font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generatingQuestions ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang tạo câu ví dụ
              </>
            ) : (
              "Bắt đầu"
            )}
          </button>
        </div>
      </section>
    )
  }

  if (sessionCompleted) {
    const accuracy = questions.length
      ? Math.round((correctCount / questions.length) * 100)
      : 0

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
            Phiên điền khuyết đã xong
          </p>
          <h1 className="mt-3 text-4xl font-black text-[#241c17] md:text-5xl">
            Hoàn thành!
          </h1>
          <p className="mt-4 text-lg leading-8 text-[#66584b]">
            Bạn đã hoàn thành bài điền khuyết với {accuracy}% chính xác.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="dashboard-soft-card">
              <p className="dashboard-card-label">Đúng</p>
              <p className="mt-3 text-3xl font-black text-[#2f7a55]">{correctCount}</p>
            </div>
            <div className="dashboard-soft-card">
              <p className="dashboard-card-label">Sai</p>
              <p className="mt-3 text-3xl font-black text-[#c96d35]">{wrongCount}</p>
            </div>
            <div className="dashboard-soft-card">
              <p className="dashboard-card-label">Streak</p>
              <p className="mt-3 text-3xl font-black text-[#226f8a]">{streak}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() =>
                router.push(isReviewDueSet(id) ? "/review" : `/vocabsets/${id}`)
              }
              className="h-14 rounded-2xl border border-[#eadccf] bg-white font-bold text-[#2d241d]"
            >
              Quay lại
            </button>
            <button
              onClick={() => setRefreshSeed((prev) => prev + 1)}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#1f1a17] font-bold text-white"
            >
              <RefreshCcw className="h-4 w-4" />
              Làm lại
            </button>
          </div>
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
              onClick={() =>
                router.push(isReviewDueSet(id) ? "/review" : `/vocabsets/${id}`)
              }
              className="inline-flex items-center gap-2 font-bold text-[#6b5b4d] transition hover:text-[#241c17]"
            >
              <ArrowLeft className="h-5 w-5" />
              Quay lại
            </button>

            <div className="rounded-full bg-[#f1e4d6] px-4 py-2 text-sm font-bold text-[#8d6542]">
              {streak} streak
            </div>
          </div>

          <div className="mt-8">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#9a6d48]">
              Câu {currentIndex + 1} / {questions.length}
            </p>
            <h1 className="mt-3 text-4xl font-black text-[#241c17]">
              Điền từ vào chỗ trống
            </h1>
            <p className="mt-3 text-lg leading-8 text-[#66584b]">
              Dựa vào câu ví dụ để điền đúng từ còn thiếu.
            </p>
          </div>

          <div className="mt-8 h-4 overflow-hidden rounded-full bg-[#eee2d6]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#d96d32_0%,#f0be64_100%)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {currentQuestion ? (
            <div className="mt-8 rounded-[2rem] border border-[#eadccf] bg-[#fffdf9] p-6">
              <p className="text-[22px] font-medium leading-10 text-[#241c17]">
                {currentQuestion.maskedSentence}
              </p>

              <div className="mt-8">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  disabled={showAnswer}
                  placeholder="Nhập từ còn thiếu"
                  className={`h-16 w-full rounded-3xl border-2 px-6 text-xl font-black outline-none ${
                    showAnswer
                      ? result === "correct"
                        ? "border-green-400 bg-green-50 text-green-700"
                        : "border-red-400 bg-red-50 text-red-700"
                      : "border-[#e2d2bf] bg-white text-[#241c17]"
                  }`}
                />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowHint((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#eadccf] bg-white px-4 py-3 font-semibold text-[#2d241d] transition hover:bg-[#fff8f1]"
                >
                  <Lightbulb className="h-4 w-4" />
                  Gợi ý nghĩa
                  {showHint ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {showAnswer ? (
                  result === "correct" ? (
                    <span className="inline-flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 font-semibold text-green-700">
                      <Check className="h-4 w-4" />
                      Chính xác
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 font-semibold text-red-700">
                      <X className="h-4 w-4" />
                      Đáp án: {currentQuestion.word}
                    </span>
                  )
                ) : null}
              </div>

              {showHint ? (
                <div className="mt-4 rounded-2xl bg-[#fff4e8] px-4 py-3 text-[#8a5b34]">
                  Nghĩa tiếng Việt: <strong>{currentQuestion.meaning}</strong>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            {!showAnswer ? (
              <button
                onClick={checkAnswer}
                disabled={!input.trim()}
                className="inline-flex h-14 items-center justify-center rounded-3xl bg-[#1f1a17] px-6 text-base font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Kiểm tra
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="inline-flex h-14 items-center justify-center rounded-3xl bg-[#d96d32] px-6 text-base font-bold text-white transition hover:bg-[#c45f29]"
              >
                Câu tiếp theo
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
