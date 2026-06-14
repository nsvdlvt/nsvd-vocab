"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Bookmark, Copy, Pencil } from "lucide-react"
import { supabase } from "@/lib/supabase"

type WordType = {
  word: string
  meaning: string
  ipa: string
  type: string
  example: string
  synonyms: string
}

type SetDetail = {
  id: string
  title: string
  description?: string
  tag?: string
  icon?: string
  owner_name?: string
  total_words: number
}

export default function CommunityViewPage({
  params,
}: {
  params: Promise<{
    id: string
  }>
}) {
  const router = useRouter()
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [setDetail, setSetDetail] = useState<SetDetail | null>(null)
  const [words, setWords] = useState<WordType[]>([])

  useEffect(() => {
    fetchSet()
  }, [id])

  const fetchSet = async () => {
    setLoading(true)

    const { data: setData } = await supabase
      .from("vocab_sets")
      .select("*")
      .eq("id", id)
      .single()

    const { data: wordsData } = await supabase
      .from("vocab_words")
      .select("*")
      .eq("set_id", id)

    if (setData) {
      setSetDetail({
        id: setData.id,
        title: setData.title,
        description: setData.description,
        tag: setData.tag,
        icon: setData.icon,
        owner_name: setData.author_name || "Community",
        total_words: wordsData?.length || 0,
      })
    }

    setWords(
      (wordsData || []).map((word) => ({
        word: word.word,
        meaning: word.meaning,
        ipa: word.ipa,
        type: word.word_type,
        example: word.example,
        synonyms: word.synonyms,
      }))
    )

    setLoading(false)
  }

  const saveSet = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const user = session?.user
    if (!user || !setDetail) {
      const redirectTo = `${window.location.pathname}${window.location.search}`
      router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`)
      return
    }

    const { data: newSet } = await supabase
      .from("vocab_sets")
      .insert({
        user_id: user.id,
        title: setDetail.title,
        description: setDetail.description,
        tag: setDetail.tag,
        icon: setDetail.icon || "📘",
        is_public: false,
      })
      .select()
      .single()

    if (newSet && words.length) {
      await supabase.from("vocab_words").insert(
        words.map((word) => ({
          set_id: newSet.id,
          word: word.word,
          meaning: word.meaning,
          ipa: word.ipa,
          word_type: word.type,
          example: word.example,
          synonyms: word.synonyms,
        }))
      )
    }

    router.push(`/edit/${newSet.id}?source=${id}`)
  }

  const copyToCreatePage = async () => {
    const payload = {
      title: setDetail?.title || "",
      description: setDetail?.description || "",
      tag: setDetail?.tag || "",
      icon: setDetail?.icon || "📘",
      words,
    }

    sessionStorage.setItem(
      "community_clone_payload",
      JSON.stringify(payload)
    )

    router.push("/new?clone=community")
  }

  if (loading || !setDetail) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    )
  }

  return (
    <section className="min-h-screen bg-[#f5f9ff] p-5 md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-semibold">Quay lại</span>
          </button>

          <div className="flex gap-3">
          
            <button
              onClick={saveSet}
              className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Bookmark className="h-4 w-4" />
              Lưu bộ từ
            </button>
          </div>
        </div>

        <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                {setDetail.tag || "General"}
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-gray-950 md:text-5xl">
                {setDetail.title}
              </h1>
              {setDetail.description ? (
                <p className="mt-3 max-w-3xl text-gray-500">
                  {setDetail.description}
                </p>
              ) : null}
            </div>

            <div className="rounded-3xl border border-gray-100 bg-[#f5f9ff] px-5 py-4">
              <p className="text-sm font-semibold text-gray-500">Chủ sở hữu</p>
              <p className="mt-1 text-lg font-black text-gray-950">
                {setDetail.owner_name || "Community"}
              </p>
              <p className="mt-4 text-sm font-semibold text-gray-500">Số lượng từ</p>
              <p className="mt-1 text-3xl font-black text-blue-600">
                {setDetail.total_words}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4">
            {words.map((word, index) => (
              <div
                key={`${word.word}-${index}`}
                className="rounded-[28px] border border-gray-100 bg-[#f5f9ff] px-5 py-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xl font-black text-gray-950">{word.word}</p>
                    <p className="mt-1 text-gray-600">{word.meaning}</p>
                    {word.example ? (
                      <p className="mt-2 text-sm italic text-gray-400">
                        {word.example}
                      </p>
                    ) : null}
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
