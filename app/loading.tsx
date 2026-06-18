type LoadingScreenProps = {
  title?: string
  subtitle?: string
}

export default function LoadingScreen({
  title = "Đang tải",
  subtitle = "Chuẩn bị nội dung học tập...",
}: LoadingScreenProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#f7efe4_0%,#f5f9ff_100%)] px-6">
      <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f0be64]/15 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d7e8ff]/45 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/80 bg-white/85 shadow-[0_20px_50px_rgba(79,56,31,0.12)] backdrop-blur-xl animate-[float_3s_ease-in-out_infinite]">
          <img
            src="/logo.png"
            alt="NSVD Vocab logo"
            className="h-12 w-12 object-contain drop-shadow-[0_0_18px_rgba(217,109,50,0.18)]"
          />
        </div>

        <div className="mt-8">
          <h2 className="text-3xl font-black tracking-[-0.03em] text-[#211914]">
            {title}
          </h2>
          <p className="mt-3 text-base font-medium text-[#8b7764]">
            {subtitle}
          </p>
        </div>

        <div className="mt-6 flex gap-2">
          <div className="h-3 w-3 animate-bounce rounded-full bg-[#d96d32]" />
          <div className="h-3 w-3 animate-bounce rounded-full bg-[#f0be64] [animation-delay:0.15s]" />
          <div className="h-3 w-3 animate-bounce rounded-full bg-[#9dc1f7] [animation-delay:0.3s]" />
        </div>
      </div>
    </div>
  )
}
