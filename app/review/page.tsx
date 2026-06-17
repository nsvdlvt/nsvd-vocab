"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  BookText,
  CalendarDays,
  ClipboardCheck,
  Headphones,
  Layers3,
  PenSquare,
  Play,
  ScanSearch,
  Sparkles,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import LoadingScreen from "@/components/ui/loading-screen"
import { fetchDueWordsForCurrentUser, REVIEW_DUE_SET_ID } from "@/lib/review-due-words"
import ReviewSession from "@/components/review/review-session"

type ReviewWord = {
  id: string
  word: string
  meaning: string
  ipa?: string | null
  word_type?: string | null
  example?: string | null
  memoryStrength: number
}

type WordGroup = {
  title: string
  icon: typeof Layers3
  colorClassName: string
  words: ReviewWord[]
}

type ReviewMode = {
  title: string
  href: string
  icon: typeof Layers3
  iconClassName: string
}

const reviewModes: ReviewMode[] = [
  {
    title: "Học",
    href: `/learn/${REVIEW_DUE_SET_ID}`,
    icon: BookOpen,
    iconClassName: "bg-[#eefaf2] text-[#1f8f55]",
  },
  {
    title: "Điền từ",
    href: `/write/${REVIEW_DUE_SET_ID}`,
    icon: PenSquare,
    iconClassName: "bg-[#fff1e8] text-[#d66a2f]",
  },
  {
    title: "Nghe chép",
    href: `/listen/${REVIEW_DUE_SET_ID}`,
    icon: Headphones,
    iconClassName: "bg-[#f3edff] text-[#7c4dff]",
  },
  {
    title: "Đọc hiểu",
    href: `/reading/${REVIEW_DUE_SET_ID}`,
    icon: ScanSearch,
    iconClassName: "bg-[#fbeee8] text-[#b45309]",
  },
]

const getLoginRedirectUrl = () => {
  const redirectTo = `${window.location.pathname}${window.location.search}`
  return `/login?redirectTo=${encodeURIComponent(redirectTo)}`
}

const getWordGroups = (words: ReviewWord[]): WordGroup[] => [
  {
    title: "Từ đã thuộc",
    icon: BadgeCheck,
    colorClassName: "bg-[#e9f8ef]",
    words: words.filter((word) => word.memoryStrength >= 4),
  },
  {
    title: "Từ đang học",
    icon: Sparkles,
    colorClassName: "bg-[#fff4de]",
    words: words.filter(
      (word) =>
        typeof word.memoryStrength === "number" &&
        (word.memoryStrength > 0 || word.memoryStrength === -1) &&
        word.memoryStrength < 4
    ),
  },
  {
    title: "Từ chưa học",
    icon: BookText,
    colorClassName: "bg-[#ebf4ff]",
    words: words.filter((word) => word.memoryStrength === 0),
  },
]

