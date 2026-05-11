"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type WordType = {
  id: string
  word: string
  meaning: string
  ipa: string
  word_type: string
  example: string
  synonyms: string
}

import { use } from "react"

export default function SetPage({
  params,
}: {
  params: Promise<{
    id: string
  }>
}) {
  const { id } = use(params)
  const [words, setWords] =
    useState<WordType[]>([])

  const [title, setTitle] =
    useState("")

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    fetchSet()
  }, [id])

  const fetchSet = async () => {
    const { data: setData } =
      await supabase
        .from("vocab_sets")
        .select("*")
        .eq("id", id)
        .single()

    if (setData) {
      setTitle(setData.title)
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
    <section className="p-5 md:p-8 pb-28">

      {/* TOP */}
      <div className="mb-10">
        <p className="text-gray-500 text-lg">
          Vocabulary set ✨
        </p>

        <h1 className="text-5xl font-black mt-2">
          {title}
        </h1>
      </div>

      {/* WORDS */}
      <div className="space-y-6">

        {words.map((word, index) => (
          <div
            key={word.id}
            className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-6 md:p-8"
          >

            {/* TOP */}
            <div className="flex items-center gap-4 mb-8">

              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl">
                {index + 1}
              </div>

              <h2 className="text-3xl font-black">
                {word.word}
              </h2>
            </div>

            {/* GRID */}
            <div className="grid md:grid-cols-2 gap-5">

              <div className="bg-[#f5f9ff] rounded-2xl p-5">
                <p className="text-gray-500 mb-2">
                  Nghĩa
                </p>

                <p className="font-bold text-lg">
                  {word.meaning}
                </p>
              </div>

              <div className="bg-[#f5f9ff] rounded-2xl p-5">
                <p className="text-gray-500 mb-2">
                  IPA
                </p>

                <p className="font-bold text-lg">
                  {word.ipa || "—"}
                </p>
              </div>

              <div className="bg-[#f5f9ff] rounded-2xl p-5">
                <p className="text-gray-500 mb-2">
                  Từ loại
                </p>

                <p className="font-bold text-lg">
                  {word.word_type || "—"}
                </p>
              </div>

              <div className="bg-[#f5f9ff] rounded-2xl p-5">
                <p className="text-gray-500 mb-2">
                  Synonyms
                </p>

                <p className="font-bold text-lg">
                  {word.synonyms || "—"}
                </p>
              </div>

              <div className="bg-[#f5f9ff] rounded-2xl p-5 md:col-span-2">
                <p className="text-gray-500 mb-2">
                  Ví dụ
                </p>

                <p className="font-bold text-lg">
                  {word.example || "—"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}