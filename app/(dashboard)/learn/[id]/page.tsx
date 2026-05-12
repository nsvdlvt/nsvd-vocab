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
    ArrowLeft,
    Brain,
    Check,
    Volume2,
    X,
} from "lucide-react"

type LearningWord = {
    id: string
    word: string
    meaning: string
    ipa: string
    example: string
    audio_url: string
    word_type: string

    correctCount: number
    hasSeen: boolean

    status:
    | "new"
    | "learning"
    | "mastered"
}

export default function LearnPage({
    params,
}: {
    params: Promise<{
        id: string
    }>
}) {

    const { id } = use(params)

    const router = useRouter()

    const [queue, setQueue] =
        useState<LearningWord[]>([])
const [allWords, setAllWords] =
    useState<LearningWord[]>([])
    const [loading, setLoading] =
        useState(true)

    const [title, setTitle] =
        useState("")


    const [selectedAnswer, setSelectedAnswer] =
        useState<string | null>(null)

    const [showAnswer, setShowAnswer] =
        useState(false)
    const [options, setOptions] =
        useState<string[]>([])
    const [correctCount, setCorrectCount] =
        useState(0)

    const [wrongCount, setWrongCount] =
        useState(0)
    const [masteredWords, setMasteredWords] =
        useState<string[]>([])
    const newCount =
        queue.filter(
            (w) => w.status === "new"
        ).length

    const learningCount =
        queue.filter(
            (w) =>
                w.status === "learning"
        ).length

    const masteredCount =
        masteredWords.length
    const [totalWords, setTotalWords] =
        useState(0)
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

        const initializedWords =
            (data || []).map(
                (word) => ({
                    ...word,
                    correctCount: 0,
                    hasSeen: false,
                    status: "new",
                })
            )

        setQueue(initializedWords)
        setAllWords(initializedWords)
        setTotalWords(
            initializedWords.length
        )
        setLoading(false)
    }

    const currentWord =
        queue[0]
    useEffect(() => {

        if (!currentWord)
            return

        const wrongAnswers =
            allWords
                .filter(
                    (w) =>
                        w.id !==
                        currentWord.id
                )
                .sort(
                    () =>
                        Math.random() - 0.5
                )
                .slice(0, 3)
                .map(
                    (w) =>
                        w.meaning
                )

        const shuffled =
            [
                currentWord.meaning,
                ...wrongAnswers
            ].sort(
                () =>
                    Math.random() - 0.5
            )

        setOptions(shuffled)

    }, [currentWord?.id])
    const playAudio = () => {

        speechSynthesis.cancel()

        const utterance =
            new SpeechSynthesisUtterance(
                currentWord.word
            )

        utterance.lang = "en-US"

        speechSynthesis.speak(
            utterance
        )
    }

    const nextQuestion = () => {

        setSelectedAnswer(null)

        setShowAnswer(false)

        setQueue((prev) => {

            const [
                current,
                ...rest
            ] = prev

            if (!current)
                return prev

            if (
                current.status ===
                "mastered"
            ) {

                return rest
            }

            return [
                ...rest,
                current
            ]
        })
    }

    const handleAnswer = (
        answer: string
    ) => {

        if (showAnswer)
            return

        setSelectedAnswer(answer)

        setShowAnswer(true)

        const isCorrect =
            answer ===
            currentWord.meaning

        setQueue((prev) => {

            return prev.map((word) => {

                if (
                    word.id !==
                    currentWord.id
                ) {
                    return word
                }

                if (isCorrect) {

                    const newCorrect =
                        word.correctCount + 1

                    return {
                        ...word,
                        hasSeen: true,
                        correctCount:
                            newCorrect,
                        status:
                            newCorrect >= 2
                                ? "mastered"
                                : "learning",
                    }
                }

                return {
                    ...word,
                    hasSeen: true,
                    correctCount: 0,
                    status: "learning",
                }
            })
        })

        if (isCorrect) {
            if (
                isCorrect &&
                currentWord.correctCount + 1 >= 2
            ) {

                setMasteredWords(
                    (prev) => {

                        if (
                            prev.includes(
                                currentWord.id
                            )
                        ) {
                            return prev
                        }

                        return [
                            ...prev,
                            currentWord.id
                        ]
                    }
                )
            }
            setCorrectCount(
                (prev) => prev + 1
            )
        } else {

            setWrongCount(
                (prev) => prev + 1
            )
        }
    }

    const handleDontKnow =
        () => {

            if (showAnswer)
                return

            setShowAnswer(true)

            setWrongCount(
                (prev) => prev + 1
            )

            setQueue((prev) => {

                return prev.map((word) => {

                    if (
                        word.id !==
                        currentWord.id
                    ) {
                        return word
                    }

                    return {
                        ...word,
                        hasSeen: true,
                        correctCount: 0,
                        status: "learning",
                    }
                })
            })
        }
    if (loading) {

        return (

            <div className="min-h-screen flex items-center justify-center">

                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />

            </div>

        )
    }
    if (!currentWord) {

        return (

            <section className="min-h-screen bg-[#f5f9ff] p-6 flex items-center justify-center">

                <div className="bg-white rounded-[40px] shadow-xl p-10 text-center max-w-xl w-full">

                    <div className="w-24 h-24 rounded-full bg-blue-100 mx-auto flex items-center justify-center">

                        <Brain className="w-12 h-12 text-blue-600" />

                    </div>

                    <h1 className="text-4xl font-black mt-8">
                        Hoàn thành 🎉
                    </h1>

                    <div className="grid grid-cols-2 gap-5 mt-10">

                        <div className="bg-green-50 rounded-3xl p-6">

                            <p className="text-green-600 font-bold">
                                Đúng
                            </p>

                            <h2 className="text-4xl font-black mt-2">
                                {correctCount}
                            </h2>

                        </div>

                        <div className="bg-red-50 rounded-3xl p-6">

                            <p className="text-red-600 font-bold">
                                Sai
                            </p>

                            <h2 className="text-4xl font-black mt-2">
                                {wrongCount}
                            </h2>

                        </div>

                    </div>

                    <button
                        onClick={() =>
                            router.back()
                        }
                        className="mt-10 w-full h-16 rounded-2xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition"
                    >
                        Quay lại
                    </button>

                </div>

            </section>
        )
    }

    return (

        <section className="min-h-screen bg-[#f5f9ff] p-5 md:p-10">

            {/* TOP */}
            <div className="flex items-center justify-between mb-8">

                <button
                    onClick={() =>
                        router.back()
                    }
                    className="flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5" />

                    <span className="font-semibold">
                        Quay lại
                    </span>

                </button>

                <div className="bg-white rounded-2xl px-5 py-3 shadow-sm font-bold">

                    {masteredCount}
                    /
                    {totalWords}

                </div>

            </div>

            {/* TITLE */}
            <div className="text-center mb-8">

                <p className="text-gray-500">
                    Learn mode ✨
                </p>

                <h1 className="text-3xl md:text-5xl font-black mt-2">
                    {title}
                </h1>

            </div>
            <div className="grid grid-cols-3 gap-4 mb-8">

                <div className="bg-white rounded-3xl p-5 text-center">

                    <p className="text-gray-400 font-bold">
                        Chưa học
                    </p>

                    <h2 className="text-3xl font-black mt-2">
                        {newCount}
                    </h2>

                </div>

                <div className="bg-yellow-50 rounded-3xl p-5 text-center">

                    <p className="text-yellow-600 font-bold">
                        Đang học
                    </p>

                    <h2 className="text-3xl font-black mt-2">
                        {learningCount}
                    </h2>

                </div>

                <div className="bg-green-50 rounded-3xl p-5 text-center">

                    <p className="text-green-600 font-bold">
                        Đã thuộc
                    </p>

                    <h2 className="text-3xl font-black mt-2">
                        {masteredCount}
                    </h2>

                </div>

            </div>
            {/* PROGRESS */}
            <div className="max-w-3xl mx-auto mb-8">

                {/* PROGRESS */}
                <div className="w-full mb-8">

                    <div className="flex items-center justify-between mb-3">

                        <p className="text-gray-500 font-semibold">
                            Tiến trình
                        </p>

                        <p className="font-black text-blue-600">

                            {totalWords > 0
                                ? Math.round(
                                    (
                                        masteredCount /
                                        totalWords
                                    ) * 100
                                )
                                : 0
                            }%

                        </p>

                    </div>

                    <div className="w-full h-4 bg-white rounded-full overflow-hidden">

                        <div
                            className="h-full bg-blue-600 transition-all duration-500"
                            style={{
                                width: `${totalWords > 0
                                        ? (
                                            masteredCount /
                                            totalWords
                                        ) * 100
                                        : 0
                                    }%`
                            }}
                        />

                    </div>

                </div>

            </div>

            {/* CARD */}
            <div className="max-w-3xl mx-auto bg-white rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-gray-100 p-8 md:p-12">

                <p className="text-center text-gray-400 font-bold mb-5">
                    WORD
                </p>

                <h2 className="text-4xl md:text-6xl font-black text-center break-words">

                    {currentWord.word}

                </h2>
                <div className="mt-12 grid gap-4">

                    {options.map(
                        (option, index) => {

                            const isCorrect =
                                option ===
                                currentWord.meaning

                            const isSelected =
                                selectedAnswer ===
                                option

                            return (

                                <button
                                    key={index}
                                    onClick={() =>
                                        handleAnswer(
                                            option
                                        )
                                    }
                                    className={`
                                    w-full
                                    rounded-3xl
                                    p-5
                                    text-left
                                    border-2
                                    transition
                                    font-semibold
                                    text-lg
                                    
                                    ${showAnswer &&
                                            isCorrect
                                            ? "border-green-500 bg-green-50"
                                            : ""
                                        }

                                    ${showAnswer &&
                                            isSelected &&
                                            !isCorrect
                                            ? "border-red-500 bg-red-50"
                                            : ""
                                        }

                                    ${!showAnswer
                                            ? "border-gray-100 hover:border-blue-300 hover:bg-blue-50"
                                            : ""
                                        }
                                    `}
                                >

                                    {option}

                                </button>
                            )
                        }
                    )}

                </div>

                {/* RESULT */}
                {showAnswer && (

                    <div
                        className={`
    rounded-3xl
    p-5
    border

    ${selectedAnswer ===
                                currentWord.meaning
                                ? "bg-green-50 border-green-200"
                                : "bg-red-50 border-red-200"
                            }
`}
                    >

                        <div className="flex items-center gap-4">

                            <div
                                className={`
            w-14 h-14 rounded-2xl flex items-center justify-center

            ${selectedAnswer ===
                                        currentWord.meaning
                                        ? "bg-green-100"
                                        : "bg-red-100"
                                    }
        `}
                            >

                                {selectedAnswer ===
                                    currentWord.meaning ? (

                                    <Check className="text-green-600" />

                                ) : (

                                    <X className="text-red-600" />

                                )}

                            </div>

                            <div>

                                <h3
                                    className={`
                font-black text-xl

                ${selectedAnswer ===
                                            currentWord.meaning
                                            ? "text-green-700"
                                            : "text-red-700"
                                        }
            `}
                                >

                                    {selectedAnswer ===
                                        currentWord.meaning
                                        ? "Chính xác!"
                                        : "Đáp án đúng:"}

                                </h3>

                                <p className="font-semibold text-lg mt-1">
                                    {currentWord.meaning}
                                </p>

                            </div>

                        </div>

                        <div className="mt-8 bg-white rounded-3xl border border-gray-100 p-6">

                            <div className="flex flex-wrap items-center gap-3">

                                {currentWord.word_type && (

                                    <span className="px-4 py-2 rounded-full bg-blue-50 text-blue-600 font-bold text-sm uppercase">

                                        {currentWord.word_type}

                                    </span>

                                )}

                                {currentWord.ipa && (

                                    <span className="text-lg text-gray-500 font-semibold">

                                        {currentWord.ipa}

                                    </span>

                                )}

                            </div>

                            <div className="mt-5">

                                <p className="text-gray-400 font-bold">
                                    Nghĩa
                                </p>

                                <p className="text-2xl font-black mt-2">
                                    {currentWord.meaning}
                                </p>

                            </div>

                            {currentWord.example && (

                                <div className="mt-6 bg-gray-50 rounded-2xl p-5">

                                    <p className="text-gray-400 font-bold mb-2">
                                        Ví dụ
                                    </p>

                                    <p className="text-lg text-gray-700 italic">

                                        {currentWord.example}

                                    </p>

                                </div>

                            )}

                            <button
                                onClick={playAudio}
                                className="mt-6 w-16 h-16 rounded-2xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition"
                            >
                                <Volume2 className="w-7 h-7 text-blue-600" />
                            </button>

                            <button
                                onClick={nextQuestion}
                                className="mt-6 w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition"
                            >
                                Tiếp tục
                            </button>

                        </div>

                    </div>

                )}

                {/* DONT KNOW */}
                {!showAnswer && (

                    <button
                        onClick={handleDontKnow}
                        className="mt-8 w-full h-16 rounded-3xl bg-gray-100 hover:bg-gray-200 font-bold text-lg transition"
                    >
                        Không biết
                    </button>

                )}

            </div>

        </section>
    )
}