export default function ReviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const startReview = searchParams.get("start") === "1"

  const [loading, setLoading] = useState(true)
  const [words, setWords] = useState<ReviewWord[]>([])

  useEffect(() => {
    const loadDueWords = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push(getLoginRedirectUrl())
        return
      }

      const result = await fetchDueWordsForCurrentUser()
      setWords(result.words as ReviewWord[])
      setLoading(false)
    }

    void loadDueWords()
  }, [router])

  const groupedWords = useMemo(() => getWordGroups(words), [words])
  const masteredWords = words.filter((word) => word.memoryStrength >= 4).length
  const learningWords = words.filter(
    (word) =>
      (word.memoryStrength > 0 || word.memoryStrength === -1) &&
      word.memoryStrength < 4
  ).length
  const newWords = words.filter((word) => word.memoryStrength === 0).length

  if (startReview) {
    return <ReviewSession />
  }

  if (loading) {
    return (
      <LoadingScreen
        title="Đang tải bộ ôn tập"
        subtitle="Gom các từ đến hạn hôm nay cho bạn..."
      />
    )
  }

  return (
    <section className="w-full px-4 pb-28 pt-4 md:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-2xl border border-[#e9dccf] bg-white px-4 py-3 font-semibold text-[#2d241d] shadow-sm transition hover:bg-[#fffaf4]"
        >
          <ArrowLeft className="h-5 w-5" />
          Quay lại
        </button>
      </div>

      <div className="mb-10">
        <div className="w-full rounded-[2rem] border border-[#eadccf] bg-[linear-gradient(180deg,#fffdf9_0%,#fff6ec_100%)] p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9c6f49]">
            Review set
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#211914] md:text-5xl">
            Ôn tập ngắt quãng
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[#66584b]">
            Tất cả các từ đến hạn hôm nay được gom thành một bộ tổng hợp để bạn
            ôn lại trong một phiên duy nhất.
          </p>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="mb-5 text-3xl font-black text-[#211914]">Chế độ học</h2>
        <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
          <button
            onClick={() => router.push("/review?start=1")}
            className="flex min-h-[118px] flex-col items-center justify-center rounded-[1.35rem] border border-[#eadccf] bg-white px-3 py-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:min-h-[132px] sm:rounded-[1.6rem] sm:px-4 sm:py-5 xl:items-start xl:justify-start xl:rounded-[2rem] xl:p-5 xl:text-left"
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[#fff6d8] text-[#a87300] sm:h-12 sm:w-12 xl:mb-4 xl:h-14 xl:w-14 xl:rounded-2xl">
              <ClipboardCheck className="h-5 w-5 xl:h-7 xl:w-7" />
            </div>
            <h3 className="text-[15px] font-black leading-tight text-[#221a16] sm:text-base xl:text-lg">
              Ôn ngay
            </h3>
          </button>

          {reviewModes.map((mode) => {
            const Icon = mode.icon

            return (
              <button
                key={mode.title}
                onClick={() => router.push(mode.href)}
                className="flex min-h-[118px] flex-col items-center justify-center rounded-[1.35rem] border border-[#eadccf] bg-white px-3 py-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:min-h-[132px] sm:rounded-[1.6rem] sm:px-4 sm:py-5 xl:items-start xl:justify-start xl:rounded-[2rem] xl:p-5 xl:text-left"
              >
                <div
                  className={`mb-3 flex h-11 w-11 items-center justify-center rounded-[1rem] ${mode.iconClassName} sm:h-12 sm:w-12 xl:mb-4 xl:h-14 xl:w-14 xl:rounded-2xl`}
                >
                  <Icon className="h-5 w-5 xl:h-7 xl:w-7" />
                </div>
                <h3 className="text-[15px] font-black leading-tight text-[#221a16] sm:text-base xl:text-lg">
                  {mode.title}
                </h3>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mb-10 grid gap-4 md:grid-cols-3">
        <div className="rounded-[28px] border border-emerald-200 bg-emerald-50/90 p-5 shadow-[0_0_40px_rgba(34,197,94,0.14)]">
          <p className="text-sm font-semibold text-emerald-700">Từ đã thuộc</p>
          <p className="mt-3 text-3xl font-black text-emerald-800">{masteredWords}</p>
        </div>

        <div className="rounded-[28px] border border-amber-200 bg-amber-50/90 p-5 shadow-[0_0_40px_rgba(245,158,11,0.14)]">
          <p className="text-sm font-semibold text-amber-700">Từ đang học</p>
          <p className="mt-3 text-3xl font-black text-amber-800">{learningWords}</p>
        </div>

        <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Từ chưa học</p>
          <p className="mt-3 text-3xl font-black text-gray-900">{newWords}</p>
        </div>
      </div>

      {words.length === 0 ? (
        <div className="dashboard-card text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f7eadb] text-[#c96d35]">
            <BookOpen className="h-9 w-9" />
          </div>
          <h2 className="mt-5 text-3xl font-black text-[#241c17]">
            Chưa có thẻ đến hạn
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-lg leading-8 text-[#66584b]">
            Hôm nay bạn chưa có thẻ nào cần xử lý. Khi đến lịch, các từ sẽ tự
            hiện ở đây.
          </p>
          <button
            onClick={() => router.push("/home")}
            className="mt-8 inline-flex h-12 items-center justify-center rounded-3xl bg-[#1f1a17] px-6 text-base font-bold text-white transition hover:bg-[#2d241f]"
          >
            Quay về trang chủ
          </button>
        </div>
      ) : (
        <div className="grid gap-5">
          {groupedWords.map((group) => {
            if (group.words.length === 0) return null
            const GroupIcon = group.icon

            return (
              <div
                key={group.title}
                className="rounded-[2rem] border border-[#eadccf] bg-white p-6 shadow-sm"
              >
                <div className="mb-5 flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${group.colorClassName}`}
                  >
                    <GroupIcon className="h-6 w-6 text-[#3f3125]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#221a16]">{group.title}</h3>
                    <p className="text-sm font-medium text-[#8b7764]">
                      {group.words.length} từ vựng
                    </p>
                  </div>
                </div>

                <div className="grid gap-3">
                  {group.words.map((word) => (
                    <div
                      key={word.id}
                      className="rounded-[1.5rem] border border-[#edf2f7] bg-[#fbfdff] px-4 py-4 md:px-5"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <h4 className="text-lg font-black text-[#221a16] md:text-[1.15rem]">
                              {word.word}
                            </h4>
                            {word.ipa && (
                              <span className="text-sm text-[#8a8a8a]">{word.ipa}</span>
                            )}
                          </div>
                          <p className="mt-1 text-[15px] text-[#5f5a55]">{word.meaning}</p>
                          {word.example && (
                            <p className="mt-2 line-clamp-2 text-sm italic text-[#8a8178]">
                              {word.example}
                            </p>
                          )}
                        </div>

                        {word.word_type && (
                          <span className="w-fit shrink-0 rounded-full border border-[#ece4da] bg-white px-3 py-1 text-xs font-bold uppercase text-[#6e5844]">
                            {word.word_type}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
