"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function NewPage() {
  const [title, setTitle] = useState("")
  const [saving, setSaving] = useState(false)

  const [words, setWords] = useState([
    {
      english: "",
      vietnamese: "",
    },
  ])

  const updateWord = (
    index: number,
    field: "english" | "vietnamese",
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
        english: "",
        vietnamese: "",
      },
    ])
  }

  const removeRow = (index: number) => {
    const updated = words.filter(
      (_, i) => i !== index
    )

    setWords(updated)
  }

  const saveSet = async () => {
    if (!title) {
      alert("Nhập tên bộ từ 😭")
      return
    }

    setSaving(true)

    // tạo set
    const { data: setData, error: setError } =
      await supabase
        .from("vocab_sets")
        .insert({
          title,
        })
        .select()
        .single()

    if (setError) {
      console.log(setError)

      alert("Lỗi tạo bộ từ")

      setSaving(false)

      return
    }

    // lọc word rỗng
    const validWords = words.filter(
      (w) => w.english && w.vietnamese
    )

    // insert words
    const { error: wordsError } =
      await supabase
        .from("vocab_words")
        .insert(
          validWords.map((word) => ({
            set_id: setData.id,
            english: word.english,
            vietnamese: word.vietnamese,
          }))
        )

    if (wordsError) {
      console.log(wordsError)

      alert("Lỗi lưu từ")

      setSaving(false)

      return
    }

    alert("Đã tạo bộ từ 😎")

    setTitle("")

    setWords([
      {
        english: "",
        vietnamese: "",
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

      {/* WORDS */}
      <div className="space-y-5">
        {words.map((word, index) => (
          <div
            key={index}
            className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-black">
                Từ {index + 1}
              </h2>

              {words.length > 1 && (
                <button
                  onClick={() => removeRow(index)}
                  className="text-red-500 font-bold"
                >
                  Xóa
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <input
                value={word.english}
                onChange={(e) =>
                  updateWord(
                    index,
                    "english",
                    e.target.value
                  )
                }
                placeholder="English"
                className="bg-[#f5f9ff] rounded-2xl p-5 outline-none border border-transparent focus:border-blue-500"
              />

              <input
                value={word.vietnamese}
                onChange={(e) =>
                  updateWord(
                    index,
                    "vietnamese",
                    e.target.value
                  )
                }
                placeholder="Tiếng Việt"
                className="bg-[#f5f9ff] rounded-2xl p-5 outline-none border border-transparent focus:border-blue-500"
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
          className="bg-blue-600 hover:bg-blue-700 transition text-white px-8 py-4 rounded-2xl font-black disabled:opacity-50"
        >
          {saving
            ? "Đang lưu..."
            : "Lưu bộ từ"}
        </button>
      </div>
    </section>
  )
}