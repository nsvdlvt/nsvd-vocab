"use client"

import {
    use,
    useEffect,
    useState,
} from "react"

import { supabase }
    from "@/lib/supabase"
import { useRouter }
    from "next/navigation"
import {
    ChevronLeft,
    ArrowLeft,
    CalendarDays,
    ChevronRight,
    Shuffle,
    Volume2,
    Settings2

} from "lucide-react"

type WordType = {
    id: string
    word: string
    meaning: string
    ipa: string
    example: string
    audio_url: string
    word_type: string
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
    const router = useRouter()

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
    const [showSettings, setShowSettings] =
        useState(false)

    const [frontMode, setFrontMode] =
        useState<
            "word" | "meaning"
        >("word")
    const [isShuffled, setIsShuffled] =
        useState(false)
    useEffect(() => {
        fetchWords()
    }, [])
    useEffect(() => {

        const closeSettings = () =>
            setShowSettings(false)

        window.addEventListener(
            "click",
            closeSettings
        )

        return () =>
            window.removeEventListener(
                "click",
                closeSettings
            )

    }, [])
    useEffect(() => {

        const handleKey = (
            e: KeyboardEvent
        ) => {

            if (
                e.code === "Space" ||
                e.code === "Enter"
            ) {

                e.preventDefault()

                setFlipped(
                    (prev) => !prev
                )
            }

            if (
                e.key === "ArrowRight"
            ) {

                nextCard()
            }

            if (
                e.key === "ArrowLeft"
            ) {

                prevCard()
            }
        }

        window.addEventListener(
            "keydown",
            handleKey
        )

        return () =>
            window.removeEventListener(
                "keydown",
                handleKey
            )

    }, [
        currentIndex,
        flipped,
        words
    ])

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
    const shuffleCards = () => {

        if (!isShuffled) {

            const shuffled =
                [...words].sort(
                    () =>
                        Math.random() - 0.5
                )

            setWords(shuffled)

        } else {

            fetchWords()
        }

        setIsShuffled(
            !isShuffled
        )

        setCurrentIndex(0)

        setFlipped(false)
    }
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
        )
    }
    const settingsButton = (

        <div className="absolute top-5 left-5 z-30">

            <button
                onClick={(e) => {

                    e.stopPropagation()

                    setShowSettings(
                        !showSettings
                    )
                }}
                className="w-11 h-11 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:scale-105 transition"
            >
                <Settings2 className="w-5 h-5 text-gray-700" />
            </button>

            {showSettings && (

                <div
                    onClick={(e) =>
                        e.stopPropagation()
                    }
                    className="absolute top-14 left-0 w-[260px] bg-white border border-gray-100 rounded-3xl shadow-2xl p-5"
                >

                    <h3 className="font-black text-lg mb-5">
                        Mặt trước thẻ
                    </h3>

                    <div className="space-y-4">

                        {/* WORD */}
                        <button
                            onClick={() =>
                                setFrontMode(
                                    "word"
                                )
                            }
                            className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition ${frontMode ===
                                "word"
                                ? "bg-blue-50 border-blue-200"
                                : "border-gray-100"
                                }`}
                        >

                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${frontMode ===
                                "word"
                                ? "border-blue-600"
                                : "border-gray-300"
                                }`}>

                                {frontMode ===
                                    "word" && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                                    )}

                            </div>

                            <span className="font-semibold">
                                Hiện thuật ngữ
                            </span>

                        </button>

                        {/* MEANING */}
                        <button
                            onClick={() =>
                                setFrontMode(
                                    "meaning"
                                )
                            }
                            className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition ${frontMode ===
                                "meaning"
                                ? "bg-blue-50 border-blue-200"
                                : "border-gray-100"
                                }`}
                        >

                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${frontMode ===
                                "meaning"
                                ? "border-blue-600"
                                : "border-gray-300"
                                }`}>

                                {frontMode ===
                                    "meaning" && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                                    )}

                            </div>

                            <span className="font-semibold">
                                Hiện định nghĩa
                            </span>

                        </button>

                    </div>

                </div>

            )}

        </div>
    )
    return (
        <section className="min-h-screen bg-[#f5f9ff] p-5 md:p-10">
            <style>{flipStyles}</style>
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


            </div>
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
                    className="
flip-container
w-full
h-[500px]
md:h-[620px]
rounded-[40px]
cursor-pointer
"
                >
                    <div className={`flip-card ${flipped ? 'flipped' : ''}`}>
                        {/* FRONT - Word */}
                        <div className="
flip-card-front
bg-white
border
border-gray-100
rounded-[40px]
shadow-[0_10px_40px_rgba(0,0,0,0.06)]
flex
flex-col
justify-center
items-center
text-center
p-10
">
                            {settingsButton}

                            <p className="text-gray-400 font-bold mb-5">
                                {frontMode === "word"
                                    ? "WORD"
                                    : "MEANING"}
                            </p>

                            <h2 className="text-4xl md:text-6xl font-black">
                                {frontMode === "word"
                                    ? currentWord.word
                                    : currentWord.meaning}
                            </h2>

                            {frontMode === "word" && (

                                <div className="flex items-center gap-3 mt-5 flex-wrap justify-center">

                                    {currentWord.word_type && (

                                        <span className="px-4 py-2 rounded-full bg-blue-50 text-blue-600 font-bold text-sm uppercase">
                                            {currentWord.word_type}
                                        </span>

                                    )}

                                    {currentWord.ipa && (

                                        <p className="text-xl text-gray-500">
                                            {currentWord.ipa}
                                        </p>

                                    )}

                                </div>

                            )}

                            {currentWord.example && (
                                <p className="text-xl text-gray-500 mt-8 max-w-xl">
                                    {currentWord.example}
                                </p>
                            )}

                            {frontMode === "word" && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        playAudio()
                                    }}
                                    className="mt-8 w-16 h-16 rounded-2xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition"
                                >
                                    <Volume2 className="w-7 h-7 text-blue-600" />
                                </button>
                            )}


                        </div>

                        {/* BACK - Meaning */}
                        <div className="flip-card-back bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col justify-center items-center text-center p-10">
                            <p className="text-gray-400 font-bold mb-5">
                                {frontMode === "word"
                                    ? "MEANING"
                                    : "WORD"}
                            </p>
                            {settingsButton}

                            <h2 className="text-3xl md:text-5xl break-words font-black">
                                {frontMode === "word"
                                    ? currentWord.meaning
                                    : currentWord.word}
                            </h2>
                            {frontMode === "meaning" && (

                                <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">

                                    {currentWord.word_type && (

                                        <span className="px-4 py-2 rounded-full bg-blue-50 text-blue-600 font-bold text-sm uppercase">
                                            {currentWord.word_type}
                                        </span>

                                    )}

                                    {currentWord.ipa && (

                                        <p className="text-xl text-gray-500">
                                            {currentWord.ipa}
                                        </p>

                                    )}

                                </div>

                            )}

                            {frontMode === "meaning" && currentWord.example && (
                                <p className="text-xl text-gray-500 mt-8 max-w-xl">
                                    {currentWord.example}
                                </p>
                            )}

                            {frontMode === "meaning" && (

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        playAudio()
                                    }}
                                    className="mt-8 w-16 h-16 rounded-2xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition"
                                >
                                    <Volume2 className="w-7 h-7 text-blue-600" />
                                </button>

                            )}
                            {frontMode === "word" && (

                                <p className="text-xl text-gray-500 mt-8 max-w-xl">
                                    {currentWord.example}
                                </p>

                            )}
                        </div>
                    </div>
                </div>

                {/* HINT */}
                <p className="text-center text-gray-500 mt-5">
                    ✨Phím tắt: Space / Enter để lật thẻ và ← → để chuyển thẻ
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

                    <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl px-5 h-16 shadow-sm">

                        <span className="font-semibold text-gray-700">
                            Đảo thứ tự
                        </span>

                        <button
                            onClick={shuffleCards}
                            className={`w-14 h-8 rounded-full transition relative ${isShuffled
                                ? "bg-blue-600"
                                : "bg-gray-200"
                                }`}
                        >

                            <div
                                className={`absolute top-1 w-6 h-6 rounded-full bg-white transition ${isShuffled
                                    ? "left-7"
                                    : "left-1"
                                    }`}
                            />

                        </button>

                    </div>

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