"use client"

import Link from "next/link"

import {
    useEffect,
    useState
} from "react"

import { supabase }
from "@/lib/supabase"

import {
    FileText,
    Clock3,
    Search,
    ChevronRight,
    Trophy,
    Layers3
} from "lucide-react"

type TestItem = {

    id: string

    title: string

    description: string

    duration: number

    total_questions: number

    difficulty: string

    created_at: string
}

export default function TestsPage() {

    const [tests, setTests] =
        useState<TestItem[]>([])

    const [loading, setLoading] =
        useState(true)

    const [search, setSearch] =
        useState("")

    useEffect(() => {

        const fetchTests =
            async () => {

                const {
                    data,
                    error
                } =
                    await supabase
                        .from("tests")
                        .select("*")
                        .order(
                            "created_at",
                            {
                                ascending: false
                            }
                        )

                if (!error && data) {

                    setTests(data)
                }

                setLoading(false)
            }

        fetchTests()

    }, [])

    const filteredTests =

        tests.filter((test) =>

            test.title
                .toLowerCase()
                .includes(
                    search.toLowerCase()
                ) ||

            test.description
                ?.toLowerCase()
                .includes(
                    search.toLowerCase()
                )
        )

    if (loading) {

        return (

            <div className="
min-h-screen
bg-[#f5f9ff]

flex
items-center
justify-center
">

                <div className="
bg-white

px-8
py-6

rounded-3xl

shadow-sm
border border-gray-100

font-black
text-xl
">

                    Đang tải bài thi...

                </div>

            </div>

        )
    }

    return (

        <main className="
min-h-screen
bg-[#f5f9ff]

p-5
md:p-8
">

            <div className="
max-w-7xl
mx-auto
">

                {/* HERO */}
                <div className="
relative

overflow-hidden

rounded-[40px]

bg-gradient-to-br
from-blue-600
to-cyan-400

p-8
md:p-10

text-white

shadow-2xl
shadow-blue-200
">

                    <div className="
absolute
right-[-60px]
top-[-60px]

w-[220px]
h-[220px]

rounded-full

bg-white/10
" />

                    <div className="
absolute
bottom-[-80px]
left-[30%]

w-[260px]
h-[260px]

rounded-full

bg-white/10
" />

                    <div className="
relative
z-10

flex
flex-col
xl:flex-row

xl:items-center
xl:justify-between

gap-8
">

                        {/* LEFT */}
                        <div>

                            <div className="
inline-flex

items-center
gap-2

px-4
py-2

rounded-full

bg-white/15

font-bold
text-sm
backdrop-blur
">

                                <Trophy className="
w-4
h-4
" />

                                Practice Center

                            </div>

                            <h1 className="
text-5xl
md:text-6xl
font-black

leading-tight

mt-6
">

                                Làm bài thi
                                trực tuyến

                            </h1>

                            <p className="
mt-5

text-blue-100

text-lg
leading-relaxed

max-w-2xl
">

                                Luyện tập với các
                                đề thi được tạo bởi admin.
                                Theo dõi điểm số và
                                cải thiện kỹ năng của bạn.

                            </p>

                        </div>

                        {/* STATS */}
                        <div className="
grid
grid-cols-2

gap-4

min-w-[280px]
">

                            <div className="
bg-white/15
backdrop-blur

rounded-3xl

p-5
">

                                <p className="
text-blue-100
font-bold
">

                                    Tổng đề thi

                                </p>

                                <h2 className="
text-4xl
font-black

mt-3
">

                                    {
                                        tests.length
                                    }

                                </h2>

                            </div>

                            <div className="
bg-white/15
backdrop-blur

rounded-3xl

p-5
">

                                <p className="
text-blue-100
font-bold
">

                                    Hệ thống

                                </p>

                                <h2 className="
text-3xl
font-black

mt-3
">

                                    AI 🚀

                                </h2>

                            </div>

                        </div>

                    </div>

                </div>

                {/* SEARCH */}
                <div className="
mt-8

relative

max-w-xl
">

                    <Search className="
absolute
left-5
top-1/2
-translate-y-1/2

w-5
h-5
text-gray-400
" />

                    <input
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                        placeholder="Tìm bài thi..."
                        className="
w-full
h-14

rounded-2xl

bg-white

border border-gray-200

pl-14
pr-5

outline-none

focus:border-blue-500

shadow-sm
"
                    />

                </div>

                {/* EMPTY */}
                {
                    filteredTests.length === 0 && (

                        <div className="
bg-white

rounded-[40px]

p-16

border border-gray-100

shadow-sm

text-center

mt-10
">

                            <FileText className="
w-16
h-16

mx-auto

text-gray-300
" />

                            <h2 className="
text-3xl
font-black

mt-6
">

                                Không có bài thi

                            </h2>

                            <p className="
text-gray-500

mt-3
leading-relaxed
">

                                Hiện chưa có đề thi
                                nào được tạo.

                            </p>

                        </div>
                    )
                }

                {/* GRID */}
                <div className="
grid
grid-cols-1
lg:grid-cols-2
2xl:grid-cols-3

gap-6

mt-10
">

                    {filteredTests.map(
                        (test) => (

                            <div
                                key={test.id}
                                className="
bg-white

rounded-[36px]

border border-gray-100

shadow-sm

overflow-hidden

hover:-translate-y-1
hover:shadow-2xl

transition-all
duration-300
"
                            >

                                {/* TOP */}
                                <div className="
relative

h-52

bg-gradient-to-br
from-violet-500
to-fuchsia-500

p-7

text-white
">

                                    <div className="
absolute
right-[-30px]
top-[-30px]

w-[140px]
h-[140px]

rounded-full

bg-white/10
" />

                                    <div className="
relative
z-10
">

                                        <div className="
w-14
h-14

rounded-2xl

bg-white/15

flex
items-center
justify-center

backdrop-blur
">

                                            <Layers3 className="
w-7
h-7
" />

                                        </div>

                                        <div className="
mt-6

inline-flex

px-3
py-1

rounded-full

bg-white/15

font-black
text-sm
">

                                            {
                                                test.difficulty ||
                                                "Normal"
                                            }

                                        </div>

                                    </div>

                                </div>

                                {/* CONTENT */}
                                <div className="
p-7
">

                                    {/* TITLE */}
                                    <h2 className="
text-3xl
font-black

leading-tight
">

                                        {test.title}

                                    </h2>

                                    {/* DESC */}
                                    <p className="
text-gray-500

mt-4

leading-relaxed

line-clamp-3
">

                                        {
                                            test.description ||
                                            "Không có mô tả."
                                        }

                                    </p>

                                    {/* INFO */}
                                    <div className="
flex
flex-wrap

gap-3

mt-6
">

                                        <div className="
px-4
py-2

rounded-2xl

bg-blue-100
text-blue-700

font-black
text-sm

flex
items-center
gap-2
">

                                            <Clock3 className="
w-4
h-4
" />

                                            {
                                                test.duration
                                            } phút

                                        </div>

                                        <div className="
px-4
py-2

rounded-2xl

bg-orange-100
text-orange-700

font-black
text-sm
">

                                            {
                                                test.total_questions
                                            } câu

                                        </div>

                                    </div>

                                    {/* ACTION */}
                                    <Link
                                        href={`/test/${test.id}`}
                                        className="
h-14

mt-7

rounded-2xl

bg-blue-600
hover:bg-blue-700

text-white
font-black

flex
items-center
justify-center
gap-2

transition
"
                                    >

                                        Làm bài thi

                                        <ChevronRight className="
w-5
h-5
" />

                                    </Link>

                                </div>

                            </div>
                        )
                    )}

                </div>

            </div>

        </main>

    )
}