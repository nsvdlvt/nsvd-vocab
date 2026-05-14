"use client"

import Link from "next/link"

import { motion } from "framer-motion"

import { ShieldX } from "lucide-react"

export default function ForbiddenPage() {

    return (

        <main
            className="
min-h-screen

bg-[#f5f9ff]

flex
items-center
justify-center

overflow-hidden

p-5
"
        >

            {/* BACKGROUND BLUR */}
            <div className="
absolute
top-[-120px]
left-[-120px]

w-[320px]
h-[320px]

bg-red-200/40

rounded-full

blur-3xl
" />

            <div className="
absolute
bottom-[-120px]
right-[-120px]

w-[320px]
h-[320px]

bg-blue-200/40

rounded-full

blur-3xl
" />

            <motion.div

                initial={{
                    opacity: 0,
                    y: 40,
                    scale: 0.95
                }}

                animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1
                }}

                transition={{
                    duration: 0.5
                }}

                className="
relative

w-full
max-w-xl

bg-white/90
backdrop-blur-xl

rounded-[40px]

p-10

border border-white

shadow-[0_20px_80px_rgba(0,0,0,0.08)]

text-center
"
            >

                {/* ICON */}
                <motion.div

                    animate={{
                        y: [0, -8, 0]
                    }}

                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}

                    className="
mx-auto

w-28
h-28

rounded-[32px]

bg-gradient-to-br
from-red-100
to-red-200

flex
items-center
justify-center

shadow-lg
shadow-red-100
"
                >

                    <ShieldX className="
w-14
h-14
text-red-500
" />

                </motion.div>

                {/* TITLE */}
                <motion.h1

                    initial={{
                        opacity: 0,
                        y: 10
                    }}

                    animate={{
                        opacity: 1,
                        y: 0
                    }}

                    transition={{
                        delay: 0.15
                    }}

                    className="
text-6xl
font-black

mt-8

bg-gradient-to-r
from-red-500
to-orange-400

bg-clip-text
text-transparent
"
                >

                    403

                </motion.h1>

                <motion.h2

                    initial={{
                        opacity: 0,
                        y: 10
                    }}

                    animate={{
                        opacity: 1,
                        y: 0
                    }}

                    transition={{
                        delay: 0.25
                    }}

                    className="
text-3xl
font-black

mt-3
text-gray-900
"
                >

                    Access Denied

                </motion.h2>

                <motion.p

                    initial={{
                        opacity: 0,
                        y: 10
                    }}

                    animate={{
                        opacity: 1,
                        y: 0
                    }}

                    transition={{
                        delay: 0.35
                    }}

                    className="
text-gray-500

mt-5

text-lg
leading-relaxed
"
                >

                    Bạn không có quyền
                    truy cập trang này.

                </motion.p>

                {/* BUTTON */}
                <motion.div

                    initial={{
                        opacity: 0,
                        y: 10
                    }}

                    animate={{
                        opacity: 1,
                        y: 0
                    }}

                    transition={{
                        delay: 0.45
                    }}

                    className="
flex
justify-center
"
                >

                    <Link
                        href="/"
                        className="
mt-10

h-14
px-8

rounded-2xl

bg-blue-600
hover:bg-blue-700

text-white
font-bold

flex
items-center
justify-center

shadow-lg
shadow-blue-200

hover:scale-[1.03]
active:scale-[0.98]

transition-all
duration-300
"
                    >

                        Về trang chủ

                    </Link>

                </motion.div>

            </motion.div>

        </main>

    )
}