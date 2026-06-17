"use client"

import { use, useEffect, useEffectEvent, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowLeft,
    Check,
    ChevronRight,
    Pencil,
    Settings2,
    Star,
    Volume2,
    X,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import {
    buildMasteryTimestampUpdate,
    calculateSpacedRepetitionUpdate,
} from "@/lib/spaced-repetition"
import { toUtcIsoString } from "@/lib/time"

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
    status: "new" | "learning" | "mastered"
    questionType?: "mcq" | "reverse"
}

type WordProgressRow = {
    word_id: string
    repetitions?: number | null
}

type LearningSessionSnapshot = {
    queue?: Partial<LearningWord>[]
    all_words?: Partial<LearningWord>[]
    correct_count?: number | null
    wrong_count?: number | null
    total_words?: number | null
    section_index?: number | null
    question_index_in_section?: number | null
    questions_answered?: number | null
    selected_answer?: string | null
    show_answer?: boolean | null
    options?: string[] | null
    option_seed?: number | null
    streak?: number | null
    learning_modes?: ("term" | "definition")[] | null
    auto_continue?: boolean | null
    summary_visible?: boolean | null
    session_completed?: boolean | null
    updated_at?: string | null
    set_updated_at?: string | null
}

type SummaryGroupKey = "mastered" | "learning" | "new"

const MAX_MEMORY_STRENGTH = 4
const SECTION_SIZE = 10
const MIN_SESSION_SECTIONS = 2
const CHECKPOINT_INTERVAL = 2
const PREVIEW_LIMIT = 5
const SECTION_PROGRESS_VISIBLE_LIMIT = 8

const getMemoryStatus = (
    strength: number
): LearningWord["status"] => {
    if (strength >= MAX_MEMORY_STRENGTH) {
        return "mastered"
    }

    if (strength >= 1) {
        return "learning"
    }

    return "new"
}

const clampMemoryStrength = (strength: number) =>
    Math.min(Math.max(strength, 0), MAX_MEMORY_STRENGTH)

const shuffleWords = <T,>(items: T[]) =>
    [...items].sort(() => Math.random() - 0.5)

const getRandomQuestionType = (
    modes: ("term" | "definition")[]
): LearningWord["questionType"] => {
    const types: LearningWord["questionType"][] = []

    if (modes.includes("term")) {
        types.push("mcq")
    }

    if (modes.includes("definition")) {
        types.push("reverse")
    }

    if (types.length === 0) {
        return "mcq"
    }

    return types[Math.floor(Math.random() * types.length)]
}

const buildOptionsForWord = (
    word: LearningWord,
    allWords: LearningWord[],
    optionSeed: number
) => {
    const expectedAnswer =
        word.questionType === "reverse" ? word.word : word.meaning
    const answerPool = Array.from(
        new Set(
            allWords.map((item) =>
                word.questionType === "reverse" ? item.word : item.meaning
            )
        )
    ).filter((answer) => answer !== expectedAnswer)

    const rotatedPool = answerPool.length
        ? [
              ...answerPool.slice(optionSeed % answerPool.length),
              ...answerPool.slice(0, optionSeed % answerPool.length),
          ]
        : []

    return shuffleWords([
        expectedAnswer,
        ...shuffleWords(rotatedPool).slice(0, 3),
    ])
}

const normalizeWord = (word: Partial<LearningWord>) => ({
    ...word,
    memoryStrength: clampMemoryStrength(word.memoryStrength || 0),
    status: getMemoryStatus(word.memoryStrength || 0),
    hasSeen: Boolean(word.hasSeen),
    questionType: word.questionType || "mcq",
    starred: Boolean(word.starred),
    word: word.word || "",
    meaning: word.meaning || "",
    ipa: word.ipa || "",
    example: word.example || "",
    audio_url: word.audio_url || "",
    word_type: word.word_type || "",
    id: word.id || "",
})

const applyProgressToWords = (
    words: LearningWord[],
    progressByWordId: Map<string, number>
) =>
    words.map((word) => {
        const storedStrength = progressByWordId.get(word.id)

        if (storedStrength === undefined) {
            return word
        }

        const memoryStrength = clampMemoryStrength(storedStrength)

        return {
            ...word,
            memoryStrength,
            status: getMemoryStatus(memoryStrength),
        }
    })

const getLearningSessionDraftKey = (userId: string, setId: string) =>
    `nsvd-learn-session:${userId}:${setId}`

const getLoginRedirectUrl = () => {
    const redirectTo = `${window.location.pathname}${window.location.search}`
    return `/login?redirectTo=${encodeURIComponent(redirectTo)}`
}

