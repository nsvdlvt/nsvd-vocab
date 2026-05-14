"use client"

import {
    useEffect,
    useState
} from "react"

import {
    useParams,
    useRouter
} from "next/navigation"

import { supabase }
from "@/lib/supabase"

import {
    ArrowLeft,
    Download,
    FileText
} from "lucide-react"

type DocumentItem = {

    id: string

    title: string

    description: string

    category: string

    file_url: string

    created_at: string
}

export default function DocumentViewerPage() {

    const params = useParams()

    const router = useRouter()

    const [document, setDocument] =
        useState<DocumentItem | null>(null)

    const [loading, setLoading] =
        useState(true)

    useEffect(() => {

        const fetchDocument =
            async () => {

                const {
                    data,
                    error
                } =
                    await supabase
                        .from("documents")
                        .select("*")
                        .eq(
                            "id",
                            params.id
                        )
                        .single()

                if (error || !data) {

                    router.push(
                        "/documents"
                    )

                    return
                }

                setDocument(data)

                setLoading(false)
            }

        fetchDocument()

    }, [])

    if (loading || !document) {

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

                    Đang tải tài liệu...

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

                {/* TOP BAR */}
                <div className="
flex
flex-col
xl:flex-row

gap-6

mb-8
">

                    {/* INFO */}
                    <div className="
flex-1

bg-white

rounded-[40px]

p-8

border border-gray-100

shadow-sm
">

                        {/* BACK */}
                        <button
                            onClick={() =>
                                router.push(
                                    "/documents"
                                )
                            }
                            className="
flex
items-center
gap-2

text-gray-500
hover:text-black

font-bold

transition
"
                        >

                            <ArrowLeft className="
w-5
h-5
" />

                            Quay lại

                        </button>

                        {/* CATEGORY */}
                        <div className="
inline-flex

mt-6

px-4
py-2

rounded-full

bg-blue-100
text-blue-700

font-black
text-sm
">

                            {
                                document.category ||
                                "General"
                            }

                        </div>

                        {/* TITLE */}
                        <h1 className="
text-5xl
font-black

mt-6

leading-tight
break-words
">

                            {document.title}

                        </h1>

                        {/* DESC */}
                        <p className="
text-gray-500

mt-6

text-lg
leading-relaxed
">

                            {
                                document.description ||
                                "Không có mô tả."
                            }

                        </p>

                        {/* ACTIONS */}
                        <div className="
flex
flex-wrap

gap-4

mt-8
">

                            <a
                                href={
                                    document.file_url
                                }
                                target="_blank"
                                className="
h-14
px-7

rounded-2xl

bg-blue-600
hover:bg-blue-700

text-white
font-black

flex
items-center
justify-center
gap-3

transition
"
                            >

                                <Download className="
w-5
h-5
" />

                                Tải tài liệu

                            </a>

                        </div>

                    </div>

                    {/* SIDE */}
                    <div className="
w-full
xl:w-[320px]

bg-gradient-to-br
from-blue-600
to-cyan-400

rounded-[40px]

p-8

text-white

shadow-xl
shadow-blue-200
">

                        <FileText className="
w-14
h-14
" />

                        <h2 className="
text-3xl
font-black

mt-6
">

                            Document Viewer

                        </h2>

                        <p className="
mt-4

text-blue-100
leading-relaxed
">

                            Xem tài liệu trực tiếp
                            ngay trên website.

                        </p>

                    </div>

                </div>

                {/* VIEWER */}
                <div className="
bg-white

rounded-[40px]

border border-gray-100

shadow-sm

overflow-hidden
">

                    <iframe
                        src={
                            document.file_url
                        }
                        className="
w-full
h-[85vh]
"
                    />

                </div>

            </div>

        </main>

    )
}