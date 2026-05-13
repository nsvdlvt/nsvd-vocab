type LoadingScreenProps = {
    title?: string
    subtitle?: string
}

export default function LoadingScreen({
    title = "Đang tải",
    subtitle = "Vui lòng chờ một chút..."
}: LoadingScreenProps) {

    return (

        <div className="
min-h-screen
bg-[#f5f9ff]

flex
items-center
justify-center

overflow-hidden
relative
">

            {/* BG GLOW */}
            <div className="
absolute

w-[400px]
h-[400px]

rounded-full

bg-blue-200/30

blur-3xl

animate-pulse
" />

            {/* CONTENT */}
            <div className="
relative z-10

flex
flex-col
items-center
">

                {/* LOGO */}
                <div className="
w-24
h-24

rounded-[28px]

bg-white

shadow-[0_16px_50px_rgba(59,130,246,0.18)]

flex
items-center
justify-center

animate-[float_3s_ease-in-out_infinite]
">

                    <img
                        src="/logo.png"
                        alt="Logo"
                        className="
w-12
h-12

object-contain

drop-shadow-[0_0_18px_rgba(59,130,246,0.25)]
"
                    />

                </div>

                {/* TEXT */}
                <div className="mt-8 text-center">

                    <h2 className="
text-2xl
font-black
tracking-tight
text-gray-800
">

                        {title}

                    </h2>

                    <p className="
mt-2
text-gray-400
font-medium
">

                        {subtitle}

                    </p>

                </div>

                {/* DOTS */}
                <div className="flex gap-2 mt-6">

                    <div className="
w-3 h-3 rounded-full
bg-blue-500
animate-bounce
" />

                    <div className="
w-3 h-3 rounded-full
bg-cyan-400
animate-bounce
[animation-delay:0.15s]
" />

                    <div className="
w-3 h-3 rounded-full
bg-blue-300
animate-bounce
[animation-delay:0.3s]
" />

                </div>

            </div>

        </div>
    )
}