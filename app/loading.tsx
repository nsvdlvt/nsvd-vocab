export default function Loading() {
  return (
    <div className="fixed inset-0 bg-[#f5f9ff] flex items-center justify-center z-[9999]">
      <div className="flex flex-col items-center">
        {/* LOGO */}
            <div className="relative">
            <img
                src="/logo.png"
                alt="logo"
                className="w-20 h-20 rounded-3xl object-cover"
            />

            <div className="absolute inset-0 rounded-3xl border-4 border-transparent border-t-blue-600 animate-spin"></div>
            </div>

        {/* SPINNER */}
        <div className="mt-8 relative">
          <div className="w-14 h-14 rounded-full border-4 border-blue-100"></div>

          <div className="w-14 h-14 rounded-full border-4 border-transparent border-t-blue-600 absolute inset-0 animate-spin"></div>
        </div>

        {/* TEXT */}
        <p className="mt-6 text-gray-500 font-semibold">
          Loading NSVD Vocab...
        </p>
      </div>
    </div>
  )
}