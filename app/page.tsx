"use client"

import Link from "next/link"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f5f9ff] text-[#111827] overflow-hidden">
      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          {/* LOGO */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="lgo"
              className="w-12 h-12 rounded-2xl object-cover"
            />
            <h1 className="font-black text-xl">NSVD Vocab</h1>
          </div>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-10 font-semibold text-gray-500">
            <a
              href="#features"
              className="hover:text-blue-600 border-b-2 border-transparent hover:border-blue-500 pb-1 transition"
            >
              Tính năng
            </a>

            <a
              href="#how"
              className="hover:text-blue-600 border-b-2 border-transparent hover:border-blue-500 pb-1 transition"
            >
              Cách học
            </a>

            <a
              href="#review"
              className="hover:text-blue-600 border-b-2 border-transparent hover:border-blue-500 pb-1 transition"
            >
              Đánh giá
            </a>

            <a
              href="#faq"
              className="hover:text-blue-600 border-b-2 border-transparent hover:border-blue-500 pb-1 transition"
            >
              FAQ
            </a>
          </nav>

          {/* ACTIONS */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden md:block font-semibold text-gray-700 hover:text-blue-600 transition"
            >
              Đăng nhập
            </Link>

            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 transition text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-blue-200 text-sm md:text-base"
            >
              Bắt đầu miễn phí →
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="pt-32 pb-16 px-5 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-14">
          {/* LEFT */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="font-black leading-tight text-5xl md:text-6xl lg:text-7xl">
              Học từ vựng có lộ trình,
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-400 bg-clip-text text-transparent">
                nhớ lâu và quay lại đều hơn
              </span>
            </h1>

            <p className="mt-8 text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Học flashcard, luyện quiz, ôn bằng SRS và theo dõi tiến độ học tập
              trong một nơi duy nhất.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto text-center bg-blue-600 hover:bg-blue-700 transition text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-blue-200"
              >
                Bắt đầu học miễn phí →
              </Link>

              <button className="w-full sm:w-auto bg-white hover:bg-gray-100 transition border border-gray-200 font-bold px-8 py-4 rounded-2xl">
                Xem demo
              </button>
            </div>

            {/* STATS */}
            <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-3xl font-black text-blue-600">100K+</h3>
                <p className="text-gray-500 mt-2">lượt học mỗi tháng</p>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-3xl font-black text-cyan-500">6 mode</h3>
                <p className="text-gray-500 mt-2">flashcard và game học</p>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-3xl font-black text-violet-500">SRS</h3>
                <p className="text-gray-500 mt-2">ôn tập thông minh</p>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex-1 w-full">
            <div className="relative w-full max-w-2xl mx-auto">
              {/* MAIN CARD */}
              <div className="bg-white rounded-[40px] p-5 md:p-8 shadow-2xl border border-gray-100">
                {/* TOP */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#f5f9ff] rounded-3xl p-5">
                    <p className="text-gray-500 text-sm">Hôm nay</p>
                    <h2 className="text-5xl font-black mt-2">77</h2>
                  </div>

                  <div className="bg-orange-400 text-white rounded-3xl p-5">
                    <p className="text-orange-100 text-sm">Chuỗi học</p>
                    <h2 className="text-5xl font-black mt-2">17</h2>
                  </div>
                </div>

                {/* FLASHCARD */}
                <div className="mt-5 bg-gray-50 rounded-3xl p-8 border border-gray-100">
                  <p className="text-gray-400 text-sm">Flashcard</p>

                  <h1 className="text-4xl md:text-5xl font-black mt-4 break-words">
                    dissemination
                  </h1>

                  <p className="text-gray-600 mt-4 text-xl">sự lan truyền</p>
                </div>

                {/* BUTTONS */}
                <div className="grid grid-cols-3 gap-3 mt-5">
                  <button className="bg-[#f5f9ff] hover:bg-blue-100 transition rounded-2xl p-4 font-bold">
                    AI
                  </button>

                  <button className="bg-[#f5f9ff] hover:bg-blue-100 transition rounded-2xl p-4 font-bold">
                    Quiz
                  </button>

                  <button className="bg-[#f5f9ff] hover:bg-blue-100 transition rounded-2xl p-4 font-bold">
                    SRS
                  </button>
                </div>
              </div>

              {/* FLOATING CARDS */}
              <div className="hidden md:flex absolute -top-6 -left-6 bg-white rounded-3xl px-6 py-4 shadow-xl items-center gap-3 border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-green-100" />

                <div>
                  <h3 className="font-black text-xl">100.000+</h3>
                  <p className="text-gray-500 text-sm">người học</p>
                </div>
              </div>

              <div className="hidden md:block absolute -bottom-6 -right-6 bg-white rounded-3xl px-6 py-4 shadow-xl border border-gray-100">
                <h3 className="font-black text-xl">SRS + roadmap</h3>
                <p className="text-gray-500">không học rời rạc</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="max-w-7xl mx-auto px-5 md:px-8 py-20"
      >
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-black">
            Mọi thứ cho việc học từ vựng
          </h2>

          <p className="text-gray-500 mt-5 text-lg">
            Không cần dùng 5 app khác nhau nữa.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            "Flashcard thông minh",
            "SRS nhắc ôn",
            "Quiz luyện tập",
            "AI tạo ví dụ",
            "Theo dõi tiến độ",
            "Roadmap học tập",
          ].map((item) => (
            <div
              key={item}
              className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 hover:-translate-y-1 transition"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#f5f9ff] mb-6" />

              <h3 className="text-2xl font-black">{item}</h3>

              <p className="text-gray-500 mt-4 leading-relaxed">
                Tối ưu cho việc học dài hạn và ghi nhớ hiệu quả.
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}