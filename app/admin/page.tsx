"use client"

import {
    useEffect,
    useState
} from "react"

import { useRouter }
    from "next/navigation"

import { supabase }
    from "@/lib/supabase"

import {
    Shield,
    FileText,
    Users,
    BookOpen,
    ChevronRight,
    ClipboardCheck
} from "lucide-react"

const getLoginRedirectUrl = () => {
    const redirectTo = `${window.location.pathname}${window.location.search}`
    return `/login?redirectTo=${encodeURIComponent(redirectTo)}`
}

export default function AdminPage() {

    const router = useRouter()

    const [loading, setLoading] =
        useState(true)

    const [role, setRole] =
        useState("")

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

                    router.push(getLoginRedirectUrl())

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

                setRole(profile.role)

                setLoading(false)
            }

        checkAdmin()

    }, [])

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

                    Loading admin...

                </div>

            </div>

        )
    }

    return (

        <section className="
min-h-screen
bg-[#f5f9ff]

p-5
md:p-8
">

            {/* TOP */}
            <div className="
flex
items-center
justify-between

mb-10
">

                <div>

                    <div className="
flex
items-center
gap-3
">

                        <div className="
w-12
h-12

rounded-2xl

bg-red-500

flex
items-center
justify-center

shadow-lg
shadow-red-200
">

                            <Shield className="
w-6
h-6
text-white
" />

                        </div>

                        <div>

                            <h1 className="
text-4xl
font-black
">

                                Admin Panel

                            </h1>

                            <p className="
text-gray-500
mt-1
">

                                Manage platform & content

                            </p>

                        </div>

                    </div>

                </div>

                <div className="
px-4
py-2

rounded-2xl

bg-red-100
text-red-600

font-black
">

                    {role}

                </div>

            </div>

            {/* GRID */}
            <div className="
grid
grid-cols-1
md:grid-cols-2
xl:grid-cols-3

gap-6
">

                {/* DOCUMENTS */}
                <button
                    onClick={() =>
                        router.push(
                            "/admin/documents"
                        )
                    }
                    className="
bg-white

rounded-[32px]

p-7

border border-gray-100

shadow-sm

hover:-translate-y-1
hover:shadow-xl

transition-all
duration-300

text-left
"
                >

                    <div className="
w-14
h-14

rounded-2xl

bg-blue-100

flex
items-center
justify-center
">

                        <FileText className="
w-7
h-7
text-blue-600
" />

                    </div>

                    <h2 className="
text-2xl
font-black

mt-6
">

                        Documents

                    </h2>

                    <p className="
text-gray-500
mt-2
leading-relaxed
">

                        Upload and manage
                        learning materials

                    </p>

                    <div className="
flex
items-center
gap-2

mt-6

text-blue-600
font-bold
">

                        Open

                        <ChevronRight className="
w-5
h-5
" />

                    </div>

                </button>

                {/* USERS */}
                <button
                    className="
bg-white

rounded-[32px]

p-7

border border-gray-100

shadow-sm

hover:-translate-y-1
hover:shadow-xl

transition-all
duration-300

text-left
"
                >

                    <div className="
w-14
h-14

rounded-2xl

bg-violet-100

flex
items-center
justify-center
">

                        <Users className="
w-7
h-7
text-violet-600
" />

                    </div>

                    <h2 className="
text-2xl
font-black

mt-6
">

                        Users

                    </h2>

                    <p className="
text-gray-500
mt-2
leading-relaxed
">

                        Manage users
                        and memberships

                    </p>

                </button>

                {/* VOCAB */}
                <button
                    className="
bg-white

rounded-[32px]

p-7

border border-gray-100

shadow-sm

hover:-translate-y-1
hover:shadow-xl

transition-all
duration-300

text-left
"
                >

                    <div className="
w-14
h-14

rounded-2xl

bg-orange-100

flex
items-center
justify-center
">

                        <BookOpen className="
w-7
h-7
text-orange-600
" />

                    </div>

                    <h2 className="
text-2xl
font-black

mt-6
">

                        Vocabulary

                    </h2>

                    <p className="
text-gray-500
mt-2
leading-relaxed
">

                        Manage vocab sets
                        and flashcards

                    </p>

                </button>
{/* TESTS */}
<button
    onClick={() =>
        router.push(
            "/admin/tests"
        )
    }
    className="
bg-white

rounded-[32px]

p-7

border border-gray-100

shadow-sm

hover:-translate-y-1
hover:shadow-xl

transition-all
duration-300

text-left
"
>

    <div className="
w-14
h-14

rounded-2xl

bg-emerald-100

flex
items-center
justify-center
">

        <ClipboardCheck className="
w-7
h-7
text-emerald-600
" />

    </div>

    <h2 className="
text-2xl
font-black

mt-6
">

        Tests

    </h2>

    <p className="
text-gray-500
mt-2
leading-relaxed
">

        Create and manage
        online exams and tests

    </p>

    <div className="
flex
items-center
gap-2

mt-6

text-emerald-600
font-bold
">

        Open

        <ChevronRight className="
w-5
h-5
" />

    </div>

</button>
            </div>

        </section>

    )
}
