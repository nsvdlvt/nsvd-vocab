"use client"

import Link from "next/link"
import { Check, Crown, Sparkles } from "lucide-react"

export default function PricingPage() {
  return (
    <section className="dashboard-shell">
      <div className="text-center">
        <div className="dashboard-pill">
          <Sparkles className="h-4 w-4" />
          Nâng cấp trong cùng một giao diện
        </div>

        <h1 className="mt-6 text-5xl font-black tracking-[-0.04em] text-[#211914] md:text-7xl">
          Chọn gói phù hợp
          <span className="block text-[#c96d35]">rồi nâng cấp ngay.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#66584b]">
          Trang pricing giờ dùng cùng tone với dashboard để trải nghiệm liền mạch hơn.
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <div className="dashboard-card">
          <p className="dashboard-card-label">Gói Free</p>
          <h2 className="mt-4 text-5xl font-black text-[#241c17]">0đ</h2>
          <p className="mt-2 text-[#66584b]">Dành cho học cơ bản và làm quen với hệ thống.</p>

          <div className="mt-8 space-y-4">
            {["Flashcard", "Quiz học", "Tạo bộ từ", "Text to speech"].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <Check className="h-5 w-5 text-[#2f7a55]" />
                <span className="font-medium text-[#3f342c]">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card bg-[linear-gradient(180deg,#231b18_0%,#352820_100%)] text-[#f8f1e8]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#e4bea0]">Premium</p>
              <p className="text-sm text-[#d3c1b2]">Mở toàn bộ tính năng học sâu hơn</p>
            </div>
          </div>

          <h2 className="mt-8 text-6xl font-black">
            49k
            <span className="text-2xl font-bold text-[#d8c8ba]">/tháng</span>
          </h2>

          <div className="mt-8 space-y-4">
            {[
              "Spaced repetition",
              "AI learning system",
              "Cloud sync",
              "Unlimited sets",
              "Advanced analytics",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <Check className="h-5 w-5 text-[#f1c86f]" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>

          <Link
            href="/upgrade"
            className="mt-10 flex h-14 w-full items-center justify-center rounded-2xl bg-[#f5c86f] font-black text-[#241c17] transition hover:bg-[#efbb55]"
          >
            Nâng cấp ngay
          </Link>
        </div>
      </div>
    </section>
  )
}
