"use client"

import {
    useState
} from "react"

import { useRouter }
    from "next/navigation"

import { supabase }
    from "@/lib/supabase"

import {
    ClipboardCheck,
    Plus,
    Trash2
} from "lucide-react"

type Question = {

    question: string

    options: string[]

    correctAnswer: number

    explanation: string
}

export default function CreateTestPage() {

    const router = useRouter()

    const [title, setTitle] =
        useState("")
const [quickMode, setQuickMode] =
    useState(false)

const [quickInput, setQuickInput] =
    useState("")
    const [
        description,
        setDescription
    ] = useState("")

    const [duration, setDuration] =
        useState(15)

    const [
        difficulty,
        setDifficulty
    ] = useState("Easy")

    const [
        questions,
        setQuestions
    ] = useState<Question[]>([
        {
            question: "",

            options: [
                "",
                "",
                "",
                ""
            ],

            correctAnswer: -1,

            explanation: ""
        }
    ])

    const [loading, setLoading] =
        useState(false)

    // ADD QUESTION
    const addQuestion = () => {

        setQuestions((prev) => [

            ...prev,

            {
                question: "",

                options: [
                    "",
                    "",
                    "",
                    ""
                ],

                correctAnswer: -1,

                explanation: ""
            }
        ])
    }

    // DELETE QUESTION
    const removeQuestion =
        (index: number) => {

            setQuestions((prev) =>

                prev.filter(
                    (_, i) =>
                        i !== index
                )
            )
        }

    // UPDATE QUESTION
    const updateQuestion =
        (
            index: number,
            field: keyof Question,
            value: any
        ) => {

            setQuestions((prev) =>

                prev.map(
                    (question, i) => {

                        if (i !== index)
                            return question

                        return {

                            ...question,

                            [field]: value
                        }
                    }
                )
            )
        }
    // UPDATE OPTION
    const updateOption =
    (
        qIndex: number,
        optionIndex: number,
        value: string
    ) => {

        setQuestions((prev) =>

            prev.map(
                (question, i) => {

                    if (i !== qIndex)
                        return question

                    const newOptions =
                        [
                            ...question.options
                        ]

                    newOptions[
                        optionIndex
                    ] = value

                    return {

                        ...question,

                        options:
                            newOptions
                    }
                }
            )
        )
    }
const parseQuestions = (
    raw: string
) => {

    const blocks =

        raw
            .split(
                /Câu\s+\d+\s*:/i
            )
            .filter(Boolean)

    const parsed =

        blocks.map((block) => {

            const lines =

                block
                    .split("\n")
                    .map((line) =>
                        line.trim()
                    )
                    .filter(Boolean)

            const question =
                lines[0]

            const options: string[] = []

            let correctAnswer = -1

            let explanation = ""

            lines.forEach(
                (line) => {

                    if (
                        /^[*]?[A-D]\./i.test(
                            line
                        )
                    ) {

                        const isCorrect =

                            line.startsWith(
                                "*"
                            )

                        const cleaned =

                            line
                                .replace(
                                    "*",
                                    ""
                                )
                                .replace(
                                    /^[A-D]\.\s*/i,
                                    ""
                                )

                        options.push(
                            cleaned
                        )

                        if (isCorrect) {

                            correctAnswer =
                                options.length - 1
                        }
                    }

                    if (
                        line.startsWith(
                            "Giải thích:"
                        )
                    ) {

                        explanation =

                            line.replace(
                                "Giải thích:",
                                ""
                            )
                    }
                }
            )

            return {

                question,

                options:
                    [
                        ...options,
                        "",
                        "",
                        "",
                        ""
                    ].slice(0, 4),

                correctAnswer,

                explanation
            }
        })

    setQuestions(parsed)
}
    // CREATE TEST
    const handleCreate =
        async () => {

            if (!title) {

                alert(
                    "Nhập tiêu đề 😭"
                )

                return
            }

            try {

                setLoading(true)

                // INSERT TEST
                const {
                    data: test,
                    error
                } =
                    await supabase
                        .from("tests")
                        .insert({

                            title,

                            description,

                            duration,

                            difficulty,

                            total_questions:
                                questions.length
                        })
                        .select()
                        .single()

                if (error)
                    throw error

                // INSERT QUESTIONS
                const formattedQuestions =

                    questions.map(
                        (q) => ({

                            test_id:
                                test.id,

                            question:
                                q.question,

                            options:
                                q.options,

                            correct_answer:
    q.options[q.correctAnswer],

                            explanation:
                                q.explanation
                        })
                    )

                const {
                    error:
                    questionError
                } =
                    await supabase
                        .from(
                            "test_questions"
                        )
                        .insert(
                            formattedQuestions
                        )

                if (questionError)
                    throw questionError

                alert(
                    "Tạo đề thi thành công 😎🔥"
                )

                router.push(
                    "/admin/tests"
                )

            } catch (error) {

                console.error(error)

                alert(
                    "Có lỗi xảy ra 😭"
                )

            } finally {

                setLoading(false)
            }
        }

    return (

        <main className="
min-h-screen
bg-[#f5f9ff]

p-5
md:p-8
">

            <div className="
max-w-5xl
mx-auto
">

                {/* HEADER */}
                <div className="
flex
items-center
gap-4

mb-10
">

                    <div className="
w-16
h-16

rounded-3xl

bg-emerald-100

flex
items-center
justify-center
">

                        <ClipboardCheck className="
w-8
h-8
text-emerald-600
" />

                    </div>

                    <div>

                        <h1 className="
text-5xl
font-black
">

                            Tạo đề thi

                        </h1>

                        <p className="
text-gray-500
mt-2
text-lg
">

                            Create online exam

                        </p>

                    </div>

                </div>
<div className="
flex
justify-end

mb-6
">

    <div className="
flex
items-center

gap-2

bg-white

p-2

rounded-2xl

border border-gray-100

shadow-sm
">

        <button
            type="button"
            onClick={() =>
                setQuickMode(false)
            }
            className={`
px-5
h-12

rounded-xl

font-black

transition-all

${!quickMode

                    ? `
bg-blue-600
text-white
`

                    : `
text-gray-500
hover:bg-gray-100
`
                }
`}
        >

            Thêm thủ công

        </button>

        <button
            type="button"
            onClick={() =>
                setQuickMode(true)
            }
            className={`
px-5
h-12

rounded-xl

font-black

transition-all

${quickMode

                    ? `
bg-emerald-600
text-white
`

                    : `
text-gray-500
hover:bg-gray-100
`
                }
`}
        >

            ⚡ Thêm nhanh

        </button>

    </div>

</div>
                {/* INFO */}
                <div className="
bg-white

rounded-[40px]

p-8

border border-gray-100

shadow-sm

space-y-6
">

                    <div>

                        <p className="
font-black
mb-3
">

                            Tiêu đề

                        </p>

                        <input
                            value={title}
                            onChange={(e) =>
                                setTitle(
                                    e.target.value
                                )
                            }
                            placeholder="IELTS Vocabulary Test"
                            className="
w-full
h-14

rounded-2xl

border border-gray-200

px-5

outline-none

focus:border-emerald-500
"
                        />

                    </div>

                    <div>

                        <p className="
font-black
mb-3
">

                            Mô tả

                        </p>

                        <textarea
                            value={description}
                            onChange={(e) =>
                                setDescription(
                                    e.target.value
                                )
                            }
                            rows={4}
                            placeholder="Mô tả đề thi..."
                            className="
w-full

rounded-2xl

border border-gray-200

p-5

outline-none

focus:border-emerald-500
"
                        />

                    </div>

                    <div className="
grid
grid-cols-1
md:grid-cols-2

gap-5
">

                        <div>

                            <p className="
font-black
mb-3
">

                                Thời gian

                            </p>

                            <input
                                type="number"
                                value={duration}
                                onChange={(e) =>
                                    setDuration(
                                        Number(
                                            e.target
                                                .value
                                        )
                                    )
                                }
                                className="
w-full
h-14

rounded-2xl

border border-gray-200

px-5

outline-none
"
                            />

                        </div>

                        <div>

                            <p className="
font-black
mb-3
">

                                Độ khó

                            </p>

                            <select
                                value={
                                    difficulty
                                }
                                onChange={(e) =>
                                    setDifficulty(
                                        e.target
                                            .value
                                    )
                                }
                                className="
w-full
h-14

rounded-2xl

border border-gray-200

px-5

outline-none
"
                            >

                                <option>
                                    Easy
                                </option>

                                <option>
                                    Medium
                                </option>

                                <option>
                                    Hard
                                </option>

                            </select>

                        </div>

                    </div>

                </div>

                {/* QUESTIONS */}
                {
    quickMode

        ? (

            <div className="
grid
grid-cols-1
xl:grid-cols-2

gap-6

mt-8
">

                {/* PREVIEW */}
                <div className="
bg-white

rounded-[40px]

p-8

border border-gray-100

shadow-sm

max-h-[80vh]
overflow-y-auto
">

                    <h2 className="
text-3xl
font-black

mb-6
">

                        Preview

                    </h2>

                    <div className="
space-y-6
">

                        {
                            questions.map(
                                (
                                    question,
                                    index
                                ) => (

                                    <div
                                        key={index}
                                        className="
border border-gray-100

rounded-3xl

p-5
"
                                    >

                                        <h2 className="
font-black
text-xl
leading-relaxed
">

                                            Câu {index + 1}: {question.question}

                                        </h2>

                                        <div className="
space-y-3

mt-5
">

                                            {
                                                question.options.map(
                                                    (
                                                        option,
                                                        optionIndex
                                                    ) => {

                                                        const label =

                                                            String.fromCharCode(
                                                                65 + optionIndex
                                                            )

                                                        const isCorrect =

                                                            question.correctAnswer ===
                                                            optionIndex

                                                        return (

                                                            <div
                                                                key={optionIndex}
                                                                className={`
flex
items-center

gap-4

rounded-2xl

border

p-4

${isCorrect

                                                                        ? `
border-green-500
bg-green-50
`

                                                                        : `
border-gray-100
`
                                                                    }
`}
                                                            >

                                                                <div className={`
min-w-10
h-10

rounded-xl

flex
items-center
justify-center

font-black

${isCorrect

                                                                        ? `
bg-green-500
text-white
`

                                                                        : `
bg-gray-100
`
                                                                    }
`}>

                                                                    {label}

                                                                </div>

                                                                <p>

                                                                    {option}

                                                                </p>

                                                            </div>
                                                        )
                                                    }
                                                )
                                            }

                                        </div>

                                    </div>
                                )
                            )
                        }

                    </div>

                </div>

                {/* INPUT */}
                <div className="
bg-white

rounded-[40px]

p-8

border border-gray-100

shadow-sm
">

                    <h2 className="
text-3xl
font-black

mb-6
">

                        ⚡ Thêm nhanh

                    </h2>

                    <textarea
                        value={quickInput}
                        onChange={(e) => {

                            setQuickInput(
                                e.target.value
                            )

                            parseQuestions(
                                e.target.value
                            )
                        }}
                        placeholder={`Câu 1: What is dissemination?

A. destruction
B. isolation
*C. spreading information
D. protection

Giải thích:
Dissemination means spreading information.`}
                        className="
w-full
h-[70vh]

rounded-3xl

border border-gray-200

p-6

font-mono
text-sm
leading-relaxed

outline-none

focus:border-emerald-500
"
                    />

                </div>

            </div>

        )

        : (

            <div className="
space-y-6

mt-8
">

                {questions.map(
                    (
                        question,
                        index
                    ) => (

                        <div
                            key={index}
                            className="
bg-white

rounded-[40px]

p-8

border border-gray-100

shadow-sm
"
                        >

                            {/* TOP */}
                            <div className="
flex
items-center
justify-between

mb-6
">

                                <h2 className="
text-3xl
font-black
">

                                    Câu {index + 1}

                                </h2>

                            </div>

                            {/* QUESTION */}
                            <input
                                value={
                                    question.question
                                }
                                onChange={(e) =>
                                    updateQuestion(
                                        index,
                                        "question",
                                        e.target.value
                                    )
                                }
                                placeholder="Nhập câu hỏi..."
                                className="
w-full
h-14

rounded-2xl

border border-gray-200

px-5
"
                            />

                        </div>
                    )
                )}

            </div>
        )
}
                <div className="
flex
flex-wrap

gap-4

mt-8
">

                    <button
                        onClick={addQuestion}
                        className="
h-14
px-7

rounded-2xl

bg-blue-100
hover:bg-blue-200

text-blue-700
font-black

flex
items-center
gap-2

transition
"
                    >

                        <Plus className="
w-5
h-5
" />

                        Thêm câu hỏi

                    </button>

                    <button
                        onClick={
                            handleCreate
                        }
                        disabled={loading}
                        className="
h-14
px-8

rounded-2xl

bg-emerald-600
hover:bg-emerald-700

disabled:opacity-50

text-white
font-black

transition
"
                    >

                        {
                            loading

                                ? "Đang tạo..."

                                : "Tạo đề thi"
                        }

                    </button>

                </div>

            </div>

        </main>

    )
}