const readLearningSessionDraft = (
    userId: string,
    setId: string
): LearningSessionSnapshot | null => {
    if (typeof window === "undefined") {
        return null
    }

    const raw = window.localStorage.getItem(
        getLearningSessionDraftKey(userId, setId)
    )

    if (!raw) {
        return null
    }

    try {
        return JSON.parse(raw) as LearningSessionSnapshot
    } catch {
        window.localStorage.removeItem(getLearningSessionDraftKey(userId, setId))
        return null
    }
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

    const [queue, setQueue] = useState<LearningWord[]>([])
    const [allWords, setAllWords] = useState<LearningWord[]>([])
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState("")
    const [title, setTitle] = useState("")
    const [setUpdatedAt, setSetUpdatedAt] = useState("")
    const [streak, setStreak] = useState(0)
    const [autoPlayAudio, setAutoPlayAudio] = useState(true)
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
    const [editingWord, setEditingWord] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [settingsVisible, setSettingsVisible] = useState(false)
    const [summaryVisible, setSummaryVisible] = useState(false)
    const [summaryPopupGroup, setSummaryPopupGroup] =
        useState<SummaryGroupKey | null>(null)

    const [learningModes, setLearningModes] = useState<
        ("term" | "definition")[]
    >(["term", "definition"])
    const [autoContinue, setAutoContinue] = useState(false)
    const [tempLearningModes, setTempLearningModes] = useState<
        ("term" | "definition")[]
    >(learningModes)
    const [tempAutoContinue, setTempAutoContinue] = useState(autoContinue)

    const [editWord, setEditWord] = useState("")
    const [editMeaning, setEditMeaning] = useState("")
    const [editExample, setEditExample] = useState("")
    const [editIPA, setEditIPA] = useState("")
    const [editWordType, setEditWordType] = useState("")

    const [showAnswer, setShowAnswer] = useState(false)
    const [options, setOptions] = useState<string[]>([])
    const [correctCount, setCorrectCount] = useState(0)
    const [wrongCount, setWrongCount] = useState(0)
    const [sessionCompleted, setSessionCompleted] = useState(false)
    const [totalWords, setTotalWords] = useState(0)
    const [sectionIndex, setSectionIndex] = useState(0)
    const [questionIndexInSection, setQuestionIndexInSection] = useState(0)
    const [questionsAnswered, setQuestionsAnswered] = useState(0)
    const [optionSeed, setOptionSeed] = useState(0)

    const autoAdvanceTimeoutRef = useRef<number | null>(null)
    const currentOptionsKeyRef = useRef<string | null>(null)
    const lastAutoPlayedKeyRef = useRef<string | null>(null)

    const masteredWords = allWords.filter(
        (word) => word.memoryStrength >= MAX_MEMORY_STRENGTH
    )
    const learningWords = allWords.filter(
        (word) =>
            word.memoryStrength >= 1 &&
            word.memoryStrength < MAX_MEMORY_STRENGTH
    )
    const newWords = allWords.filter((word) => word.memoryStrength === 0)

    const masteredCount = masteredWords.length
    const learningCount = learningWords.length
    const unlearnedCount = newWords.length
    const wordsBelowTargetCount = learningCount + unlearnedCount

    const currentWord = queue[0]
    const correctAnswer =
        currentWord?.questionType === "reverse"
            ? currentWord.word
            : currentWord?.meaning || ""
    const currentOptionsKey = currentWord
        ? `${currentWord.id}:${currentWord.questionType}:${optionSeed}`
        : null
    const currentAnswerKey =
        currentOptionsKey && showAnswer ? `${currentOptionsKey}:answer` : null

    const minimumQuestionTarget = Math.max(
        totalWords * MAX_MEMORY_STRENGTH,
        SECTION_SIZE * MIN_SESSION_SECTIONS
    )
    const minimumPracticeMet =
        totalWords > 0 && questionsAnswered >= minimumQuestionTarget
    const allWordsAtTarget =
        totalWords > 0 && wordsBelowTargetCount === 0
    const allWordsMastered = allWordsAtTarget && minimumPracticeMet
    const effectiveSessionCompleted = sessionCompleted || allWordsMastered
    const activeQueueLength = allWordsMastered ? 0 : queue.length
    const completedSections = sectionIndex
    const currentSectionSize = Math.min(
        SECTION_SIZE,
        Math.max(SECTION_SIZE, activeQueueLength, 1)
    )
    const plannedSections = Math.max(
        MIN_SESSION_SECTIONS,
        Math.ceil(minimumQuestionTarget / SECTION_SIZE)
    )
    const remainingSections = allWordsMastered
        ? 0
        : Math.max(1, plannedSections - completedSections)
    const totalSections = allWordsMastered
        ? completedSections
        : Math.max(plannedSections, completedSections + remainingSections)
    const visibleSectionCount = allWordsMastered
        ? 0
        : Math.min(totalSections, SECTION_PROGRESS_VISIBLE_LIMIT)
    const hiddenSectionCount = Math.max(
        totalSections - SECTION_PROGRESS_VISIBLE_LIMIT,
        0
    )
    const buildLearningSessionSnapshot = (): LearningSessionSnapshot => ({
        queue: structuredClone(queue),
        all_words: allWords,
        correct_count: correctCount,
        wrong_count: wrongCount,
        total_words: totalWords,
        section_index: sectionIndex,
        question_index_in_section: questionIndexInSection,
        questions_answered: questionsAnswered,
        selected_answer: selectedAnswer,
        show_answer: showAnswer,
        options,
        option_seed: optionSeed,
        streak,
        learning_modes: learningModes,
        auto_continue: autoContinue,
        summary_visible: summaryVisible,
        session_completed: sessionCompleted,
        updated_at: new Date().toISOString(),
        set_updated_at: setUpdatedAt,
    })

    const saveProgress = useEffectEvent(async () => {
        if (!userId) {
            return
        }

        const snapshot = buildLearningSessionSnapshot()

        await supabase.from("learning_sessions").upsert(
            {
                user_id: userId,
                set_id: id,
                ...snapshot,
            },
            {
                onConflict: "user_id,set_id",
            }
        )
    })

    function playAudio() {
        if (!currentWord) {
            return
        }

        speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(currentWord.word)
        utterance.lang = "en-US"
        speechSynthesis.speak(utterance)
    }

    const restoreLearningSession = (
        session: LearningSessionSnapshot,
        progressByWordId: Map<string, number>
    ) => {
        const restoredQueue = applyProgressToWords(
            (session.queue || []).map(normalizeWord),
            progressByWordId
        )
        const restoredAllWords = applyProgressToWords(
            (session.all_words || []).map(normalizeWord),
            progressByWordId
        )

        setQueue(restoredQueue)
        setAllWords(restoredAllWords)
        setCorrectCount(session.correct_count || 0)
        setWrongCount(session.wrong_count || 0)
        setTotalWords(session.total_words || restoredAllWords.length)
        setSectionIndex(session.section_index || 0)
        setQuestionIndexInSection(session.question_index_in_section || 0)
        setQuestionsAnswered(session.questions_answered || 0)
        setSelectedAnswer(session.selected_answer || null)
        setShowAnswer(Boolean(session.show_answer))
        setOptions(Array.isArray(session.options) ? session.options : [])
        setOptionSeed(session.option_seed || 0)
        setStreak(session.streak || 0)
        if (Array.isArray(session.learning_modes)) {
            setLearningModes(session.learning_modes)
            setTempLearningModes(session.learning_modes)
        }
        setAutoContinue(Boolean(session.auto_continue))
        setTempAutoContinue(Boolean(session.auto_continue))
        setSummaryVisible(Boolean(session.summary_visible))
        setSessionCompleted(Boolean(session.session_completed))
    }

    useEffect(() => {
        let cancelled = false

        const loadWords = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                router.push(getLoginRedirectUrl())
                return
            }

            if (cancelled) {
                return
            }

            setUserId(user.id)

            const { data: setData } = await supabase
                .from("vocab_sets")
                .select("*")
                .eq("id", id)
                .single()

            if (cancelled) {
                return
            }

            if (setData) {
                setTitle(setData.title)
                setSetUpdatedAt(setData.updated_at)
            }

            const { data: vocabData } = await supabase
                .from("vocab_words")
                .select("*")
                .eq("set_id", id)

            if (cancelled) {
                return
            }

            for (const word of vocabData || []) {
                await supabase.from("user_word_progress").upsert({
                    user_id: user.id,
                    word_id: word.id,
                })
            }

            const wordIds = (vocabData || []).map((word) => word.id)
            const { data: progressData } = wordIds.length > 0
                ? await supabase
                      .from("user_word_progress")
                      .select("word_id, repetitions")
                      .eq("user_id", user.id)
                      .in("word_id", wordIds)
                : { data: [] }

            if (cancelled) {
                return
            }

            const progressByWordId = new Map(
                ((progressData || []) as WordProgressRow[]).map((row) => [
                    row.word_id,
                    row.repetitions || 0,
                ])
            )

            const { data: session } = await supabase
                .from("learning_sessions")
                .select("*")
                .eq("user_id", user.id)
                .eq("set_id", id)
                .maybeSingle()

            if (cancelled) {
                return
            }

            const localDraft = readLearningSessionDraft(user.id, id)
            const localDraftMatchesSet =
                localDraft &&
                setData &&
                new Date(localDraft.set_updated_at || 0).getTime() ===
                    new Date(setData.updated_at).getTime()
            const remoteSessionMatchesSet =
                session &&
                setData &&
                new Date(session.set_updated_at).getTime() ===
                    new Date(setData.updated_at).getTime()
            const localUpdatedAt = localDraftMatchesSet
                ? new Date(localDraft.updated_at || 0).getTime()
                : 0
            const remoteUpdatedAt = remoteSessionMatchesSet
                ? new Date(session.updated_at || 0).getTime()
                : 0
            const sessionToRestore =
                localUpdatedAt > remoteUpdatedAt
                    ? localDraft
                    : remoteSessionMatchesSet
                    ? session
                    : localDraftMatchesSet
                    ? localDraft
                    : null

            if (sessionToRestore) {
                restoreLearningSession(sessionToRestore, progressByWordId)
                setLoading(false)
                return
            }

            if (session) {
                await supabase
                    .from("learning_sessions")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("set_id", id)
            }

            const initializedWords = shuffleWords(vocabData || []).map((word) =>
                normalizeWord({
                    ...word,
                    memoryStrength: progressByWordId.get(word.id) || 0,
                    questionType: getRandomQuestionType(learningModes),
                    hasSeen: false,
                    status: getMemoryStatus(
                        progressByWordId.get(word.id) || 0
                    ),
                })
            )

            if (cancelled) {
                return
            }

            setQueue(initializedWords)
            setAllWords(initializedWords)
            setTotalWords(initializedWords.length)
            setLoading(false)
        }

        void loadWords()

        return () => {
            cancelled = true
            if (autoAdvanceTimeoutRef.current) {
                window.clearTimeout(autoAdvanceTimeoutRef.current)
            }
        }
    }, [id, learningModes, router])

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape") {
                return
            }

            if (summaryPopupGroup) {
                setSummaryPopupGroup(null)
                return
            }

            if (editingWord) {
                setModalVisible(false)
                window.setTimeout(() => {
                    setEditingWord(false)
                }, 200)
                return
            }

            if (settingsVisible) {
                setSettingsVisible(false)
            }
        }

        window.addEventListener("keydown", handleKeyDown)

        return () => {
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [summaryPopupGroup, editingWord, settingsVisible])

    useEffect(() => {
        if (
            loading ||
            !userId ||
            totalWords === 0
        ) {
            return
        }

        const timeout = window.setTimeout(() => {
            void saveProgress()
        }, 1200)

        return () => window.clearTimeout(timeout)
    }, [
        queue,
        allWords,
        correctCount,
        wrongCount,
        userId,
        loading,
        totalWords,
        sectionIndex,
        questionIndexInSection,
        questionsAnswered,
        selectedAnswer,
        showAnswer,
        options,
        optionSeed,
        streak,
        learningModes,
        autoContinue,
        summaryVisible,
        sessionCompleted,
    ])

    useEffect(() => {
        if (loading || !userId || totalWords === 0) {
            return
        }

        window.localStorage.setItem(
            getLearningSessionDraftKey(userId, id),
            JSON.stringify({
                queue: structuredClone(queue),
                all_words: allWords,
                correct_count: correctCount,
                wrong_count: wrongCount,
                total_words: totalWords,
                section_index: sectionIndex,
                question_index_in_section: questionIndexInSection,
                questions_answered: questionsAnswered,
                selected_answer: selectedAnswer,
                show_answer: showAnswer,
                options,
                option_seed: optionSeed,
                streak,
                learning_modes: learningModes,
                auto_continue: autoContinue,
                summary_visible: summaryVisible,
                session_completed: sessionCompleted,
                updated_at: new Date().toISOString(),
                set_updated_at: setUpdatedAt,
            } satisfies LearningSessionSnapshot)
        )
    }, [
        queue,
        allWords,
        correctCount,
        wrongCount,
        userId,
        loading,
        totalWords,
        sectionIndex,
        questionIndexInSection,
        questionsAnswered,
        selectedAnswer,
        showAnswer,
        options,
        optionSeed,
        streak,
        learningModes,
        autoContinue,
        summaryVisible,
        sessionCompleted,
        setUpdatedAt,
        id,
    ])

    useEffect(() => {
        if (!showAnswer || !autoPlayAudio || !currentWord || !currentAnswerKey) {
            return
        }

        if (lastAutoPlayedKeyRef.current === currentAnswerKey) {
            return
        }

        lastAutoPlayedKeyRef.current = currentAnswerKey
        playAudio()
    }, [showAnswer, autoPlayAudio, currentWord, currentAnswerKey])

    useEffect(() => {
        if (loading || !currentWord || showAnswer || !currentOptionsKey) {
            return
        }

        if (
            currentOptionsKeyRef.current === currentOptionsKey &&
            options.includes(correctAnswer)
        ) {
            return
        }

        if (options.length > 0 && options.includes(correctAnswer)) {
            currentOptionsKeyRef.current = currentOptionsKey
            return
        }

        currentOptionsKeyRef.current = currentOptionsKey
        const timeout = window.setTimeout(() => {
            setOptions(buildOptionsForWord(currentWord, allWords, optionSeed))
        }, 0)

        return () => window.clearTimeout(timeout)
    }, [
        currentWord,
        currentOptionsKey,
        correctAnswer,
        optionSeed,
        loading,
        showAnswer,
        allWords,
        options,
    ])

    const updateSpacedRepetition = async (
        wordId: string,
        correct: boolean
    ) => {
        const { data: progress } = await supabase
            .from("user_word_progress")
            .select("*")
            .eq("user_id", userId)
            .eq("word_id", wordId)
            .single()

        if (!progress) {
            return
        }

        const previousLevel = progress.repetitions || 0
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
                ease_factor: progress.ease_factor,
                review_at: nextReview.reviewAt,
                last_reviewed_at: now,
                total_correct: correct
                    ? progress.total_correct + 1
                    : progress.total_correct,
                total_wrong: !correct
                    ? progress.total_wrong + 1
                    : progress.total_wrong,
                updated_at: now,
                ...buildMasteryTimestampUpdate(
                    previousLevel,
                    nextReview.level,
                    new Date(now)
                ),
            })
            .eq("id", progress.id)
    }

    const hasWordsBelowTarget = allWords.some(
        (word) => word.memoryStrength < MAX_MEMORY_STRENGTH
    ) || !minimumPracticeMet

    const prepareCatchUpSection = () => {
        const weakWords = allWords.filter(
            (word) => word.memoryStrength < MAX_MEMORY_STRENGTH
        )
        const practiceWords =
            weakWords.length > 0 || minimumPracticeMet ? weakWords : allWords

        if (practiceWords.length === 0) {
            setSessionCompleted(true)
            setSummaryVisible(true)
            return
        }

        const catchUpQueue = shuffleWords(practiceWords).map((word) => ({
            ...word,
            questionType: getRandomQuestionType(learningModes),
        }))

        setQueue(catchUpQueue)
        setSectionIndex(totalSections)
        setQuestionIndexInSection(0)
        lastAutoPlayedKeyRef.current = null
        setOptions([])
        setOptionSeed((prev) => prev + 1)
        setSummaryVisible(false)
        setSelectedAnswer(null)
        setShowAnswer(false)
    }

    const finishQuestionStep = () => {
        const nextQuestionIndex = questionIndexInSection + 1
        const nextQuestionsAnswered = questionsAnswered + 1
        const nextSectionCompleted = nextQuestionIndex >= currentSectionSize
        const nextSectionIndex = nextSectionCompleted
            ? sectionIndex + 1
            : sectionIndex
        const nextMinimumPracticeMet =
            nextQuestionsAnswered >= minimumQuestionTarget
        const allWordsReachedTarget = allWords.every(
            (word) => word.memoryStrength >= MAX_MEMORY_STRENGTH
        )

        setQueue((prev) => {
            const [current, ...rest] = prev

            if (!current) {
                return prev
            }

            if (current.memoryStrength >= MAX_MEMORY_STRENGTH && nextMinimumPracticeMet) {
                return rest
            }

            const newQueue = [...rest]
            const insertIndex = current.memoryStrength >= MAX_MEMORY_STRENGTH
                ? newQueue.length
                : current.memoryStrength <= 1
                ? Math.min(
                      4 + Math.floor(Math.random() * 3),
                      newQueue.length
                  )
                : Math.min(
                      8 + Math.floor(Math.random() * 4),
                      newQueue.length
                  )

            newQueue.splice(insertIndex, 0, {
                ...current,
                questionType: getRandomQuestionType(learningModes),
            })

            return newQueue
        })

        setQuestionsAnswered(nextQuestionsAnswered)
        lastAutoPlayedKeyRef.current = null
        setOptions([])
        setOptionSeed((prev) => prev + 1)
        setSelectedAnswer(null)
        setShowAnswer(false)

        if (nextSectionCompleted) {
            setSectionIndex(nextSectionIndex)
            setQuestionIndexInSection(0)

            if (allWordsReachedTarget && nextMinimumPracticeMet) {
                setSessionCompleted(true)
                setSummaryVisible(true)
                return
            }

            const checkpointReached =
                nextSectionIndex > 0 &&
                nextSectionIndex % CHECKPOINT_INTERVAL === 0

            if (checkpointReached) {
                setSummaryVisible(true)
                return
            }

            if (queue.length <= 1) {
                if (hasWordsBelowTarget) {
                    prepareCatchUpSection()
                } else {
                    setSessionCompleted(true)
                    setSummaryVisible(true)
                }
                return
            }

            return
        }

        setQuestionIndexInSection(nextQuestionIndex)
    }

    const handleWordResult = (isCorrect: boolean) => {
        if (!currentWord) {
            return
        }

        setQueue((prev) => {
            const updatedWords = prev.map((word) => {
                if (word.id !== currentWord.id) {
                    return word
                }

                const nextStrength = isCorrect
                    ? clampMemoryStrength(word.memoryStrength + 1)
                    : clampMemoryStrength(word.memoryStrength - 2)

                void updateSpacedRepetition(currentWord.id, isCorrect)

                return {
                    ...word,
                    hasSeen: true,
                    memoryStrength: nextStrength,
                    status: getMemoryStatus(nextStrength),
                    questionType: word.questionType,
                }
            })

            setAllWords((prevAllWords) =>
                prevAllWords.map((word) => {
                    const updated = updatedWords.find(
                        (candidate) => candidate.id === word.id
                    )

                    return updated || word
                })
            )

            return updatedWords
        })
    }

    const handleAnswer = (answer: string) => {
        if (!currentWord || showAnswer) {
            return
        }

        const isCorrect = answer === correctAnswer

        setSelectedAnswer(answer)
        setShowAnswer(true)
        handleWordResult(isCorrect)

        if (isCorrect) {
            navigator.vibrate?.(30)
            setCorrectCount((prev) => prev + 1)
            setStreak((prev) => prev + 1)

            if (autoContinue) {
                autoAdvanceTimeoutRef.current = window.setTimeout(() => {
                    finishQuestionStep()
                }, 700)
            }
        } else {
            navigator.vibrate?.([50, 30, 50])
            setWrongCount((prev) => prev + 1)
            setStreak(0)
        }
    }

    const handleDontKnow = () => {
        if (!currentWord || showAnswer) {
            return
        }

        setShowAnswer(true)
        setSelectedAnswer(null)
        setStreak(0)
        setWrongCount((prev) => prev + 1)
        handleWordResult(false)
    }

    const applyLearningSettings = () => {
        const modeChanged =
            JSON.stringify(learningModes) !==
            JSON.stringify(tempLearningModes)

        setLearningModes(tempLearningModes)
        setAutoContinue(tempAutoContinue)

        if (!modeChanged) {
            setSettingsVisible(false)
            return
        }

        if (allWords.length === 0) {
            alert("Không có từ phù hợp.")
            return
        }

        const randomized = shuffleWords(allWords).map((word) => ({
            ...word,
            questionType: getRandomQuestionType([...tempLearningModes]),
        }))

        setQueue(randomized)
        setSelectedAnswer(null)
        setShowAnswer(false)
        setSettingsVisible(false)
        lastAutoPlayedKeyRef.current = null
        setOptions([])
        setOptionSeed((prev) => prev + 1)
    }

    const resetLearningProgress = () => {
        const resetQueue = shuffleWords(allWords).map((word) => ({
            ...word,
            memoryStrength: 0,
            hasSeen: false,
            status: getMemoryStatus(0),
            questionType: getRandomQuestionType(learningModes),
        }))

        setQueue(resetQueue)
        setAllWords(resetQueue)
        setSelectedAnswer(null)
        setShowAnswer(false)
        setCorrectCount(0)
        setWrongCount(0)
        setStreak(0)
        setSectionIndex(0)
        setQuestionIndexInSection(0)
        setQuestionsAnswered(0)
        setSummaryVisible(false)
        setSessionCompleted(false)
        lastAutoPlayedKeyRef.current = null
        setOptions([])
        setOptionSeed((prev) => prev + 1)
    }

    const continueLearning = () => {
        setSummaryVisible(false)
        setSelectedAnswer(null)
        setShowAnswer(false)
        lastAutoPlayedKeyRef.current = null
    }

    const renderWordsPreview = (
        label: string,
        words: LearningWord[],
        group: SummaryGroupKey
    ) => {
        const preview = words.slice(0, PREVIEW_LIMIT)
        const hasMore = words.length > PREVIEW_LIMIT
        const neonClass =
            group === "mastered"
                ? "border border-emerald-200 bg-emerald-50/80 shadow-[0_0_30px_rgba(34,197,94,0.16)]"
                : group === "learning"
                ? "border border-amber-200 bg-amber-50/80 shadow-[0_0_30px_rgba(245,158,11,0.14)]"
                : "border border-gray-100 bg-white"

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-gray-900">
                        {label}
                    </h3>
                    <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-bold text-white">
                        {words.length} từ
                    </span>
                </div>

                <div className="space-y-3">
                    {preview.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-4 py-5 text-sm font-medium text-gray-400">
                            Chưa có từ nào trong nhóm này.
                        </div>
                    ) : null}

                    {preview.map((word) => (
                        <div
                            key={word.id}
                            className={`rounded-3xl px-4 py-4 ${neonClass}`}
                        >
                            <p className="text-base font-black text-gray-900">
                                {word.word}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                                {word.meaning}
                            </p>
                        </div>
                    ))}
                </div>

                {hasMore ? (
                    <button
                        onClick={() => setSummaryPopupGroup(group)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 transition hover:border-blue-200 hover:bg-blue-50"
                    >
                        Xem thêm
                        <ChevronRight className="h-4 w-4" />
                    </button>
                ) : null}
            </div>
        )
    }

    const renderSectionProgress = () => {
        const lastVisibleIndex = visibleSectionCount - 1

        return (
            <div className="flex items-center gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    {Array.from({ length: visibleSectionCount }).map(
                        (_, index) => {
                            const isCollapsedTail =
                                hiddenSectionCount > 0 &&
                                index === lastVisibleIndex
                            const representedSection = isCollapsedTail
                                ? totalSections - 1
                                : index
                            const isCompleted =
                                representedSection < sectionIndex
                            const isCurrent =
                                representedSection === sectionIndex

                            return (
                                <div
                                    key={`section-progress-${index}`}
                                    className={`h-3 flex-1 rounded-full transition-all ${
                                        isCompleted
                                            ? "bg-blue-600 shadow-[0_0_18px_rgba(37,99,235,0.3)]"
                                            : isCurrent
                                            ? "bg-blue-200"
                                            : "bg-slate-200"
                                    }`}
                                />
                            )
                        }
                    )}
                </div>

                {hiddenSectionCount > 0 ? (
                    <span className="shrink-0 text-sm font-semibold text-gray-500">
                        +{hiddenSectionCount}
                    </span>
                ) : null}
            </div>
        )
    }

    if (loading) {
        return (
            <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f9ff]">
                <div className="absolute h-[420px] w-[420px] rounded-full bg-blue-200/30 blur-3xl" />
                <div className="relative z-10 flex flex-col items-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-[32px] bg-white shadow-[0_20px_60px_rgba(59,130,246,0.18)]">
                        <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[24px] bg-white shadow-[0_12px_40px_rgba(59,130,246,0.18)]">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-cyan-300/10" />
                            <img
                                src="/logo.png"
                                alt="Logo"
                                className="h-12 w-12 object-contain drop-shadow-[0_0_18px_rgba(59,130,246,0.35)]"
                            />
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <h2 className="text-2xl font-black text-gray-800">
                            Đang tải bài học
                        </h2>
                        <p className="mt-2 font-medium text-gray-400">
                            Chuẩn bị hệ thống học tập...
                        </p>
                    </div>

                    <div className="mt-6 flex gap-2">
                        <div className="h-3 w-3 animate-bounce rounded-full bg-blue-500" />
                        <div className="h-3 w-3 animate-bounce rounded-full bg-cyan-400 [animation-delay:0.15s]" />
                        <div className="h-3 w-3 animate-bounce rounded-full bg-blue-300 [animation-delay:0.3s]" />
                    </div>
                </div>
            </div>
        )
    }

    if (!currentWord && !summaryVisible && !effectiveSessionCompleted) {
        return null
    }

    return (
        <section className="min-h-screen bg-[#f5f9ff] p-5 md:p-10">
            <div className="mx-auto max-w-6xl">
                {summaryVisible ? (
                    <div className="space-y-8">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">
                                    {effectiveSessionCompleted
                                        ? "Tổng kết cuối"
                                        : "Checkpoint sau 2 section"}
                                </p>
                                <h1 className="mt-2 text-3xl font-black text-gray-900">
                                    {title || "Tổng kết bài học"}
                                </h1>
                                <p className="mt-2 text-sm font-medium text-gray-500">
                                    {effectiveSessionCompleted
                                        ? "Bạn đã đi hết lượt học hiện tại."
                                        : `Đã học xong ${completedSections} / ${totalSections} section.`}
                                </p>
                            </div>

                            <div className="rounded-3xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
                                <p className="text-sm font-semibold text-gray-500">
                                    Phần còn lại
                                </p>
                                <p className="mt-1 text-3xl font-black text-blue-600">
                                    {remainingSections}
                                </p>
                                <p className="text-xs font-medium text-gray-400">
                                    section
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="rounded-[28px] border border-emerald-200 bg-emerald-50/90 p-5 shadow-[0_0_40px_rgba(34,197,94,0.14)]">
                                <p className="text-sm font-semibold text-emerald-700">
                                    Các từ đã học
                                </p>
                                <p className="mt-3 text-3xl font-black text-emerald-800">
                                    {masteredCount}
                                </p>
                            </div>

                            <div className="rounded-[28px] border border-amber-200 bg-amber-50/90 p-5 shadow-[0_0_40px_rgba(245,158,11,0.14)]">
                                <p className="text-sm font-semibold text-amber-700">
                                    Các từ đang học
                                </p>
                                <p className="mt-3 text-3xl font-black text-amber-800">
                                    {learningCount}
                                </p>
                            </div>

                            <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
                                <p className="text-sm font-semibold text-gray-500">
                                    Các từ chưa học
                                </p>
                                <p className="mt-3 text-3xl font-black text-gray-900">
                                    {unlearnedCount}
                                </p>
                            </div>

                            <div className="rounded-[28px] border border-blue-200 bg-blue-50/90 p-5 shadow-[0_0_40px_rgba(59,130,246,0.12)]">
                                <p className="text-sm font-semibold text-blue-700">
                                    Phần còn lại
                                </p>
                                <p className="mt-3 text-3xl font-black text-blue-800">
                                    {remainingSections}
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-3">
                            {renderWordsPreview(
                                "Từ đã học",
                                masteredWords,
                                "mastered"
                            )}
                            {renderWordsPreview(
                                "Từ đang học",
                                learningWords,
                                "learning"
                            )}
                            {renderWordsPreview(
                                "Từ chưa học",
                                newWords,
                                "new"
                            )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <button
                                onClick={() => router.push(`/document/${id}`)}
                                className="h-14 rounded-2xl border border-gray-200 bg-white font-bold text-gray-800 transition hover:border-blue-200 hover:bg-blue-50"
                            >
                                Quay lại
                            </button>

                            <button
                                onClick={continueLearning}
                                disabled={effectiveSessionCompleted}
                                className="h-14 rounded-2xl bg-blue-600 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                                {effectiveSessionCompleted ? "Đã hoàn thành" : "Học tiếp"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="mb-8 grid grid-cols-[auto_1fr_auto] items-start gap-6">
                            <button
                                onClick={() => router.back()}
                                className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span className="font-semibold">
                                    Quay lại
                                </span>
                            </button>

                            <div className="flex justify-center pt-1">
                                <span className="rounded-full bg-orange-100 px-5 py-2 font-bold text-orange-600">
                                    {streak} streak
                                </span>
                            </div>

                            <div className="min-w-[220px] rounded-2xl bg-white px-4 py-4 shadow-sm md:min-w-[360px]">
                                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                                    Section
                                </p>
                                {renderSectionProgress()}
                            </div>
                        </div>

                        <div className="mx-auto mb-6 max-w-5xl">
                            <div className="mb-8 w-full">
                                <div className="mb-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-500">
                                            {title || "Tiến trình"}
                                        </p>
                                        <p className="mt-1 text-xs font-medium text-gray-400">
                                            Câu hỏi {questionIndexInSection + 1} / {currentSectionSize} trong section này
                                        </p>
                                    </div>
                                </div>

                                <div className="h-4 w-full overflow-hidden rounded-full border border-blue-100 bg-slate-200/70">
                                    <div
                                        className="h-full rounded-full bg-blue-600 transition-all duration-500"
                                        style={{
                                            width: `${currentSectionSize
                                                ? ((questionIndexInSection + (showAnswer ? 1 : 0)) /
                                                      currentSectionSize) *
                                                  100
                                                : 0}%`,
                                        }}
                                    />
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-gray-500">
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                        Đã học: {masteredCount}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                                        Đang học: {learningCount}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                                        Chưa học: {unlearnedCount}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mx-auto max-w-5xl rounded-[40px] border border-gray-100 bg-white p-7 shadow-[0_20px_60px_rgba(59,130,246,0.08)] md:p-8">
                            <div className="mb-5 flex items-center justify-between">
                                <div className="rounded-full bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                                    {currentWord.questionType === "reverse"
                                        ? "Meaning -> Word"
                                        : "Word -> Meaning"}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={async () => {
                                            const newStarred = !currentWord.starred

                                            setQueue((prev) =>
                                                prev.map((word) =>
                                                    word.id === currentWord.id
                                                        ? {
                                                              ...word,
                                                              starred: newStarred,
                                                          }
                                                        : word
                                                )
                                            )

                                            setAllWords((prev) =>
                                                prev.map((word) =>
                                                    word.id === currentWord.id
                                                        ? {
                                                              ...word,
                                                              starred: newStarred,
                                                          }
                                                        : word
                                                )
                                            )

                                            await supabase
                                                .from("vocab_words")
                                                .update({
                                                    starred: newStarred,
                                                })
                                                .eq("id", currentWord.id)
                                        }}
                                        className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-yellow-50"
                                    >
                                        <Star
                                            className={`h-5 w-5 ${
                                                currentWord.starred
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "text-gray-400"
                                            }`}
                                        />
                                    </button>

                                    <button
                                        onClick={() => {
                                            setTempLearningModes(learningModes)
                                            setTempAutoContinue(autoContinue)
                                            setSettingsVisible(true)
                                        }}
                                        className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-gray-100"
                                    >
                                        <Settings2 className="h-5 w-5 text-gray-500" />
                                    </button>

                                    <button
                                        onClick={() => {
                                            setEditWord(currentWord.word)
                                            setEditMeaning(currentWord.meaning)
                                            setEditExample(currentWord.example)
                                            setEditIPA(currentWord.ipa)
                                            setEditWordType(currentWord.word_type)
                                            setModalVisible(false)
                                            setEditingWord(true)

                                            requestAnimationFrame(() => {
                                                requestAnimationFrame(() => {
                                                    setModalVisible(true)
                                                })
                                            })
                                        }}
                                        className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-blue-50"
                                    >
                                        <Pencil className="h-5 w-5 text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            <h2 className="mt-8 text-center text-3xl font-black leading-tight text-gray-900 md:mt-10 md:text-5xl">
                                {currentWord.questionType === "reverse"
                                    ? currentWord.meaning
                                    : currentWord.word}
                            </h2>

                            <div className="mt-10 grid grid-cols-2 gap-4">
                                {options.map((option, index) => {
                                    const isCorrectOption = option === correctAnswer
                                    const isSelected = selectedAnswer === option

                                    return (
                                        <button
                                            key={`${option}-${index}`}
                                            onClick={() => handleAnswer(option)}
                                            className={`min-h-[84px] w-full rounded-[28px] border-2 border-gray-100 p-5 text-left text-base font-bold leading-snug shadow-[0_1px_0_rgba(255,255,255,0.7)_inset] transition-all duration-300 active:scale-[0.98] ${
                                                showAnswer && isCorrectOption
                                                    ? "border-green-500 bg-green-50"
                                                    : showAnswer && isSelected && !isCorrectOption
                                                    ? "border-red-500 bg-red-50"
                                                    : "hover:border-blue-200 hover:bg-blue-50/70"
                                            }`}
                                        >
                                            {option}
                                        </button>
                                    )
                                })}
                            </div>

                            {showAnswer ? (
                                <>
                                    <div className="mt-4 flex justify-center">
                                        <button
                                            onClick={finishQuestionStep}
                                            className="h-11 rounded-2xl bg-blue-600 px-7 font-bold text-white shadow-lg transition hover:bg-blue-700"
                                        >
                                            Tiếp tục
                                        </button>
                                    </div>

                                    <div
                                        className={`relative mt-6 rounded-[28px] border p-5 ${
                                            selectedAnswer === correctAnswer
                                                ? "border-green-300 bg-green-50"
                                                : "border-red-300 bg-red-50"
                                        }`}
                                    >
                                        <div className="mt-2 flex items-center gap-4">
                                            <div
                                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                                                    selectedAnswer === correctAnswer
                                                        ? "bg-green-100"
                                                        : "bg-red-100"
                                                }`}
                                            >
                                                {selectedAnswer === correctAnswer ? (
                                                    <Check className="h-5 w-5 text-green-600" />
                                                ) : (
                                                    <X className="h-5 w-5 text-red-600" />
                                                )}
                                            </div>

                                            <div className="flex-1">
                                                {selectedAnswer === correctAnswer ? (
                                                    <h3 className="text-xl font-black text-green-700">
                                                        Chính xác
                                                    </h3>
                                                ) : (
                                                    <p className="text-lg font-black text-red-700">
                                                        Đáp án đúng:
                                                        <span className="ml-2 text-black">
                                                            {correctAnswer}
                                                        </span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-7 rounded-[24px] bg-white/70 p-5">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-400">
                                                        Từ vựng
                                                    </p>
                                                    <h3 className="mt-1 text-3xl font-black text-gray-900">
                                                        {currentWord.word}
                                                    </h3>

                                                    <div className="mt-2 flex items-center gap-3">
                                                        {currentWord.word_type ? (
                                                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase text-blue-600 shadow-sm">
                                                                {currentWord.word_type}
                                                            </span>
                                                        ) : null}

                                                        {currentWord.ipa ? (
                                                            <span className="text-sm font-medium text-gray-500">
                                                                {currentWord.ipa}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={playAudio}
                                                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 transition hover:bg-blue-100"
                                                    >
                                                        <Volume2 className="h-5 w-5 text-blue-600" />
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            setAutoPlayAudio(!autoPlayAudio)
                                                        }
                                                        className={`relative h-6 w-11 rounded-full transition ${
                                                            autoPlayAudio
                                                                ? "bg-blue-600"
                                                                : "bg-gray-200"
                                                        }`}
                                                    >
                                                        <div
                                                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                                                                autoPlayAudio
                                                                    ? "left-5"
                                                                    : "left-0.5"
                                                            }`}
                                                        />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mt-5">
                                                <p className="text-sm font-bold text-gray-400">
                                                    Nghĩa
                                                </p>
                                                <p className="mt-1 text-2xl font-black text-gray-900">
                                                    {currentWord.meaning}
                                                </p>
                                            </div>

                                            {currentWord.example ? (
                                                <div className="mt-5 rounded-2xl bg-white px-4 py-3">
                                                    <p className="mb-2 text-sm font-bold text-gray-400">
                                                        Ví dụ
                                                    </p>
                                                    <p className="italic leading-relaxed text-gray-700">
                                                        {currentWord.example}
                                                    </p>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <button
                                    onClick={handleDontKnow}
                                    className="mt-8 h-16 w-full rounded-3xl bg-gray-100 text-lg font-bold transition hover:bg-gray-200"
                                >
                                    Tôi không biết
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>

            {summaryPopupGroup ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5 backdrop-blur-sm">
                    <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[32px] bg-white p-6 shadow-[0_20px_80px_rgba(0,0,0,0.18)]">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-2xl font-black text-gray-900">
                                {summaryPopupGroup === "mastered"
                                    ? "Tat ca tu da hoc"
                                    : summaryPopupGroup === "learning"
                                    ? "Tat ca tu dang hoc"
                                    : "Tat ca tu chua hoc"}
                            </h2>

                            <button
                                onClick={() => setSummaryPopupGroup(null)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-gray-100"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {(summaryPopupGroup === "mastered"
                                ? masteredWords
                                : summaryPopupGroup === "learning"
                                ? learningWords
                                : newWords
                            ).map((word) => (
                                <div
                                    key={word.id}
                                    className={`rounded-3xl px-4 py-4 ${
                                        summaryPopupGroup === "mastered"
                                            ? "border border-emerald-200 bg-emerald-50/80 shadow-[0_0_30px_rgba(34,197,94,0.16)]"
                                            : summaryPopupGroup === "learning"
                                            ? "border border-amber-200 bg-amber-50/80 shadow-[0_0_30px_rgba(245,158,11,0.14)]"
                                            : "border border-gray-100 bg-white"
                                    }`}
                                >
                                    <p className="text-base font-black text-gray-900">
                                        {word.word}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {word.meaning}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : null}

            {settingsVisible ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5 backdrop-blur-sm">
                    <div className="relative w-full max-w-2xl rounded-[36px] bg-white p-7 shadow-[0_20px_80px_rgba(0,0,0,0.15)]">
                        <button
                            onClick={() => setSettingsVisible(false)}
                            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-gray-100"
                        >
                            <X className="h-5 w-5 text-gray-500" />
                        </button>

                        <h2 className="text-3xl font-black text-gray-900">
                            Cài đặt học tập
                        </h2>
                        <p className="mt-2 font-medium leading-relaxed text-gray-500">
                            ùy chỉnh cách học và cách kiểm tra.
                        </p>

                        <div className="mt-8">
                            <p className="mb-4 text-lg font-black">
                                Chế độ học
                            </p>

                            <div className="space-y-3">
                                {[
                                    {
                                        key: "term",
                                        label: "Hoi tu, tra loi nghia",
                                    },
                                    {
                                        key: "definition",
                                        label: "Hoi nghia, tra loi tu",
                                    },
                                ].map((mode) => (
                                    <button
                                        key={mode.key}
                                        onClick={() => {
                                            setTempLearningModes((prev) => {
                                                const exists = prev.includes(
                                                    mode.key as "term" | "definition"
                                                )

                                                if (exists && prev.length === 1) {
                                                    return prev
                                                }

                                                return exists
                                                    ? prev.filter(
                                                          (item) => item !== mode.key
                                                      )
                                                    : [
                                                          ...prev,
                                                          mode.key as
                                                              | "term"
                                                              | "definition",
                                                      ]
                                            })
                                        }}
                                        className={`w-full rounded-2xl border-2 p-4 text-left font-bold transition ${
                                            tempLearningModes.includes(
                                                mode.key as "term" | "definition"
                                            )
                                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                                : "border-gray-100 hover:border-gray-200"
                                        }`}
                                    >
                                        {mode.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8">
                            <p className="mb-4 text-lg font-black">
                                Tùy chọn hành vi
                            </p>

                            <button
                                onClick={() =>
                                    setTempAutoContinue(!tempAutoContinue)
                                }
                                className={`w-full rounded-2xl border-2 p-4 text-left font-bold transition ${
                                    tempAutoContinue
                                        ? "border-blue-500 bg-blue-50 text-blue-700"
                                        : "border-gray-100 hover:border-gray-200"
                                }`}
                            >
                                Tự động tiếp tục khi trả lời đúng
                            </button>
                        </div>

                        <div className="mt-10 grid grid-cols-2 gap-4">
                            <button
                                onClick={resetLearningProgress}
                                className="h-14 rounded-2xl bg-red-50 font-bold text-red-600 transition hover:bg-red-100"
                            >
                                Reset tiến độ học tập
                            </button>

                            <button
                                onClick={applyLearningSettings}
                                className="h-14 rounded-2xl bg-blue-600 font-bold text-white transition hover:bg-blue-700"
                            >
                                Áp dụng
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {editingWord ? (
                <div
                    className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5 backdrop-blur-sm transition-all duration-200 ${
                        modalVisible ? "opacity-100" : "opacity-0"
                    }`}
                >
                    <div
                        className={`max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[32px] bg-white transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                            modalVisible
                                ? "translate-y-0 scale-100 opacity-100"
                                : "translate-y-4 scale-95 opacity-0"
                        }`}
                    >
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/90 px-6 pb-4 pt-6 backdrop-blur-xl">
                            <h2 className="text-2xl font-black">
                                Chỉnh sửa từ
                            </h2>

                            <button
                                onClick={() => {
                                    setModalVisible(false)
                                    window.setTimeout(() => {
                                        setEditingWord(false)
                                    }, 200)
                                }}
                                className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-gray-100"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="space-y-5">
                                <div className="rounded-3xl bg-gray-50 p-4">
                                    <p className="mb-3 text-sm font-bold text-gray-400">
                                        Thuật ngữ
                                    </p>
                                    <input
                                        value={editWord}
                                        onChange={(event) =>
                                            setEditWord(event.target.value)
                                        }
                                        placeholder="Word"
                                        className="h-14 w-full rounded-2xl border border-gray-200 bg-white px-4 font-semibold"
                                    />
                                </div>

                                <div className="rounded-3xl bg-gray-50 p-4">
                                    <p className="mb-3 text-sm font-bold text-gray-400">
                                        Định nghĩa
                                    </p>
                                    <textarea
                                        value={editMeaning}
                                        onChange={(event) =>
                                            setEditMeaning(event.target.value)
                                        }
                                        placeholder="Meaning"
                                        className="min-h-[120px] w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-4 font-semibold"
                                    />
                                </div>

                                <div className="rounded-3xl bg-gray-50 p-4">
                                    <p className="mb-3 text-sm font-bold text-gray-400">
                                        Phát âm
                                    </p>
                                    <input
                                        value={editIPA}
                                        onChange={(event) =>
                                            setEditIPA(event.target.value)
                                        }
                                        placeholder="IPA"
                                        className="h-14 w-full rounded-2xl border border-gray-200 bg-white px-4 font-semibold"
                                    />
                                </div>

                                <div className="rounded-3xl bg-gray-50 p-4">
                                    <p className="mb-3 text-sm font-bold text-gray-400">
                                        Loai tu
                                    </p>
                                    <input
                                        value={editWordType}
                                        onChange={(event) =>
                                            setEditWordType(event.target.value)
                                        }
                                        placeholder="Word type"
                                        className="h-14 w-full rounded-2xl border border-gray-200 bg-white px-4 font-semibold"
                                    />
                                </div>

                                <div className="rounded-3xl bg-gray-50 p-4">
                                    <p className="mb-3 text-sm font-bold text-gray-400">
                                        Vi du
                                    </p>
                                    <textarea
                                        value={editExample}
                                        onChange={(event) =>
                                            setEditExample(event.target.value)
                                        }
                                        placeholder="Example"
                                        className="min-h-[140px] w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-4 font-semibold"
                                    />
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        onClick={() => {
                                            setModalVisible(false)
                                            window.setTimeout(() => {
                                                setEditingWord(false)
                                            }, 200)
                                        }}
                                        className="h-12 rounded-2xl bg-gray-100 px-5 font-bold"
                                    >
                                        Hủy
                                    </button>

                                    <button
                                        onClick={async () => {
                                            if (!currentWord) {
                                                return
                                            }

                                            await supabase
                                                .from("vocab_words")
                                                .update({
                                                    word: editWord,
                                                    meaning: editMeaning,
                                                    ipa: editIPA,
                                                    example: editExample,
                                                    word_type: editWordType,
                                                })
                                                .eq("id", currentWord.id)

                                            setQueue((prev) =>
                                                prev.map((word) =>
                                                    word.id === currentWord.id
                                                        ? {
                                                              ...word,
                                                              word: editWord,
                                                              meaning: editMeaning,
                                                              ipa: editIPA,
                                                              example: editExample,
                                                              word_type: editWordType,
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
                                                              meaning: editMeaning,
                                                              ipa: editIPA,
                                                              example: editExample,
                                                              word_type: editWordType,
                                                          }
                                                        : word
                                                )
                                            )

                                            setModalVisible(false)
                                            window.setTimeout(() => {
                                                setEditingWord(false)
                                            }, 200)
                                        }}
                                        className="h-12 rounded-2xl bg-blue-600 px-5 font-bold text-white"
                                    >
                                        Lưu
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    )
}
