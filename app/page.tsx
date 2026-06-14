"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  BookOpen,
  Brain,
  ChartColumn,
  Check,
  Layers3,
  Sparkles,
  Target,
} from "lucide-react"
import { supabase } from "@/lib/supabase"

const features = [
  {
    title: "Học có nhịp độ rõ ràng",
    description:
      "Từ việc thêm từ mới đến lịch ôn tập, mọi bước đều được sắp xếp để bạn không học theo cảm hứng.",
    icon: Target,
  },
  {
    title: "Flashcard, quiz và nhiều chế độ học",
    description:
      "Chuyển đổi linh hoạt giữa nhiều chế độ học trong cùng một bộ từ để ghi nhớ sâu hơn và bớt nhàm chán.",
    icon: Layers3,
  },
  {
    title: "Theo dõi tiến độ mỗi ngày",
    description:
      "Nhìn thấy số từ đã nhớ, chuỗi học và mức độ thành thạo để biết hôm nay nên làm gì tiếp theo.",
    icon: ChartColumn,
  },
]

const steps = [
  "Tạo bộ từ vựng theo bài học, chủ đề hoặc kỳ thi.",
  "Học nhanh bằng flashcard, sau đó chuyển sang quiz và luyện viết lại.",
  "Hệ thống nhắc ôn đúng lúc để bạn nhớ lâu hơn mà không bị quá tải.",
]

const stats = [
  { value: "06", label: "chế độ học trong một lộ trình" },
  { value: "SRS", label: "nhắc lịch ôn tập thông minh" },
  { value: "AI", label: "hỗ trợ học, quiz và theo dõi tiến độ" },
]

