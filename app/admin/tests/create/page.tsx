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

                                        Câu
                                        {" "}
                                        {index + 1}

                                    </h2>

                                    {
                                        questions.length >
                                        1 && (

                                            <button
                                                onClick={() =>
                                                    removeQuestion(
                                                        index
                                                    )
                                                }
                                                className="
w-12
h-12

rounded-2xl

bg-red-100
hover:bg-red-200

text-red-600

flex
items-center
justify-center

transition
"
                                            >

                                                <Trash2 className="
w-5
h-5
" />

                                            </button>
                                        )
                                    }

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
                                            e.target
                                                .value
                                        )
                                    }
                                    placeholder="Nhập câu hỏi..."
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

                                {/* OPTIONS */}
<div className="
space-y-4

mt-6
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

                const isSelected =

    Number(question.correctAnswer) ===
    Number(optionIndex)

                return (

                    <div
                        key={optionIndex}
                        className="
flex
items-center

gap-4
"
                    >

                        {/* SELECT */}
                        <button
                            type="button"
                            onClick={() => {

                                updateQuestion(
                                    index,
                                    "correctAnswer",
Number(optionIndex)
                                )
                            }}
                            className={`
min-w-14
h-14

rounded-2xl

border-2

font-black
text-lg

transition-all

${isSelected

                                    ? `
border-green-500
bg-green-500
text-white

shadow-lg
shadow-green-200

scale-105
`

                                    : `
border-gray-200
bg-white

hover:border-green-400
hover:bg-green-50
`
                                }
`}
                        >

                            {label}

                        </button>

                        {/* INPUT */}
                        <input
                            value={option}
                            onChange={(e) =>
                                updateOption(
                                    index,
                                    optionIndex,
                                    e.target.value
                                )
                            }
                            placeholder={`Đáp án ${label}`}
                            className="
flex-1
h-14

rounded-2xl

border border-gray-200

px-5

outline-none

focus:border-emerald-500
"
                        />

                    </div>
                )
            }
        )
    }

</div>

                                {/* EXPLANATION */}
                                <div className="
mt-6
">

                                    <p className="
font-black
mb-3
">

                                        Giải thích

                                    </p>

                                    <textarea
                                        value={
                                            question.explanation
                                        }
                                        onChange={(e) =>
                                            updateQuestion(
                                                index,
                                                "explanation",
                                                e.target
                                                    .value
                                            )
                                        }
                                        rows={4}
                                        placeholder="Giải thích đáp án..."
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

                            </div>
                        )
                    )}

                </div>

                {/* ACTIONS */}
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