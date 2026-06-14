"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Download, FileText } from "lucide-react"
import { Document, Page, pdfjs } from "react-pdf"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"
import { supabase } from "@/lib/supabase"

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString()

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
  const previewRef = useRef<HTMLDivElement | null>(null)
  const [document, setDocument] = useState<DocumentItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [numPages, setNumPages] = useState(0)
  const [pageWidth, setPageWidth] = useState(820)

  useEffect(() => {
    const fetchDocument = async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", params.id)
        .single()

      if (error || !data) {
        router.push("/documents")
        return
      }

      setDocument(data)
      setLoading(false)
    }

    fetchDocument()
  }, [params.id, router])

  useEffect(() => {
    const updateWidth = () => {
      if (!previewRef.current) return
      setPageWidth(Math.max(280, Math.min(previewRef.current.clientWidth - 32, 900)))
    }

    updateWidth()
    window.addEventListener("resize", updateWidth)
    return () => window.removeEventListener("resize", updateWidth)
  }, [])

  const handleDownload = async () => {
    if (!document?.file_url || downloading) return

    try {
      setDownloading(true)

      const response = await fetch(document.file_url)
      if (!response.ok) throw new Error("Download failed")

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const extension = document.file_url.split(".").pop()?.split("?")[0] || "pdf"
      const safeTitle = document.title.replace(/[\\/:*?"<>|]+/g, "-")
      const link = window.document.createElement("a")

      link.href = blobUrl
      link.download = `${safeTitle}.${extension}`
      window.document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.log(error)
      window.open(document.file_url, "_blank", "noopener,noreferrer")
    } finally {
      setDownloading(false)
    }
  }

  if (loading || !document) {
    return (
      <section className="dashboard-shell min-h-[calc(100vh-5rem)]">
        <div className="dashboard-loading">
          <div className="dashboard-spinner" />
          <p className="dashboard-loading-text">Đang tải tài liệu</p>
        </div>
      </section>
    )
  }

  return (
    <section className="dashboard-shell">
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="dashboard-card">
          <button
            onClick={() => router.push("/documents")}
            className="flex items-center gap-2 font-bold text-[#6b5b4d] transition hover:text-[#241c17]"
          >
            <ArrowLeft className="h-5 w-5" />
            Quay lại
          </button>

          <div className="mt-6 inline-flex rounded-full bg-[#f1e4d6] px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-[#8d6542]">
            {document.category || "Tổng hợp"}
          </div>

          <h1 className="mt-6 break-words text-4xl font-black tracking-[-0.04em] text-[#241c17] md:text-5xl">
            {document.title}
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#66584b]">
            {document.description || "Không có mô tả cho tài liệu này."}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex h-14 items-center justify-center gap-3 rounded-2xl bg-[#d96d32] px-7 font-black text-white transition hover:bg-[#c25f29] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Download className="h-5 w-5" />
              {downloading ? "Đang tải..." : "Tải tài liệu"}
            </button>
          </div>
        </div>

        <aside className="dashboard-card bg-[linear-gradient(180deg,#231b18_0%,#352820_100%)] text-[#f8f1e8]">
          <FileText className="h-14 w-14" />
          <h2 className="mt-6 text-3xl font-black">Xem trực tiếp trên web</h2>
          <p className="mt-4 leading-7 text-[#d8c9ba]">
            Preview giờ được render bằng PDF viewer riêng, nên không còn phụ thuộc trình xem PDF của Safari.
          </p>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#e0b88f]">
            Cuộn toàn bộ file ngay trên trang
          </p>
        </aside>
      </div>

      <div ref={previewRef} className="dashboard-card mt-6 overflow-hidden p-4 md:p-6">
        <Document
          file={document.file_url}
          loading={
            <div className="dashboard-loading py-12">
              <div className="dashboard-spinner" />
              <p className="dashboard-loading-text">Đang dựng preview PDF</p>
            </div>
          }
          error={
            <div className="dashboard-empty-state">
              <p className="text-lg font-bold text-[#281f19]">Không thể hiển thị preview.</p>
              <p className="mt-2 text-sm leading-6 text-[#6d5f53]">
                Bạn vẫn có thể dùng nút tải tài liệu ở phía trên.
              </p>
            </div>
          }
          onLoadSuccess={({ numPages: totalPages }) => setNumPages(totalPages)}
        >
          <div className="space-y-6">
            {Array.from({ length: numPages }, (_, index) => (
              <div key={`page_${index + 1}`} className="overflow-hidden rounded-[1.75rem] border border-[#eadccf] bg-white shadow-[0_18px_40px_rgba(84,58,33,0.08)]">
                <Page
                  pageNumber={index + 1}
                  width={pageWidth}
                  renderAnnotationLayer
                  renderTextLayer
                />
              </div>
            ))}
          </div>
        </Document>
      </div>
    </section>
  )
}
