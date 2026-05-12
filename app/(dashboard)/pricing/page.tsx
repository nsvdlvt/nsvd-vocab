"use client"

import Link from "next/link"

import {
    Check,
    Crown,
    Sparkles,
} from "lucide-react"

export default function PricingPage() {

    return (

        <section className="min-h-screen bg-[#f5f9ff] px-6 py-16 overflow-hidden">

            {/* BACKGROUND */}
            <div className="absolute inset-0 pointer-events-none">

                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-200/30 rounded-full blur-3xl" />

                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-200/30 rounded-full blur-3xl" />

            </div>

            <div className="relative max-w-7xl mx-auto">

                {/* HEADER */}
                <div className="text-center">

                    <div className="inline-flex items-center gap-2 bg-white border border-gray-100 rounded-full px-5 py-2 shadow-sm">

                        <Sparkles className="w-4 h-4 text-blue-600" />

                        <span className="font-semibold text-sm">
                            NSVD Vocabulary Premium
                        </span>

                    </div>

                    <h1 className="text-5xl md:text-7xl font-black mt-8 leading-tight">

                        Học từ vựng
                        <br />

                        <span className="bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">

                            nhanh hơn, hiệu quả hơn

                        </span>

                    </h1>

                    <p className="text-gray-500 text-xl mt-8 max-w-2xl mx-auto leading-relaxed">

                        Unlock toàn bộ tính năng học thông minh,
                        đồng bộ đa thiết bị và AI learning system.

                    </p>

                </div>

                {/* PRICING */}
                <div className="grid lg:grid-cols-3 gap-8 mt-20">

                    {/* FREE */}
                    <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-[40px] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">

                        <p className="text-gray-400 font-bold">
                            FREE
                        </p>

                        <h2 className="text-5xl font-black mt-5">
                            0đ
                        </h2>

                        <p className="text-gray-500 mt-3">
                            Dành cho học cơ bản
                        </p>

                        <div className="space-y-5 mt-10">

                            {[
                                "Flashcard",
                                "Quiz học",
                                "Tạo bộ từ",
                                "Text to speech",
                            ].map((item) => (

                                <div
                                    key={item}
                                    className="flex items-center gap-4"
                                >

                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">

                                        <Check className="w-4 h-4 text-green-600" />

                                    </div>

                                    <span className="font-medium">
                                        {item}
                                    </span>

                                </div>

                            ))}

                        </div>

                        <button className="mt-12 w-full h-14 rounded-2xl bg-gray-100 hover:bg-gray-200 transition font-bold">

                            Đang sử dụng

                        </button>

                    </div>

                    {/* PREMIUM */}
                    <div className="relative bg-gradient-to-b from-blue-600 to-purple-600 text-white rounded-[40px] p-10 shadow-[0_30px_80px_rgba(59,130,246,0.35)] scale-[1.03]">

                        {/* BADGE */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">

                            <div className="bg-white text-blue-600 font-black px-5 py-2 rounded-full shadow-lg">

                                MOST POPULAR 🔥

                            </div>

                        </div>

                        <div className="flex items-center gap-3">

                            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">

                                <Crown className="w-6 h-6" />

                            </div>

                            <div>

                                <p className="font-bold">
                                    PREMIUM
                                </p>

                                <p className="text-blue-100 text-sm">
                                    Học mạnh hơn
                                </p>

                            </div>

                        </div>

                        <h2 className="text-6xl font-black mt-8">

                            49k

                            <span className="text-2xl font-bold text-blue-100">

                                /tháng

                            </span>

                        </h2>

                        <div className="space-y-5 mt-10">

                            {[
                                "Spaced repetition",
                                "AI learning system",
                                "Cloud sync",
                                "Unlimited sets",
                                "Advanced analytics",
                                "Priority updates",
                            ].map((item) => (

                                <div
                                    key={item}
                                    className="flex items-center gap-4"
                                >

                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">

                                        <Check className="w-4 h-4" />

                                    </div>

                                    <span className="font-medium">
                                        {item}
                                    </span>

                                </div>

                            ))}

                        </div>

                        <Link
                            href="/upgrade"
                            className="mt-12 w-full h-14 rounded-2xl bg-white text-blue-600 hover:bg-blue-50 transition font-black flex items-center justify-center"
                        >

                            Nâng cấp ngay 😎🔥

                        </Link>

                    </div>

                    {/* TEAM */}
                    <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-[40px] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">

                        <p className="text-gray-400 font-bold">
                            TEAM
                        </p>

                        <h2 className="text-5xl font-black mt-5">
                            199k
                        </h2>

                        <p className="text-gray-500 mt-3">
                            Cho nhóm học tập
                        </p>

                        <div className="space-y-5 mt-10">

                            {[
                                "Mọi tính năng Premium",
                                "Shared folders",
                                "Team analytics",
                                "Classroom mode",
                                "Collaborative sets",
                                "Admin controls",
                            ].map((item) => (

                                <div
                                    key={item}
                                    className="flex items-center gap-4"
                                >

                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">

                                        <Check className="w-4 h-4 text-green-600" />

                                    </div>

                                    <span className="font-medium">
                                        {item}
                                    </span>

                                </div>

                            ))}

                        </div>

                        <button className="mt-12 w-full h-14 rounded-2xl bg-gray-100 hover:bg-gray-200 transition font-bold">

                            Liên hệ

                        </button>

                    </div>

                </div>

            </div>

        </section>
    )
}