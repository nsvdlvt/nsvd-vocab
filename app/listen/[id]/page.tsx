"use client"

import { use, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Check,
  Headphones,
  Volume2,
  X,
} from "lucide-react"
import { supabase } from "@/lib/supabase"

type ListeningWord = {
  id: string
  word: string
  meaning: string
  ipa?: string
  example?: string
  audio_url?: string
  word_type?: string
  memoryStrength: number
}

type ResultState = "idle" | "correct" | "wrong"

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()

const shuffleWords = <T,>(items: T[]) =>
  [...items].sort(() => Math.random() - 0.5)

const getLoginRedirectUrl = () => {
  const redirectTo = `${window.location.pathname}${window.location.search}`
  return `/login?redirectTo=${encodeURIComponent(redirectTo)}`
}

export default function ListenPage({
  params,
}: {
  params: Promise<{
    id: string
  }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const autoplayPendingRef = useRef(false)
  const lastAutoPlayedKeyRef = useRef<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [started, setStarted] = useState(false)
  const [queue, setQueue] = useState<ListeningWord[]>([])
  const [input, setInput] = useState("")
  const [result, setResult] = useState<ResultState>("idle")
  const [showAnswer, setShowAnswer] = useState(false)
  const [streak, setStreak] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [questionAmount, setQuestionAmount] = useState("20")
  const [questionLimit, setQuestionLimit] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState(0)
  const [sessionCompleted, setSessionCompleted] = useState(false)
  const [autoPlay, setAutoPlay] = useState(true)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioPulse, setAudioPulse] = useState(false)

  const currentWord = queue[0]
  const currentAudioKey = currentWord
    ? `${currentWord.id}:${answeredQuestions}`
    : null
  const maxQuestions = queue.length
  const parsedAmount = Number(questionAmount)
  const isInvalidAmount =
    parsedAmount > maxQuestions || parsedAmount <= 0 || Number.isNaN(parsedAmount)

  const progress = useMemo(() => {
    if (questionLimit === 0) return 0
    return (answeredQuestions / questionLimit) * 100
  }, [answeredQuestions, questionLimit])

  const accuracyRate = useMemo(() => {
    if (answeredQuestions === 0) return 0
    return Math.round((correctCount / answeredQuestions) * 100)
  }, [answeredQuestions, correctCount])

  const playAudio = useMemo(
    () => () => {
    if (!currentWord || audioPlaying) return

    speechSynthesis.cancel()
    setAudioPulse(true)
    window.setTimeout(() => {
      setAudioPulse(false)
    }, 650)

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    if (currentWord.audio_url) {
      const audio = new Audio(currentWord.audio_url)
      audioRef.current = audio
      setAudioPlaying(true)

      audio.onended = () => {
        setAudioPlaying(false)
        audioRef.current = null
      }

      audio.onerror = () => {
        setAudioPlaying(false)
        audioRef.current = null
        const utterance = new SpeechSynthesisUtterance(currentWord.word)
        utterance.lang = "en-US"
        speechSynthesis.speak(utterance)
      }

      audio.play().catch(() => {
        setAudioPlaying(false)
        audioRef.current = null
        const utterance = new SpeechSynthesisUtterance(currentWord.word)
        utterance.lang = "en-US"
        speechSynthesis.speak(utterance)
      })

      return
    }

    const utterance = new SpeechSynthesisUtterance(currentWord.word)
    utterance.lang = "en-US"
    speechSynthesis.speak(utterance)
    },
    [audioPlaying, currentWord]
  )

  useEffect(() => {
    const fetchWords = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push(getLoginRedirectUrl())
        return
      }

      const { data } = await supabase
        .from("vocab_words")
        .select("*")
        .eq("set_id", id)

      const words = (data || []).map((word) => ({
        ...word,
        memoryStrength: 0,
      }))

      const shuffled = [...words].sort(() => Math.random() - 0.5)

      setQueue(shuffled)
      setQuestionAmount(String(Math.min(20, shuffled.length || 20)))
      autoplayPendingRef.current = true
      setLoading(false)
    }

    fetchWords()

    return () => {
      speechSynthesis.cancel()
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [id, router])

  useEffect(() => {
    if (!started || !currentWord || !currentAudioKey || showAnswer || !autoPlay || !autoplayPendingRef.current) {
      return
    }

    if (lastAutoPlayedKeyRef.current === currentAudioKey) {
      autoplayPendingRef.current = false
      return
    }

    lastAutoPlayedKeyRef.current = currentAudioKey
    autoplayPendingRef.current = false
    const timeout = window.setTimeout(() => {
      playAudio()
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [started, currentWord, currentAudioKey, showAnswer, autoPlay, audioPlaying, playAudio])

  const checkAnswer = () => {
    if (!currentWord || showAnswer) return

    const isCorrect = normalize(input) === normalize(currentWord.word)

    setResult(isCorrect ? "correct" : "wrong")
    setShowAnswer(true)

    setQueue((prev) =>
      prev.map((word) => {
        if (word.id !== currentWord.id) return word

        return {
          ...word,
          memoryStrength: isCorrect
            ? Math.min(word.memoryStrength + 1, 4)
            : Math.max(word.memoryStrength - 1, 0),
        }
      })
    )

    if (isCorrect) {
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
    const nextCount = answeredQuestions + 1

    setAnsweredQuestions(nextCount)
    setInput("")
    setResult("idle")
    setShowAnswer(false)
    lastAutoPlayedKeyRef.current = null
    autoplayPendingRef.current = true
    setQueue((prev) => prev.slice(1))

    if (nextCount >= questionLimit) {
      setSessionCompleted(true)
    }
  }

  if (loading) {
    return (
      <section className="dashboard-shell min-h-screen">
        <div className="dashboard-loading">
          <div className="dashboard-spinner" />
          <p className="dashboard-loading-text">Đang tải bài nghe chép</p>
        </div>
      </section>
    )
  }

  if (!currentWord && !sessionCompleted) {
    return null
  }

  if (!started) {
    return (
      <section className="dashboard-shell min-h-screen flex items-center justify-center">
        <div className="dashboard-card w-full max-w-2xl">
          <h1 className="text-4xl font-black text-[#241c17]">Nghe chép</h1>
          <p className="mt-3 text-lg leading-8 text-[#66584b]">
            Nghe từ được phát âm, gõ lại chính xác rồi kiểm tra đúng hoặc sai như các chế độ học hiện tại.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {[10, 20, 30, 40].map((amount) => (
              <button
                key={amount}
                onClick={() => setQuestionAmount(String(amount))}
                className={`h-14 rounded-2xl font-bold transition ${
                  questionAmount === String(amount)
                    ? "bg-[#d96d32] text-white"
                    : "bg-[#f3e8dc] text-[#4b3a2f]"
                }`}
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
              onChange={(e) => setQuestionAmount(e.target.value)}
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
            onClick={() => {
              if (isInvalidAmount || maxQuestions === 0) return
              setQuestionLimit(parsedAmount)
              lastAutoPlayedKeyRef.current = null
              autoplayPendingRef.current = true
              setStarted(true)
            }}
            disabled={isInvalidAmount || maxQuestions === 0}
            className="mt-8 flex h-16 w-full items-center justify-center rounded-3xl bg-[#1f1a17] text-lg font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Bắt đầu
          </button>
        </div>
      </section>
    )
  }

  if (sessionCompleted) {
    return (
      <section className="dashboard-shell min-h-screen flex items-center justify-center">
        <div className="relative w-full max-w-3xl overflow-hidden rounded-[2.5rem] border border-[#e6d5c4] bg-[#fffaf3] p-8 text-center shadow-[0_30px_90px_rgba(84,58,33,0.12)] md:p-10">
          <div className="absolute left-[-4rem] top-[-4rem] h-40 w-40 rounded-full bg-[#f5c86f]/25 blur-3xl" />
          <div className="absolute bottom-[-5rem] right-[-3rem] h-48 w-48 rounded-full bg-[#d96d32]/12 blur-3xl" />

          <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,#e3f9e7_0%,#c8f1d1_70%,#b5e8c3_100%)] shadow-[0_18px_40px_rgba(63,166,92,0.18)]">
            <div className="absolute inset-0 rounded-full border border-white/60 animate-ping" />
            <Check className="relative h-14 w-14 text-green-600" />
          </div>

          <div className="relative">
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.28em] text-[#9a6d48]">
              Phiên nghe chép đã xong
            </p>
            <h1 className="mt-3 text-4xl font-black text-[#241c17] md:text-5xl">Hoàn thành!</h1>
          </div>

          <p className="relative mt-4 text-lg leading-8 text-[#66584b]">
            Bạn đã hoàn thành bài nghe chép.
          </p>

          <div className="relative mt-8 rounded-[2rem] border border-[#eadccf] bg-[linear-gradient(180deg,#fff7ef_0%,#fffaf3_100%)] p-6">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#9a6d48]">
              Tỷ lệ đúng
            </p>
            <div className="mt-3 flex items-end justify-center gap-3">
              <p className="text-6xl font-black tracking-[-0.05em] text-[#241c17]">
                {accuracyRate}
              </p>
              <span className="pb-2 text-2xl font-black text-[#c96d35]">%</span>
            </div>
            <div className="mx-auto mt-5 h-4 max-w-md overflow-hidden rounded-full bg-[#efe2d3]">
              <div
                className="relative h-full rounded-full bg-[linear-gradient(90deg,#d96d32_0%,#f0be64_100%)] transition-all duration-700 ease-out"
                style={{ width: `${accuracyRate}%` }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.38)_40%,transparent_80%)] animate-[pulse_1.8s_ease-in-out_infinite]" />
              </div>
            </div>
          </div>

          <div className="relative mt-6 grid gap-4 sm:grid-cols-3">
            <div className="dashboard-soft-card shadow-[0_12px_28px_rgba(63,166,92,0.08)]">
              <p className="dashboard-card-label">Đúng</p>
              <p className="mt-3 text-3xl font-black text-[#2f7a55]">{correctCount}</p>
            </div>
            <div className="dashboard-soft-card shadow-[0_12px_28px_rgba(217,109,50,0.08)]">
              <p className="dashboard-card-label">Sai</p>
              <p className="mt-3 text-3xl font-black text-[#c96d35]">{wrongCount}</p>
            </div>
            <div className="dashboard-soft-card shadow-[0_12px_28px_rgba(34,111,138,0.08)]">
              <p className="dashboard-card-label">Hoàn thành</p>
              <p className="mt-3 text-3xl font-black text-[#226f8a]">
                {answeredQuestions}/{questionLimit}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const resetQueue = shuffleWords(queue)
              setQueue(resetQueue)
              setInput("")
              setShowAnswer(false)
              setResult("idle")
              lastAutoPlayedKeyRef.current = null
              autoplayPendingRef.current = true
              setStreak(0)
              setCorrectCount(0)
              setWrongCount(0)
              setAnsweredQuestions(0)
              setSessionCompleted(false)
              setStarted(false)
            }}
            className="relative mt-10 inline-flex h-14 items-center justify-center rounded-3xl bg-[#1f1a17] px-8 text-lg font-bold text-white transition hover:scale-[1.03] active:scale-[0.98]"
          >
            Học lại
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
                Chuỗi đúng: {streak}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="dashboard-card-label">Nghe chép</p>
              <p className="text-sm font-bold text-[#8d6542]">
                {answeredQuestions}/{questionLimit}
              </p>
            </div>
            <div className="relative h-4 overflow-hidden rounded-full bg-[#eee2d6]">
              <div
                className="relative h-full rounded-full bg-[linear-gradient(90deg,#d96d32_0%,#f0be64_100%)] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.38)_40%,transparent_80%)] animate-[pulse_1.8s_ease-in-out_infinite]" />
              </div>
              <div className="absolute inset-y-0 left-0 w-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_55%)]" />
            </div>
          </div>

          <div className="mt-8 rounded-[2rem] bg-[linear-gradient(180deg,#231b18_0%,#352820_100%)] p-8 text-[#f8f1e8]">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <Headphones className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.22em] text-[#ddb897]">
                  Nghe và gõ lại từ bạn nghe được
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={playAudio}
                  aria-label="Phát âm thanh"
                  className={`relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white transition duration-200 hover:bg-white/15 active:scale-95 ${
                    audioPlaying ? "opacity-80" : ""
                  } ${audioPulse ? "scale-110 bg-[#f5c86f] text-[#241c17] shadow-[0_0_0_8px_rgba(245,200,111,0.16)]" : ""}`}
                >
                  <Volume2 className={`h-5 w-5 ${audioPulse ? "animate-pulse" : ""}`} />
                  {audioPulse && (
                    <span className="absolute inset-0 rounded-2xl border border-[#f5c86f] animate-ping" />
                  )}
                </button>

                <button
                  onClick={() => setAutoPlay((prev) => !prev)}
                  className={`relative h-6 w-11 rounded-full transition ${
                    autoPlay ? "bg-blue-600" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                      autoPlay ? "left-5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-8">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (showAnswer) nextQuestion()
                    else checkAnswer()
                  }
                }}
                placeholder="Nhập từ bạn nghe được..."
                className="h-16 w-full rounded-3xl border border-white/10 bg-white/95 px-6 text-xl font-black text-[#241c17] outline-none"
                autoFocus
              />
            </div>

            {showAnswer && (
              <div
                className={`mt-6 rounded-[1.75rem] p-5 ${
                  result === "correct"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                <div className="mt-2 flex items-center gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                      result === "correct" ? "bg-green-200" : "bg-red-200"
                    }`}
                  >
                    {result === "correct" ? (
                      <Check className="h-5 w-5 text-green-700" />
                    ) : (
                      <X className="h-5 w-5 text-red-700" />
                    )}
                  </div>

                  <div className="flex-1">
                    {result === "correct" ? (
                      <h3 className="text-xl font-black text-green-700">Chính xác!</h3>
                    ) : (
                      <p className="text-lg font-black text-red-700">
                        Đáp án đúng
                        <span className="ml-2 text-[#241c17]">{currentWord.word}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-7 rounded-[24px] bg-white/70 p-5 text-[#241c17]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-gray-400">Từ vựng</p>
                      <h3 className="mt-1 text-3xl font-black text-gray-900">
                        {currentWord.word}
                      </h3>

                      <div className="mt-2 flex items-center gap-3">
                        {currentWord.word_type ? (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase text-blue-600 shadow-sm">
                            {currentWord.word_type}
                          </span>
                        ) : null}

                        {currentWord.ipa ? (
                          <span className="text-sm font-medium text-gray-500">
                            {currentWord.ipa}
                          </span>
                        ) : null}
                      </div>
                    </div>

                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-bold text-gray-400">Nghĩa</p>
                    <p className="mt-1 text-2xl font-black text-gray-900">
                      {currentWord.meaning}
                    </p>
                  </div>

                  {currentWord.example ? (
                    <div className="mt-5 rounded-2xl bg-white px-4 py-3">
                      <p className="mb-2 text-sm font-bold text-gray-400">Ví dụ</p>
                      <p className="italic leading-relaxed text-gray-700">
                        {currentWord.example}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {!showAnswer ? (
              <button
                onClick={checkAnswer}
                className="flex h-14 flex-1 items-center justify-center rounded-3xl bg-[#d96d32] text-base font-bold text-white transition hover:bg-[#c25f29]"
              >
                Kiểm tra
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="flex h-14 flex-1 items-center justify-center rounded-3xl bg-[#1f1a17] text-base font-bold text-white"
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
