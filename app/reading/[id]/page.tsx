"use client"

import { use, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Loader2,
  ScanSearch,
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

type Word = {
  id: string
  word: string
  meaning: string
  example: string
  ipa: string
  word_type: string
  memoryStrength?: number | null
}

type ClozeBlank = {
  id: string
  answer: string
  meaning: string
}

type QuestionType = "mcq" | "true_false_not_given" | "short_answer"

type ReadingQuestion = {
  id: string
  type: QuestionType
  instruction: string
  prompt: string
  answer: string
  options?: string[]
}

type ReadingPassage = {
  id: string
  title: string
  passage: string
  focusWords: string[]
  blanks: ClozeBlank[]
  questions: ReadingQuestion[]
}

type ReadingResponse = {
  passage: ReadingPassage
}

type UserWordProgressRow = {
  id: string
  repetitions: number | null
  ease_factor: number | null
  total_correct: number | null
  total_wrong: number | null
}

type WordProgressLookupRow = {
  word_id: string
  repetitions: number | null
}

const MAX_MEMORY_STRENGTH = 4

const clampMemoryStrength = (strength: number) =>
  Math.min(Math.max(strength, -1), MAX_MEMORY_STRENGTH)

const normalizeText = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ")

const pickWordGroup = (words: Word[]) => {
  const prioritized = [...words].sort((a, b) => {
    const strengthDiff = (a.memoryStrength ?? 0) - (b.memoryStrength ?? 0)

    if (strengthDiff !== 0) {
      return strengthDiff
    }

    return Math.random() - 0.5
  })

  return prioritized.slice(0, Math.min(9, words.length))
}

const injectMissingBlanks = (
  passage: ReadingPassage,
  selectedWords: Word[]
) => {
  let nextPassage = passage.passage
  const meaningByWord = new Map(
    selectedWords.map((word) => [normalizeText(word.word), word.meaning])
  )

  // Remove accidental inline Vietnamese glosses like "(chăm sóc y tế)" from the passage.
  nextPassage = nextPassage
    .replace(/\s*\((?:[^()]*[à-ỹÀ-ỸđĐ][^()]*)\)/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\n\s+/g, "\n")
    .trim()

  const nextBlanks = passage.blanks.map((blank) => ({
    ...blank,
    meaning:
      blank.meaning?.trim() ||
      meaningByWord.get(normalizeText(blank.answer)) ||
      "Xem ngữ cảnh",
  }))

  for (const blank of nextBlanks) {
    if (nextPassage.includes(`{{${blank.id}}}`)) {
      continue
    }

    const escaped = blank.answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const pattern = new RegExp(`\\b${escaped}\\b`, "i")
    nextPassage = nextPassage.replace(pattern, `{{${blank.id}}}`)
  }

  return {
    ...passage,
    passage: nextPassage,
    blanks: nextBlanks,
  }
}

const renderPassageWithInputs = (
  passage: ReadingPassage,
  answers: Record<string, string>,
  submitted: boolean,
  results: Record<string, boolean>,
  onChange: (blankId: string, value: string) => void
) => {
  const segments = passage.passage.split(/(\{\{[^}]+\}\})/g)

  return segments.map((segment, index) => {
    const match = segment.match(/^\{\{([^}]+)\}\}$/)

    if (!match) {
      return (
        <span key={`${passage.id}-text-${index}`} className="whitespace-pre-wrap">
          {segment}
        </span>
      )
    }

    const blankId = match[1]
    const blank = passage.blanks.find((item) => item.id === blankId)
    const isCorrect = results[blankId]
    const currentAnswer = answers[blankId] || ""

    return (
      <span
        key={`${passage.id}-blank-${blankId}`}
        className={`mx-1 inline-flex min-w-[200px] flex-col rounded-2xl px-3 py-2 align-middle ${
          submitted ? (isCorrect ? "bg-[#eefaf2]" : "bg-[#fff1ef]") : ""
        }`}
      >
        {!submitted ? (
          <input
            value={currentAnswer}
            onChange={(event) => onChange(blankId, event.target.value)}
            placeholder="Nhập từ"
            className="rounded-none border-0 border-b-2 border-[#c9b19d] bg-transparent px-2 py-1 text-center text-base font-medium text-[#2b221b] outline-none transition focus:border-[#b45309]"
          />
        ) : isCorrect ? (
          <div className="border-b-2 border-[#1f8f55] px-2 py-1 text-center text-base font-medium text-[#1f8f55]">
            {currentAnswer || blank?.answer || ""}
          </div>
        ) : (
          <div className="border-b-2 border-[#d04d35] px-2 py-1 text-center text-base font-medium">
            <span className="text-[#d04d35] line-through">
              {currentAnswer || "Để trống"}
            </span>
            <span className="mx-2 text-[#c79a8c]">|</span>
            <span className="text-[#1f8f55]">{blank?.answer || ""}</span>
          </div>
        )}

        <span className="mt-2 text-center text-xs leading-5 text-[#7f6451]">
          {blank?.meaning || ""}
        </span>
      </span>
    )
  })
}

