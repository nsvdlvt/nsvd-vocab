"use client"

import {
  use,
  useEffect,
  useState,
} from "react"

import { supabase }
from "@/lib/supabase"

import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Volume2,
} from "lucide-react"

type WordType = {
  id: string
  word: string
  meaning: string
  ipa: string
  example: string
  audio_url: string
}

export default function FlashcardPage({
  params,
}: {
  params: Promise<{
    id: string
  }>
}) {

  const { id } = use(params)

  const [words, setWords] =
    useState<WordType[]>([])

  const [loading, setLoading] =
    useState(true)

  const [currentIndex, setCurrentIndex] =
    useState(0)

  const [flipped, setFlipped] =
    useState(false)

  const [title, setTitle] =
    useState("")

  useEffect(() => {
    fetchWords()
  }, [])

  const fetchWords = async () => {

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

  const currentWord =
    words[currentIndex]

  const nextCard = () => {

    if (
      currentIndex <
      words.length - 1
    ) {

      setFlipped(false)

      setCurrentIndex(
        currentIndex + 1
      )
    }
  }

  const prevCard = () => {

    if (currentIndex > 0) {

      setFlipped(false)

      setCurrentIndex(
        currentIndex - 1
      )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <section className="min-h-screen bg-[#f5f9ff] p-5 md:p-10">

      {/* TOP */}
      <div className="mb-10 text-center">

        <p className="text-gray-500">
          Flashcard mode ✨
        </p>

        <h1 className="text-5xl font-black mt-2">
          {title}
        </h1>

      </div>

      {/* PROGRESS */}
      <div className="max-w-3xl mx-auto mb-6">

        <div className="flex justify-between mb-3 text-sm font-bold text-gray-500">
          <span>
            {currentIndex + 1}
            /
            {words.length}
          </span>

          <span>
            {Math.round(
              (
                (currentIndex + 1)
                /
                words.length
              ) * 100
            )}%
          </span>
        </div>

        <div className="w-full h-4 bg-white rounded-full overflow-hidden">

          <div
            className="h-full bg-blue-600 transition-all duration-500"
            style={{
              width: `${(
                (currentIndex + 1)
                /
                words.length
              ) * 100}%`
            }}
          />

        </div>
      </div>

      {/* CARD */}
      <div className="max-w-3xl mx-auto">

        <button
          onClick={() =>
            setFlipped(!flipped)
          }
          className="w-full h-[500px] rounded-[50px] bg-white shadow-xl border border-gray-100 p-10 flex flex-col justify-center items-center text-center hover:scale-[1.01] transition-all"
        >

          {!flipped ? (

            <>
              <p className="text-gray-400 font-bold mb-5">
                WORD
              </p>

              <h2 className="text-6xl font-black">
                {currentWord.word}
              </h2>

              <p className="text-2xl text-gray-500 mt-5">
                {currentWord.ipa}
              </p>

              {currentWord.audio_url && (

                <button
                  onClick={(e) => {

                    e.stopPropagation()

                    new Audio(
                      currentWord.audio_url
                    ).play()

                  }}
                  className="mt-8 w-16 h-16 rounded-2xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition"
                >
                  <Volume2 className="w-7 h-7 text-blue-600" />
                </button>

              )}

            </>

          ) : (

            <>
              <p className="text-gray-400 font-bold mb-5">
                MEANING
              </p>

              <h2 className="text-5xl font-black">
                {currentWord.meaning}
              </h2>

              <p className="text-xl text-gray-500 mt-8 max-w-xl">
                {currentWord.example}
              </p>
            </>

          )}

        </button>

        {/* HINT */}
        <p className="text-center text-gray-500 mt-5">
          Click vào card để lật 😎🔥
        </p>

        {/* ACTIONS */}
        <div className="flex items-center justify-center gap-5 mt-10">

          <button
            onClick={prevCard}
            disabled={currentIndex === 0}
            className="w-16 h-16 rounded-2xl bg-white border border-gray-100 flex items-center justify-center disabled:opacity-40"
          >
            <ChevronLeft />
          </button>

          <button
            onClick={() =>
              setFlipped(!flipped)
            }
            className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center"
          >
            <RotateCcw />
          </button>

          <button
            onClick={nextCard}
            disabled={
              currentIndex ===
              words.length - 1
            }
            className="w-16 h-16 rounded-2xl bg-white border border-gray-100 flex items-center justify-center disabled:opacity-40"
          >
            <ChevronRight />
          </button>

        </div>

      </div>

    </section>
  )
}