"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

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
const [showImport, setShowImport] =
  useState(false)
  const [aiText, setAiText] = useState("")
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
  const hasWords = words.some(
  (w) =>
    w.word ||
    w.meaning ||
    w.ipa ||
    w.type ||
    w.example ||
    w.synonyms
)
  const [popup, setPopup] = useState<{
    
  show: boolean
  type: "success" | "error"
  message: string
}>({
  show: false,
  type: "success",
  message: "",
})
const [invalidIndexes, setInvalidIndexes] =
  useState<number[]>([])
const [closing, setClosing] =
  useState(false)

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

    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      })
    }, 100)
  }

  const removeRow = (index: number) => {
    const updated = words.filter(
      (_, i) => i !== index
    )

    setWords(updated)
  }
const saveSet = async () => {
  if (!title) {
    setPopup({
      show: true,
      type: "error",
      message: "Nhập tên bộ từ 😭",
    })

    return
  }

  setSaving(true)

  try {
    // lấy session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const user = session?.user

    // lọc từ hợp lệ
    // check row lỗi
// tìm các row lỗi
const invalids = words
  .map((w, index) => ({
    ...w,
    index,
  }))
  .filter(
    (w) =>
      (w.word && !w.meaning) ||
      (!w.word && w.meaning)
  )

if (invalids.length > 0) {
  setInvalidIndexes(
    invalids.map((w) => w.index)
  )

  setPopup({
    show: true,
    type: "error",
    message:
      "Có từ đang thiếu Word hoặc Meaning 😭",
  })

  setSaving(false)

  return
}

// clear lỗi
setInvalidIndexes([])
// lọc từ hợp lệ
const validWords = words.filter(
  (w) => w.word && w.meaning
)

if (validWords.length === 0) {
  setPopup({
    show: true,
    type: "error",
    message: "Chưa có từ nào 😭",
  })

  setSaving(false)

  return
}

    // tạo vocab set
    const {
      data: setData,
      error: setError,
    } = await supabase
      .from("vocab_sets")
      .insert({
        title,
        user_id: user?.id,
      })
      .select()
      .single()

    if (setError) {
      console.log(setError)

      setPopup({
        show: true,
        type: "error",
        message: "Lỗi tạo bộ từ 😭",
      })

      setSaving(false)

      return
    }

    // insert words
    const { error: wordsError } =
      await supabase
        .from("vocab_words")
        .insert(
          validWords.map((word) => ({
            set_id: setData.id,

            word: word.word,
            meaning: word.meaning,
            ipa: word.ipa,
            word_type: word.type,
            example: word.example,
            synonyms: word.synonyms,
          }))
        )

    if (wordsError) {
      console.log(wordsError)

      setPopup({
        show: true,
        type: "error",
        message: "Lỗi lưu từ 😭",
      })

      setSaving(false)

      return
    }

    setPopup({
      show: true,
      type: "success",
      message: "Đã lưu bộ từ 😎🔥",
    })

    // reset
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

    setAiText("")
  } catch (err) {
    console.log(err)

    setPopup({
      show: true,
      type: "error",
      message: "Có lỗi xảy ra 😭",
    })
  }

  setSaving(false)
}
const closePopup = () => {
  setClosing(true)

  setTimeout(() => {
    setPopup({
      ...popup,
      show: false,
    })

    setClosing(false)
  }, 250)
}
  return (
    <section className="p-5 md:p-8 pb-28 lg:pb-8">
      {/* POPUP */}
{popup.show && (
<div
  className={`fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-5 ${
    closing
      ? "animate-fade-out"
      : "animate-fade-blur"
  }`}
>
    <div
  className={`bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl ${
    closing
      ? "animate-popup-out"
      : "animate-popup-spring"
  }`}
>
      {/* ICON */}
<div
  className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center shadow-lg ${
    popup.type === "success"
      ? "bg-green-100"
      : "bg-red-100"
  }`}
>
  {popup.type === "success" ? (
    <svg
      className="w-12 h-12 text-green-600 animate-icon-pop"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  ) : (
    <svg
      className="w-12 h-12 text-red-500 animate-icon-pop"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  )}
</div>

      {/* TITLE */}
      <h2 className="text-3xl font-black text-center mt-6">
        {popup.type === "success"
          ? "Thành công"
          : "Oops!"}
      </h2>

      {/* MESSAGE */}
      <p className="text-gray-500 text-center mt-3 text-lg">
        {popup.message}
      </p>

      {/* BUTTON */}
      <button
        onClick={closePopup}
        className={`w-full mt-8 py-4 rounded-2xl font-black text-white transition ${
          popup.type === "success"
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-red-500 hover:bg-red-600"
        }`}
      >
        OK
      </button>
    </div>
  </div>
)}
  {/* IMPORT POPUP */}
{showImport && (
  <div className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm flex items-center justify-center p-5 animate-fade-blur">
    <div className="bg-white w-full max-w-2xl rounded-[40px] p-8 shadow-2xl animate-popup-spring">

      {/* TOP */}
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-4xl font-black">
            📥 Nhập từ vựng nhanh
          </h2>

          <p className="text-gray-500 mt-2">
            Format:
            Từ vựng	| Nghĩa |	IPA |	Từ loại |	Ví dụ |	Synonyms

          </p>
        </div>

        <button
          onClick={() =>
            setShowImport(false)
          }
          className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 transition text-2xl font-bold"
        >
          ×
        </button>
      </div>

      {/* EXAMPLE */}
      <div className="bg-[#f5f9ff] rounded-2xl p-4 mb-5 font-mono text-sm whitespace-pre-line">
        Ví dụ:
        {"\n"}
        dissemination |	sự lan truyền	| /dɪˌsemɪˈneɪʃən/ |	noun |	
        {"\n"}
        The dissemination of fake news spreads rapidly |	spread, distribution
        {"\n"}
        <h2 className="text-sm text-red-500 font-bold">
          (Mỗi từ một dòng, cách nhau bởi dấu Tab)
        </h2>
      </div>

      {/* TEXTAREA */}
      <textarea
        value={aiText}
        onChange={(e) =>
          setAiText(e.target.value)
        }
        placeholder="Paste vocab vào đây..."
        className="w-full min-h-[250px] bg-[#f5f9ff] rounded-2xl p-5 outline-none resize-none"
      />

      {/* BUTTONS */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => {
            if (!aiText) return

            const lines = aiText
              .split("\n")
              .filter((line) =>
                line.trim()
              )

            const parsed = lines.map(
              (line) => {
                const parts =
                  line.split("\t")

                return {
                  word:
                    parts[0]?.trim() ||
                    "",

                  meaning:
                    parts[1]?.trim() ||
                    "",

                  ipa:
                    parts[2]?.trim() ||
                    "",

                  type:
                    parts[3]?.trim() ||
                    "",

                  example:
                    parts[4]?.trim() ||
                    "",

                  synonyms:
                    parts[5]?.trim() ||
                    "",
                }
              }
            )

            setWords(parsed)

            setShowImport(false)

            setPopup({
              show: true,
              type: "success",
              message:
                "Import thành công 😎🔥",
            })
          }}
          className="flex-1 bg-blue-600 hover:bg-blue-700 transition text-white py-4 rounded-2xl font-black"
        >
          Import
        </button>

        <button
          onClick={() =>
            setShowImport(false)
          }
          className="px-6 bg-gray-100 hover:bg-gray-200 transition rounded-2xl font-bold"
        >
          Hủy
        </button>
      </div>
    </div>
  </div>
)}
{/* TOP */}
<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-10">

  <div>
    <p className="text-gray-500 text-lg">
      Create vocabulary set ✨
    </p>

    <h1 className="text-5xl font-black mt-2">
      Thêm từ vựng
    </h1>
  </div>

<div className="flex flex-wrap gap-3">

  <button
    onClick={() =>
      setShowImport(true)
    }
    className="bg-black text-white hover:opacity-90 transition px-6 py-4 rounded-2xl font-black shadow-lg"
  >
    ✨ Thêm từ vựng nhanh
  </button>

  <button
    disabled={!hasWords}
    onClick={() => {
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

      setPopup({
        show: true,
        type: "success",
        message:
          "Đã xóa toàn bộ từ",
      })
    }}
    className={`px-6 py-4 rounded-2xl font-black transition ${
      hasWords
        ? "bg-red-500 hover:bg-red-600 text-white shadow-lg"
        : "bg-gray-200 text-gray-400 cursor-not-allowed"
    }`}
  >
    🗑 Xóa toàn bộ
  </button>

</div>
</div>

      {/* TITLE */}
      <div className="bg-white rounded-[40px] p-6 md:p-8 shadow-sm border border-gray-100 mb-6">
        <p className="font-bold mb-4 text-lg">
          Tên bộ từ
        </p>

        <input
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          placeholder="Ví dụ: IELTS Vocabulary"
          className="w-full bg-[#f5f9ff] rounded-2xl p-5 outline-none border border-transparent focus:border-blue-500"
        />
      </div>
      {/* WORDS */}
      <div className="space-y-6">
        {words.map((word, index) => (
          <div
            key={index}
            className={`rounded-[40px] p-6 md:p-8 shadow-sm border transition-all ${
            invalidIndexes.includes(index)
              ? "bg-red-50 border-red-400 shadow-red-100 animate-shake"
              : "bg-white border-gray-100"
          }`}
          >
            {/* TOP */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl">
                  {index + 1}
                </div>

                <h2 className="text-3xl font-black">
                  Vocabulary
                </h2>
              </div>

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