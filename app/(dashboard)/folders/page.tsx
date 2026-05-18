"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import {
  Check,
  Clock3,
  SlidersHorizontal,
  User,
} from "lucide-react"

type VocabSet = {
  id: string
  title: string
  created_at: string
  total_words?: number
  icon?: string
  tag?: string
  description?: string
  mastered_words: number
  learning_words: number
  unlearned_words: number
  author?: string
  last_studied_at?: string | null
}

type SupabaseVocabSet = {
  id: string
  title: string
  created_at: string
  icon?: string | null
  tag?: string | null
  description?: string | null
  author_name?: string | null
  vocab_words?: {
    count: number
  }[]
}

type LearningSession = {
  set_id: string
  updated_at: string
  all_words?: LearningWordProgress[] | null
}

type LearningWordProgress = {
  memoryStrength?: number
}

type SortBy =
  | "az"
  | "za"
  | "modified"

const formatRelativeTime = (
  value?: string | null
) => {

  if (!value)
    return "Chưa học"

  const time =
    new Date(value).getTime()

  if (Number.isNaN(time))
    return "Chưa học"

  const diffMs =
    Date.now() - time

  const diffMinutes =
    Math.max(
      0,
      Math.floor(
        diffMs / 60000
      )
    )

  if (diffMinutes < 1)
    return "Vừa xong"

  if (diffMinutes < 60)
    return `${diffMinutes} phút trước`

  const diffHours =
    Math.floor(
      diffMinutes / 60
    )

  if (diffHours < 24)
    return `${diffHours} giờ trước`

  const diffDays =
    Math.floor(
      diffHours / 24
    )

  if (diffDays < 30)
    return `${diffDays} ngày trước`

  return new Date(value)
    .toLocaleDateString("vi-VN")
}

const getLearningStats = (
  session: LearningSession | undefined,
  totalWords: number
) => {

  const words =
    session?.all_words || []

  if (words.length === 0) {

    return {
      mastered: 0,
      learning: 0,
      unlearned: totalWords,
    }
  }

  const mastered =
    words.filter(
      (word) =>
        (word.memoryStrength || 0) >= 4
    ).length

  const learning =
    words.filter((word) => {

      const strength =
        word.memoryStrength || 0

      return (
        strength >= 1 &&
        strength < 4
      )
    }).length

  return {
    mastered,
    learning,
    unlearned:
      Math.max(
        0,
        totalWords - mastered - learning
      ),
  }
}

