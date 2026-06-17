"use client"

import {
    use,
    useEffect,
    useMemo,
    useState,
} from "react"

import { useRouter } from "next/navigation"

import {
    ArrowLeft,
    Check,
    Volume2,
    X,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import {
    fetchDueWordsForCurrentUser,
    isReviewDueSet,
} from "@/lib/review-due-words"
import {
    buildMasteryTimestampUpdate,
    calculateSpacedRepetitionUpdate,
} from "@/lib/spaced-repetition"
import { toUtcIsoString } from "@/lib/time"


type LearningWord = {
    id: string
    word: string
    meaning: string
    ipa?: string
    example?: string
    word_type?: string

    memoryStrength: number
}
type QuestionMode =
    | "word"
    | "meaning"

type UserWordProgressRow = {
    id: string
    repetitions?: number | null
    ease_factor?: number | null
    total_correct?: number | null
    total_wrong?: number | null
}

const clampMemoryStrength = (strength: number) =>
    Math.min(Math.max(strength, -1), 4)

const getLoginRedirectUrl = () => {
    const redirectTo = `${window.location.pathname}${window.location.search}`
    return `/login?redirectTo=${encodeURIComponent(redirectTo)}`
}

export default function WritePage({
    params,
}: {
    params: Promise<{
        id: string
    }>
}) {

    const { id } = use(params)

    const router = useRouter()

    const [loading, setLoading] =
        useState(true)

    const [queue, setQueue] =
        useState<LearningWord[]>([])

    const [input, setInput] =
        useState("")

    const [showAnswer, setShowAnswer] =
        useState(false)

    const [isCorrect, setIsCorrect] =
        useState(false)

    const [isPartialCorrect, setIsPartialCorrect] =
        useState(false)
const [manualChecked, setManualChecked] =
    useState(false)
    const [machineResult, setMachineResult] =
    useState<
        "correct" |
        "partial" |
        "wrong"
    >("wrong")
    const [streak, setStreak] =
        useState(0)

    const [sessionCompleted, setSessionCompleted] =
        useState(false)
    const [questionAmount, setQuestionAmount] =
        useState("20")

    const [started, setStarted] =
        useState(false)
    const [questionModes, setQuestionModes] =
        useState<QuestionMode[]>([
            "word"
        ])

    const [currentMode, setCurrentMode] =
        useState<QuestionMode>("word")
    const [questionLimit, setQuestionLimit] =
        useState(0)
    const [answeredQuestions, setAnsweredQuestions] =
        useState(0)
    const maxQuestions =
        queue.length

    const parsedAmount =
        Number(questionAmount)

    const isInvalidAmount =

        parsedAmount > maxQuestions ||

        parsedAmount <= 0 ||

        Number.isNaN(parsedAmount)
    const currentWord = queue[0]

    useEffect(() => {

        fetchWords()

    }, [])

    const fetchWords = async () => {

        const {
            data: { user }
        } =
            await supabase.auth.getUser()

        if (!user) {

            router.push(getLoginRedirectUrl())

            return
        }

        const baseWords = isReviewDueSet(id)
            ? ((await fetchDueWordsForCurrentUser()).words as LearningWord[])
            : (((await supabase
                  .from("vocab_words")
                  .select("*")
                  .eq("set_id", id)).data || []) as LearningWord[])
        const wordIds = baseWords.map((word) => word.id)

        if (wordIds.length > 0) {
            await supabase
                .from("user_word_progress")
                .upsert(
                    wordIds.map((wordId) => ({
                        user_id: user.id,
                        word_id: wordId,
                    })),
                    {
                        onConflict: "user_id,word_id",
                        ignoreDuplicates: true,
                    }
                )
        }

        const { data: progressRows } =
            wordIds.length > 0
                ? await supabase
                      .from("user_word_progress")
                      .select("word_id, repetitions")
                      .eq("user_id", user.id)
                      .in("word_id", wordIds)
                : { data: [] }

        const progressMap = new Map(
            ((progressRows || []) as { word_id: string; repetitions?: number | null }[]).map(
                (row) => [row.word_id, Number(row.repetitions ?? 0)]
            )
        )

        const words = baseWords.map((word) => ({
            ...word,
            memoryStrength: progressMap.get(word.id) ?? 0,
        }))

        const shuffled =
            [...words].sort(
                () =>
                    Math.random() - 0.5
            )

        setQueue(shuffled)

        // default question amount should be minimum of 20 and the number of words in the set
        setQuestionAmount(String(Math.min(20, shuffled.length)))

        setLoading(false)
    }

    const normalize = (
        text: string
    ) =>

        text
            .trim()
            .toLowerCase()
    const tokenize = (
        text: string
    ) =>

        normalize(text)
            .split(/[ ,;/]+/)
            .filter(Boolean)
    const masteredCount =

        queue.filter(
            (w) =>
                w.memoryStrength >= 4
        ).length
    const progress =

        questionLimit === 0

            ? 0

            : (
                answeredQuestions /
                questionLimit
            ) * 100
    const checkAnswer = () => {

        if (
            !currentWord ||
            showAnswer
        ) return

        let correct = false

        let partial = false

        if (currentMode === "word") {

            correct =

                normalize(input) ===
                normalize(currentWord.word)

        } else {

            const inputTokens =
                tokenize(input)

            const answerTokens =
                tokenize(currentWord.meaning)

            const matched =

                inputTokens.filter(
                    (token) =>
                        answerTokens.includes(token)
                ).length

            const ratio =
                matched /
                answerTokens.length

            if (ratio >= 0.8) {

                correct = true

            } else if (ratio >= 0.3) {

                partial = true
            }
        }

        setIsCorrect(correct)
        if (correct) {

    setMachineResult(
        "correct"
    )

} else if (partial) {

    setMachineResult(
        "partial"
    )

} else {

    setMachineResult(
        "wrong"
    )
}
        setIsPartialCorrect(
            partial
        )
        setShowAnswer(true)

        void updateSpacedRepetition(currentWord.id, correct)

        setQueue((prev) =>

            prev.map((word) => {

                if (
                    word.id !==
                    currentWord.id
                ) {
                    return word
                }

                return {
                    ...word,

                    memoryStrength:
                        correct
                            ? word.memoryStrength < 0
                                ? 1
                                : clampMemoryStrength(word.memoryStrength + 1)
                            : word.memoryStrength <= 0
                            ? -1
                            : clampMemoryStrength(word.memoryStrength - 1)
                }
            })
        )

        if (correct) {

            navigator.vibrate?.(30)

            setStreak(
                (prev) => prev + 1
            )

        } else {

            navigator.vibrate?.([40, 20, 40])

            setStreak(0)
        }
    }

    const updateSpacedRepetition = async (
        wordId: string,
        correct: boolean
    ) => {
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return
        }

        const { data: progress } = await supabase
            .from("user_word_progress")
            .select("*")
            .eq("user_id", user.id)
            .eq("word_id", wordId)
            .single()

        if (!progress) {
            return
        }

        const row = progress as UserWordProgressRow
        const previousLevel = row.repetitions ?? 0
        const nextReview = calculateSpacedRepetitionUpdate(
            previousLevel,
            correct
        )
        const now = toUtcIsoString()

        await supabase
            .from("user_word_progress")
            .update({
                repetitions: nextReview.level,
                interval_days: nextReview.intervalDays,
                ease_factor: row.ease_factor,
                review_at: nextReview.reviewAt,
                last_reviewed_at: now,
                total_correct: correct
                    ? (row.total_correct ?? 0) + 1
                    : row.total_correct ?? 0,
                total_wrong: !correct
                    ? (row.total_wrong ?? 0) + 1
                    : row.total_wrong ?? 0,
                updated_at: now,
                ...buildMasteryTimestampUpdate(
                    previousLevel,
                    nextReview.level,
                    new Date(now)
                ),
            })
            .eq("id", row.id)
    }

    const nextQuestion = () => {
        setManualChecked(false)
        setAnsweredQuestions((prev) => {
            const randomMode =

                questionModes[
                Math.floor(
                    Math.random() *
                    questionModes.length
                )
                ]

            setCurrentMode(
                randomMode
            )
            const next = prev + 1

            if (
                next >= questionLimit
            ) {

                setSessionCompleted(true)
            }

            return next
        })

        setInput("")

        setShowAnswer(false)

        setQueue((prev) =>

            prev.slice(1)
        )
    }

    const playAudio = () => {

        if (!currentWord)
            return

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

    if (loading) {

        return (

            <div className="
min-h-screen
bg-[#f5f9ff]
flex
items-center
justify-center
">

                <div className="flex flex-col items-center">

                    <div className="
w-24
h-24
rounded-[28px]
bg-white
shadow-[0_16px_50px_rgba(59,130,246,0.18)]
flex
items-center
justify-center
animate-[float_3s_ease-in-out_infinite]
">

                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="w-12 h-12 object-contain"
                        />

                    </div>

                    <h2 className="
mt-8
text-2xl
font-black
text-gray-800
">
                        Đang tải bài học
                    </h2>

                </div>

            </div>
        )
    }

    if (sessionCompleted) {

        return (

            <section className="
min-h-screen
bg-[#f5f9ff]
flex
items-center
justify-center
p-6
">

                <div className="
max-w-xl
w-full
bg-white
rounded-[40px]
p-10
border border-gray-100
shadow-[0_10px_40px_rgba(0,0,0,0.06)]
text-center
">

                    <div className="
w-24
h-24
mx-auto
rounded-full
bg-green-100
flex
items-center
justify-center
">

                        <Check className="w-12 h-12 text-green-600" />

                    </div>

                    <h1 className="
mt-6
text-4xl
font-black
">
                        Hoàn thành!
                    </h1>

                    <p className="
mt-3
text-gray-500
font-medium
">
                        Bạn đã hoàn thành bài điền từ.
                    </p>

                    <div className="mt-8">

                        <div className="flex items-center justify-between mb-3">

                            <p className="text-gray-500 font-semibold">
                                Tiến trình
                            </p>

                            <p className="
font-black
text-blue-600
">
                                {answeredQuestions}
                                /
                                {questionLimit}
                            </p>

                        </div>

                        <div className="
w-full
h-4
rounded-full
bg-gray-100
overflow-hidden
">

                            <div
                                className="
h-full
rounded-full
bg-gradient-to-r
from-blue-500
via-blue-400
to-cyan-400
transition-all
duration-700
"
                                style={{
                                    width: `${progress}%`
                                }}
                            />

                        </div>

                    </div>

                    <button
                        onClick={() => {

                            const resetQueue =

                                [...queue]
                                    .sort(
                                        () =>
                                            Math.random() - 0.5
                                    )
                                    .map((word) => ({

                                        ...word,

                                        memoryStrength: 0,
                                    }))

                            setQueue(resetQueue)

                            setSessionCompleted(false)

                            setInput("")

                            setShowAnswer(false)

                            setStreak(0)
                        }}
                        className="
mt-8
w-full
h-16
rounded-3xl
bg-black
text-white
font-bold
text-lg
hover:scale-[1.02]
active:scale-[0.98]
transition-all
"
                    >
                        Học lại
                    </button>

                </div>

            </section>
        )
    }

    if (!currentWord) {
        return null
    }
    if (!started) {

        return (

            <section className="
min-h-screen
bg-[#f5f9ff]

flex
items-center
justify-center

p-6
">

                <div className="
max-w-xl
w-full

bg-white
rounded-[40px]

p-8

border border-gray-100

shadow-[0_10px_40px_rgba(0,0,0,0.06)]
">

                    <h1 className="
text-4xl
font-black
text-gray-800
">
                        Điền từ
                    </h1>

                    <p className="
mt-3
text-gray-500
font-medium
leading-relaxed
">

                        Hãy chọn số câu mà bạn muốn luyện tập.

                        <br />

                        Bạn có thể chọn một số câu có sẵn
                        hoặc nhập số tùy chỉnh.
                    </p>
                    {/* QUICK OPTIONS */}
                    <div className="
grid
grid-cols-2
gap-3

mt-8
">

                        {[20, 40, 60, 80].map((amount) => (

                            <button
                                key={amount}

                                onClick={() =>
                                    setQuestionAmount(
                                        String(amount)
                                    )
                                }

                                className={`
h-14

rounded-2xl

font-bold

transition-all

${questionAmount === String(amount)

                                        ? `
bg-blue-600
text-white
`

                                        : `
bg-gray-100
hover:bg-gray-200
text-gray-700
`
                                    }
`}
                            >

                                {amount}

                            </button>
                        ))}

                    </div>

                    {/* CUSTOM */}
                    <div className="mt-6">

                        <p className="
text-sm
font-bold
text-gray-500
mb-3
">
                            Tùy chỉnh số câu
                        </p>

                        <input
                            type="number"

                            value={questionAmount}

                            onChange={(e) =>
                                setQuestionAmount(
                                    e.target.value
                                )
                            }

                            placeholder="20"

                            className={`
w-full
h-16

rounded-3xl

border-2

px-6

text-xl
font-black

outline-none

transition-all

${isInvalidAmount

                                    ? `
border-red-400
bg-red-50
text-red-700

focus:border-red-500
`

                                    : `
border-gray-200

focus:border-blue-500
`
                                }
`}
                        />

                        {isInvalidAmount && (

                            <p className="
mt-3

text-red-500
font-semibold
text-sm
">

                                Số lượng không vượt quá{" "}

                                <span className="font-black">
                                    {maxQuestions}
                                </span>{" "}

                                từ

                            </p>

                        )}

                    </div>
                    <div className="mt-8">

                        <p className="
    text-sm
    font-bold
    text-gray-500
    mb-4
    ">
                            Chế độ luyện tập
                        </p>

                        <div className="
    flex
    flex-col
    gap-3
    ">

                            {[
                                {
                                    value: "word",
                                    label: "Điền từ"
                                },

                                {
                                    value: "meaning",
                                    label: "Điền nghĩa"
                                }

                            ].map((mode) => {

                                const active =
                                    questionModes.includes(
                                        mode.value as QuestionMode
                                    )

                                return (

                                    <button
                                        key={mode.value}

                                        onClick={() => {

                                            setQuestionModes((prev) => {

                                                if (active) {

                                                    if (
                                                        prev.length === 1
                                                    ) {
                                                        return prev
                                                    }

                                                    return prev.filter(
                                                        (m) =>
                                                            m !== mode.value
                                                    )
                                                }

                                                return [
                                                    ...prev,
                                                    mode.value as QuestionMode
                                                ]
                                            })
                                        }}

                                        className={`
h-16

rounded-3xl

border-2

flex
items-center
justify-between

px-6

font-bold

transition-all

${active

                                                ? `
border-blue-500
bg-blue-50
text-blue-700
`

                                                : `
border-gray-200
hover:border-gray-300
`
                                            }
`}
                                    >

                                        <span>
                                            {mode.label}
                                        </span>

                                        <div className={`
w-6
h-6
rounded-full
border-2

${active
                                                ? `
bg-blue-500
border-blue-500
`
                                                : `
border-gray-300
`
                                            }
`} />

                                    </button>
                                )
                            })}

                        </div>

                    </div>
                    {/* START */}
                    <button

                        disabled={isInvalidAmount}

                        onClick={() => {
                            setCurrentMode(
                                questionModes[
                                Math.floor(
                                    Math.random() *
                                    questionModes.length
                                )
                                ]
                            )

                            const prioritized =

                                [...queue].sort((a, b) => {

                                    const scoreA =
                                        a.memoryStrength +
                                        Math.random()

                                    const scoreB =
                                        b.memoryStrength +
                                        Math.random()

                                    return scoreA - scoreB
                                })

                            const limited =

                                prioritized.slice(
                                    0,
                                    parsedAmount
                                )


                            setQueue(limited)
                            setQuestionLimit(
                                limited.length
                            )
                            setStarted(true)
                        }}

                        className={`
mt-8
w-full
h-16

rounded-3xl

font-bold
text-lg

transition-all

${isInvalidAmount

                                ? `
bg-gray-200
text-gray-400
cursor-not-allowed
`

                                : `
bg-blue-600
hover:bg-blue-700
text-white
`
                            }
`}
                    >

                        Bắt đầu

                    </button>

                </div>

            </section>
        )
    }
    return (

        <section className="
min-h-screen
bg-[#f5f9ff]
p-5 md:p-10
">

            {/* TOP */}
            <div className="flex items-center justify-between mb-8">

                <button
                    onClick={() =>
                        router.back()
                    }
                    className="
flex items-center gap-2
bg-white
border border-gray-100
rounded-2xl
px-4 py-3
shadow-sm
"
                >

                    <ArrowLeft className="w-5 h-5" />

                    <span className="font-semibold">
                        Quay lại
                    </span>

                </button>

            </div>


            {/* STREAK */}
            <div className="text-center mt-4">

                <span className="
bg-orange-100
text-orange-600
px-5 py-2
rounded-full
font-bold
">
                    🔥 {streak} streak
                </span>

            </div>

            {/* PROGRESS */}
            <div className="max-w-4xl mx-auto mt-8 mb-8">

                <div className="
flex
items-center
justify-between
mb-3
">

                    <p className="
text-gray-500
font-bold
">
                        Tiến trình
                    </p>

                    <p className="
font-black
text-blue-600
">
                        {answeredQuestions}
                        /
                        {questionLimit}
                    </p>

                </div>

                <div className="
w-full
h-4
bg-blue-100/60
rounded-full
overflow-hidden
border border-blue-100
">

                    <div
                        className="
h-full
rounded-full
bg-gradient-to-r
from-blue-500
via-blue-400
to-cyan-400
transition-all
duration-700
"
                        style={{
                            width: `${progress}%`
                        }}
                    />

                </div>

            </div>

            {/* CARD */}
            <div className="
max-w-4xl
mx-auto
bg-white
rounded-[40px]
p-6 md:p-10
border border-gray-100
shadow-[0_10px_40px_rgba(0,0,0,0.06)]
">

                {/* MEANING */}
                <div className="text-center">

                    <p className="
text-gray-400
font-bold
uppercase
tracking-wider
">
                        Nghĩa
                    </p>

                    <h1 className="
mt-4

max-w-3xl
mx-auto

text-2xl md:text-4xl

font-black
leading-tight
text-gray-800
">
                        {currentMode === "word"

                            ? currentWord.meaning

                            : currentWord.word
                        }
                    </h1>

                </div>

                {/* INPUT */}
                <div className="mt-12">

                    <input
                        value={input}
                        disabled={showAnswer}
                        onChange={(e) =>
                            setInput(
                                e.target.value
                            )
                        }
                        onKeyDown={(e) => {

                            if (
                                e.key === "Enter"
                            ) {

                                if (showAnswer) {

                                    nextQuestion()

                                } else {

                                    checkAnswer()
                                }
                            }
                        }}
                        placeholder={
                            currentMode === "word"

                                ? "Nhập từ tiếng Anh..."

                                : "Nhập nghĩa tiếng Việt..."
                        }
                        className={`

w-full
h-20
rounded-[32px]
border-2
px-7
text-2xl
font-black
outline-none
transition-all

${showAnswer

                                ? isCorrect

                                    ? "border-green-400 bg-green-50 text-green-700"

                                    : isPartialCorrect

                                        ? "border-yellow-400 bg-yellow-50 text-yellow-700"

                                        : "border-red-400 bg-red-50 text-red-700"

                                : "border-gray-200 focus:border-blue-500"
                            }
`}
                    />

                </div>

                {/* ACTION */}
                <button
                    onClick={
                        showAnswer
                            ? nextQuestion
                            : checkAnswer
                    }
                    className={`

mt-8
w-full
h-16
rounded-3xl
font-bold
text-lg
transition-all

${showAnswer
                            ? "bg-black text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }
`}
                >

                    {showAnswer
                        ? "Tiếp tục"
                        : "Kiểm tra"}

                </button>

                {/* RESULT */}
                {showAnswer && (

                    <div
                        className={`

mt-8
rounded-[32px]
border
p-6

${isCorrect

                                ? "bg-green-50 border-green-300"

                                : isPartialCorrect

                                    ? "bg-yellow-50 border-yellow-300"

                                    : "bg-red-50 border-red-300"
                            }
`}
                    >

                        <div className="flex items-start gap-4">

                            <div
                                className={`

w-12
h-12
rounded-2xl
flex
items-center
justify-center

${isCorrect

        ? "bg-green-100"

        : isPartialCorrect

            ? "bg-yellow-100"

            : "bg-red-100"
    }
`}
                            >

                                {(isCorrect || isPartialCorrect) ? (

    <Check
        className={`
w-6
h-6

${isCorrect
            ? "text-green-600"
            : "text-yellow-600"
        }
`}
    />

) : (

    <X className="
w-6
h-6
text-red-600
" />

)}

                            </div>

                            <div className="flex-1">

                                {isCorrect ? (

                                    <h2 className="
text-2xl
font-black
text-green-700
">
                                        Chính xác!
                                    </h2>

                                ) : isPartialCorrect ? (

                                    <h2 className="
text-2xl
font-black
text-yellow-700
">
                                        Chính xác!
                                    </h2>

                                ) : (

                                    <>

                                        <h2 className="
text-2xl
font-black
text-red-700
">
                                            Sai rồi
                                        </h2>

                                        

                                    </>
                                )}

                                <div className="
mt-5
bg-white/70
rounded-[24px]
p-5
">

                                    <div className="
flex items-start justify-between gap-4
">

                                        <div>

                                            <p className="
text-gray-400
font-bold
text-sm
">
                                                Đáp án đúng
                                            </p>

                                            <h3 className="
mt-1
text-3xl
font-black
text-gray-800
">
                                                {currentMode === "word"

                                                    ? currentWord.word

                                                    : currentWord.meaning
                                                }
                                            </h3>

                                            {currentWord.ipa && (

                                                <p className="
mt-2
text-gray-500
font-medium
">
                                                    {currentWord.ipa}
                                                </p>
                                            )}

                                        </div>

                                        <button
                                            onClick={playAudio}
                                            className="
w-11
h-11
rounded-2xl
bg-blue-50
hover:bg-blue-100
flex
items-center
justify-center
transition
"
                                        >

                                            <Volume2 className="w-5 h-5 text-blue-600" />

                                        </button>

                                    </div>

                                    {currentWord.example && (

                                        <div className="
mt-5
bg-white
rounded-2xl
p-4
">

                                            <p className="
text-gray-400
font-bold
text-sm
mb-2
">
                                                Ví dụ
                                            </p>

                                            <p className="
italic
text-gray-700
leading-relaxed
">
                                                {currentWord.example}
                                            </p>

                                        </div>
                                    )}

                                </div>

                            </div>

                        </div>

                    </div>
                )}
                {showAnswer && (

    <div className="
flex
gap-3
mt-5
">

        {/* MACHINE THINKS WRONG */}
        {machineResult === "wrong" && (

            <button
                onClick={() => {

    if (manualChecked)
        return

    setManualChecked(true)

    if (!isCorrect) {

        setIsCorrect(true)

        setIsPartialCorrect(false)
    }
}}
                className={`
flex-1
h-12

rounded-2xl

bg-green-100
hover:bg-green-200

text-green-700
font-bold

transition

${manualChecked
    ? `
opacity-50
cursor-not-allowed
`
    : ""
}
`}
            >

                Tôi đúng

            </button>
        )}

        {/* MACHINE THINKS CORRECT */}
        {machineResult !== "wrong" && (

            <button
                onClick={() => {

    if (manualChecked)
        return

    setManualChecked(true)

    if (
        isCorrect ||
        isPartialCorrect
    ) {

        setIsCorrect(false)

        setIsPartialCorrect(false)
    }
}}
                className="
flex-1
h-12

rounded-2xl

bg-red-100
hover:bg-red-200

text-red-700
font-bold

transition
"
            >

                Tôi sai

            </button>
        )}

    </div>
)}

            </div>

        </section>
    )
}
