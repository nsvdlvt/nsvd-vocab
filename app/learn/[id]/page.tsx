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

    memoryStrength: number
    hasSeen: boolean

    status:
    | "new"
    | "learning"
    | "mastered"
    questionType?:
    | "mcq"
    | "typing"
    | "reverse"
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
    const [userId, setUserId] =
        useState("")
    const [title, setTitle] =
        useState("")

    const [streak, setStreak] =
        useState(0)
    const [autoPlayAudio, setAutoPlayAudio] =
        useState(true)
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
    const newCount =
        queue.filter(
            (w) => w.status === "new"
        ).length

    const learningCount =
        queue.filter(
            (w) =>
                w.status === "learning"
        ).length

    const progressValue =

        queue.reduce(
            (sum, word) =>

                sum +
                Math.min(
                    word.memoryStrength || 0,
                    4
                ),

            0
        )

    const masteredCount =
        progressValue / 4
    const [totalWords, setTotalWords] =
        useState(0)
    useEffect(() => {

        fetchWords()

    }, [])

    const fetchWords = async () => {
        const {
            data: { user }
        } =
            await supabase.auth.getUser()

        if (!user) {

            router.push("/login")

            return
        }

        setUserId(user.id)
        const { data: setData } =
            await supabase
                .from("vocab_sets")
                .select("*")
                .eq("id", id)
                .single()

        if (setData) {

            setTitle(setData.title)
        }
        const { data: session } =
            await supabase
                .from(
                    "learning_sessions"
                )
                .select("*")
                .eq(
                    "user_id",
                    user.id
                )
                .eq(
                    "set_id",
                    id
                )
                .maybeSingle()

        if (session) {

            setQueue(

                session.queue.map(
                    (word: any) => ({

                        ...word,

                        memoryStrength:
                            word.memoryStrength || 0,

                        status:
                            word.status || "new",

                        hasSeen:
                            word.hasSeen || false,

                        questionType:
                            word.questionType || "mcq",
                    })
                )
            )

            setAllWords(
                session.all_words
            )


            setCorrectCount(
                session.correct_count
            )

            setWrongCount(
                session.wrong_count
            )

            setTotalWords(
                session.total_words
            )

            setLoading(false)

            return
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
                    memoryStrength: 0,
                    questionType: "mcq",
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
    const trulyMastered =

        queue.filter(
            (w) =>
                w.memoryStrength >= 4
        ).length
    useEffect(() => {

        if (
            !loading &&
            trulyMastered >= totalWords
        ) {

            handleComplete()
        }

    }, [
        currentWord,
        loading
    ])
    useEffect(() => {

        if (
            loading ||
            !userId ||
            queue.length === 0
        ) {
            return
        }

        const timeout =
            setTimeout(() => {

                saveProgress(
                    structuredClone(queue)
                )

            }, 300)

        return () =>
            clearTimeout(timeout)

    }, [
        queue,
        correctCount,
        wrongCount,
        userId,
        loading
    ])
    useEffect(() => {

        if (
            !currentWord ||
            trulyMastered >= totalWords
        )
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
    useEffect(() => {

        const handleKey =
            (e: KeyboardEvent) => {

                if (
                    showAnswer &&
                    e.code === "Space"
                ) {

                    e.preventDefault()

                    nextQuestion()
                }

                if (
                    !showAnswer
                ) {

                    const index =
                        Number(e.key) - 1

                    if (
                        index >= 0 &&
                        index < options.length
                    ) {

                        handleAnswer(
                            options[index]
                        )
                    }
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
        options,
        showAnswer
    ])
    const saveProgress = async (
        updatedQueue:
            LearningWord[]
    ) => {

        if (!userId)
            return

        await supabase
            .from(
                "learning_sessions"
            )
            .upsert(
                {
                    user_id: userId,

                    set_id: id,

                    queue: updatedQueue,

                    all_words:
                        allWords,

                    correct_count:
                        correctCount,

                    wrong_count:
                        wrongCount,

                    total_words:
                        totalWords,

                    updated_at:
                        new Date(),
                },
                {
                    onConflict:
                        "user_id,set_id"
                }
            )
    }
    const handleComplete =
        async () => {

            if (!userId)
                return

            await supabase
                .from(
                    "learning_sessions"
                )
                .delete()
                .eq(
                    "user_id",
                    userId
                )
                .eq(
                    "set_id",
                    id
                )
        }
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
    useEffect(() => {

        if (
            showAnswer &&
            autoPlayAudio
        ) {

            playAudio()
        }

    }, [
        showAnswer
    ])
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


            const insertIndex =

                current.memoryStrength <= 1

                    ? Math.min(
                        2,
                        rest.length
                    )

                    : current.memoryStrength <= 3

                        ? Math.min(
                            5,
                            rest.length
                        )

                        : Math.min(
                            8,
                            rest.length
                        )

            const newQueue = [
                ...rest
            ]

            newQueue.splice(
                insertIndex,
                0,
                current
            )

            return newQueue
        })
    }
    const getRandomQuestionType =
    (): LearningWord["questionType"] => {

            const types: LearningWord["questionType"][] = [
                "mcq",
                "typing",
                "reverse",
            ]

            return types[
                Math.floor(
                    Math.random() *
                    types.length
                )
            ]
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

                    const nextStrength =
                        isCorrect
                            ? Math.min(
                                word.memoryStrength + 1,
                                4
                            )
                            : Math.max(
                                word.memoryStrength - 2,
                                0
                            )

                    return {
                        ...word,

                        hasSeen: true,

                        memoryStrength:
                            nextStrength,

                        status:
                            nextStrength >= 4
                                ? "mastered"
                                : nextStrength >= 2
                                    ? "learning"
                                    : "new",

                        questionType:
                            getRandomQuestionType(),
                    }
                }

                return {
                    ...word,
                    hasSeen: true,
                    memoryStrength:
                        Math.max(
                            word.memoryStrength - 2,
                            0
                        ),
                    questionType: "mcq" , 
                    status: "learning",
                }
            })
        })

        if (isCorrect) {
            navigator.vibrate?.(30)
            setCorrectCount(
                (prev) => prev + 1
            )
            setStreak(
                prev => prev + 1
            )
        } else {
            navigator.vibrate?.([50, 30, 50])
            setWrongCount(
                (prev) => prev + 1
            )
            setStreak(0)
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
                        memoryStrength:
                            Math.max(
                                word.memoryStrength - 2,
                                0
                            ),
                        questionType: "mcq",
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
    if (
        trulyMastered >=
        totalWords
    ) {

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
                            <div className="flex justify-center mt-5">

                                <span className={`
        px-4 py-2 rounded-full text-sm font-bold

        ${currentWord.memoryStrength >= 4
                                        ? "bg-green-100 text-green-700"
                                        : currentWord.memoryStrength >= 2
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "bg-red-100 text-red-700"
                                    }
    `}>

                                    {currentWord.memoryStrength >= 4
                                        ? "Đã thuộc"
                                        : currentWord.memoryStrength >= 2
                                            ? "Đang nhớ"
                                            : "Mới học"
                                    }

                                </span>

                            </div>

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

                    {Math.floor(masteredCount)}
                    /
                    {totalWords}

                </div>

            </div>

            <div className="text-center mt-4">

                <span className="bg-orange-100 text-orange-600 px-5 py-2 rounded-full font-bold">

                    🔥 {streak} streak

                </span>

            </div>
            {/* PROGRESS */}
            <div className="max-w-4xl mx-auto mb-6">

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

                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">

                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.35)] rounded-full transition-all duration-500"
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
            <div className="max-w-4xl mx-auto bg-white rounded-[40px] shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-gray-100 p-6 md:p-7">

                <p className="text-center text-gray-400 font-bold mb-5">
                    WORD
                </p>

                <h2 className="text-2xl md:text-4xl font-black text-center break-words leading-tight">

                    {currentWord.word}

                </h2>
                <div className="mt-7 grid grid-cols-2 gap-3">

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
                                    rounded-[28px]
