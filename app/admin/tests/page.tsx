"use client"

import {
    useEffect,
    useState
} from "react"

import Link from "next/link"

import { useRouter }
from "next/navigation"

import { supabase }
from "@/lib/supabase"

import {
    ClipboardCheck,
    Plus,
    Search,
    Clock3,
    Trash2,
    Pencil,
    ChevronRight
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

export default function AdminTestsPage() {

    const router = useRouter()

    const [loading, setLoading] =
        useState(true)

    const [tests, setTests] =
        useState<TestItem[]>([])

    const [search, setSearch] =
        useState("")

    // ADMIN CHECK
    useEffect(() => {

        const checkAdmin =
            async () => {

                const {
                    data: { user }
                } =
                    await supabase
                        .auth
                        .getUser()

                if (!user) {

                    router.push("/login")

                    return
                }

                const {
                    data: profile
                } =
                    await supabase
                        .from("profiles")
                        .select("role")
                        .eq("id", user.id)
                        .single()

                if (
                    !profile ||
                    profile.role !== "ADMIN"
                ) {

                    router.push("/403")

                    return
                }

                fetchTests()
            }

        checkAdmin()

    }, [])

    // FETCH
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

    // DELETE
    const handleDelete =
        async (id: string) => {

            const confirmed =
                confirm(
                    "Xóa đề thi này?"
                )

            if (!confirmed)
                return

            const { error } =
                await supabase
                    .from("tests")
                    .delete()
                    .eq("id", id)

            if (!error) {

                setTests((prev) =>
                    prev.filter(
                        (test) =>
                            test.id !== id
                    )
                )
            }
        }

    const filteredTests =

        tests.filter((test) =>

            test.title
                .toLowerCase()
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

font-black
text-xl

shadow-sm
border border-gray-100
">

                    Loading tests...

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

                {/* HEADER */}
                <div className="
flex
flex-col
xl:flex-row

xl:items-center
xl:justify-between

gap-5

mb-10
">

                    {/* LEFT */}
                    <div className="
flex
items-center
gap-4
">

                        <div className="
w-16
h-16

rounded-3xl

bg-emerald-100

flex
items-center
justify-center

shadow-lg
shadow-emerald-100
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

                                Tests

                            </h1>

                            <p className="
text-gray-500
mt-2
text-lg
">

                                Create and manage exams

                            </p>

                        </div>

                    </div>

                    {/* ACTIONS */}
                    <div className="
flex
flex-wrap
gap-4
">

                        {/* SEARCH */}
                        <div className="
relative
w-[320px]
max-w-full
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
                                placeholder="Tìm đề thi..."
                                className="
w-full
h-14

rounded-2xl

bg-white

border border-gray-200

pl-14
pr-5

outline-none

focus:border-emerald-500

shadow-sm
"
                            />

                        </div>

                        {/* CREATE */}
                        <Link
                            href="/admin/tests/create"
                            className="
h-14
px-6

rounded-2xl

bg-emerald-600
hover:bg-emerald-700

text-white
font-black

flex
items-center
justify-center
gap-2

shadow-lg
shadow-emerald-200

transition
"
                        >

                            <Plus className="
w-5
h-5
" />

                            Tạo đề thi

                        </Link>

                    </div>

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
">

                            <ClipboardCheck className="
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

                                Chưa có đề thi

                            </h2>

                            <p className="
text-gray-500

mt-3
leading-relaxed
">

                                Hãy tạo đề thi đầu tiên 😎

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

h-48

bg-gradient-to-br
from-emerald-500
to-teal-400

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
">

                                            <ClipboardCheck className="
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

                                    <h2 className="
text-3xl
font-black

leading-tight
">

                                        {test.title}

                                    </h2>

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

                                    {/* ACTIONS */}
                                    <div className="
grid
grid-cols-3

gap-3

mt-7
">

                                        {/* OPEN */}
                                        <Link
                                            href={`/test/${test.id}`}
                                            className="
h-12

rounded-2xl

bg-emerald-600
hover:bg-emerald-700

text-white
font-bold

flex
items-center
justify-center
gap-2

transition
"
                                        >

                                            <ChevronRight className="
w-5
h-5
" />

                                        </Link>

                                        {/* EDIT */}
                                        <button
                                            className="
h-12

rounded-2xl

bg-blue-100
hover:bg-blue-200

text-blue-700

flex
items-center
justify-center

transition
"
                                        >

                                            <Pencil className="
w-5
h-5
" />

                                        </button>

                                        {/* DELETE */}
                                        <button
                                            onClick={() =>
                                                handleDelete(
                                                    test.id
                                                )
                                            }
                                            className="
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

                                    </div>

                                </div>

                            </div>
                        )
                    )}

                </div>

            </div>

        </main>

    )
}