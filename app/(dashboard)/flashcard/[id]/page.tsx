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

const flipStyles = `
  .flip-container {
    perspective: 1000px;
  }

  .flip-card {
    position: relative;
    width: 100%;
    height: 100%;
    transition:
  transform 0.7s
  cubic-bezier(
    0.22,
    1,
    0.36,
    1
  );
    transform-style: preserve-3d;
  }

.flip-card.flipped {
  transform: rotateY(180deg);
}

  .flip-card-front,
.flip-card-back {
  position: absolute;
  inset: 0;

  width: 100%;
  height: 100%;

  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;

  border-radius: 50px;

  background: white;
}

.flip-card-back {
  transform: rotateY(180deg);
}
`

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
    const playAudio = () => {

        speechSynthesis.cancel()

        if (currentWord.audio_url) {

            const audio =
                new Audio(
                    currentWord.audio_url
                )

            audio.play().catch(() => {

                const utterance =
                    new SpeechSynthesisUtterance(
                        currentWord.word
                    )

                utterance.lang = "en-US"

                speechSynthesis.speak(
                    utterance
                )
            })

        } else {

            const utterance =
                new SpeechSynthesisUtterance(
                    currentWord.word
                )

            utterance.lang = "en-US"

            speechSynthesis.speak(
                utterance
            )
        }
    }
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
            <style>{flipStyles}</style>

            {/* TOP */}
            <div className="mb-10 text-center">

                <p className="text-gray-500">
                    Flashcard mode ✨
                </p>

                <h1 className="text-3xl md:text-5xl font-black mt-2">
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

                <div
                    onClick={() =>
                        setFlipped(!flipped)
                    }
                    className="flip-container w-full h-[420px] md:h-[500px] rounded-[50px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-gray-100 cursor-pointer hover:scale-[1.01]
                        hover:shadow-2xl
                        active:scale-[0.98] transition-all"
                >
                    <div className={`flip-card ${flipped ? 'flipped' : ''}`}>
                        {/* FRONT - Word */}
                        <div className="flip-card-front bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col justify-center items-center text-center p-10">
                            <p className="text-gray-400 font-bold mb-5">
                                WORD
                            </p>

                            <h2 className="text-4xl md:text-6xl font-black">
                                {currentWord.word}
                            </h2>

                            <p className="text-2xl text-gray-500 mt-5">
                                {currentWord.ipa}
                            </p>


                            <button
                                onClick={(e) => {

                                    e.stopPropagation()

                                    playAudio()

                                }}
                                className="mt-8 w-16 h-16 rounded-2xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition"
                            >
                                <Volume2 className="w-7 h-7 text-blue-600" />
                            </button>


                        </div>

                        {/* BACK - Meaning */}
                        <div className="flip-card-back bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col justify-center items-center text-center p-10">
                            <p className="text-gray-400 font-bold mb-5">
                                MEANING
                            </p>

                            <h2 className="text-3xl md:text-5xl break-words font-black">
                                {currentWord.meaning}
                            </h2>

                            <p className="text-xl text-gray-500 mt-8 max-w-xl">
                                {currentWord.example}
                            </p>
                        </div>
                    </div>
                </div>

                {/* HINT */}
                <p className="text-center text-gray-500 mt-5">
                    Click vào card để lật 😎🔥
                </p>

                {/* ACTIONS */}
                <div className="flex items-center justify-center gap-5 mt-10">

                    <button
                        onClick={prevCard}
                        disabled={currentIndex === 0}
                        className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center disabled:opacity-40"
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