"use client"

import { use, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  BookText,
  CalendarDays,
  ClipboardCheck,
  Headphones,
  Languages,
  Layers3,
  MessageSquareQuote,
  PenSquare,
  ScanSearch,
  Sparkles,
} from "lucide-react"
import { supabase } from "@/lib/supabase"

type WordType = {
  id: string
  word: string
  meaning: string
  ipa: string
  word_type: string
  example: string
  synonyms: string
  audio_url: string
  starred?: boolean
  memoryStrength?: number | null
}

type SessionWordProgress = {
  id?: string
  memoryStrength?: number
}

type SessionRow = {
  all_words?: SessionWordProgress[] | null
}


type LearningMode = {
  title: string
  href: string
  icon: typeof Layers3
  iconClassName: string
}

type WordGroup = {
  title: string
  icon: typeof Layers3
  colorClassName: string
  words: WordType[]
}

const learningModes = (id: string): LearningMode[] => [
  {
    title: "Flashcard",
    href: `/flashcard/${id}`,
    icon: Layers3,
    iconClassName: "bg-[#e8f1ff] text-[#2563eb]",
  },
  {
    title: "Học",
    href: `/learn/${id}`,
    icon: BookOpen,
    iconClassName: "bg-[#eefaf2] text-[#1f8f55]",
  },
  {
    title: "Điền từ",
    href: `/write/${id}`,
    icon: PenSquare,
    iconClassName: "bg-[#fff1e8] text-[#d66a2f]",
  },
  {
    title: "Nghe chép",
    href: `/listen/${id}`,
    icon: Headphones,
    iconClassName: "bg-[#f3edff] text-[#7c4dff]",
  },
  {
    title: "Kiểm tra",
    href: `/review/${id}`,
    icon: ClipboardCheck,
    iconClassName: "bg-[#fff6d8] text-[#a87300]",
  },
  {
    title: "Ngữ pháp",
    href: `/grammar/${id}`,
    icon: Languages,
    iconClassName: "bg-[#e8fbf8] text-[#0f8b7b]",
  },
  {
    title: "Đọc hiểu",
    href: `/reading/${id}`,
    icon: ScanSearch,
    iconClassName: "bg-[#fbeee8] text-[#b45309]",
  },
  {
    title: "Speaking",
    href: `/speaking/${id}`,
    icon: MessageSquareQuote,
    iconClassName: "bg-[#edf2ff] text-[#4338ca]",
  },
]

const getWordGroups = (words: WordType[]): WordGroup[] => [
  {
    title: "Từ đã thuộc",
    icon: BadgeCheck,
    colorClassName: "bg-[#e9f8ef]",
    words: words.filter((word) => word.memoryStrength === 4),
  },
  {
    title: "Từ đang học",
    icon: Sparkles,
    colorClassName: "bg-[#fff4de]",
    words: words.filter(
      (word) =>
        typeof word.memoryStrength === "number" &&
        word.memoryStrength > 0 &&
        word.memoryStrength < 4
    ),
  },
  {
    title: "Từ chưa học",
    icon: BookText,
    colorClassName: "bg-[#ebf4ff]",
    words: words.filter(
      (word) =>
        word.memoryStrength === null ||
        word.memoryStrength === undefined ||
        word.memoryStrength === 0
    ),
  },
]


export default function SetPage({
  params,
}: {
  params: Promise<{
    id: string
  }>
}) {
  const router = useRouter()
  const { id } = use(params)

  const [words, setWords] = useState<WordType[]>([])
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [authorAvatar, setAuthorAvatar] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSet = async () => {
      setLoading(true)

      const { data: setData } = await supabase
        .from("vocab_sets")
        .select("title, author_name, author_avatar")
        .eq("id", id)
        .single()

      if (setData) {
        setTitle(setData.title || "")
        setAuthor(setData.author_name || "")
        setAuthorAvatar(setData.author_avatar || "")
      }

      const { data: wordRows } = await supabase
        .from("vocab_words")
        .select("*")
        .eq("set_id", id)

      let mergedWords: WordType[] = (wordRows || []) as WordType[]

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data: session } = await supabase
            .from("learning_sessions")
            .select("all_words")
            .eq("user_id", user.id)
            .eq("set_id", id)
            .maybeSingle()

          const progressMap = new Map<string, number>()
          ;(((session as SessionRow | null)?.all_words || []) as SessionWordProgress[]).forEach((item) => {
            if (!item.id) return
            const strength = Number(item.memoryStrength || 0)
            progressMap.set(item.id, Number.isNaN(strength) ? 0 : strength)
          })

          mergedWords = mergedWords.map((word) => ({
            ...word,
            memoryStrength: progressMap.has(word.id)
              ? progressMap.get(word.id)
              : word.memoryStrength ?? null,
          }))
        }
      } catch {
        // Keep the plain word list if session data cannot be merged.
      }

      setWords(mergedWords)
      setLoading(false)
    }

    void loadSet()
  }, [id])


  const groupedWords = useMemo(() => getWordGroups(words), [words])
  const modes = useMemo(() => learningModes(id), [id])

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#d7e8ff] border-t-[#2563eb]" />
      </div>
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

        <button
          onClick={() => router.push(`/review/${id}`)}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#2563eb] px-4 py-3 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-[#1f57d6]"
        >
          <CalendarDays className="h-5 w-5" />
          Học ngắt quãng
        </button>
      </div>

      <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9c6f49]">
            Vocabulary set
          </p>
          <h1 className="mt-3 max-w-4xl break-words text-4xl font-black tracking-[-0.04em] text-[#211914] md:text-5xl">
            {title}
          </h1>
        </div>

        {author && (
          <div className="w-full rounded-[2rem] border border-[#eadccf] bg-[linear-gradient(180deg,#fffdf9_0%,#fff6ec_100%)] p-5 shadow-sm lg:w-auto lg:min-w-[240px]">
            <p className="text-sm font-semibold text-[#9a7a5c]">Tác giả</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-[#e9f1ff] text-lg font-black text-[#2563eb]">
                {authorAvatar ? (
                  <img
                    src={authorAvatar}
                    alt={author}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  author.charAt(0).toUpperCase()
                )}
              </div>
              <h2 className="text-lg font-black text-[#221a16]">{author}</h2>
            </div>
          </div>
        )}
      </div>

      <div className="mb-10">
        <h2 className="mb-5 text-3xl font-black text-[#211914]">Chế độ học</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {modes.map((mode) => {
            const Icon = mode.icon

            return (
              <button
                key={mode.title}
                onClick={() => router.push(mode.href)}
                className="rounded-[2rem] border border-[#eadccf] bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div
                  className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${mode.iconClassName}`}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-black text-[#221a16]">{mode.title}</h3>
              </button>
            )
          })}
        </div>
      </div>

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
                  <p className="text-sm font-medium text-[#8b7764]">{group.words.length} từ vựng</p>
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
    </section>
  )
}
