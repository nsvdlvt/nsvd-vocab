"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Languages } from "lucide-react"

export default function GrammarPage({
  params,
}: {
  params: Promise<{
    id: string
  }>
}) {
  const { id } = use(params)
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[#f7efe4] px-4 py-8 md:px-8">
      <button
        onClick={() => router.push(`/vocabsets/${id}`)}
        className="inline-flex items-center gap-2 rounded-2xl border border-[#e4d4c2] bg-white px-4 py-3 font-semibold text-[#2c221b] shadow-sm transition hover:bg-[#fffaf3]"
      >
        <ArrowLeft className="h-5 w-5" />
        Quay lại bộ từ
      </button>

      <section className="mx-auto mt-8 max-w-4xl rounded-[2.5rem] border border-[#eadccf] bg-white p-8 shadow-[0_24px_60px_rgba(79,56,31,0.08)] md:p-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#e8fbf8] text-[#0f8b7b]">
          <Languages className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-4xl font-black tracking-[-0.04em] text-[#211914] md:text-5xl">
          Ngữ pháp
        </h1>
      </section>
    </main>
  )
}
