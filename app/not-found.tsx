"use client"

import Link from "next/link"
import { Home, Search } from "lucide-react"

export default function NotFound() {

    return (

        <section className="min-h-screen bg-[#f5f9ff] flex items-center justify-center p-6 overflow-hidden">

            {/* BACKGROUND */}
            <div className="absolute inset-0 pointer-events-none">

                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl" />

                <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl" />

            </div>

            {/* CARD */}
            <div className="relative bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_20px_80px_rgba(0,0,0,0.08)] rounded-[40px] max-w-2xl w-full p-10 md:p-16 text-center">

                {/* 404 */}
                <div className="relative inline-block">

                    <h1 className="text-[110px] md:text-[160px] font-black leading-none tracking-tight bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">

                        404

                    </h1>

                    <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-yellow-300 animate-bounce" />

                </div>

                {/* TEXT */}
                <h2 className="text-3xl md:text-5xl font-black mt-6">

                    Trang không tồn tại

                </h2>

                <p className="text-gray-500 text-lg mt-5 leading-relaxed max-w-xl mx-auto">

                    Đừng lo, còn rất nhiều điều thú vị khác đang chờ bạn khám phá trên NSVD Vocabulary!

                </p>

                {/* BUTTONS */}
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">

                    <Link
                        href="/"
                        className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 transition text-white font-bold flex items-center justify-center gap-3 shadow-lg shadow-blue-200"
                    >

                        <Home className="w-5 h-5" />

                        Trang chủ

                    </Link>

                    <Link
                        href="/"
                        className="h-14 px-8 rounded-2xl bg-gray-100 hover:bg-gray-200 transition font-bold flex items-center justify-center gap-3"
                    >

                        <Search className="w-5 h-5" />

                        Khám phá 

                    </Link>

                </div>

                {/* SMALL TEXT */}
                <p className="text-gray-400 text-sm mt-10">

                    NSVD Vocabulary • By Nguyen Dung

                </p>

            </div>

        </section>
    )
}