export default function ReadingPage({
  params,
}: {
  params: Promise<{
    id: string
  }>
}) {
  const { id } = use(params)
  const router = useRouter()

  const [userId, setUserId] = useState("")
  const [title, setTitle] = useState("")
  const [words, setWords] = useState<Word[]>([])
  const [passage, setPassage] = useState<ReadingPassage | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")
  const [hasAttemptedInitialGeneration, setHasAttemptedInitialGeneration] =
    useState(false)
  const [showHintBox, setShowHintBox] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<Record<string, boolean>>({})
  const [questionResults, setQuestionResults] = useState<Record<string, boolean>>({})
  const [selectedWordGroup, setSelectedWordGroup] = useState<Word[]>([])

  const activeQuestionType = passage?.questions[0]?.type || null
  const questionInstruction = passage?.questions[0]?.instruction || ""

  const questionHeading = useMemo(() => {
    if (activeQuestionType === "mcq") {
      return "Multiple Choice Questions"
    }

    if (activeQuestionType === "true_false_not_given") {
      return "True / False / Not Given"
    }

    if (activeQuestionType === "short_answer") {
      return "Short Answer Questions"
    }

    return "Questions"
  }, [activeQuestionType])

  useEffect(() => {
    let cancelled = false

    const loadSet = async () => {
      setLoading(true)
      setError("")

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push(`/login?redirectTo=${encodeURIComponent(`/reading/${id}`)}`)
        return
      }

      if (cancelled) return

      setUserId(user.id)

      const { data: setData } = isReviewDueSet(id)
        ? { data: { title: "Ôn tập ngắt quãng" } }
        : await supabase
            .from("vocab_sets")
            .select("title")
            .eq("id", id)
            .single()

      const vocabData = isReviewDueSet(id)
        ? (await fetchDueWordsForCurrentUser()).words
        : (
            await supabase
              .from("vocab_words")
              .select("id, word, meaning, example, ipa, word_type")
              .eq("set_id", id)
          ).data

      if (cancelled) return

      setTitle(setData?.title || "")

      const baseWords = ((vocabData || []) as Word[]).map((word) => ({
        ...word,
        memoryStrength: 0,
      }))

      if (baseWords.length === 0) {
        setWords([])
        setError("Bộ từ này chưa có dữ liệu để tạo bài đọc hiểu.")
        setLoading(false)
        return
      }

      const { data: progressRows } = await supabase
        .from("user_word_progress")
        .select("word_id, repetitions")
        .eq("user_id", user.id)
        .in(
          "word_id",
          baseWords.map((word) => word.id)
        )

      if (cancelled) return

      const progressMap = new Map(
        (((progressRows as WordProgressLookupRow[] | null) || []) as WordProgressLookupRow[]).map(
          (row) => [row.word_id, Number(row.repetitions ?? 0)]
        )
      )

      setWords(
        baseWords.map((word) => ({
          ...word,
          memoryStrength: progressMap.get(word.id) ?? 0,
        }))
      )
      setLoading(false)
    }

    void loadSet()
    return () => {
      cancelled = true
    }
  }, [id, router])

  useEffect(() => {
    if (
      !userId ||
      words.length === 0 ||
      passage ||
      generating ||
      hasAttemptedInitialGeneration
    ) {
      return
    }

    setHasAttemptedInitialGeneration(true)
    void generateReading()
  }, [userId, words, passage, generating, hasAttemptedInitialGeneration])

  const generateReading = async () => {
    if (words.length === 0) return

    const selectedWords = pickWordGroup(words)

    if (selectedWords.length === 0) {
      setError("Không chọn được từ phù hợp để tạo bài đọc hiểu.")
      return
    }

    setPassage(null)
    setShowHintBox(false)
    setAnswers({})
    setQuestionAnswers({})
    setResults({})
    setQuestionResults({})
    setSubmitted(false)
    setGenerating(true)
    setError("")

    try {
      setSelectedWordGroup(selectedWords)
      const response = await fetch("/api/reading", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          setTitle: title,
          wordGroup: selectedWords.map((word) => ({
            word: word.word,
            meaning: word.meaning,
            example: word.example,
          })),
        }),
      })

      const payload = (await response.json()) as ReadingResponse & { error?: string }

      if (!response.ok || !payload.passage) {
        throw new Error(payload.error || "Không tạo được bài đọc hiểu.")
      }

      setPassage(injectMissingBlanks(payload.passage, selectedWords))
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Không tạo được bài đọc hiểu."
      )
    } finally {
      setGenerating(false)
    }
  }

  const updateProgressForWords = async (
    blankAnswers: Array<{ answer: string; correct: boolean }>
  ) => {
    if (!userId) return

    for (const blankAnswer of blankAnswers) {
      const word = words.find(
        (item) => normalizeText(item.word) === normalizeText(blankAnswer.answer)
      )

      if (!word) {
        continue
      }

      const { data: progress } = await supabase
        .from("user_word_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("word_id", word.id)
        .single()

      if (!progress) continue

      const row = progress as UserWordProgressRow
      const previousLevel = row.repetitions ?? 0
      const nextReview = calculateSpacedRepetitionUpdate(
        previousLevel,
        blankAnswer.correct
      )
      const now = toUtcIsoString()

      await supabase
        .from("user_word_progress")
        .update({
          repetitions: nextReview.level,
          interval_days: nextReview.intervalDays,
          ease_factor: row.ease_factor,
          review_at: nextReview.reviewAt,
          last_reviewed_at: now,
          total_correct: blankAnswer.correct
            ? (row.total_correct ?? 0) + 1
            : row.total_correct ?? 0,
          total_wrong: !blankAnswer.correct
            ? (row.total_wrong ?? 0) + 1
            : row.total_wrong ?? 0,
          updated_at: now,
          ...buildMasteryTimestampUpdate(previousLevel, nextReview.level, new Date(now)),
        })
        .eq("id", row.id)

      setWords((prev) =>
        prev.map((item) =>
          item.id === word.id
            ? {
                ...item,
                memoryStrength: clampMemoryStrength(
                  blankAnswer.correct
                    ? (item.memoryStrength ?? 0) < 0
                      ? 1
                      : (item.memoryStrength ?? 0) + 1
                    : (item.memoryStrength ?? 0) <= 0
                    ? -1
                    : (item.memoryStrength ?? 0) - 2
                ),
              }
            : item
        )
      )
    }
  }

  const handleSubmit = async () => {
    if (!passage) return

    const confirmed = window.confirm("Bạn có chắc muốn nộp bài này không?")

    if (!confirmed) {
      return
    }

    const nextResults: Record<string, boolean> = {}
    const nextQuestionResults: Record<string, boolean> = {}
    const blankProgressUpdates: Array<{ answer: string; correct: boolean }> = []

    for (const blank of passage.blanks) {
      const correct = normalizeText(answers[blank.id] || "") === normalizeText(blank.answer)
      nextResults[blank.id] = correct
      blankProgressUpdates.push({
        answer: blank.answer,
        correct,
      })
    }

    for (const question of passage.questions) {
      const answer = questionAnswers[question.id] || ""
      const correct = normalizeText(answer) === normalizeText(question.answer)
      nextQuestionResults[question.id] = correct
    }

    setResults(nextResults)
    setQuestionResults(nextQuestionResults)
    setSubmitted(true)
    await updateProgressForWords(blankProgressUpdates)
  }

  if (loading) {
    return (
      <LoadingScreen
        title="Đang tải bài đọc hiểu"
        subtitle="Chuẩn bị đoạn đọc và câu hỏi phù hợp..."
      />
    )
  }

  return (
    <main className="min-h-screen bg-[#f7efe4] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => router.push(`/vocabsets/${id}`)}
          className="inline-flex items-center gap-2 rounded-2xl border border-[#e4d4c2] bg-white px-4 py-3 font-semibold text-[#2c221b] shadow-sm transition hover:bg-[#fffaf3]"
        >
          <ArrowLeft className="h-5 w-5" />
          Quay lại bộ từ
        </button>

        <section className="mt-8 rounded-[2.5rem] border border-[#eadccf] bg-white p-8 shadow-[0_24px_60px_rgba(79,56,31,0.08)] md:p-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#fbeee8] text-[#b45309]">
                <ScanSearch className="h-8 w-8" />
              </div>
              <h1 className="mt-6 text-4xl font-black tracking-[-0.04em] text-[#211914] md:text-5xl">
                Đọc hiểu
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#6d5645]">
                Mỗi lượt chỉ tạo 1 bài. Bạn điền từ trực tiếp vào đoạn văn, rồi trả
                lời thêm một dạng câu hỏi đọc hiểu theo phong cách IELTS.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setShowHintBox((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#e4d4c2] bg-white px-4 py-3 font-semibold text-[#2c221b] shadow-sm transition hover:bg-[#fffaf3]"
              >
                Gợi ý
                {showHintBox ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {showHintBox && passage ? (
                <div className="max-w-sm rounded-2xl border border-[#eadccf] bg-[#fffaf4] p-4 text-sm text-[#6d5645]">
                  <p className="font-semibold text-[#2c221b]">Các từ có thể dùng:</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedWordGroup.map((word) => (
                      <span
                        key={word.id}
                        className="rounded-full bg-white px-3 py-1 text-[#5f4a3d]"
                      >
                        {word.word}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-[#f0c7b7] bg-[#fff1eb] px-4 py-3 text-sm text-[#a14524]">
              {error}
            </div>
          ) : null}

          {generating && !passage ? (
            <div className="mt-10 flex items-center gap-3 rounded-[2rem] border border-[#eadccf] bg-[#fffaf6] px-5 py-4 text-[#6d5645]">
              <Loader2 className="h-5 w-5 animate-spin text-[#b45309]" />
              AI đang tạo bài đọc hiểu...
            </div>
          ) : null}

          {passage ? (
            <article className="mt-8 rounded-[2.25rem] border border-[#eadccf] bg-[#fffaf6] p-6 md:p-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#b07b52]">
                  Dạng bài
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#241b15]">
                  {passage.title}
                </h2>
              </div>

              <div className="mt-6 rounded-[2rem] bg-white px-5 py-5 text-[19px] leading-10 text-[#31261f]">
                {renderPassageWithInputs(passage, answers, submitted, results, (blankId, value) =>
                  setAnswers((prev) => ({ ...prev, [blankId]: value }))
                )}
              </div>

              <div className="mt-8 space-y-4">
                <div>
                  <h3 className="text-xl font-black text-[#241b15]">
                    {questionHeading}
                  </h3>
                  <p className="mt-2 text-sm font-semibold text-[#996746]">
                    {questionInstruction}
                  </p>
                </div>

                {passage.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className={`rounded-2xl border p-4 ${
                      submitted
                        ? questionResults[question.id]
                          ? "border-[#b9e5c8] bg-[#eefaf2]"
                          : "border-[#f0beb5] bg-[#fff1ef]"
                        : "border-[#eadccf] bg-white"
                    }`}
                  >
                    <p className="font-semibold text-[#241b15]">
                      {index + 1}. {question.prompt}
                    </p>

                    {question.type === "mcq" ? (
                      <div className="mt-3 grid gap-3">
                        {(question.options || []).map((option) => {
                          const isSelected = questionAnswers[question.id] === option
                          const isCorrectOption =
                            normalizeText(option) === normalizeText(question.answer)
                          const isWrongSelected =
                            submitted && isSelected && !questionResults[question.id]

                          return (
                            <button
                              key={option}
                              type="button"
                              disabled={submitted}
                              onClick={() =>
                                setQuestionAnswers((prev) => ({
                                  ...prev,
                                  [question.id]: option,
                                }))
                              }
                              className={`rounded-2xl border px-4 py-3 text-left transition ${
                                submitted
                                  ? isCorrectOption
                                    ? "border-[#1f8f55] bg-[#eefaf2] text-[#1f8f55]"
                                    : isWrongSelected
                                    ? "border-[#d04d35] bg-[#fff1ef] text-[#d04d35]"
                                    : "border-[#eadccf] bg-white text-[#2b221b]"
                                  : isSelected
                                  ? "border-[#b45309] bg-[#fff1e5] text-[#8a470c]"
                                  : "border-[#eadccf] bg-white text-[#2b221b] hover:bg-[#fff8f1]"
                              } ${submitted ? "cursor-default" : ""}`}
                            >
                              {option}
                            </button>
                          )
                        })}
                      </div>
                    ) : question.type === "true_false_not_given" ? (
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        {["True", "False", "Not Given"].map((option) => {
                          const isSelected = questionAnswers[question.id] === option
                          const isCorrectOption =
                            normalizeText(option) === normalizeText(question.answer)
                          const isWrongSelected =
                            submitted && isSelected && !questionResults[question.id]

                          return (
                            <button
                              key={option}
                              type="button"
                              disabled={submitted}
                              onClick={() =>
                                setQuestionAnswers((prev) => ({
                                  ...prev,
                                  [question.id]: option,
                                }))
                              }
                              className={`rounded-2xl border px-4 py-3 text-center transition ${
                                submitted
                                  ? isCorrectOption
                                    ? "border-[#1f8f55] bg-[#eefaf2] text-[#1f8f55]"
                                    : isWrongSelected
                                    ? "border-[#d04d35] bg-[#fff1ef] text-[#d04d35]"
                                    : "border-[#eadccf] bg-white text-[#2b221b]"
                                  : isSelected
                                  ? "border-[#b45309] bg-[#fff1e5] text-[#8a470c]"
                                  : "border-[#eadccf] bg-white text-[#2b221b] hover:bg-[#fff8f1]"
                              } ${submitted ? "cursor-default" : ""}`}
                            >
                              {option}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <input
                        value={questionAnswers[question.id] || ""}
                        disabled={submitted}
                        onChange={(event) =>
                          setQuestionAnswers((prev) => ({
                            ...prev,
                            [question.id]: event.target.value,
                          }))
                        }
                        placeholder="Nhập câu trả lời ngắn"
                        className={`mt-3 w-full rounded-2xl border px-4 py-3 outline-none ${
                          submitted
                            ? questionResults[question.id]
                              ? "border-[#1f8f55] text-[#1f8f55]"
                              : "border-[#d04d35] text-[#d04d35]"
                            : "border-[#e4d4c2] text-[#2b221b] focus:border-[#b45309]"
                        }`}
                      />
                    )}

                    {submitted ? (
                      <p className="mt-2 text-sm text-[#6d5645]">
                        Câu trả lời của bạn:{" "}
                        <span
                          className={
                            questionResults[question.id]
                              ? "font-semibold text-[#1f8f55]"
                              : "text-[#d04d35] line-through"
                          }
                        >
                          {questionAnswers[question.id] || "Để trống"}
                        </span>
                        {!questionResults[question.id] ? (
                          <>
                            <span className="mx-2 text-[#c79a8c]">|</span>
                            <span className="font-semibold text-[#1f8f55]">
                              {question.answer}
                            </span>
                          </>
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {!submitted ? (
                  <button
                    type="button"
                    onClick={() => void handleSubmit()}
                    className="rounded-2xl bg-[#b45309] px-5 py-3 font-semibold text-white transition hover:bg-[#9a4407]"
                  >
                    Nộp bài này
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => void generateReading()}
                      disabled={generating}
                      className="rounded-2xl bg-[#2b221b] px-5 py-3 font-semibold text-white transition hover:bg-[#17110d] disabled:opacity-60"
                    >
                      Làm tiếp
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(`/vocabsets/${id}`)}
                      className="rounded-2xl border border-[#d8c2b2] bg-white px-5 py-3 font-semibold text-[#2b221b] transition hover:bg-[#fff8f1]"
                    >
                      Quay lại
                    </button>
                  </>
                )}
              </div>
            </article>
          ) : null}
        </section>
      </div>
    </main>
  )
}
