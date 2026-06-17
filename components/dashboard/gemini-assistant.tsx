"use client"

import { Brain, LoaderCircle, Sparkles } from "lucide-react"
import { FormEvent, useState } from "react"

export function GeminiAssistant() {
  const [prompt, setPrompt] = useState("")
  const [answer, setAnswer] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt || loading) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: trimmedPrompt }),
      })

      const data = (await response.json()) as {
        text?: string
        error?: string
      }

      if (!response.ok) {
        throw new Error(data.error || "Không thể nhận phản hồi từ OpenAI.")
      }

      setAnswer(data.text || "")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi khi gọi OpenAI."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <article className="dashboard-card bg-[linear-gradient(180deg,#fff8f1_0%,#f8ecdf_100%)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="dashboard-card-label">AI OpenAI</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#241c17]">
            Hỏi nhanh trợ lý học tập
          </h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#231b18] text-[#f8f1e8]">
          <Brain className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-[#66584b]">
        Dùng OpenAI để xin giải nghĩa từ, ví dụ câu, mẹo ghi nhớ hoặc gợi ý cách học.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Ví dụ: Giải thích từ meticulous và cho mình 3 câu ví dụ dễ nhớ."
          className="min-h-32 w-full rounded-[1.75rem] border border-[#dbc7b4] bg-[#fffaf5] px-5 py-4 text-sm text-[#241c17] outline-none transition placeholder:text-[#9a8673] focus:border-[#d96d32]"
        />

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#d96d32] px-6 text-sm font-bold text-white transition hover:bg-[#c45f29] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "OpenAI đang trả lời..." : "Hỏi OpenAI"}
        </button>
      </form>

      {error ? (
        <div className="mt-4 rounded-[1.5rem] border border-[#efc1b2] bg-[#fff1ed] px-4 py-3 text-sm text-[#9a3f24]">
          {error}
        </div>
      ) : null}

      {answer ? (
        <div className="mt-5 whitespace-pre-wrap rounded-[1.75rem] bg-[#231b18] px-5 py-4 text-sm leading-7 text-[#f7efe5]">
          {answer}
        </div>
      ) : null}
    </article>
  )
}