export default function ArchivePage() {

  const router = useRouter()

  const [loading, setLoading] =
    useState(true)

  const [sets, setSets] =
    useState<VocabSet[]>([])

  const [search, setSearch] =
    useState("")

  const [sortBy, setSortBy] =
    useState<SortBy>("az")

  const [filterTag, setFilterTag] =
    useState("all")
  const [
    sortOpen,
    setSortOpen
  ] = useState(false)

  const fetchSets = async () => {

    const {
      data: { session },
    } =
      await supabase.auth.getSession()

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
          description,
          author_name,
          vocab_words(count)
        `)
        .eq("user_id", user.id)

    if (error) {

      console.log(error)

      setLoading(false)

      return
    }

    const setIds = (
      data || []
    ).map(
      (item: SupabaseVocabSet) =>
        item.id
    )

    const {
      data: sessions
    } = setIds.length > 0

      ? await supabase
        .from("learning_sessions")
        .select(`
          set_id,
          updated_at,
          all_words
        `)
        .eq("user_id", user.id)
        .in("set_id", setIds)

      : {
        data: []
      }

    const sessionBySetId =
      new Map(
        (
          sessions as
            LearningSession[] | null
        )?.map((learningSession) =>
          [
            learningSession.set_id,
            learningSession
          ] as const
        ) || []
      )

    const formatted = (
      data || []
    ).map(
      (item: SupabaseVocabSet) => {

        const totalWords =
          item.vocab_words?.[0]
            ?.count || 0

        const stats =
          getLearningStats(
            sessionBySetId.get(item.id),
            totalWords
          )

        return {

        id: item.id,

        title: item.title,

        icon:
          item.icon || undefined,

        tag:
          item.tag || undefined,

        created_at:
          item.created_at,

        total_words:
          totalWords,
            description:
  item.description || "",

mastered_words:
  stats.mastered,

learning_words:
  stats.learning,

unlearned_words:
  stats.unlearned,

author:
  item.author_name ||
  user.email ||
  "Unknown",

last_studied_at:
  sessionBySetId.get(item.id)
    ?.updated_at ||
  null,
      }
      }
    )

    setSets(formatted)

    setLoading(false)
  }

  useEffect(() => {

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSets()

  }, [])

  useEffect(() => {

    const closeMenu = () =>
      setSortOpen(false)

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

  const tags = useMemo(() => {

    return Array.from(

      new Set(

        sets.map(
          (s) =>
            s.tag || "General"
        )

      )

    )

  }, [sets])

  const filteredSets = useMemo(() => {

    return [...sets]

      .filter((set) =>

        set.title
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
      )

      .filter((set) =>

        filterTag === "all"

          ? true

          : (
            set.tag ||
            "General"
          ) === filterTag
      )

      .sort((a, b) => {

        if (sortBy === "az") {

          return a.title.localeCompare(
            b.title
          )
        }

        if (sortBy === "za") {

          return b.title.localeCompare(
            a.title
          )
        }

        return (
          new Date(
            b.created_at
          ).getTime()

          -

          new Date(
            a.created_at
          ).getTime()
        )
      })

  }, [
    sets,
    search,
    filterTag,
    sortBy
  ])

  return (

    <section className="
min-h-screen

bg-[#f5f9ff]

p-5
md:p-8
pb-28
lg:pb-8
">

      {/* TOP */}
      <div className="
flex
flex-col
lg:flex-row
lg:items-center
lg:justify-between

gap-5

mb-8
">

        <div>

          <p className="
text-gray-500
font-medium
">

            Your vocabulary sets ✨

          </p>

          <h1 className="
text-4xl
md:text-5xl
font-black

mt-2
tracking-tight
">

            Kho lưu trữ

          </h1>

        </div>

        <button
          onClick={() =>
            router.push("/new")
          }
          className="
h-14

px-6

rounded-full

bg-blue-600
hover:bg-blue-700

text-white
font-black

shadow-lg
shadow-blue-200/50

transition
"
        >

          + Tạo bộ từ

        </button>

      </div>
{/* TABS */}
<div className="
bg-white

rounded-[28px]

border border-gray-100

shadow-sm

p-2

mb-5
">

  <div className="
grid
grid-cols-3

gap-2
">

    <button className="
h-12

rounded-2xl

bg-[#f5f9ff]

font-semibold
text-sm

flex
items-center
justify-center
gap-2

transition
">

      📖 Bộ thẻ của tôi

    </button>

    <button className="
h-12

rounded-2xl

hover:bg-[#f5f9ff]

font-semibold
text-sm

flex
items-center
justify-center
gap-2

transition
">

      🗺️ Lộ trình của tôi

    </button>

    <button className="
h-12

rounded-2xl

hover:bg-[#f5f9ff]

font-semibold
text-sm

flex
items-center
justify-center
gap-2

transition
">

      🔖 Đã lưu

    </button>

  </div>

</div>
      {/* SEARCH + FILTER */}
      <div className="
bg-white

rounded-[28px]

border border-gray-100

shadow-sm

p-4

mb-8
">

        <div className="
flex
gap-3
">
<div className="flex-1">
          {/* SEARCH */}
          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Tìm bộ từ..."
            className="
w-full

bg-[#f5f9ff]

rounded-2xl

px-5
h-14

outline-none

font-medium
"
          />
</div>
{/* SORT */}
<div className="relative">

  <button
    aria-label="Tùy chọn sắp xếp và chủ đề"
    aria-expanded={sortOpen}
    onClick={(e) => {

      e.stopPropagation()

      setSortOpen(
        !sortOpen
      )
    }}
    className={`
h-14
w-14

rounded-full

bg-white

border
border-[#d9dde8]
hover:border-blue-500

shadow-[0_2px_8px_rgba(15,23,42,0.08)]
hover:shadow-[0_4px_14px_rgba(15,23,42,0.12)]

flex
items-center
justify-center

text-[#586380]
text-[0px]

transition

focus-visible:outline-none
focus-visible:ring-4
focus-visible:ring-blue-100

${
  sortOpen

    ? "border-blue-500 ring-4 ring-blue-100 text-blue-600"

    : ""
}
`}
  >

    <SlidersHorizontal className="
w-5
h-5
" />

    ⚙️

  </button>

  {sortOpen && (

    <div
      onClick={(e) =>
        e.stopPropagation()
      }
      className="
absolute
top-16
right-0

w-[280px]

bg-white

border border-[#edeff5]

rounded-2xl

shadow-[0_16px_40px_rgba(15,23,42,0.14)]

p-2

z-50

animate-in
fade-in
zoom-in-95
duration-100
"
    >

      <p className="
text-xs
font-black
text-[#586380]
uppercase

px-3
pt-2
pb-1
">

        Sắp xếp

      </p>

      {([
        {
          label: "A → Z",
          value: "az"
        },
        {
          label: "Z → A",
          value: "za"
        },
        {
          label: "Mới cập nhật",
          value: "modified"
        },
      ] as const).map((item) => (

        <button
          key={item.value}
          onClick={() => {

            setSortBy(
              item.value
            )

            setSortOpen(false)
          }}
          className={`
w-full

flex
items-center
justify-between
gap-3

px-3
py-2.5

rounded-xl

font-semibold
text-[15px]

transition

${
  sortBy === item.value

    ? "bg-[#eef4ff] text-blue-700"

    : "text-slate-900 hover:bg-[#f5f7fb]"
}
`}
        >

          <span>
            {item.label}
          </span>

          {sortBy === item.value && (

            <Check className="
w-4
h-4
stroke-[3]
" />

          )}

        </button>

      ))}

      <div className="
h-px
bg-gray-100

my-2
" />

      <p className="
text-xs
font-black
text-[#586380]
uppercase

px-3
pb-1
">

        Chủ đề

      </p>

      <button
        onClick={() => {

          setFilterTag("all")

          setSortOpen(false)
        }}
        className={`
w-full

flex
items-center
justify-between
gap-3

px-3
py-2.5

rounded-xl

font-semibold
text-[15px]

transition

${
  filterTag === "all"

    ? "bg-[#eef4ff] text-blue-700"

    : "text-slate-900 hover:bg-[#f5f7fb]"
}
`}
      >

        Tất cả chủ đề

        {filterTag === "all" && (

          <Check className="
w-4
h-4
stroke-[3]
" />

        )}

      </button>

      {tags.map((tag) => (

        <button
          key={tag}
          onClick={() => {

            setFilterTag(tag)

            setSortOpen(false)
          }}
          className={`
w-full

flex
items-center
justify-between
gap-3

px-3
py-2.5

rounded-xl

font-semibold
text-[15px]

transition

${
  filterTag === tag

    ? "bg-[#eef4ff] text-blue-700"

    : "text-slate-900 hover:bg-[#f5f7fb]"
}
`}
        >

          <span className="
truncate
">
            {tag}
          </span>

          {filterTag === tag && (

            <Check className="
w-4
h-4
shrink-0
stroke-[3]
" />

          )}

        </button>

      ))}

    </div>

  )}

</div>

        </div>

      </div>

      {/* LOADING */}
      {loading && (

        <div className="
flex
items-center
justify-center

py-32
">

          <div className="
w-14
h-14

rounded-full

border-4
border-blue-200
border-t-blue-600

animate-spin
" />

        </div>

      )}

      {/* EMPTY */}
      {!loading &&
        filteredSets.length === 0 && (

          <div className="
flex
flex-col
items-center
justify-center

text-center

py-32
">

            <div className="
text-7xl
mb-5
">

              📚

            </div>

            <h2 className="
text-3xl
md:text-4xl
font-black
">

              Không tìm thấy bộ từ

            </h2>

            <p className="
text-gray-500

mt-3
text-lg
">

              Hãy tạo bộ từ đầu tiên 😎

            </p>

            <button
              onClick={() =>
                router.push("/new")
              }
              className="
mt-8

h-14
px-8

rounded-2xl

bg-blue-600
hover:bg-blue-700

text-white
font-black

shadow-lg
shadow-blue-200/50

transition
"
            >

              + Tạo ngay

            </button>

          </div>

        )}

      {/* GRID */}
      {!loading &&
        filteredSets.length > 0 && (

          <div className="
grid
md:grid-cols-2
xl:grid-cols-3

gap-3
">

            {filteredSets.map((set) => (

              <div
                key={set.id}
                onClick={() =>
                  router.push(
                    `/vocabsets/${set.id}`
                  )
                }
                className="
group
cursor-pointer

bg-white

rounded-[24px]

border border-gray-100
hover:border-blue-200

shadow-sm
hover:shadow-lg

transition-all
duration-300

p-3.5
"
              >
                {/* CONTENT */}
<div className="
flex
flex-col

h-full
">

  {/* TOP */}
  <div className="
flex
items-start
justify-between

gap-3
min-h-[82px]
">

    <div className="
min-w-0
">

      <h2 className="
text-[22px]
font-black

leading-snug

line-clamp-2

break-words
">

        {set.title}

      </h2>

      {set.description && (

        <p className="
text-gray-500

mt-3

text-[15px]

line-clamp-2
">

          {set.description}

        </p>

      )}

    </div>

    <div className="
shrink-0

px-3
py-1

rounded-full

bg-gray-100

text-xs
font-bold
text-gray-500
">

      {set.total_words} từ

    </div>

  </div>

  {/* PROGRESS */}
  <div className="
mt-8
">

    <div className="
flex
items-center
gap-3
">

      <div className="
flex-1

h-3

rounded-full

bg-slate-200/70

overflow-hidden
flex
">

        <div
          style={{
            width:
              `${
                set.total_words

                  ? (
                    set.mastered_words /
                    set.total_words
                  ) * 100

                  : 0
              }%`
          }}
          className="
h-full

bg-blue-700
"
        />

        <div
          style={{
            width:
              `${
                set.total_words

                  ? (
                    set.learning_words /
                    set.total_words
                  ) * 100

                  : 0
              }%`
          }}
          className="
h-full

bg-blue-300
"
        />

      </div>

      <span className="
font-black
text-sm
">

        {set.mastered_words}/{set.total_words || 0}

      </span>

    </div>

  </div>

  {/* FOOTER */}
  <div className="
flex
items-center
justify-between

mt-8
">

    <div className="
flex
items-center
gap-2

text-gray-500
text-sm
">

      <Clock3 className="
w-4
h-4
shrink-0
" />

      <span>

        Học lần cuối:
        {" "}
        {formatRelativeTime(
          set.last_studied_at
        )}

      </span>

    </div>

    <div className="
px-3
py-1.5

rounded-full

bg-gray-100

text-sm
text-gray-600

flex
items-center
gap-2
">

      <User className="
w-4
h-4
shrink-0
" />

      {set.author}

    </div>

  </div>

</div>

              </div>

            ))}

          </div>

        )}

    </section>
  )
}
