"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ChevronRight,
  Clock3,
  FileText,
  Layers3,
  Search,
  Trophy,
} from "lucide-react"
import { supabase } from "@/lib/supabase"

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
  const [tests, setTests] = useState<TestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const fetchTests = async () => {
      const { data, error } = await supabase
        .from("tests")
        .select("*")
        .order("created_at", { ascending: false })

      if (!error && data) {
        setTests(data)
      }

      setLoading(false)
    }

    fetchTests()
  }, [])

  const filteredTests = useMemo(
    () =>
      tests.filter(
        (test) =>
          test.title.toLowerCase().includes(search.toLowerCase()) ||
          test.description?.toLowerCase().includes(search.toLowerCase())
      ),
    [search, tests]
  )

  if (loading) {
    return (
      <section className="dashboard-shell min-h-[calc(100vh-5rem)]">
        <div className="dashboard-loading">
          <div className="dashboard-spinner" />
          <p className="dashboard-loading-text">Đang tải bài thi</p>
        </div>
      </section>
    )
  }

  return (
    <section className="dashboard-shell">
      <div className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <div className="dashboard-pill">
            <Trophy className="h-4 w-4" />
            Khu luyện tập trong cùng hệ giao diện
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] text-[#211914] md:text-6xl">
            Làm bài thi trực tuyến
            <span className="block text-[#c96d35]">rõ ràng và tập trung hơn.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#66584b]">
            Chọn đề phù hợp, xem nhanh thời lượng và số câu hỏi để bắt đầu luyện ngay.
          </p>
        </div>

        <div className="dashboard-hero-panel">
          <div className="dashboard-panel-dark">
            <p className="text-xs uppercase tracking-[0.24em] text-[#d6b396]">Tìm bài thi</p>
            <div className="mt-4 flex items-center gap-3 rounded-[1.5rem] bg-white/10 px-4 py-4">
              <Search className="h-5 w-5 text-[#e1c5ab]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm bài thi..."
                className="w-full bg-transparent text-white outline-none placeholder:text-[#cfb39a]"
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-[1.5rem] bg-white/8 p-4">
                <p className="text-sm text-[#d9bba0]">Tổng đề</p>
                <p className="mt-2 text-3xl font-black">{tests.length}</p>
              </div>
              <div className="rounded-[1.5rem] bg-white/8 p-4">
                <p className="text-sm text-[#d9bba0]">Chế độ</p>
                <p className="mt-2 text-3xl font-black">AI</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {filteredTests.length === 0 ? (
        <div className="dashboard-empty-state mt-6">
          <FileText className="h-14 w-14 text-[#cbb29d]" />
          <h2 className="mt-4 text-3xl font-black text-[#241c17]">Chưa có bài thi phù hợp</h2>
          <p className="mt-3 max-w-lg text-[#66584b]">
            Chưa có bài thi nào được tạo hoặc từ khóa tìm kiếm chưa khớp.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredTests.map((test) => (
            <article key={test.id} className="dashboard-card">
              <div className="flex items-center gap-3">
                <div className="dashboard-icon-wrap">
                  <Layers3 className="h-5 w-5" />
                </div>
                <div className="rounded-full bg-[#f1e4d6] px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#8d6542]">
                  {test.difficulty || "Mixed"}
                </div>
              </div>

              <h2 className="mt-5 line-clamp-2 text-2xl font-black text-[#241c17]">
                {test.title}
              </h2>
              <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#66584b]">
                {test.description || "Không có mô tả cho bài thi này."}
              </p>

              <div className="mt-6 space-y-3">
                <div className="dashboard-soft-card flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[#66584b]">
                    <Clock3 className="h-4 w-4" />
                    Thời lượng
                  </span>
                  <span className="font-black text-[#241c17]">{test.duration} phút</span>
                </div>
                <div className="dashboard-soft-card flex items-center justify-between">
                  <span className="text-[#66584b]">Số câu hỏi</span>
                  <span className="font-black text-[#241c17]">{test.total_questions}</span>
                </div>
              </div>

              <Link
                href={`/test/${test.id}`}
                className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-[#d96d32] px-4 py-4 font-black text-white transition hover:bg-[#c25f29]"
              >
                Vào làm
                <ChevronRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
