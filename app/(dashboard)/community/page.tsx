"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Bookmark, Search, Sparkles } from "lucide-react"
import { supabase } from "@/lib/supabase"

type CommunitySet = {
  id: string
  title: string
  tag?: string
  owner_name?: string
  total_words: number
  downloads?: number
}

type CommunitySetRow = {
  id: string
  title: string
  tag?: string | null
  author_name?: string | null
  downloads?: number | null
  vocab_words?: { count: number }[]
}

export default function CommunityPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sets, setSets] = useState<CommunitySet[]>([])

  useEffect(() => {
    const fetchSets = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from("vocab_sets")
        .select(
          `
            id,
            title,
            tag,
            author_name,
            downloads,
            vocab_words(count)
          `
        )
        .eq("is_public", true)
        .order("downloads", { ascending: false })

      if (error) {
        console.log(error)
        setLoading(false)
        return
      }

      const formatted = ((data || []) as CommunitySetRow[]).map((item) => ({
        id: item.id,
        title: item.title,
        tag: item.tag || "Tổng hợp",
        owner_name: item.author_name || "Cộng đồng",
        total_words: item.vocab_words?.[0]?.count || 0,
        downloads: item.downloads || 0,
      }))

      setSets(formatted)
      setLoading(false)
    }

    fetchSets()
  }, [])

  const filteredSets = useMemo(
    () =>
      sets.filter((set) =>
        [set.title, set.tag || "", set.owner_name || ""]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [search, sets]
  )

  const saveSet = async (setId: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const user = session?.user
    if (!user) {
      router.push("/login")
      return
    }

    const { data: setData } = await supabase
      .from("vocab_sets")
      .select("*")
      .eq("id", setId)
      .single()

    if (!setData) return

    const { data: newSet } = await supabase
      .from("vocab_sets")
      .insert({
        user_id: user.id,
        title: setData.title,
        description: setData.description,
        tag: setData.tag,
        icon: setData.icon,
        is_public: false,
      })
      .select()
      .single()

    const { data: words } = await supabase
      .from("vocab_words")
      .select("*")
      .eq("set_id", setId)

    if (newSet && words?.length) {
      await supabase.from("vocab_words").insert(
        words.map((word) => ({
          set_id: newSet.id,
          word: word.word,
          meaning: word.meaning,
          ipa: word.ipa,
          word_type: word.word_type,
          example: word.example,
          synonyms: word.synonyms,
          audio_url: word.audio_url,
        }))
      )
    }

    await supabase
      .from("vocab_sets")
      .update({
        downloads: (setData.downloads || 0) + 1,
      })
      .eq("id", setId)

    router.push(`/edit/${newSet.id}?source=${setId}`)
  }

  if (loading) {
    return (
      <section className="dashboard-shell min-h-[calc(100vh-5rem)]">
        <div className="dashboard-loading">
          <div className="dashboard-spinner" />
          <p className="dashboard-loading-text">Đang tải bộ từ cộng đồng</p>
        </div>
      </section>
    )
  }

  return (
    <section className="dashboard-shell">
      <div className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <div className="dashboard-pill">
            <Sparkles className="h-4 w-4" />
            Khám phá bộ từ do cộng đồng chia sẻ
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] text-[#211914] md:text-6xl">
            Community
            <span className="block text-[#c96d35]">cùng nhau học tập .</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#66584b]">
            Chọn bộ từ phù hợp, xem nhanh số lượng từ và lưu về kho của bạn để tiếp tục học.
          </p>
        </div>

        <div className="dashboard-hero-panel">
          <div className="dashboard-panel-dark">
            <p className="text-xs uppercase tracking-[0.24em] text-[#d6b396]">Tìm kiếm nhanh</p>
            <div className="mt-4 flex items-center gap-3 rounded-[1.5rem] bg-white/10 px-4 py-4">
              <Search className="h-5 w-5 text-[#e1c5ab]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm bộ từ, chủ đề hoặc tác giả..."
                className="w-full bg-transparent text-white outline-none placeholder:text-[#cfb39a]"
              />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-[1.5rem] bg-white/8 p-4">
                <p className="text-sm text-[#d9bba0]">Bộ công khai</p>
                <p className="mt-2 text-3xl font-black">{sets.length}</p>
              </div>
              <div className="rounded-[1.5rem] bg-white/8 p-4">
                <p className="text-sm text-[#d9bba0]">Lượt lưu</p>
                <p className="mt-2 text-3xl font-black">
                  {sets.reduce((sum, item) => sum + (item.downloads || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredSets.length === 0 ? (
          <div className="dashboard-empty-state md:col-span-2 xl:col-span-3">
            <h2 className="text-3xl font-black text-[#241c17]">Chưa có bộ từ phù hợp</h2>
            <p className="mt-3 max-w-xl text-[#66584b]">
              Thử từ khóa khác hoặc là người đầu tiên chia sẻ một bộ từ cho cộng đồng.
            </p>
          </div>
        ) : (
          filteredSets.map((set) => (
            <div
              key={set.id}
              onClick={() => router.push(`/community/view/${set.id}`)}
              className="dashboard-card cursor-pointer transition hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="rounded-full bg-[#f1e4d6] px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#8d6542]">
                    {set.tag}
                  </div>
                  <h2 className="mt-4 line-clamp-2 text-2xl font-black text-[#221a16]">
                    {set.title}
                  </h2>
                </div>
                <span className="rounded-2xl bg-[#fbf1e6] px-3 py-2 text-sm font-black text-[#c96d35]">
                  {set.total_words}
                </span>
              </div>

              <div className="mt-6 space-y-3 text-sm text-[#66584b]">
                <div className="dashboard-soft-card flex items-center justify-between">
                  <span>Số lượng từ</span>
                  <span className="font-black text-[#241c17]">{set.total_words}</span>
                </div>
                <div className="dashboard-soft-card flex items-center justify-between">
                  <span>Người chia sẻ</span>
                  <span className="font-black text-[#241c17]">{set.owner_name}</span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    saveSet(set.id)
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#d96d32] px-4 py-4 font-black text-white transition hover:bg-[#c25f29]"
                >
                  <Bookmark className="h-4 w-4" />
                  Lưu
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/community/view/${set.id}`)
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#e2d2bf] bg-[#fffaf3] px-4 py-4 font-black text-[#241c17] transition hover:border-[#c96d35] hover:text-[#c96d35]"
                >
                  Xem
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
