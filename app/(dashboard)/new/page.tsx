"use client"

import { useState } from "react"

type WordType = {
  word: string
  meaning: string
  ipa: string
  type: string
  example: string
  synonyms: string
}

export default function NewPage() {
  const [title, setTitle] = useState("")
  const [saving, setSaving] = useState(false)

  const [activeTab, setActiveTab] = useState<
    "chat" | "image"
  >("chat")

  const [aiText, setAiText] = useState("")

  const [imagePreview, setImagePreview] =
    useState<string | null>(null)

  const [words, setWords] = useState<WordType[]>([
    {
      word: "",
      meaning: "",
      ipa: "",
      type: "",
      example: "",
      synonyms: "",
    },
  ])

  const updateWord = (
    index: number,
    field: keyof WordType,
    value: string
  ) => {
    const updated = [...words]

    updated[index][field] = value

    setWords(updated)
  }

  const addRow = () => {
    setWords([
      ...words,
      {
        word: "",
        meaning: "",
        ipa: "",
        type: "",
        example: "",
        synonyms: "",
      },
    ])
  }

  const removeRow = (index: number) => {
    const updated = words.filter(
      (_, i) => i !== index
    )

    setWords(updated)
  }

  // FAKE AI IMPORT
  const handleAIImport = async () => {
    setSaving(true)

    await new Promise((resolve) =>
      setTimeout(resolve, 1500)
    )

    setWords([
      {
        word: "dissemination",
        meaning: "sự lan truyền",
        ipa: "/dɪˌsemɪˈneɪʃən/",
        type: "noun",
        example:
          "The dissemination of fake news spreads rapidly.",
        synonyms: "spread, distribution",
      },
      {
        word: "archaic",
        meaning: "cổ xưa",
        ipa: "/ɑːˈkeɪɪk/",
        type: "adjective",
        example:
          "The book contains many archaic words.",
        synonyms: "ancient, outdated",
      },
    ])

    setSaving(false)

    alert("AI đã import từ 😎")
  }

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]

    if (!file) return

    const imageUrl = URL.createObjectURL(file)

    setImagePreview(imageUrl)
  }

  const saveSet = async () => {
    if (!title) {
      alert("Nhập tên bộ từ 😭")
      return
    }

    setSaving(true)

    await new Promise((resolve) =>
      setTimeout(resolve, 1000)
    )

    console.log({
      title,
      words,
    })

    alert("Đã tạo bộ từ 😎")

    setTitle("")

    setWords([
      {
        word: "",
        meaning: "",
        ipa: "",
        type: "",
        example: "",
        synonyms: "",
      },
    ])

    setSaving(false)
  }

  return (
    <section className="p-5 md:p-8 pb-28 lg:pb-8">
      {/* TOP */}
      <div className="mb-10">
        <p className="text-gray-500">
          Tạo bộ từ mới
        </p>

        <h1 className="text-5xl font-black mt-2">
          Thêm từ vựng
        </h1>
      </div>

      {/* TITLE */}
      <div className="bg-white rounded-[40px] p-6 md:p-8 shadow-sm border border-gray-100 mb-6">
        <p className="font-bold mb-4">
          Tên bộ từ
        </p>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ví dụ: IELTS Vocabulary"
          className="w-full bg-[#f5f9ff] rounded-2xl p-5 outline-none border border-transparent focus:border-blue-500"
        />
      </div>

      {/* AI IMPORT */}
      <div className="bg-gradient-to-br from-blue-600 to-cyan-400 rounded-[40px] p-6 md:p-8 shadow-xl shadow-blue-200 text-white mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">
            ✨
          </span>

          <h2 className="text-3xl font-black">
            Thêm từ nhanh với AI
          </h2>
        </div>

        <p className="text-blue-100 mb-6 text-lg">
          AI sẽ tự phân tích và điền:
          nghĩa, IPA, từ loại, ví dụ và từ đồng nghĩa.
        </p>

        {/* TABS */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <button
            onClick={() => setActiveTab("chat")}
            className={`font-black px-5 py-3 rounded-2xl transition ${
              activeTab === "chat"
                ? "bg-white text-blue-700"
                : "bg-white/20 hover:bg-white/30"
            }`}
          >
            💬 AI Chat
          </button>

          <button
            onClick={() => setActiveTab("image")}
            className={`font-black px-5 py-3 rounded-2xl transition ${
              activeTab === "image"
                ? "bg-white text-blue-700"
                : "bg-white/20 hover:bg-white/30"
            }`}
          >
            📸 Chụp ảnh
          </button>
        </div>

        {/* CHAT */}
        {activeTab === "chat" && (
          <div className="bg-white rounded-[32px] p-5">
            <textarea
              value={aiText}
              onChange={(e) =>
                setAiText(e.target.value)
              }
              placeholder="Paste đoạn vocab hoặc text vào đây..."
              className="w-full min-h-[160px] bg-[#f5f9ff] rounded-2xl p-5 outline-none text-black resize-none"
            />

            <button
              onClick={handleAIImport}
              disabled={saving}
              className="mt-5 bg-blue-600 hover:bg-blue-700 transition text-white px-6 py-4 rounded-2xl font-black"
            >
              {saving
                ? "AI đang phân tích..."
                : "✨ Import bằng AI"}
            </button>
          </div>
        )}

        {/* IMAGE */}
        {activeTab === "image" && (
          <div className="bg-white rounded-[32px] p-5">
            <label className="w-full min-h-[260px] border-2 border-dashed border-blue-300 rounded-[32px] flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition overflow-hidden">
              {!imagePreview ? (
                <>
                  <div className="text-6xl mb-5">
                    📸
                  </div>

                  <h3 className="text-2xl font-black text-black">
                    Upload ảnh
                  </h3>

                  <p className="text-gray-500 mt-2">
                    PNG, JPG, hoặc chụp ảnh
                  </p>
                </>
              ) : (
                <img
                  src={imagePreview}
                  alt="preview"
                  className="w-full h-[320px] object-cover rounded-[24px]"
                />
              )}

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>

            <button
              onClick={handleAIImport}
              disabled={
                !imagePreview || saving
              }
              className="mt-5 bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50 text-white px-6 py-4 rounded-2xl font-black"
            >
              {saving
                ? "AI đang quét ảnh..."
                : "✨ Phân tích ảnh bằng AI"}
            </button>
          </div>
        )}
      </div>

      {/* WORDS */}
      <div className="space-y-6">
        {words.map((word, index) => (
          <div
            key={index}
            className="bg-white rounded-[40px] p-6 md:p-8 shadow-sm border border-gray-100"
          >
            {/* TOP */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black">
                Từ {index + 1}
              </h2>

              {words.length > 1 && (
                <button
                  onClick={() =>
                    removeRow(index)
                  }
                  className="text-red-500 font-bold"
                >
                  Xóa
                </button>
              )}
            </div>

            {/* GRID */}
            <div className="grid md:grid-cols-2 gap-5">
              <input
                value={word.word}
                onChange={(e) =>
                  updateWord(
                    index,
                    "word",
                    e.target.value
                  )
                }
                placeholder="Word"
                className="bg-[#f5f9ff] rounded-2xl p-5 outline-none"
              />

              <input
                value={word.meaning}
                onChange={(e) =>
                  updateWord(
                    index,
                    "meaning",
                    e.target.value
                  )
                }
                placeholder="Meaning"
                className="bg-[#f5f9ff] rounded-2xl p-5 outline-none"
              />

              <input
                value={word.ipa}
                onChange={(e) =>
                  updateWord(
                    index,
                    "ipa",
                    e.target.value
                  )
                }
                placeholder="IPA"
                className="bg-[#f5f9ff] rounded-2xl p-5 outline-none"
              />

              <input
                value={word.type}
                onChange={(e) =>
                  updateWord(
                    index,
                    "type",
                    e.target.value
                  )
                }
                placeholder="Word Type"
                className="bg-[#f5f9ff] rounded-2xl p-5 outline-none"
              />

              <textarea
                value={word.example}
                onChange={(e) =>
                  updateWord(
                    index,
                    "example",
                    e.target.value
                  )
                }
                placeholder="Example"
                className="bg-[#f5f9ff] rounded-2xl p-5 outline-none md:col-span-2 min-h-[120px]"
              />

              <input
                value={word.synonyms}
                onChange={(e) =>
                  updateWord(
                    index,
                    "synonyms",
                    e.target.value
                  )
                }
                placeholder="Synonyms"
                className="bg-[#f5f9ff] rounded-2xl p-5 outline-none md:col-span-2"
              />
            </div>
          </div>
        ))}
      </div>

      {/* ACTIONS */}
      <div className="flex flex-wrap gap-4 mt-8">
        <button
          onClick={addRow}
          className="bg-white border border-gray-200 hover:bg-gray-100 transition px-6 py-4 rounded-2xl font-bold"
        >
          + Thêm từ
        </button>

        <button
          onClick={saveSet}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 transition text-white px-8 py-4 rounded-2xl font-black"
        >
          {saving
            ? "Đang lưu..."
            : "Lưu bộ từ"}
        </button>
      </div>
    </section>
  )
}