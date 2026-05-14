"use client"

import {
    useEffect,
    useState
} from "react"

import Link from "next/link"

import { supabase }
    from "@/lib/supabase"

import {
    FileText,
    Search,
    Download,
    Eye
} from "lucide-react"

type DocumentItem = {

    id: string

    title: string

    description: string

    category: string

    file_url: string

    created_at: string
}

export default function DocumentsPage() {

    const [documents, setDocuments] =
        useState<DocumentItem[]>([])

    const [loading, setLoading] =
        useState(true)

    const [search, setSearch] =
        useState("")

    useEffect(() => {

        const fetchDocuments =
            async () => {

                const {
                    data,
                    error
                } =
                    await supabase
                        .from("documents")
                        .select("*")
                        .order(
                            "created_at",
                            {
                                ascending: false
                            }
                        )

                if (!error && data) {

                    setDocuments(data)
                }

                setLoading(false)
            }

        fetchDocuments()

    }, [])

    const filteredDocuments =

        documents.filter((doc) =>

            doc.title
                .toLowerCase()
                .includes(
                    search.toLowerCase()
                ) ||

            doc.category
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

                {/* HEADER */}
                <div className="
flex
flex-col
md:flex-row

md:items-center
md:justify-between

gap-5

mb-10
">

                    <div>

                        <h1 className="
text-5xl
font-black
">

                            Tài liệu học tập

                        </h1>

                        <p className="
text-gray-500
mt-3

text-lg
leading-relaxed
">

                            Khám phá tài liệu,
                            PDF và bài học
                            được chia sẻ bởi admin.

                        </p>

                    </div>

                    {/* SEARCH */}
                    <div className="
relative
w-full
md:w-[380px]
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
                            placeholder="Tìm tài liệu..."
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

                </div>

                {/* EMPTY */}
                {
                    filteredDocuments.length === 0 && (

                        <div className="
bg-white

rounded-[40px]

p-16

border border-gray-100

shadow-sm

text-center
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

                                Chưa có tài liệu

                            </h2>

                            <p className="
text-gray-500

mt-3
leading-relaxed
">

                                Hiện chưa có tài liệu
                                nào được upload.

                            </p>

                        </div>
                    )
                }

                {/* GRID */}
                <div className="
grid
grid-cols-1
md:grid-cols-2
xl:grid-cols-3

gap-6
">

                    {filteredDocuments.map(
                        (doc) => (

                            <div
                                key={doc.id}
                                className="
bg-white

rounded-[36px]

border border-gray-100

shadow-sm

overflow-hidden

hover:-translate-y-1
hover:shadow-xl

transition-all
duration-300
"
                            >

                                {/* PREVIEW */}
                                <div className="
h-52

bg-gradient-to-br
from-blue-500
to-cyan-400

flex
items-center
justify-center
">

                                    <FileText className="
w-20
h-20
text-white
opacity-90
" />

                                </div>

                                {/* CONTENT */}
                                <div className="
p-6
">

                                    {/* CATEGORY */}
                                    <div className="
inline-flex

px-3
py-1

rounded-full

bg-blue-100
text-blue-700

text-sm
font-black
">

                                        {
                                            doc.category ||
                                            "General"
                                        }

                                    </div>

                                    {/* TITLE */}
                                    <h2 className="
text-2xl
font-black

mt-4

line-clamp-2
">

                                        {doc.title}

                                    </h2>

                                    {/* DESC */}
                                    <p className="
text-gray-500

mt-3

leading-relaxed

line-clamp-3
">

                                        {
                                            doc.description ||
                                            "Không có mô tả."
                                        }

                                    </p>

                                    {/* ACTIONS */}
                                    <div className="
grid
grid-cols-2

gap-3

mt-6
">

                                        <Link
                                            href={`/documents/${doc.id}`}
                                            className="
h-12

rounded-2xl

bg-blue-600
hover:bg-blue-700

text-white
font-bold

flex
items-center
justify-center
gap-2

transition
"
                                        >

                                            <Eye className="
w-5
h-5
" />

                                            Xem

                                        </Link>

                                        <a
                                            href={
                                                doc.file_url
                                            }
                                            target="_blank"
                                            className="
h-12

rounded-2xl

bg-gray-100
hover:bg-gray-200

font-bold

flex
items-center
justify-center
gap-2

transition
"
                                        >

                                            <Download className="
w-5
h-5
" />

                                            Tải

                                        </a>

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