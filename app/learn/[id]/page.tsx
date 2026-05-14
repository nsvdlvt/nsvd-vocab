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
    Star,
    Pencil,
    Settings2,
} from "lucide-react"

type LearningWord = {
    id: string
    word: string
    meaning: string
    ipa: string
    example: string
    audio_url: string
    word_type: string
    starred?: boolean
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
    const [setUpdatedAt, setSetUpdatedAt] =
        useState("")
    const [streak, setStreak] =
        useState(0)
    const [autoPlayAudio, setAutoPlayAudio] =
        useState(true)
    const [selectedAnswer, setSelectedAnswer] =
        useState<string | null>(null)
    const [editingWord, setEditingWord] =
        useState(false)
    const [modalVisible, setModalVisible] =
        useState(false)
    const [
        settingsVisible,
        setSettingsVisible
    ] = useState(false)

    const [
        learningModes,
        setLearningModes
    ] = useState<
        ("term" | "definition")[]
    >([
        "term",
        "definition"
    ])

    const [
        vocabFilter,
        setVocabFilter
    ] = useState<
        "all" |
        "starred" |
        "unmastered"
    >("all")

    const [
        autoContinue,
        setAutoContinue
    ] = useState(false)
    const [editWord, setEditWord] =
        useState("")

    const [editMeaning, setEditMeaning] =
        useState("")

    const [editExample, setEditExample] =
        useState("")

    const [editIPA, setEditIPA] =
        useState("")

    const [editWordType, setEditWordType] =
        useState("")
    const [showAnswer, setShowAnswer] =
        useState(false)
    const [options, setOptions] =
        useState<string[]>([])
    const [correctCount, setCorrectCount] =
        useState(0)

    const [wrongCount, setWrongCount] =
        useState(0)
    const [
        sessionCompleted,
        setSessionCompleted
    ] = useState(false)
    const masteredCount =

        queue.filter(
            (w) =>
                w.memoryStrength >= 4
        ).length
    const [totalWords, setTotalWords] =
        useState(0)
    const progress =

        totalWords === 0

            ? 0

            :

            (
                queue.reduce(
                    (sum, word) =>

                        sum +
                        (word.memoryStrength / 4),

                    0
                )

                / totalWords

            ) * 100
    useEffect(() => {

        fetchWords()

    }, [])
    useEffect(() => {

        if (
            loading ||
            totalWords === 0
        ) return

        const hasUnlearnedWords =

            queue.some(
                (w) =>
                    w.memoryStrength < 4
            )

        if (
            !hasUnlearnedWords &&
            !showAnswer
        ) {

            const timeout =
                setTimeout(() => {

                    setSessionCompleted(true)

                }, 500)

            return () =>
                clearTimeout(timeout)
        }

    }, [
        queue,
        totalWords,
        loading
    ])
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
            setSetUpdatedAt(
                setData.updated_at
            )
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

        if (
            session &&
            new Date(
                session.set_updated_at
            ).getTime() ===
            new Date(
                setData.updated_at
            ).getTime()
        ) {

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

        else if (session) {

            await supabase
                .from("learning_sessions")
                .delete()
                .eq("user_id", user.id)
                .eq("set_id", id)
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
                    questionType:
    getRandomQuestionType(),
                    hasSeen: false,
                    status: "new",
                })
            )
        for (const word of data || []) {

            await supabase
                .from(
                    "user_word_progress"
                )
                .upsert({
                    user_id: user.id,
                    word_id: word.id,
                })
        }
        setQueue(initializedWords)
        setAllWords(initializedWords)
        setTotalWords(
            initializedWords.length
        )
        setLoading(false)
    }
    const applyLearningSettings = () => {

        let filtered = [...allWords]

        // FILTER
        if (vocabFilter === "starred") {

            filtered = filtered.filter(
                (word) => word.starred
            )
        }

        else if (
            vocabFilter === "unmastered"
        ) {

            filtered = filtered.filter(
                (word) =>
                    word.memoryStrength < 4
            )
        }

        if (filtered.length === 0) {

            alert(
                "Không có từ phù hợp với bộ lọc này."
            )

            return
        }
        // RESET + RANDOM
        const randomized =

            filtered
                .sort(
                    () =>
                        Math.random() - 0.5
                )
                .map((word) => ({

                    ...word,

                    memoryStrength: 0,

                    hasSeen: false,

                    status: "new" as const,

                    questionType:
                        getRandomQuestionType(),
                }))

        setQueue(randomized)

        setTotalWords(
            randomized.length
        )

        setCorrectCount(0)

        setWrongCount(0)

        setStreak(0)

        setShowAnswer(false)

        setSelectedAnswer(null)

        setSessionCompleted(false)
    }
    const currentWord =
        queue[0]
    const correctAnswer =

        currentWord?.questionType === "reverse"

            ? currentWord.word

            : currentWord?.meaning || ""
    const trulyMastered =

        queue.filter(
            (w) =>
                w.memoryStrength >= 4
        ).length
    const learningWords =

        queue.filter(
            (w) =>

                w.memoryStrength >= 1 &&
                w.memoryStrength < 4
        ).length

    const weakWords =

        queue.filter(
            (w) =>
                w.memoryStrength === 0
        ).length
    useEffect(() => {

        if (
            !loading &&
            progress >= 100
        ) {

            return
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
            loading ||
            allWords.length < 2
        ) return
        if (
            !currentWord ||
            trulyMastered >= totalWords
        )
            return
        if (showAnswer)
            return
        const correctAnswer =

            currentWord.questionType === "reverse"

                ? currentWord.word

                : currentWord.meaning
        const uniqueAnswers =

            Array.from(

                new Set(

                    allWords.map(
                        (w) =>

                            currentWord.questionType === "reverse"

                                ? w.word

                                : w.meaning
                    )

                )

            ).filter(
                (meaning) =>
                    meaning !==

                    (
                        currentWord.questionType === "reverse"

                            ? currentWord.word

                            : correctAnswer
                    )
            )

        const wrongAnswers =

            uniqueAnswers
                .sort(
                    () =>
                        Math.random() - 0.5
                )
                .slice(0, 3)

        const shuffled =

            [
                correctAnswer,
                ...wrongAnswers
            ].sort(
                () =>
                    Math.random() - 0.5
            )
        setOptions(shuffled)
    }, [
        currentWord?.id,
        allWords,
        showAnswer,
        loading
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
                    set_updated_at:
                        setUpdatedAt,
                },
                {
                    onConflict:
                        "user_id,set_id"
                }
            )
    }
    const updateSpacedRepetition =
        async (
            wordId: string,
            correct: boolean
        ) => {

            const {
                data: progress
            } = await supabase
                .from(
                    "user_word_progress"
                )
                .select("*")
                .eq(
                    "user_id",
                    userId
                )
                .eq(
                    "word_id",
                    wordId
                )
                .single()

            if (!progress)
                return

            let repetitions =
                progress.repetitions

            let interval =
                progress.interval_days

            let easeFactor =
                progress.ease_factor

            // CORRECT
            if (correct) {

                repetitions += 1

                if (
                    repetitions === 1
                ) {

                    interval = 1

                } else if (
                    repetitions === 2
                ) {

                    interval = 3

                } else {

                    interval =
                        Math.min(
                            7,
                            Math.round(
                                interval *
                                easeFactor
                            )
                        )
                }

            }

            // WRONG
            else {

                repetitions = 0

                interval = 1

                easeFactor =
                    Math.max(
                        1.3,
                        easeFactor - 0.2
                    )
            }

            // REVIEW DATE
            const reviewAt =
                new Date()

            reviewAt.setDate(
                reviewAt.getDate() +
                interval
            )

            await supabase
                .from(
                    "user_word_progress"
                )
                .update({

                    repetitions,

                    interval_days:
                        interval,

                    ease_factor:
                        easeFactor,

                    review_at:
                        reviewAt,

                    last_reviewed_at:
                        new Date(),

                    total_correct:
                        correct
                            ? progress.total_correct + 1
                            : progress.total_correct,

                    total_wrong:
                        !correct
                            ? progress.total_wrong + 1
                            : progress.total_wrong,

                    updated_at:
                        new Date(),
                })
                .eq(
                    "id",
                    progress.id
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
        const allMastered =

            queue.every(
                (w) =>
                    w.memoryStrength >= 4
            )

        if (allMastered) {

            setSessionCompleted(true)

            return
        }
        setSelectedAnswer(null)
        setOptions([])

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
                        6 + Math.floor(Math.random() * 4),
                        rest.length
                    )

                    : current.memoryStrength <= 3

                        ? Math.min(
                            10 + Math.floor(Math.random() * 6),
                            rest.length
                        )

                        : Math.min(
                            16 + Math.floor(Math.random() * 8),
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

            const types:
                LearningWord["questionType"][] = []

            if (
                learningModes.includes("term")
            ) {

                types.push("mcq")
            }

            if (
                learningModes.includes("definition")
            ) {

                types.push("reverse")
            }

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

        const correctAnswer =

            currentWord.questionType === "reverse"

                ? currentWord.word

                : currentWord.meaning

        const isCorrect =
            answer === correctAnswer
        setQueue((prev) => {

            return prev.map((word) => {

                if (
                    word.id !==
                    currentWord.id
                ) {
                    return word
                }
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

                if (

                    word.memoryStrength >= 4 ||

                    nextStrength >= 4

                ) {

                    updateSpacedRepetition(
                        currentWord.id,
                        isCorrect
                    )
                }
                if (isCorrect) {

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
                        nextStrength,
                    questionType:
    getRandomQuestionType(),
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
            if (autoContinue) {

                setTimeout(() => {

                    nextQuestion()

                }, 700)
            }
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
            if (
                (currentWord?.memoryStrength || 0) >= 4
            ) {

                updateSpacedRepetition(
                    currentWord.id,
                    false
                )
            }
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
                        questionType: getRandomQuestionType(),
                        status: "learning",
                    }
                })
            })
        }
    const renderWordSection = (
        title: string,
        words: LearningWord[],
        badgeColor: string
    ) => {

        if (words.length === 0)
            return null

        return (

            <div className="mt-10">

                <div className="flex items-center gap-3 mb-5">

                    <h2 className="text-xl font-black">

                        {title}

                    </h2>

                    <span className={`
                    px-3 py-1 rounded-full shadow-sm text-sm font-bold
                    ${badgeColor}
                `}>

                        {words.length} thẻ

                    </span>

                </div>

                <div className="space-y-3">

                    {words
                        .slice(0, 3)
                        .map((word) => (

                            <div
                                key={word.id}
                                className="
bg-white
border border-gray-100
rounded-3xl
p-5

shadow-[0_4px_20px_rgba(0,0,0,0.03)]

hover:shadow-[0_8px_30px_rgba(59,130,246,0.08)]
hover:border-blue-100

transition-all
duration-300
"
                            >

                                <p className="font-black text-lg">

                                    {word.word}

                                </p>

                                <p className="text-gray-500 mt-1">

                                    {word.meaning}

                                </p>

                            </div>

                        ))}

                </div>

                {words.length > 3 && (

                    <p className="text-center text-gray-400 font-medium mt-4">

                        +{words.length - 3} từ khác

                    </p>

                )}

            </div>

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
overflow-hidden
relative
">

                {/* BACKGROUND GLOW */}
                <div className="
absolute
w-[420px]
h-[420px]
rounded-full

bg-blue-200/30
blur-3xl

animate-pulse
" />

                {/* CONTENT */}
                <div className="relative z-10 flex flex-col items-center">

                    {/* LOGO */}
                    <div className="
relative

w-24
h-24

rounded-[32px]

bg-white

shadow-[0_20px_60px_rgba(59,130,246,0.18)]

flex
items-center
justify-center

animate-[float_3s_ease-in-out_infinite]
">



                        {/* ICON */}
                        {/* LOGO */}
                        <div className="
relative

w-20
h-20

rounded-[24px]

bg-white

flex
items-center
justify-center

shadow-[0_12px_40px_rgba(59,130,246,0.18)]

overflow-hidden
">

                            {/* GLOW */}
                            <div className="
absolute
inset-0

bg-gradient-to-br
from-blue-400/10
to-cyan-300/10
" />

                            <img
                                src="/logo.png"
                                alt="Logo"
                                className="
w-12
h-12
object-contain

drop-shadow-[0_0_18px_rgba(59,130,246,0.35)]
"
                            />

                        </div>

                    </div>

                    {/* TEXT */}
                    <div className="mt-8 text-center">

                        <h2 className="
text-2xl
font-black
text-gray-800
tracking-tight
">

                            Đang tải bài học

                        </h2>

                        <p className="
mt-2
text-gray-400
font-medium
">

                            Chuẩn bị hệ thống học tập...

                        </p>

                    </div>

                    {/* DOTS */}
                    <div className="flex gap-2 mt-6">

                        <div className="
w-3 h-3 rounded-full
bg-blue-500
animate-bounce
" />

                        <div className="
w-3 h-3 rounded-full
bg-cyan-400
animate-bounce
[animation-delay:0.15s]
" />

                        <div className="
w-3 h-3 rounded-full
bg-blue-300
animate-bounce
[animation-delay:0.3s]
" />

                    </div>

                </div>

            </div>

        )
    }
    if (sessionCompleted) {

        return (

            <section className="min-h-screen bg-[#f5f9ff] p-5 md:p-10">

                <div className="max-w-5xl mx-auto">

                    <h1 className="text-3xl font-black mb-8">

                        Tổng kết

                    </h1>

                    {/* STATS */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                        <div className="
bg-white
rounded-3xl
p-5

border border-gray-100

shadow-[0_4px_20px_rgba(0,0,0,0.03)]

hover:-translate-y-1
hover:shadow-[0_12px_40px_rgba(59,130,246,0.12)]
hover:border-blue-100

transition-all
duration-300
">

                            <p className="text-gray-400 font-medium">
                                Tổng thể
                            </p>

                            <h2 className="text-3xl font-black mt-2">

                                {totalWords}

                            </h2>

                        </div>

                        <div className="
bg-white
rounded-3xl
p-5

border border-gray-100

shadow-[0_4px_20px_rgba(0,0,0,0.03)]

hover:-translate-y-1
hover:shadow-[0_12px_40px_rgba(59,130,246,0.12)]
hover:border-blue-100

transition-all
duration-300
">

                            <p className="text-green-600 font-medium">
                                Đã hoàn thành
                            </p>

                            <h2 className="text-3xl font-black mt-2 text-green-600">

                                {trulyMastered}

                            </h2>

                        </div>

                        <div className="
bg-white
rounded-3xl
p-5

border border-gray-100

shadow-[0_4px_20px_rgba(0,0,0,0.03)]

hover:-translate-y-1
hover:shadow-[0_12px_40px_rgba(59,130,246,0.12)]
hover:border-blue-100

transition-all
duration-300
">

                            <p className="text-orange-500 font-medium">
                                Chưa hoàn thành
                            </p>

                            <h2 className="text-3xl font-black mt-2 text-orange-500">

                                {learningWords + weakWords}

                            </h2>

                        </div>

                        <div className="
bg-white
rounded-3xl
p-5

border border-gray-100

shadow-[0_4px_20px_rgba(0,0,0,0.03)]

hover:-translate-y-1
hover:shadow-[0_12px_40px_rgba(59,130,246,0.12)]
hover:border-blue-100

transition-all
duration-300
">

                            <p className="text-blue-500 font-medium">
                                Phần còn lại
                            </p>

                            <h2 className="text-3xl font-black mt-2 text-blue-500">

                                {totalWords - trulyMastered}

                            </h2>

                        </div>

                    </div>

                    {/* PROGRESS */}
                    <div className="mt-8">

                        <div className="flex items-center justify-between mb-2">

                            <p className="font-semibold text-gray-500">
                                Tiến độ
                            </p>

                            <p className="font-black">

                                {Math.round(
                                    (trulyMastered / totalWords) * 100
                                )}%

                            </p>

                        </div>

                        <div className="w-full h-4 rounded-full bg-gray-100 overflow-hidden">

                            <div
                                className="
h-full
rounded-full

bg-gradient-to-r
from-blue-500
via-blue-400
to-cyan-400

shadow-[0_0_24px_rgba(59,130,246,0.35)]

transition-all
duration-700
"
                                style={{
                                    width: `${(trulyMastered / totalWords) * 100}%`
                                }}
                            />

                        </div>

                    </div>

                    {/* ACTIONS */}
                    <div className="grid grid-cols-2 gap-4 mt-8">

                        <button
                            onClick={() => {

                                const shouldReset =

                                    trulyMastered >= totalWords

                                if (shouldReset) {

                                    const resetQueue =

                                        [...queue]

                                            .sort(
                                                () =>
                                                    Math.random() - 0.5
                                            )

                                            .map((word) => ({

                                                ...word,

                                                memoryStrength: 0,

                                                hasSeen: false,

                                                status: "new" as const,

                                                questionType: "mcq" as const,
                                            }))

                                    setQueue(resetQueue)

                                }

                                setSessionCompleted(false)

                                setCorrectCount(0)

                                setWrongCount(0)

                                setStreak(0)

                                setShowAnswer(false)

                                setSelectedAnswer(null)
                            }}
                            className="
h-16
rounded-2xl

bg-black
text-white

font-bold
text-lg

hover:scale-[1.02]
hover:shadow-[0_12px_30px_rgba(0,0,0,0.18)]

active:scale-[0.98]

transition-all
duration-300
"
                        >

                            {trulyMastered >= totalWords
                                ? "Học lại"
                                : "Tiếp tục học"}

                        </button>

                        <button
                            onClick={() =>
                                router.back()
                            }
                            className="
h-16
rounded-2xl

bg-white
border border-gray-100

font-bold
text-lg

hover:border-blue-200
hover:bg-blue-50
hover:-translate-y-0.5

transition-all
duration-300
"
                        >

                            ← Quay lại

                        </button>

                    </div>

                    {/* LEARNING */}
                    {renderWordSection(
                        "Từ đang học",

                        queue.filter(
                            (w) =>
                                w.memoryStrength >= 1 &&
                                w.memoryStrength < 4
                        ),

                        "bg-blue-100 text-blue-600"
                    )}

                    {/* MASTERED */}
                    {renderWordSection(
                        "Từ đã thuộc",

                        queue.filter(
                            (w) =>
                                w.memoryStrength >= 4
                        ),

                        "bg-green-100 text-green-600"
                    )}

                    {/* NEW */}
                    {renderWordSection(
                        "Từ chưa học",

                        queue.filter(
                            (w) =>
                                w.memoryStrength === 0
                        ),

                        "bg-gray-100 text-gray-600"
                    )}

                </div>

            </section>

        )

    }
    if (!currentWord) {
        return null
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

                            {Math.round(progress)}%

                        </p>

                    </div>

                    <div className="w-full h-4 bg-blue-100/60 backdrop-blur rounded-full overflow-hidden border border-blue-100">

                        <div
                            className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 shadow-[0_0_20px_rgba(59,130,246,0.35)] animate-pulse rounded-full transition-all duration-700 ease-out"
                            style={{
                                width: `${progress}%`
                            }}
                        />

                    </div>

                </div>

            </div>

            {/* CARD */}
            <div className="max-w-4xl mx-auto bg-white rounded-[40px] shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-gray-100 p-6 md:p-7">

                <div className="flex items-center justify-between mb-5">

                    <div />


                    <div className="flex items-center gap-2">

                        {/* STAR */}
                        <button
                            onClick={() => {

                                setQueue((prev) =>
                                    prev.map((word) =>

                                        word.id === currentWord.id

                                            ? {
                                                ...word,
                                                starred:
                                                    !word.starred
                                            }

                                            : word
                                    )
                                )
                            }}
                            className="w-10 h-10 rounded-xl hover:bg-yellow-50 flex items-center justify-center transition"
                        >

                            <Star
                                className={`
                    w-5 h-5

                    ${currentWord.starred
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-400"
                                    }
                `}
                            />

                        </button>
                        {/* SETTINGS */}
                        <button
                            onClick={() =>
                                setSettingsVisible(true)
                            }
                            className="
w-10
h-10

rounded-xl

hover:bg-gray-100

flex
items-center
justify-center

transition
"
                        >

                            <Settings2 className="
w-5
h-5
text-gray-500
" />

                        </button>
                        {/* EDIT */}
                        <button
                            onClick={() => {

                                setEditWord(
                                    currentWord.word
                                )

                                setEditMeaning(
                                    correctAnswer
                                )

                                setEditExample(
                                    currentWord.example
                                )

                                setEditIPA(
                                    currentWord.ipa
                                )

                                setEditWordType(
                                    currentWord.word_type
                                )

                                setModalVisible(false)

                                setEditingWord(true)

                                requestAnimationFrame(() => {

                                    requestAnimationFrame(() => {

                                        setModalVisible(true)

                                    })

                                })
                            }}
                            className="w-10 h-10 rounded-xl hover:bg-blue-50 flex items-center justify-center transition"
                        >

                            <Pencil className="w-5 h-5 text-gray-500" />

                        </button>

                    </div>

                </div>

                <h2 className="text-2xl md:text-4xl font-black text-center break-words leading-tight">

                    {currentWord.questionType === "reverse"

                        ? correctAnswer

                        : currentWord.word
                    }

                </h2>
                <div className="mt-7 grid grid-cols-2 gap-3">

                    {options.map(
                        (option, index) => {

                            const isCorrect =
                                option ===
                                correctAnswer

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
                    <>

                        {/* CONTINUE BUTTON */}
                        <div className="flex justify-center mt-4">

                            <button
                                onClick={nextQuestion}
                                className="h-11 px-7 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg transition"
                            >

                                Tiếp tục

                            </button>

                        </div>

                        {/* RESULT + EXPLANATION */}
                        <div
                            className={`
        mt-6
        rounded-[28px]
        border
        p-5
        relative

        ${selectedAnswer === correctAnswer
                                    ? "bg-green-50 border-green-300"
                                    : "bg-red-50 border-red-300"
                                }
    `}
                        >

                            {/* HEADER */}
                            <div className="flex items-center gap-4 mt-2">

                                <div
                                    className={`
                w-11 h-11 rounded-2xl
                flex items-center justify-center shrink-0

                ${selectedAnswer === correctAnswer
                                            ? "bg-green-100"
                                            : "bg-red-100"
                                        }
            `}
                                >

                                    {selectedAnswer === correctAnswer ? (

                                        <Check className="w-5 h-5 text-green-600" />

                                    ) : (

                                        <X className="w-5 h-5 text-red-600" />

                                    )}

                                </div>

                                <div className="flex-1">

                                    {selectedAnswer === correctAnswer ? (

                                        <h3 className="font-black text-green-700 text-xl">

                                            Chính xác!

                                        </h3>

                                    ) : (

                                        <p className="font-black text-red-700 text-lg">

                                            Đáp án đúng:
                                            <span className="ml-2 text-black">

                                                {correctAnswer}

                                            </span>

                                        </p>

                                    )}

                                </div>

                            </div>

                            {/* EXPLANATION */}
                            <div className="mt-7 bg-white/70 rounded-[24px] p-5">

                                {/* TOP */}
                                <div className="flex items-start justify-between gap-4">

                                    <div>

                                        <p className="text-gray-400 font-bold text-sm">
                                            Từ vựng
                                        </p>

                                        <h3 className="text-3xl font-black mt-1">

                                            {currentWord.word}

                                        </h3>

                                        <div className="flex items-center gap-3 mt-2">

                                            {currentWord.word_type && (

                                                <span className="px-3 py-1 rounded-full shadow-sm bg-blue-50 text-blue-600 font-bold text-xs uppercase">

                                                    {currentWord.word_type}

                                                </span>

                                            )}

                                            {currentWord.ipa && (

                                                <span className="text-gray-500 font-medium text-sm">

                                                    {currentWord.ipa}

                                                </span>

                                            )}

                                        </div>

                                    </div>

                                    <div className="flex items-center gap-3">

                                        <button
                                            onClick={playAudio}
                                            className="w-10 h-10 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition"
                                        >

                                            <Volume2 className="w-5 h-5 text-blue-600" />

                                        </button>

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

                                {/* MEANING */}
                                <div className="mt-5">

                                    <p className="text-gray-400 font-bold text-sm">
                                        Nghĩa
                                    </p>

                                    <p className="text-2xl font-black mt-1">

                                        {correctAnswer}

                                    </p>

                                </div>

                                {/* EXAMPLE */}
                                {currentWord.example && (

                                    <div className="mt-5 bg-white rounded-2xl px-4 py-3">

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

                            </div>

                        </div>
                    </>
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
            {/* SETTINGS MODAL */}
            {settingsVisible && (

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
max-w-2xl

bg-white

rounded-[36px]

p-7

shadow-[0_20px_80px_rgba(0,0,0,0.15)]

relative
">

                        {/* CLOSE */}
                        <button
                            onClick={() =>
                                setSettingsVisible(false)
                            }
                            className="
absolute
top-5
right-5

w-10
h-10

rounded-xl

hover:bg-gray-100

flex
items-center
justify-center

transition
"
                        >

                            <X className="
w-5
h-5
text-gray-500
" />

                        </button>

                        {/* HEADER */}
                        <h2 className="
text-3xl
font-black
text-gray-900
">

                            Cài đặt học tập

                        </h2>

                        <p className="
mt-2
text-gray-500
font-medium
leading-relaxed
">

                            Tùy chỉnh cách bạn muốn học và kiểm tra

                        </p>

                        {/* MODES */}
                        <div className="mt-8">

                            <p className="
font-black
text-lg
mb-4
">

                                Chế độ học

                            </p>

                            <div className="
space-y-3
">

                                {[
                                    {
                                        key: "term",
                                        label:
                                            "Hỏi thuật ngữ, trả lời định nghĩa"
                                    },

                                    {
                                        key: "definition",
                                        label:
                                            "Hỏi định nghĩa, trả lời thuật ngữ"
                                    }
                                ].map((mode) => (

                                    <button
                                        key={mode.key}
                                        onClick={() => {

                                            setLearningModes((prev) =>

                                                prev.includes(
                                                    mode.key as any
                                                )

                                                    ? prev.filter(
                                                        (m) =>
                                                            m !== mode.key
                                                    )

                                                    : [
                                                        ...prev,
                                                        mode.key as any
                                                    ]
                                            )
                                        }}
                                        className={`
w-full

rounded-2xl
p-4

border-2

text-left
font-bold

transition

${learningModes.includes(
                                            mode.key as any
                                        )

                                                ? `
border-blue-500
bg-blue-50
text-blue-700
`

                                                : `
border-gray-100
hover:border-gray-200
`
                                            }
`}
                                    >

                                        {mode.label}

                                    </button>

                                ))}

                            </div>

                        </div>

                        {/* FILTER */}
                        <div className="mt-8">

                            <p className="
font-black
text-lg
mb-4
">

                                Lọc từ vựng

                            </p>

                            <div className="
grid
grid-cols-3
gap-3
">

                                {[
                                    {
                                        key: "all",
                                        label:
                                            "Tất cả các từ"
                                    },

                                    {
                                        key: "starred",
                                        label:
                                            "Chỉ từ đánh dấu sao"
                                    },

                                    {
                                        key: "unmastered",
                                        label:
                                            "Chỉ từ chưa thuộc"
                                    }
                                ].map((filter) => (

                                    <button
                                        key={filter.key}
                                        onClick={() =>
                                            setVocabFilter(
                                                filter.key as any
                                            )
                                        }
                                        className={`
rounded-2xl
p-4

border-2

font-bold
text-sm

transition

${vocabFilter === filter.key

                                                ? `
border-blue-500
bg-blue-50
text-blue-700
`

                                                : `
border-gray-100
hover:border-gray-200
`
                                            }
`}
                                    >

                                        {filter.label}

                                    </button>

                                ))}

                            </div>

                        </div>

                        {/* OPTIONS */}
                        <div className="mt-8">

                            <p className="
font-black
text-lg
mb-4
">

                                Tùy chọn hành vi

                            </p>

                            <button
                                onClick={() =>
                                    setAutoContinue(
                                        !autoContinue
                                    )
                                }
                                className={`
w-full

rounded-2xl
p-4

border-2

font-bold
text-left

transition

${autoContinue

                                        ? `
border-blue-500
bg-blue-50
text-blue-700
`

                                        : `
border-gray-100
hover:border-gray-200
`
                                    }
`}
                            >

                                Tự động tiếp tục khi trả lời đúng

                            </button>

                        </div>

                        {/* ACTIONS */}
                        <div className="
grid
grid-cols-2
gap-4

mt-10
">

                            <button
                                onClick={() => {

                                    const resetQueue =
                                        allWords
                                            .sort(
                                                () =>
                                                    Math.random() - 0.5
                                            )
                                            .map(
                                                (word) => ({
                                                    ...word,

                                                    memoryStrength: 0,

                                                    hasSeen: false,

                                                    status: "new" as const,
                                                })
                                            )

                                    setQueue(resetQueue)
                                }}
                                className="
h-14

rounded-2xl

bg-red-50
hover:bg-red-100

text-red-600
font-bold

transition
"
                            >

                                Reset tiến độ học

                            </button>

                            <button
                                onClick={() => {
                                    applyLearningSettings()

                                    setSettingsVisible(false)
                                }}
                                className="
h-14

rounded-2xl

bg-blue-600
hover:bg-blue-700

text-white
font-bold

transition
"
                            >

                                Áp dụng

                            </button>

                        </div>

                    </div>

                </div>

            )}
            {/* EDIT MODAL */}
            {editingWord && (

                <div
                    className={`
fixed inset-0 z-50
bg-black/40 backdrop-blur-sm
flex items-center justify-center p-5

transition-all duration-200

${modalVisible
                            ? "opacity-100"
                            : "opacity-0"
                        }
`}
                >

                    <div
                        className={`
bg-white
w-full
max-w-xl
rounded-[32px]
max-h-[90vh]
overflow-y-auto scroll-smooth

scrollbar-thin
scrollbar-thumb-gray-300 scrollbar-thumb-rounded-full
scrollbar-track-transparent
hover:scrollbar-thumb-gray-400

transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]

${modalVisible
                                ? "opacity-100 scale-100 translate-y-0"
                                : "opacity-0 scale-95 translate-y-4"
                            }
`}
                    >

                        {/* HEADER */}
                        <div className="sticky top-0 bg-white/90 backdrop-blur-xl z-10 px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">

                            <h2 className="text-2xl font-black">

                                Chỉnh sửa từ

                            </h2>

                            <button
                                onClick={() => {

                                    setModalVisible(false)

                                    setTimeout(() => {

                                        setEditingWord(false)

                                    }, 200)

                                }}
                                className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition"
                            >

                                <X className="w-5 h-5 text-gray-500" />

                            </button>

                        </div>

                        {/* BODY */}
                        <div className="p-6">
                            <div className="space-y-5">

                                {/* WORD */}
                                <div className="bg-gray-50 rounded-3xl p-4">

                                    <p className="text-sm font-bold text-gray-400 mb-3">
                                        Thuật ngữ
                                    </p>

                                    <input
                                        value={editWord}
                                        onChange={(e) =>
                                            setEditWord(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Word"
                                        className="w-full h-14 rounded-2xl border border-gray-200 px-4 font-semibold bg-white"
                                    />

                                </div>

                                {/* MEANING */}
                                <div className="bg-gray-50 rounded-3xl p-4">

                                    <p className="text-sm font-bold text-gray-400 mb-3">
                                        Định nghĩa
                                    </p>

                                    <textarea
                                        value={editMeaning}
                                        onChange={(e) =>
                                            setEditMeaning(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Meaning"
                                        className="w-full min-h-[120px] rounded-2xl border border-gray-200 px-4 py-4 font-semibold bg-white resize-none"
                                    />

                                </div>

                                {/* IPA */}
                                <div className="bg-gray-50 rounded-3xl p-4">

                                    <p className="text-sm font-bold text-gray-400 mb-3">
                                        Phát âm
                                    </p>

                                    <input
                                        value={editIPA}
                                        onChange={(e) =>
                                            setEditIPA(
                                                e.target.value
                                            )
                                        }
                                        placeholder="IPA"
                                        className="w-full h-14 rounded-2xl border border-gray-200 px-4 font-semibold bg-white"
                                    />

                                </div>

                                {/* WORD TYPE */}
                                <div className="bg-gray-50 rounded-3xl p-4">

                                    <p className="text-sm font-bold text-gray-400 mb-3">
                                        Loại từ
                                    </p>

                                    <input
                                        value={editWordType}
                                        onChange={(e) =>
                                            setEditWordType(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Word type"
                                        className="w-full h-14 rounded-2xl border border-gray-200 px-4 font-semibold bg-white"
                                    />

                                </div>

                                {/* EXAMPLE */}
                                <div className="bg-gray-50 rounded-3xl p-4">

                                    <p className="text-sm font-bold text-gray-400 mb-3">
                                        Ví dụ
                                    </p>

                                    <textarea
                                        value={editExample}
                                        onChange={(e) =>
                                            setEditExample(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Example"
                                        className="w-full min-h-[140px] rounded-2xl border border-gray-200 px-4 py-4 font-semibold bg-white resize-none"
                                    />

                                </div>

                                {/* SYNONYMS */}
                                <div className="bg-gray-50 rounded-3xl p-4">

                                    <p className="text-sm font-bold text-gray-400 mb-3">
                                        Từ đồng nghĩa
                                    </p>

                                    <input
                                        placeholder="từ1, từ2, từ3..."
                                        className="w-full h-14 rounded-2xl border border-gray-200 px-4 font-semibold bg-white"
                                    />

                                    <p className="text-xs text-gray-400 mt-2 font-medium">
                                        Phân cách bằng dấu phẩy
                                    </p>

                                </div>

                                <div className="flex justify-end gap-3 mt-6">

                                    <button
                                        onClick={() => {

                                            setModalVisible(false)

                                            setTimeout(() => {

                                                setEditingWord(false)

                                            }, 200)

                                        }}
                                        className="h-12 px-5 rounded-2xl bg-gray-100 font-bold"
                                    >

                                        Hủy

                                    </button>

                                    <button
                                        onClick={async () => {

                                            await supabase
                                                .from(
                                                    "vocab_words"
                                                )
                                                .update({
                                                    word: editWord,
                                                    meaning:
                                                        editMeaning,
                                                    ipa: editIPA,
                                                    example:
                                                        editExample,
                                                    word_type:
                                                        editWordType,
                                                })
                                                .eq(
                                                    "id",
                                                    currentWord.id
                                                )

                                            setQueue((prev) =>
                                                prev.map((word) =>

                                                    word.id === currentWord.id

                                                        ? {
                                                            ...word,
                                                            word: editWord,
                                                            meaning:
                                                                editMeaning,
                                                            ipa: editIPA,
                                                            example:
                                                                editExample,
                                                            word_type:
                                                                editWordType,
                                                        }

                                                        : word
                                                )
                                            )

                                            setAllWords((prev) =>
                                                prev.map((word) =>

                                                    word.id === currentWord.id

                                                        ? {
                                                            ...word,
                                                            word: editWord,
                                                            meaning:
                                                                editMeaning,
                                                            ipa: editIPA,
                                                            example:
                                                                editExample,
                                                            word_type:
                                                                editWordType,
                                                        }

                                                        : word
                                                )
                                            )

                                            setModalVisible(false)

                                            setTimeout(() => {

                                                setEditingWord(false)

                                            }, 200)
                                        }}
                                        className="h-12 px-5 rounded-2xl bg-blue-600 text-white font-bold"
                                    >

                                        Lưu

                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>
            )}

        </section>

    )

}