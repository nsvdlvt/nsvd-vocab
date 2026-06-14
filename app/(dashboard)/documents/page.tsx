"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Download, Eye, FileText, Search, Sparkles } from "lucide-react"
import { supabase } from "@/lib/supabase"

type DocumentItem = {
  id: string
  title: string
  description: string
  category: string
  file_url: string
  created_at: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const fetchDocuments = async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false })

      if (!error && data) {
        setDocuments(data)
      }

      setLoading(false)
    }

    fetchDocuments()
  }, [])

  const filteredDocuments = useMemo(
    () =>
      documents.filter(
        (doc) =>
          doc.title.toLowerCase().includes(search.toLowerCase()) ||
          doc.category?.toLowerCase().includes(search.toLowerCase())
      ),
    [documents, search]
  )

  if (loading) {
    return (
      <section className="dashboard-shell min-h-[calc(100vh-5rem)]">
        <div className="dashboard-loading">
          <div className="dashboard-spinner" />
          <p className="dashboard-loading-text">Đang tải tài liệu học tập</p>
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
            Tài liệu, PDF và bài đọc trong cùng dashboard
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] text-[#211914] md:text-6xl">
            Tài liệu học tập
            <span className="block text-[#c96d35]">gọn, sáng và dễ đọc hơn.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#66584b]">
            Tìm tài liệu nhanh, mở xem hoặc tải xuống mà vẫn giữ nguyên cùng một ngôn ngữ giao diện.
          </p>
        </div>

        <div className="dashboard-hero-panel">
          <div className="dashboard-panel-dark">
            <p className="text-xs uppercase tracking-[0.24em] text-[#d6b396]">Tìm kiếm tài liệu</p>
            <div className="mt-4 flex items-center gap-3 rounded-[1.5rem] bg-white/10 px-4 py-4">
              <Search className="h-5 w-5 text-[#e1c5ab]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tài liệu hoặc danh mục..."
                className="w-full bg-transparent text-white outline-none placeholder:text-[#cfb39a]"
              />
            </div>
            <div className="mt-5 rounded-[1.5rem] bg-white/8 p-4">
              <p className="text-sm text-[#d9bba0]">Tổng tài liệu</p>
              <p className="mt-2 text-3xl font-black">{documents.length}</p>
            </div>
          </div>
        </div>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="dashboard-empty-state mt-6">
          <FileText className="h-14 w-14 text-[#cbb29d]" />
          <h2 className="mt-4 text-3xl font-black text-[#241c17]">Chưa có tài liệu phù hợp</h2>
          <p className="mt-3 max-w-lg text-[#66584b]">
            Hiện chưa có tài liệu nào được tải lên hoặc từ khóa tìm kiếm chưa khớp.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredDocuments.map((doc) => (
            <article key={doc.id} className="dashboard-card">
              <div className="flex h-44 items-center justify-center rounded-[2rem] bg-[linear-gradient(135deg,#f2e4d5_0%,#f9f3eb_100%)]">
                <FileText className="h-16 w-16 text-[#c96d35]" />
              </div>

              <div className="mt-5 rounded-full bg-[#f1e4d6] px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#8d6542] inline-flex">
                {doc.category || "Tổng hợp"}
              </div>

              <h2 className="mt-4 line-clamp-2 text-2xl font-black text-[#241c17]">
                {doc.title}
              </h2>

              <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#66584b]">
                {doc.description || "Không có mô tả cho tài liệu này."}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Link
                  href={`/documents/${doc.id}`}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-[#d96d32] px-4 py-4 font-black text-white transition hover:bg-[#c25f29]"
                >
                  <Eye className="h-4 w-4" />
                  Xem
                </Link>
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-2xl border border-[#e2d2bf] bg-[#fffaf3] px-4 py-4 font-black text-[#241c17] transition hover:border-[#c96d35] hover:text-[#c96d35]"
                >
                  <Download className="h-4 w-4" />
                  Tải
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
