"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
  Layers3,
  BookOpen,
  PenSquare,
  Headphones,
  ClipboardCheck,
  ArrowLeft,
  CalendarDays,
} from "lucide-react"

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
memoryStrength?: number
}

import { use } from "react"

export default function SetPage({
  params,
}: {
  params: Promise<{
    id: string
  }>
}) {
  const router = useRouter()
  const { id } = use(params)
  const [words, setWords] =
    useState<WordType[]>([])

  const [title, setTitle] =
    useState("")
  const [description, setDescription] =
    useState("")
  const [author, setAuthor] =
    useState("")
  const [authorAvatar, setAuthorAvatar] =
    useState("")
  const [loading, setLoading] =
    useState(true)
  const [
    previewModal,
    setPreviewModal
  ] = useState<{
    title: string
    words: WordType[]
  } | null>(null)
  useEffect(() => {
    fetchSet()
  }, [id])
  useEffect(() => {

  const handleEsc = (
    e: KeyboardEvent
  ) => {

    if (
      e.key === "Escape"
    ) {

      setPreviewModal(null)
    }
  }

  window.addEventListener(
    "keydown",
    handleEsc
  )

  return () => {

    window.removeEventListener(
      "keydown",
      handleEsc
    )
  }

}, [])
  const renderCompactSection = (
    title: string,
    words: WordType[],
    icon: string,
    color: string
  ) => {

    if (words.length === 0)
      return null

    return (

      <div className="
bg-white
rounded-[32px]
border border-gray-100
shadow-sm
p-6
">

        {/* HEADER */}
        <div className="
flex
items-center
justify-between
mb-5
">

          <div className="
flex
items-center
gap-3
">

            <div className={`
w-12
h-12
rounded-2xl

flex
items-center
justify-center

text-2xl

${color}
`}>

              {icon}

            </div>

            <div>

              <h3 className="
text-2xl
font-black
">

                {title}

              </h3>

              <p className="
text-gray-400
font-medium
text-sm
">

                {words.length} từ

              </p>

            </div>

          </div>

          {words.length > 3 && (

            <button
              onClick={() =>
                setPreviewModal({
                  title,
                  words
                })
              }
              className="
px-4
py-2

rounded-xl

bg-blue-50
hover:bg-blue-100

text-blue-600
font-bold

transition
"
            >

              Xem thêm →

            </button>

          )}

        </div>

        {/* WORDS */}
        <div className="
space-y-3
">

          {words
            .slice(0, 3)
            .map((word) => (

              <div
                key={word.id}
                className="
bg-[#f5f9ff]
rounded-2xl
p-4

border border-blue-50
"
              >

                <div className="
flex
items-center
justify-between
gap-3
">

                  <div>

                    <h4 className="
font-black
text-lg
">

                      {word.word}

                    </h4>

                    <p className="
text-gray-500
mt-1
">

                      {word.meaning}
                    </p>

                  </div>

                  {word.word_type && (

                    <span className="
px-3
py-1

rounded-full

bg-white
border border-gray-100

text-xs
font-bold
uppercase
text-gray-500
">

                      {word.word_type}

                    </span>

                  )}

                </div>

              </div>

            ))}

        </div>

      </div>
    )
  }
  const fetchSet = async () => {
    const { data: setData } =
      await supabase
        .from("vocab_sets")
        .select("*")
        .eq("id", id)
        .single()

    if (setData) {
      setTitle(setData.title)
      setDescription(
        setData.description || ""
      )
      setAuthor(
        setData.author_name || ""
      )
      setAuthorAvatar(
        setData.author_avatar || ""
      )
    }

    const { data } =
      await supabase
        .from("vocab_words")
        .select("*")
        .eq("set_id", id)

    setWords(data || [])

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <section className="w-full p-4 md:p-8 pb-28">

      {/* TOP BAR */}
      <div className="flex items-center justify-between mb-6">

        {/* BACK */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 bg-white border border-gray-100 hover:bg-gray-50 transition rounded-2xl px-4 py-3 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />

          <span className="font-semibold">
            Quay lại
          </span>
        </button>

        {/* SPACED REP */}
        <button
          className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 transition rounded-2xl px-4 py-3 shadow-lg shadow-blue-200"
        >
          <CalendarDays className="w-5 h-5" />

          <span className="font-semibold">
            Học ngắt quãng
          </span>
        </button>

      </div>
      {/* TOP */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-10">

        {/* LEFT */}
        <div>
          <p className="text-gray-500 text-lg">
            Vocabulary set ✨
          </p>

          <h1 className="text-4xl md:text-5xl font-black mt-2 leading-none break-words">
            {title}
          </h1>

          {description && (

            <p className="text-gray-500 text-lg mt-4 max-w-3xl leading-relaxed">
              {description}
            </p>

          )}
        </div>

        {/* AUTHOR */}
        {author && (
          <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-100 shadow-sm rounded-3xl px-5 py-4 w-full md:w-auto md:min-w-[220px]">

            <p className="text-gray-400 text-sm font-semibold">
              Tác giả
            </p>

            <div className="flex items-center gap-3 mt-2">

              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-blue-100 flex items-center justify-center">

                {authorAvatar ? (

                  <img
                    src={authorAvatar}
                    alt={author}
                    className="w-full h-full object-cover"
                  />

                ) : (

                  <span className="font-black text-lg text-blue-600">
                    {author.charAt(0)}
                  </span>

                )}

              </div>

              <div>
                <h3 className="font-black text-lg leading-tight">
                  {author}
                </h3>

                <p className="text-gray-400 text-sm">
                  Member
                </p>
              </div>

            </div>
          </div>
        )}

      </div>
      {/* LEARNING MODES */}
      <div className="mb-10">

        <h2 className="text-3xl font-black mb-5">
          Chế độ học 😎🔥
        </h2>

        <div
          className="
    grid
    gap-3
    md:gap-4
    w-full
  "
          style={{
            gridTemplateColumns:
              "repeat(auto-fit,minmax(180px,1fr))"
          }}
        >

          {/* FLASHCARD */}
          <button
            onClick={() =>
              router.push(
                `/flashcard/${id}`
              )
            }
            className="w-full max-w-full min-w-0 bg-white border border-gray-100 hover:-translate-y-1 hover:shadow-xl transition-all rounded-[24px] p-4 text-left min-h-[140px] md:min-h-[180px]"
          >

            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <Layers3 className="w-7 h-7 text-blue-600" />
            </div>

            <h3 className="font-black text-sm md:text-lg">
              Flashcard
            </h3>

            <p className="text-gray-500 text-sm mt-1 hidden md:block">
              Lật thẻ học từ
            </p>
          </button>

          {/* LEARN */}
          <button
            onClick={() =>
              router.push(
                `/learn/${id}`
              )
            }
            className="w-full max-w-full min-w-0 bg-white border border-gray-100 hover:-translate-y-1 hover:shadow-xl transition-all rounded-[24px] p-4 text-left min-h-[140px] md:min-h-[180px]"
          >
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <BookOpen className="w-7 h-7 text-blue-600" />
            </div>

            <h3 className="font-black text-sm md:text-lg">
              Học
            </h3>

            <p className="text-gray-500 text-sm mt-1 hidden md:block">
              Học từng bước
            </p>
          </button>

          {/* FILL */}
          <button
            className="w-full max-w-full min-w-0 bg-white border border-gray-100 hover:-translate-y-1 hover:shadow-xl transition-all rounded-[24px] p-4 text-left min-h-[140px] md:min-h-[180px]"
          >
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <PenSquare className="w-7 h-7 text-blue-600" />
            </div>

            <h3 className="font-black text-sm md:text-lg">
              Điền từ
            </h3>

            <p className="text-gray-500 text-sm mt-1 hidden md:block">
              Điền từ còn thiếu
            </p>
          </button>

          {/* LISTEN */}
          <button
            className="w-full max-w-full min-w-0 bg-white border border-gray-100 hover:-translate-y-1 hover:shadow-xl transition-all rounded-[24px] p-4 text-left min-h-[140px] md:min-h-[180px]"
          >
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <Headphones className="w-7 h-7 text-blue-600" />
            </div>

            <h3 className="font-black text-sm md:text-lg">
              Nghe chép
            </h3>

            <p className="text-gray-500 text-sm mt-1 hidden md:block">
              Nghe và gõ lại
            </p>
          </button>

          {/* TEST */}
          <button
            className="w-full max-w-full min-w-0 bg-white border border-gray-100 hover:-translate-y-1 hover:shadow-xl transition-all rounded-[24px] p-4 text-left min-h-[140px] md:min-h-[180px]"
          >
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <ClipboardCheck className="w-7 h-7 text-blue-600" />
            </div>

            <h3 className="font-black text-sm md:text-lg">
              Kiểm tra
            </h3>

            <p className="text-gray-500 text-sm mt-1 hidden md:block">
              Test tổng hợp
            </p>
          </button>

        </div>
      </div>
      {/* WORD LIST */}
<div className="
grid
gap-5
">

  {renderCompactSection(
    "Từ đánh dấu sao",
    words.filter(
      (w: any) => w.starred
    ),
    "⭐",
    "bg-yellow-100"
  )}

  {renderCompactSection(
    "Từ đã thuộc",
    words.filter(
      (w: any) =>
        w.memoryStrength >= 4
    ),
    "🧠",
    "bg-green-100"
  )}

  {renderCompactSection(
    "Từ chưa thuộc",
    words.filter(
      (w: any) =>
        !w.memoryStrength ||
        w.memoryStrength < 4
    ),
    "📘",
    "bg-blue-100"
  )}

</div>

{/* PREVIEW MODAL */}
{previewModal && (

  <div className="
fixed
inset-0
z-50

bg-black/40
backdrop-blur-sm

flex
items-center
justify-center

p-5
">

    <div className="
w-full
max-w-3xl

bg-white

rounded-[36px]

p-7

shadow-[0_20px_80px_rgba(0,0,0,0.15)]

max-h-[85vh]
overflow-y-auto
">

      {/* HEADER */}
      <div className="
flex
items-center
justify-between
mb-6
">

        <div>

          <h2 className="
text-3xl
font-black
">

            {previewModal.title}

          </h2>

          <p className="
text-gray-400
font-medium
mt-1
">

            {previewModal.words.length} từ
          </p>

        </div>

        <button
          onClick={() =>
            setPreviewModal(null)
          }
          className="
w-11
h-11

rounded-2xl

hover:bg-gray-100

flex
items-center
justify-center

transition
"
        >

          ✕

        </button>

      </div>

      {/* LIST */}
      <div className="
space-y-3
">

        {previewModal.words.map(
          (word) => (

            <div
              key={word.id}
              className="
bg-[#f5f9ff]

rounded-2xl
p-5

border border-blue-50
"
            >

              <div className="
flex
items-start
justify-between
gap-4
">

                <div>

                  <h3 className="
text-xl
font-black
">

                    {word.word}

                  </h3>

                  <p className="
text-gray-600
mt-1
">

                    {word.meaning}
                  </p>

                  {word.example && (

                    <p className="
text-gray-400
italic
mt-3
text-sm
">

                      {word.example}
                    </p>

                  )}

                </div>

                {word.word_type && (

                  <span className="
px-3
py-1

rounded-full

bg-white

text-xs
font-bold
uppercase

border border-gray-100
">

                    {word.word_type}

                  </span>

                )}

              </div>

            </div>

          )
        )}

      </div>

    </div>

  </div>

)}
    </section >
  )
}
