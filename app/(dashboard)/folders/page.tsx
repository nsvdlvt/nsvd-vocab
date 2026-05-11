"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

type VocabSet = {
  id: string
  title: string
  created_at: string
  total_words?: number
  icon?: string
  tag?: string
}

export default function ArchivePage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [sets, setSets] = useState<VocabSet[]>([])
  const [search, setSearch] = useState("")
  const [openMenu, setOpenMenu] =
    useState<string | null>(null)

  const fetchSets = async () => {
    setLoading(true)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const user = session?.user

    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } =
      await supabase
        .from("vocab_sets")
        .select(`
  id,
  title,
  created_at,
  icon,
  tag,
  vocab_words(count)
`)
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        })

    if (error) {
      console.log(error)
      setLoading(false)
      return
    }

    const formatted = data.map(
      (item: any) => ({
        id: item.id,
        title: item.title,
        icon: item.icon,
        tag: item.tag,
        created_at:
          item.created_at,

        total_words:
          item.vocab_words?.[0]
            ?.count || 0,

      })
    )

    setSets(formatted)

    setLoading(false)
  }
  useEffect(() => {
    fetchSets()
  }, [])
  useEffect(() => {
    const closeMenu = () =>
      setOpenMenu(null)

    window.addEventListener(
      "click",
      closeMenu
    )

    return () =>
      window.removeEventListener(
        "click",
        closeMenu
      )
  }, [])

  const filteredSets = sets.filter(
    (set) =>
      set.title
        .toLowerCase()
        .includes(search.toLowerCase())
  )
  const deleteSet = async (
    id: string
  ) => {
    const confirmDelete =
      confirm(
        "Xóa bộ từ này? 😭"
      )

    if (!confirmDelete) return

    await supabase
      .from("vocab_words")
      .delete()
      .eq("set_id", id)

    await supabase
      .from("vocab_sets")
      .delete()
      .eq("id", id)

    fetchSets()
  }
  return (
    <section className="p-5 md:p-8 pb-28 lg:pb-8">

      {/* TOP */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-10">

        <div>
          <p className="text-gray-500 text-lg">
            Your vocabulary sets ✨
          </p>

          <h1 className="text-5xl font-black mt-2">
            Kho lưu trữ
          </h1>
        </div>

        <button
          onClick={() =>
            router.push("/new")
          }
          className="bg-blue-600 hover:bg-blue-700 transition text-white px-6 py-4 rounded-2xl font-black shadow-lg shadow-blue-200"
        >
          + Tạo bộ từ
        </button>
      </div>

      {/* SEARCH */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-5 mb-8">
        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Tìm bộ từ..."
          className="w-full bg-[#f5f9ff] rounded-2xl p-5 outline-none"
        />
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex items-center justify-center py-32">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {/* EMPTY */}
      {!loading &&
        filteredSets.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-32">

            <div className="text-8xl mb-6">
              📚
            </div>

            <h2 className="text-4xl font-black">
              Bạn chưa có từ vựng
            </h2>

            <p className="text-gray-500 mt-3 text-lg">
              Tạo bộ từ đầu tiên của bạn 😎
            </p>

            <button
              onClick={() =>
                router.push("/new")
              }
              className="mt-8 bg-blue-600 hover:bg-blue-700 transition text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-blue-200"
            >
              + Tạo ngay
            </button>
          </div>
        )}

      {/* GRID */}
      {!loading &&
        filteredSets.length > 0 && (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

            {filteredSets.map((set) => (
              <div
                key={set.id}
                className="bg-white rounded-[30px] md:rounded-[40px] border border-gray-100 shadow-sm p-5 md:p-6 hover:-translate-y-1 hover:shadow-xl transition-all"
              >
                {/* MENU */}
                <div className="flex justify-end relative -mt-2 -mr-2 mb-2">

                  <button
                    onClick={(e) => {
                      e.stopPropagation()

                      setOpenMenu(
                        openMenu === set.id
                          ? null
                          : set.id
                      )
                    }}
                    className="w-11 h-11 rounded-xl hover:bg-gray-100 transition flex items-center justify-center text-2xl"
                  >
                    ⋯
                  </button>

                  {openMenu === set.id && (
                    <div className="absolute top-14 right-0 bg-white border border-gray-100 shadow-2xl rounded-2xl p-2 w-52 z-[999] animate-fade-blur">

                      <button
                        onClick={() =>
                          router.push(
                            `/edit/${set.id}`
                          )
                        }
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-100 transition font-semibold"
                      >
                        ✏️ Chỉnh sửa
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/vocabsets/${set.id}`
                          )

                          setOpenMenu(null)

                          alert(
                            "Đã copy link 😎🔥"
                          )
                        }}
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-100 transition font-semibold"
                      >
                        🔗 Chia sẻ
                      </button>

                      <button
                        onClick={() =>
                          deleteSet(set.id)
                        }
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 text-red-500 transition font-semibold"
                      >
                        🗑 Xóa bộ từ vựng
                      </button>

                    </div>
                  )}
                </div>

                {/* TOP */}
                <div className="flex flex-col items-center text-center">

                  {/* ICON */}
                  <div className="w-20 h-20 rounded-[28px] bg-blue-600 text-white flex items-center justify-center text-4xl shadow-lg shadow-blue-200">
                    {set.icon || "📘"}
                  </div>

                  {/* TITLE */}
                  <h2 className="text-2xl md:text-3xl font-black line-clamp-2 break-all max-w-full px-2 leading-tight">
  {set.title}
</h2>

                  {/* TAG */}
                  <div className="mt-4 inline-flex bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-bold">
                    #{set.tag || "General"}
                  </div>

                </div>

                {/* INFO */}
                <div className="space-y-3 mt-6">

                  <div className="bg-[#f5f9ff] rounded-2xl px-4 py-3 flex items-center justify-between">
                    <span className="text-gray-500">
                      Số từ
                    </span>

                    <span className="font-black">
                      {set.total_words}
                    </span>
                  </div>

                  <div className="bg-[#f5f9ff] rounded-2xl px-4 py-3 flex items-center justify-between">
                    <span className="text-gray-500">
                      Ngày tạo
                    </span>

                    <span className="font-bold">
                      {new Date(
                        set.created_at
                      ).toLocaleDateString(
                        "vi-VN"
                      )}
                    </span>
                  </div>
                </div>

                {/* BUTTON */}
                <button
                  onClick={() =>
                    router.push(
                      `/vocabsets/${set.id}`
                    )
                  }
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 transition text-white py-4 rounded-2xl font-black"
                >
                  Mở bộ từ
                </button>
              </div>
            ))}
          </div>
        )}
    </section>
  )
}