p-4
min-h-[84px]
                                    text-left
                                    border-2
transition-all duration-300 active:scale-[0.98]
font-bold
text-base
leading-snug
                                    
                                    ${showAnswer &&
                                            isCorrect
                                            ? "border-green-500 bg-green-50"
                                            : showAnswer &&
                                                isSelected &&
                                                !isCorrect
                                                ? "border-red-500 bg-red-50"
                                                : "border-gray-100"
                                        }

${!showAnswer
                                            ? "hover:border-blue-300 hover:bg-blue-50"
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
        mt-5
        rounded-[28px]
        border
        px-5 py-4

        ${selectedAnswer === currentWord.meaning
            ? "bg-green-50 border-green-300"
            : "bg-red-50 border-red-300"
        }
    `}
>

    {/* HEADER */}
    <div className="flex items-center gap-4">

        {/* ICON */}
        <div
            className={`
                w-10 h-10 rounded-xl flex items-center justify-center shrink-0

                ${selectedAnswer === currentWord.meaning
                    ? "bg-green-100"
                    : "bg-red-100"
                }
            `}
        >

            {selectedAnswer === currentWord.meaning ? (

                <Check className="w-5 h-5 text-green-600" />

            ) : (

                <X className="w-5 h-5 text-red-600" />

            )}

        </div>

        {/* LEFT */}
        <div className="flex-1 min-w-0">

            {selectedAnswer === currentWord.meaning ? (

                <h3 className="font-black text-green-700 text-lg">

                    Chính xác!

                </h3>

            ) : (

                <div>

                    <p className="font-black text-red-700 text-lg">

                        Đáp án đúng:
                        <span className="ml-2 text-black">

                            {currentWord.meaning}

                        </span>

                    </p>

                </div>

            )}

        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2 shrink-0 self-start pt-1">

            {currentWord.word_type && (

                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-bold text-xs uppercase">

                    {currentWord.word_type}

                </span>

            )}

            {currentWord.ipa && (

                <span className="text-gray-500 font-semibold whitespace-nowrap">

                    {currentWord.ipa}

                </span>

            )}

        </div>

    </div>

    {/* BODY */}
    <div className="mt-4 pt-4 border-t border-black/5">

        {/* MEANING + SOUND */}
        <div className="flex items-start gap-4">

            <div className="flex-1">

                <p className="text-gray-400 font-bold text-sm">
                    Nghĩa
                </p>

                <p className="text-2xl font-black mt-1">

                    {currentWord.meaning}

                </p>

            </div>

            <div className="flex items-center gap-3">

                {/* SOUND */}
                <button
                    onClick={playAudio}
                    className="w-10 h-10 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition"
                >

                    <Volume2 className="w-5 h-5 text-blue-600" />

                </button>

                {/* AUTO SOUND */}
                <div className="relative group">

                    <div className="
                        absolute bottom-[120%] left-1/2
                        -translate-x-1/2
                        px-3 py-1.5 rounded-xl
                        bg-black text-white
                        text-xs font-semibold
                        whitespace-nowrap
                        opacity-0 pointer-events-none
                        transition-all duration-200
                        translate-y-1
                        group-hover:opacity-100
                        group-hover:translate-y-0
                    ">

                        Auto sound

                    </div>

                    <button
                        onClick={() =>
                            setAutoPlayAudio(
                                !autoPlayAudio
                            )
                        }
                        className={`
                            relative w-11 h-6 rounded-full transition

                            ${autoPlayAudio
                                ? "bg-blue-600"
                                : "bg-gray-200"
                            }
                        `}
                    >

                        <div
                            className={`
                                absolute top-0.5 w-5 h-5 rounded-full bg-white transition

                                ${autoPlayAudio
                                    ? "left-5"
                                    : "left-0.5"
                                }
                            `}
                        />

                    </button>

                </div>

            </div>

        </div>

        {/* EXAMPLE */}
        {currentWord.example && (

            <div className="mt-5 bg-white/70 rounded-2xl px-4 py-3">

                <p className="text-gray-400 font-bold text-sm mb-2">
                    Ví dụ
                </p>

                <p className="text-gray-700 italic leading-relaxed">

                    {currentWord.example
                        .split(currentWord.word)
                        .map(
                            (
                                part,
                                index,
                                arr
                            ) => (

                                <span key={index}>

                                    {part}

                                    {index <
                                        arr.length - 1 && (

                                            <span className="font-bold text-blue-600 drop-shadow-[0_0_16px_rgba(59,130,246,0.8)]">

                                                {currentWord.word}

                                            </span>

                                        )}

                                </span>

                            )
                        )}

                </p>

            </div>

        )}

        {/* NEXT */}
        <div className="flex justify-end mt-5">

            <button
                onClick={nextQuestion}
                className="w-[150px] h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition"
            >

                Tiếp tục

            </button>

        </div>

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