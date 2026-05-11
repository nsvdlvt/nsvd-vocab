"use client"

import { useState } from "react"

export default function StudyPage() {
  const [flipped, setFlipped] = useState(false)

  return (
    <main className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
      <div className="bg-zinc-800 p-10 rounded-3xl shadow-2xl w-[500px] text-center">
        <p className="text-zinc-400 mb-3">NSVD VOCAB</p>

        <h1 className="text-5xl font-bold mb-6">
          {flipped ? "sự lan truyền" : "dissemination"}
        </h1>

        <p className="text-2xl text-zinc-300">
          {flipped
            ? "The dissemination of information is important."
            : "Click flip to see meaning"}
        </p>

        <button
          onClick={() => setFlipped(!flipped)}
          className="mt-8 bg-blue-500 hover:bg-blue-600 transition px-6 py-3 rounded-2xl text-lg font-semibold"
        >
          Flip Card
        </button>
      </div>
    </main>
  )
}