export default function LandingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        router.push("/home")
        return
      }

      setLoading(false)
    }

    checkSession()
  }, [router])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#fff8e8_0%,#f7f1e8_38%,#efe7da_100%)]">
        <div className="flex flex-col items-center gap-5">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-[#d7c8b6]" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#c46a2f] animate-spin" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7f6c59]">
            Đang tải lộ trình học tập
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6efe4] text-[#1f1a17]">
      <div className="absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(circle_at_top_left,#fff7cc_0%,rgba(255,247,204,0.65)_22%,rgba(246,239,228,0)_58%)]" />
      <div className="absolute right-[-6rem] top-24 -z-10 h-72 w-72 rounded-full bg-[#d96d32]/15 blur-3xl" />
      <div className="absolute left-[-4rem] top-[30rem] -z-10 h-72 w-72 rounded-full bg-[#f3c969]/20 blur-3xl" />

      <header className="sticky top-0 z-30 border-b border-[#3f3227]/8 bg-[#f6efe4]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1f1a17] text-[10px] font-black text-[#f8f3ec] shadow-[0_12px_30px_rgba(31,26,23,0.16)]">
              NSVD
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#a17348]">
                NSVD Vocab
              </p>
              <p className="text-sm text-[#5f5144]">Học từ vựng có hệ thống</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-[#5d4a3a] md:flex">
            <a href="#features" className="transition hover:text-[#c46a2f]">
              Tính năng
            </a>
            <a href="#process" className="transition hover:text-[#c46a2f]">
              Cách học
            </a>
            <a href="#preview" className="transition hover:text-[#c46a2f]">
              Giao diện
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-semibold text-[#4f4033] transition hover:text-[#c46a2f] md:inline-flex"
            >
              Đăng nhập
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-[#1f1a17] px-5 py-3 text-sm font-bold text-[#fff7ef] transition hover:bg-[#31271f]"
            >
              Bắt đầu miễn phí
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="px-5 pb-20 pt-10 md:px-8 md:pt-14">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_1fr] xl:grid-cols-[0.96fr_1.04fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d8c4ad] bg-[#fff9f2] px-4 py-2 text-sm font-semibold text-[#94623a] shadow-sm">
              <Sparkles className="h-4 w-4" />
              Từ vựng, SRS, AI và nhiều hơn nữa trong một ứng dụng duy nhất
            </div>

            <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.04em] md:text-7xl">
              Học ít lần hơn,
              <span className="block text-[#c46a2f]">nhớ lâu hơn.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5d5148] md:text-xl">
              NSVD Vocab biến việc học từ vựng thành một lộ trình rõ ràng: tạo bộ từ thông minh,
              học bằng nhiều chế độ, được nhắc ôn đúng lúc và nhìn thấy tiến độ mỗi ngày.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d96d32] px-7 py-4 text-base font-bold text-white shadow-[0_18px_40px_rgba(217,109,50,0.28)] transition hover:bg-[#c25f29]"
              >
                Vào học ngay
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#preview"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d5c2ae] bg-[#fffaf4] px-7 py-4 text-base font-bold text-[#3d3026] transition hover:border-[#c46a2f] hover:text-[#c46a2f]"
              >
                Xem giao diện
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {["Flashcard", "Quiz", "Write mode", "SRS reminders"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[#dcc8b4] bg-[#fff8f0] px-4 py-2 text-sm font-semibold text-[#6f5d4d]"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[2rem] border border-[#e2d2bf] bg-[#fffaf3] p-5 shadow-[0_16px_30px_rgba(115,84,53,0.06)]"
                >
                  <p className="text-3xl font-black text-[#1f1a17]">{stat.value}</p>
                  <p className="mt-2 text-sm leading-6 text-[#6a5a4c]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div id="preview" className="relative lg:px-8 lg:py-6">
            <div className="absolute left-0 top-20 z-20 hidden rounded-[1.75rem] border border-[#ead9c5] bg-[#fff8ef] px-4 py-3 shadow-xl lg:block">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#9b6c47]">
                Hôm nay
              </p>
              <p className="mt-2 text-3xl font-black">32 từ cần ôn tập</p>
            </div>

            <div className="relative rounded-[2.5rem] border border-[#ead7c2] bg-[#fffaf4] p-4 shadow-[0_28px_80px_rgba(65,44,25,0.14)] md:p-6 xl:p-7">
              <div className="absolute inset-x-8 top-0 h-24 rounded-b-[2rem] bg-[linear-gradient(180deg,rgba(255,236,210,0.8),rgba(255,236,210,0))]" />

              <div className="rounded-[2rem] bg-[#231b18] p-5 text-[#f8f1e8]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-[#d8b89a]">
                      Study session
                    </p>
                    <h2 className="mt-2 text-2xl font-black">Roadmap từ vựng IELTS</h2>
                  </div>
                  <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
                    Streak 17
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[1.75rem] bg-[#fff8ef] p-6 text-[#221a16]">
                    <p className="text-sm font-semibold text-[#95663e]">Flashcard hiện tại</p>
                    <p className="mt-4 text-4xl font-black tracking-[-0.04em]">meticulous</p>
                    <p className="mt-3 text-lg text-[#5e5146]">cẩn thận, tỉ mỉ trong từng chi tiết</p>

                    <div className="mt-6 grid grid-cols-3 gap-3">
                      {["AI hint", "Quiz", "Speak"].map((action) => (
                        <div
                          key={action}
                          className="rounded-2xl bg-[#f4eadf] px-3 py-4 text-center text-sm font-bold text-[#4d3c31]"
                        >
                          {action}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[1.75rem] bg-[#3b2d25] p-5">
                      <p className="text-sm text-[#dcbca1]">Độ chính xác tuần này</p>
                      <p className="mt-3 text-4xl font-black">92%</p>
                      <div className="mt-4 h-3 rounded-full bg-white/10">
                        <div className="h-3 w-[92%] rounded-full bg-[#f6c15b]" />
                      </div>
                    </div>

                    <div className="rounded-[1.75rem] bg-[#2d221d] p-5">
                      <p className="text-sm text-[#dcbca1]">Tiến độ hôm nay</p>
                      <div className="mt-4 space-y-3">
                        {[
                          ["Học mới", "18/20"],
                          ["Ôn tập", "32/40"],
                          ["Quiz", "14/14"],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="flex items-center justify-between rounded-2xl bg-white/6 px-4 py-3 text-sm"
                          >
                            <span className="text-[#f8efe5]">{label}</span>
                            <span className="font-bold text-[#f4c66d]">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {[
                  ["Tập trung", "Bộ nhắc nhở theo mức độ quên của bạn."],
                  ["Linh hoạt", "Chuyển chế độ học mà không mất mạch ôn tập."],
                  ["Dễ theo dõi", "Biết ngay phần nào đang yếu để học tiếp."],
                ].map(([title, desc]) => (
                  <div
                    key={title}
                    className="rounded-[1.75rem] border border-[#ebdac7] bg-[#fffdf9] p-5"
                  >
                    <p className="text-lg font-black">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#67584b]">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute bottom-0 right-4 z-20 hidden translate-y-1/2 rounded-[1.75rem] border border-[#ead9c5] bg-[#fff9f2] px-5 py-4 shadow-xl md:block">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#9b6c47]">
                Nhớ đều hơn
              </p>
              <p className="mt-2 flex items-center gap-2 text-lg font-black">
                <Brain className="h-5 w-5 text-[#d96d32]" />
                Ôn đúng lúc, không học dồn dập
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#a17348]">
            Tính năng nổi bật
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] md:text-5xl">
            Không chỉ đẹp mắt, mà còn giúp bạn học tốt hơn mỗi ngày.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {features.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="rounded-[2rem] border border-[#e4d4c1] bg-[#fffaf4] p-7 shadow-[0_18px_40px_rgba(84,58,33,0.07)]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1f1a17] text-[#f8f1e8]">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-2xl font-black">{title}</h3>
              <p className="mt-4 text-base leading-7 text-[#66584c]">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="process"
        className="border-y border-[#e4d6c7] bg-[#f3eadf]/85 px-5 py-20 md:px-8"
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#a17348]">
              Cách học
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] md:text-5xl">
              Một quy trình đơn giản, để bạn duy trì lâu dài.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#63564a]">
              Trang chủ được viết lại để người mới vào là hiểu ngay sản phẩm này giúp học từ vựng như thế nào.
            </p>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step}
                className="flex gap-4 rounded-[2rem] border border-[#e2d3c0] bg-[#fffaf3] p-5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d96d32] text-lg font-black text-white">
                  {index + 1}
                </div>
                <div>
                  <p className="text-lg font-bold text-[#241d19]">{step}</p>
                  <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#86654a]">
                    <Check className="h-4 w-4" />
                    Tập trung vào trí nhớ dài hạn thay vì học thật nhanh rồi quên.
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="rounded-[2.5rem] bg-[#1f1a17] px-6 py-10 text-[#f8f1e8] shadow-[0_30px_80px_rgba(31,26,23,0.22)] md:px-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#e0b88f]">
                Sẵn sàng vào học?
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] md:text-5xl">
                Tạo một bộ từ vựng và bắt đầu ngay trong vài phút.
              </h2>
              <p className="mt-4 text-lg leading-8 text-[#d8c8ba]">
                Cùng nhau học và thành thạo tất cả các từ vựng và cùng nhau chinh phục Tiếng Anh!
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f5c86f] px-7 py-4 text-base font-black text-[#251d19] transition hover:bg-[#efbb55]"
              >
                Bắt đầu miễn phí
                <BookOpen className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-4 text-base font-bold text-[#f8f1e8] transition hover:bg-white/10"
              >
                Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
