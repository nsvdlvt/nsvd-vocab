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
    Upload,
    FileText,
    ShieldAlert
} from "lucide-react"

export default function AdminDocumentsPage() {

    const router = useRouter()

    const [loading, setLoading] =
        useState(true)

    const [uploading, setUploading] =
        useState(false)

    const [title, setTitle] =
        useState("")

    const [
        description,
        setDescription
    ] = useState("")

    const [category, setCategory] =
        useState("")

    const [file, setFile] =
        useState<File | null>(null)

    // CHECK ADMIN
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

                setLoading(false)
            }

        checkAdmin()

    }, [])

    // UPLOAD
    const handleUpload =
        async () => {

            if (
                !title ||
                !file
            ) {

                alert(
                    "Vui lòng nhập tiêu đề và chọn file."
                )

                return
            }

            try {

                setUploading(true)

                const {
                    data: { user }
                } =
                    await supabase
                        .auth
                        .getUser()

                if (!user)
                    return

                const safeName =

                    file.name
                        .normalize("NFD")
                        .replace(
                            /[\u0300-\u036f]/g,
                            ""
                        )
                        .replace(
                            /\s+/g,
                            "-"
                        )
                        .replace(
                            /[^a-zA-Z0-9.-]/g,
                            ""
                        )

                const filePath =
                    `${Date.now()}-${safeName}`

                // UPLOAD STORAGE
                const {
                    error: uploadError
                } =
                    await supabase
                        .storage
                        .from("documents")
                        .upload(
                            filePath,
                            file
                        )

                if (uploadError)
                    throw uploadError

                // GET URL
                const { data } =
                    supabase
                        .storage
                        .from("documents")
                        .getPublicUrl(
                            filePath
                        )

                const fileUrl =
                    data.publicUrl

                // SAVE DB
                const {
                    error: insertError
                } =
                    await supabase
                        .from("documents")
                        .insert({

                            title,

                            description,

                            category,

                            file_url:
                                fileUrl,

                            uploaded_by:
                                user.id
                        })

                if (insertError)
                    throw insertError

                alert(
                    "Upload thành công 😎🔥"
                )

                setTitle("")
                setDescription("")
                setCategory("")
                setFile(null)

            } catch (error: any) {

                console.error(error)

                alert(
                    error.message ||
                    "Upload thất bại 😭"
                )
            } finally {

                setUploading(false)
            }
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

                <div className="
bg-white
px-8
py-6
rounded-3xl

font-black
shadow-sm
">

                    Loading...

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
max-w-3xl
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

                    <div>

                        <h1 className="
text-4xl
font-black
">

                            Upload tài liệu

                        </h1>

                        <p className="
text-gray-500
mt-1
">

                            Chỉ ADMIN mới có quyền upload.

                        </p>

                    </div>

                </div>

                {/* FORM */}
                <div className="
bg-white

rounded-[40px]

p-8

border border-gray-100

shadow-sm
">

                    {/* TITLE */}
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
                            placeholder="Ví dụ: IELTS Vocabulary PDF"
                            className="
w-full
h-14

rounded-2xl

border border-gray-200

px-5

outline-none

focus:border-blue-500
"
                        />

                    </div>

                    {/* DESCRIPTION */}
                    <div className="mt-6">

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
                            rows={5}
                            placeholder="Mô tả tài liệu..."
                            className="
w-full

rounded-2xl

border border-gray-200

p-5

outline-none

focus:border-blue-500
"
                        />

                    </div>

                    {/* CATEGORY */}
                    <div className="mt-6">

                        <p className="
font-black
mb-3
">

                            Danh mục

                        </p>

                        <input
                            value={category}
                            onChange={(e) =>
                                setCategory(
                                    e.target.value
                                )
                            }
                            placeholder="IELTS / TOEIC / Biology..."
                            className="
w-full
h-14

rounded-2xl

border border-gray-200

px-5

outline-none

focus:border-blue-500
"
                        />

                    </div>

                    {/* FILE */}
                    <div className="mt-6">

                        <p className="
font-black
mb-3
">

                            File tài liệu

                        </p>

                        <label className="
h-40

border-2
border-dashed
border-gray-300

rounded-3xl

flex
flex-col
items-center
justify-center

cursor-pointer

hover:border-blue-500
hover:bg-blue-50

transition
">

                            <Upload className="
w-10
h-10
text-gray-400
" />

                            <p className="
mt-4
font-bold
text-gray-600
">

                                {
                                    file
                                        ? file.name
                                        : "Chọn file PDF/DOCX"
                                }

                            </p>

                            <input
                                type="file"
                                hidden
                                onChange={(e) => {

                                    const selected =
                                        e.target
                                            .files?.[0]

                                    if (
                                        selected
                                    ) {

                                        setFile(
                                            selected
                                        )
                                    }
                                }}
                            />

                        </label>

                    </div>

                    {/* ACTION */}
                    <button
                        onClick={
                            handleUpload
                        }
                        disabled={uploading}
                        className="
w-full
h-14

mt-8

rounded-2xl

bg-blue-600
hover:bg-blue-700

disabled:opacity-50

text-white
font-black

transition
"
                    >

                        {
                            uploading

                                ? "Đang upload..."

                                : "Upload tài liệu"
                        }

                    </button>

                </div>

                {/* NOTE */}
                <div className="
mt-6

bg-orange-50

border border-orange-200

rounded-3xl

p-5

flex
gap-4
items-start
">

                    <ShieldAlert className="
w-6
h-6
text-orange-500

mt-1
" />

                    <div>

                        <p className="
font-black
text-orange-700
">

                            Lưu ý

                        </p>

                        <p className="
text-orange-600
mt-1
leading-relaxed
">

                            Hãy kiểm tra kỹ nội dung
                            trước khi upload tài liệu.

                        </p>

                    </div>

                </div>

            </div>

        </main>

    )
}