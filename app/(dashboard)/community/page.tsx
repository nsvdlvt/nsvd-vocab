"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

type CommunitySet = {
  id: string
  title: string
  icon?: string
  tag?: string
  created_at: string
  downloads?: number
  total_words?: number
}

export default function CommunityPage() {

  const router = useRouter()

  const [loading, setLoading] =
    useState(true)

  const [search, setSearch] =
    useState("")

  const [sets, setSets] =
    useState<CommunitySet[]>([])

  const fetchSets = async () => {

    setLoading(true)

    const { data, error } =
      await supabase
        .from("vocab_sets")
        .select(`
          id,
          title,
          icon,
          tag,
          created_at,
          downloads,
          vocab_words(count)
        `)
        .eq("is_public", true)
        .order("downloads", {
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

        downloads:
          item.downloads || 0,

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

  const filteredSets =
    sets.filter((set) =>
      set.title
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
    )

  const saveSet = async (
    setId: string
  ) => {

    const {
      data: { session },
    } =
      await supabase.auth.getSession()

    const user = session?.user

    if (!user) return

    // lấy set gốc
    const { data: setData } =
      await supabase
        .from("vocab_sets")
        .select("*")
        .eq("id", setId)
        .single()

    if (!setData) return

    // clone set
    const { data: newSet } =
      await supabase
        .from("vocab_sets")
        .insert({
          user_id: user.id,

          title:
            setData.title,

          icon:
            setData.icon,

          tag:
            setData.tag,

          is_public: false,
        })
        .select()
        .single()

    // lấy words
    const { data: words } =
      await supabase
        .from("vocab_words")
        .select("*")
        .eq("set_id", setId)

    // clone words
    if (words?.length) {

      await supabase
        .from("vocab_words")
        .insert(
          words.map((word) => ({
            set_id: newSet.id,

            word: word.word,
            meaning:
              word.meaning,

            ipa: word.ipa,

            word_type:
              word.word_type,

            example:
              word.example,

            synonyms:
              word.synonyms,
          }))
        )
    }

    // tăng downloads
    await supabase
      .from("vocab_sets")
      .update({
        downloads:
          (setData.downloads || 0) + 1,
      })
      .eq("id", setId)

    alert(
      "Đã lưu vào kho 😎🔥"
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <section className="p-5 md:p-10">

      {/* TOP */}
      <div className="mb-10">

        <p className="text-gray-500 text-lg">
          Shared by community ✨
        </p>

        <h1 className="text-5xl font-black mt-2">
          Community
        </h1>

      </div>

      {/* SEARCH */}
      <div className="bg-white rounded-[30px] p-4 border border-gray-100 shadow-sm mb-10">

        <input
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          placeholder="Tìm bộ từ..."
          className="w-full bg-[#f5f9ff] rounded-2xl p-5 outline-none"
        />
      </div>

      {/* EMPTY */}
      {filteredSets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-center">

          <div className="text-8xl mb-6">
            😭
          </div>

          <h2 className="text-4xl font-black mb-4">
            Chưa có bộ từ nào
          </h2>

          <p className="text-gray-500">
            Hãy là người đầu tiên chia sẻ 😎🔥
          </p>

        </div>
      )}

      {/* GRID */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">

        {filteredSets.map(
          (set) => (

            <div
              key={set.id}
              className="bg-white rounded-[35px] p-5 md:p-6 border border-gray-100 shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all"
            >

              {/* TOP */}
              <div className="flex flex-col items-center text-center">

                {/* ICON */}
                <div className="w-20 h-20 rounded-[28px] bg-blue-600 text-white flex items-center justify-center text-4xl shadow-lg shadow-blue-200">
                  {set.icon || "📘"}
                </div>

                {/* TITLE */}
                <h2 className="text-2xl md:text-3xl font-black line-clamp-2 break-all max-w-full px-2 leading-tight mt-5">
                  {set.title}
                </h2>

                {/* TAG */}
                <div className="mt-4 inline-flex bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-bold">
                  #{set.tag || "General"}
                </div>

              </div>

              {/* INFO */}
              <div className="space-y-4 mt-8">

                <div className="bg-[#f5f9ff] rounded-2xl px-5 py-4 flex justify-between">
                  <span className="text-gray-500">
                    Số từ
                  </span>

                  <span className="font-black">
                    {set.total_words}
                  </span>
                </div>

                <div className="bg-[#f5f9ff] rounded-2xl px-5 py-4 flex justify-between">
                  <span className="text-gray-500">
                    Downloads
                  </span>

                  <span className="font-black">
                    {set.downloads}
                  </span>
                </div>

              </div>

              {/* ACTIONS */}
              <div className="flex gap-3 mt-6">

                <button
                  onClick={() =>
                    router.push(
                      `/vocabsets/${set.id}`
                    )
                  }
                  className="flex-1 bg-black text-white py-4 rounded-2xl font-black hover:opacity-90 transition"
                >
                  👀 Xem
                </button>

                <button
                  onClick={() =>
                    saveSet(set.id)
                  }
                  className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition"
                >
                  ⬇ Lưu
                </button>

              </div>

            </div>
          )
        )}
      </div>
    </section>
  )
}