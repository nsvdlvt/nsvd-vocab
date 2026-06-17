"use client"

import { startTransition, useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  Check,
  ChevronDown,
  Globe,
  Import,
  Lock,
  PencilLine,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import { supabase } from "@/lib/supabase"

type WordType = {
  word: string
  meaning: string
  ipa: string
  type: string
  example: string
  synonyms: string
}

type DictionaryPhonetic = {
  audio?: string
}

type DictionaryEntry = {
  phonetics?: DictionaryPhonetic[]
}

type ClonePayload = {
  title?: string
  description?: string
  tag?: string
  words?: Partial<WordType>[]
}

type PopupState = {
  show: boolean
  type: "success" | "error"
  message: string
  redirect?: boolean
}

type EditorMode =
  | {
      mode: "create"
    }
  | {
      mode: "edit"
      id: string
    }

const DEFAULT_SET_ICON = "📘"
const EMPTY_WORD: WordType = {
  word: "",
  meaning: "",
  ipa: "",
  type: "",
  example: "",
  synonyms: "",
}

const TAG_OPTIONS = ["IELTS", "TOEIC", "CEFR", "TOEFL", "Công việc", "Khác"]

function FieldLabel({
  label,
  hint,
}: {
  label: string
  hint?: string
}) {
  return (
    <div className="mb-3">
      <p className="text-sm font-black uppercase tracking-[0.16em] text-[#8d6542]">{label}</p>
      {hint ? <p className="mt-1 text-sm text-[#7b6a5d]">{hint}</p> : null}
    </div>
  )
}

export function VocabSetEditor(props: EditorMode) {
  const router = useRouter()
  const isEditMode = props.mode === "edit"
  const setId = isEditMode ? props.id : null

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [tag, setTag] = useState("IELTS")
  const [showTags, setShowTags] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEditMode)
  const [showImport, setShowImport] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [aiText, setAiText] = useState("")
  const [words, setWords] = useState<WordType[]>([{ ...EMPTY_WORD }])
  const [popup, setPopup] = useState<PopupState>({
    show: false,
    type: "success",
    message: "",
    redirect: false,
  })
  const [invalidIndexes, setInvalidIndexes] = useState<number[]>([])
  const [closing, setClosing] = useState(false)
  const [originalData, setOriginalData] = useState<string | null>(null)

  const hasWords = words.some((word) =>
    Object.values(word).some((value) => value.trim())
  )

  const currentData = JSON.stringify({
    isPublic,
    title,
    description,
    tag,
    words,
  })

  const hasChanges = isEditMode ? originalData !== null && currentData !== originalData : true

  useEffect(() => {
    if (isEditMode || typeof window === "undefined") return

    const cloneRaw = sessionStorage.getItem("community_clone_payload")
    if (!cloneRaw) return

    try {
      const cloneData = JSON.parse(cloneRaw) as ClonePayload

      startTransition(() => {
        if (cloneData.title) setTitle(cloneData.title)
        if (cloneData.description) setDescription(cloneData.description)
        if (cloneData.tag) setTag(cloneData.tag)

        if (Array.isArray(cloneData.words) && cloneData.words.length) {
          setWords(
            cloneData.words.map((word) => ({
              word: word.word || "",
              meaning: word.meaning || "",
              ipa: word.ipa || "",
              type: word.type || "",
              example: word.example || "",
              synonyms: word.synonyms || "",
            }))
          )
        }
      })
    } catch (error) {
      console.log(error)
    } finally {
      sessionStorage.removeItem("community_clone_payload")
    }
  }, [isEditMode])

  useEffect(() => {
    if (!isEditMode || !setId) return

    let cancelled = false

    const fetchSet = async () => {
      setLoading(true)

      const { data: setData } = await supabase.from("vocab_sets").select("*").eq("id", setId).single()

      if (cancelled) return

      if (setData) {
        setTitle(setData.title || "")
        setDescription(setData.description || "")
        setTag(setData.tag || "IELTS")
        setIsPublic(setData.is_public || false)
      }

      const { data: wordsData } = await supabase.from("vocab_words").select("*").eq("set_id", setId)

      if (cancelled) return

      const formattedWords =
        wordsData?.length
          ? wordsData.map((word) => ({
              word: word.word || "",
              meaning: word.meaning || "",
              ipa: word.ipa || "",
              type: word.word_type || "",
              example: word.example || "",
              synonyms: word.synonyms || "",
            }))
          : [{ ...EMPTY_WORD }]

      setWords(formattedWords)
      setOriginalData(
        JSON.stringify({
          isPublic: setData?.is_public || false,
          title: setData?.title || "",
          description: setData?.description || "",
          tag: setData?.tag || "IELTS",
          words: formattedWords,
        })
      )
      setLoading(false)
    }

    void fetchSet()

    return () => {
      cancelled = true
    }
  }, [isEditMode, setId])

  const updateWord = (index: number, field: keyof WordType, value: string) => {
    setWords((current) => {
      const updated = [...current]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addRow = () => {
    setWords((current) => [...current, { ...EMPTY_WORD }])

    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      })
    }, 100)
  }

  const removeRow = (index: number) => {
    setWords((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  const openPopup = (next: PopupState) => {
    setClosing(false)
    setPopup(next)
  }

  const closePopup = () => {
    setClosing(true)

    setTimeout(() => {
      const shouldRedirect = popup.redirect

      setPopup((current) => ({ ...current, show: false }))
      setClosing(false)

      if (shouldRedirect) {
        router.push("/folders")
      }
    }, 250)
  }

  const parseImportText = () => {
    if (!aiText.trim()) return

    const lines = aiText.split("\n").filter((line) => line.trim())
    const parsed = lines.map((line) => {
      const parts = line.split("\t")

      return {
        word: parts[0]?.trim() || "",
        meaning: parts[1]?.trim() || "",
        ipa: parts[2]?.trim() || "",
        type: parts[3]?.trim() || "",
        example: parts[4]?.trim() || "",
        synonyms: parts[5]?.trim() || "",
      }
    })

    setWords(parsed.length ? parsed : [{ ...EMPTY_WORD }])
    setShowImport(false)
    openPopup({
      show: true,
      type: "success",
      message: "Import thành công.",
    })
  }

  const resetWords = () => {
    setWords([{ ...EMPTY_WORD }])
    openPopup({
      show: true,
      type: "success",
      message: "Đã xóa toàn bộ từ.",
    })
  }

  const saveSet = async () => {
    setSaving(true)

    if (!title.trim()) {
      openPopup({
        show: true,
        type: "error",
        message: "Nhập tên bộ từ.",
      })
      setSaving(false)
      return
    }

    const invalids = words
      .map((word, index) => ({ ...word, index }))
      .filter((word) => (word.word.trim() && !word.meaning.trim()) || (!word.word.trim() && word.meaning.trim()))

    if (invalids.length > 0) {
      setInvalidIndexes(invalids.map((word) => word.index))
      openPopup({
        show: true,
        type: "error",
        message: "Có từ đang thiếu Word hoặc Meaning.",
      })
      setSaving(false)
      return
    }

    setInvalidIndexes([])

    const validWords = words.filter((word) => word.word.trim() && word.meaning.trim())

    if (validWords.length === 0) {
      openPopup({
        show: true,
        type: "error",
        message: "Chưa có từ nào hợp lệ.",
      })
      setSaving(false)
      return
    }

    try {
      if (isEditMode && setId) {
        const { error: setError } = await supabase
          .from("vocab_sets")
          .update({
            title,
            description,
            tag,
            icon: DEFAULT_SET_ICON,
            is_public: isPublic,
            updated_at: new Date(),
          })
          .eq("id", setId)

        if (setError) {
          console.log(setError)
          openPopup({
            show: true,
            type: "error",
            message: "Không thể cập nhật bộ từ.",
          })
          setSaving(false)
          return
        }

        await supabase.from("vocab_words").delete().eq("set_id", setId)

        const { error: wordsError } = await supabase.from("vocab_words").insert(
          validWords.map((word) => ({
            set_id: setId,
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
          openPopup({
            show: true,
            type: "error",
            message: "Không thể lưu danh sách từ.",
          })
          setSaving(false)
          return
        }

        setOriginalData(
          JSON.stringify({
            isPublic,
            title,
            description,
            tag,
            words: validWords,
          })
        )

        openPopup({
          show: true,
          type: "success",
          message: "Đã cập nhật bộ từ thành công.",
          redirect: true,
        })
      } else {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        const user = session?.user

        if (!user) {
          openPopup({
            show: true,
            type: "error",
            message: "Bạn chưa đăng nhập.",
          })
          setSaving(false)
          return
        }

        const wordsWithAudio = await Promise.all(
          validWords.map(async (word) => {
            try {
              const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.word}`)
              const data = (await response.json()) as DictionaryEntry[]
              let audio = data?.[0]?.phonetics?.find((phonetic) => phonetic.audio)?.audio || ""

              if (!audio) {
                audio = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(word.word)}&tl=en&client=tw-ob`
              }

              return {
                ...word,
                audio_url: audio,
              }
            } catch {
              return {
                ...word,
                audio_url: "",
              }
            }
          })
        )

        const { data: setData, error: setError } = await supabase
          .from("vocab_sets")
          .insert({
            title,
            description,
            tag,
            icon: DEFAULT_SET_ICON,
            is_public: isPublic,
            user_id: user.id,
            author_name: user.user_metadata?.full_name || user.email,
            author_avatar: user.user_metadata?.avatar_url || "",
          })
          .select()
          .single()

        if (setError) {
          console.log(setError)
          openPopup({
            show: true,
            type: "error",
            message: "Không thể tạo bộ từ.",
          })
          setSaving(false)
          return
        }

        const { error: wordsError } = await supabase.from("vocab_words").insert(
          wordsWithAudio.map((word) => ({
            set_id: setData.id,
            audio_url: word.audio_url,
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
          openPopup({
            show: true,
            type: "error",
            message: "Không thể lưu danh sách từ.",
          })
          setSaving(false)
          return
        }

        setTitle("")
        setDescription("")
        setTag("IELTS")
        setWords([{ ...EMPTY_WORD }])
        setAiText("")

        openPopup({
          show: true,
          type: "success",
          message: "Đã tạo bộ từ thành công.",
          redirect: true,
        })
      }
    } catch (error) {
      console.log(error)
      openPopup({
        show: true,
        type: "error",
        message: "Có lỗi xảy ra trong quá trình lưu.",
      })
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <section className="min-h-screen bg-[#f6efe4] p-5 md:p-8">
        <div className="mx-auto max-w-6xl rounded-[2.5rem] border border-[#ead8c4] bg-[#fffaf3] p-8 shadow-[0_22px_60px_rgba(84,58,33,0.08)]">
          <div className="h-8 w-40 animate-pulse rounded-full bg-[#efe2d3]" />
          <div className="mt-6 h-52 animate-pulse rounded-[2rem] bg-[#f3e7da]" />
          <div className="mt-6 h-96 animate-pulse rounded-[2rem] bg-[#f3e7da]" />
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-screen overflow-hidden bg-[#f6efe4] px-4 py-6 md:px-8 md:py-8">
      <div className="absolute right-[-4rem] top-24 h-56 w-56 rounded-full bg-[#d96d32]/12 blur-3xl" />
      <div className="absolute left-[-5rem] top-[24rem] h-64 w-64 rounded-full bg-[#f3c969]/18 blur-3xl" />

      {popup.show ? (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#1f1a17]/45 p-5 backdrop-blur-sm ${
            closing ? "animate-fade-out" : "animate-fade-blur"
          }`}
        >
          <div
            className={`w-full max-w-md rounded-[2rem] border border-[#ead8c4] bg-[#fffaf3] p-8 shadow-[0_28px_80px_rgba(31,26,23,0.22)] ${
              closing ? "animate-popup-out" : "animate-popup-spring"
            }`}
          >
            <div
              className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
                popup.type === "success" ? "bg-[#eefaf2] text-[#1f8f55]" : "bg-[#fff1ef] text-[#d04d35]"
              }`}
            >
              {popup.type === "success" ? <Check className="h-10 w-10" /> : <X className="h-10 w-10" />}
            </div>

            <h2 className="mt-6 text-center text-3xl font-black text-[#241c17]">
              {popup.type === "success" ? "Thành công" : "Có vấn đề"}
            </h2>
            <p className="mt-3 text-center text-base leading-7 text-[#6d5a4b]">{popup.message}</p>

            <button
              onClick={closePopup}
              className={`mt-8 flex h-14 w-full items-center justify-center rounded-2xl font-black text-white transition ${
                popup.type === "success" ? "bg-[#1f1a17] hover:bg-black" : "bg-[#d96d32] hover:bg-[#c25f29]"
              }`}
            >
              OK
            </button>
          </div>
        </div>
      ) : null}

      {showImport ? (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-[#1f1a17]/45 p-4 backdrop-blur-sm">
          <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2.5rem] border border-[#ead8c4] bg-[#fffaf3] shadow-[0_28px_80px_rgba(31,26,23,0.22)]">
            <div className="flex items-center justify-between border-b border-[#ead8c4] px-6 py-5 md:px-8">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-[#fff1dd] px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#c96d35]">
                  <Import className="h-3.5 w-3.5" />
                  ✨ Thêm từ vựng nhanh
                </p>
                <h2 className="mt-3 text-3xl font-black text-[#241c17]">Nhập từ vựng nhanh</h2>
              </div>

              <button
                onClick={() => setShowImport(false)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e2d2bf] bg-white text-[#2d241d] transition hover:bg-[#fff8f1]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
              <div className="rounded-[2rem] border border-[#ead8c4] bg-[#fff8ef] p-5">
                <button
                  onClick={() => setShowGuide((current) => !current)}
                  className="flex w-full items-center justify-between gap-4 text-left"
                >
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.16em] text-[#8d6542]">Hướng dẫn</p>
                    <h3 className="mt-2 text-xl font-black text-[#241c17]">Dùng ChatGPT để tạo danh sách từ nhanh</h3>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-[#8d6542] transition ${showGuide ? "rotate-180" : ""}`} />
                </button>

                {showGuide ? (
                  <div className="mt-5 space-y-4">
                    <p className="text-sm leading-7 text-[#6d5a4b]">
                      Copy prompt bên dưới, gửi cho ChatGPT rồi dán kết quả vào khung import.
                    </p>
                    <div className="overflow-auto rounded-[1.5rem] border border-[#e4d4c2] bg-white p-4 text-sm leading-7 text-[#3d3026]">
                      {`Hãy tạo danh sách từ vựng tiếng Anh theo chủ đề [CHỦ ĐỀ] với định dạng tab:

word	meaning	ipa	word type	example	synonyms`}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`Hãy tạo danh sách từ vựng tiếng Anh theo chủ đề [CHỦ ĐỀ] với định dạng tab:\n\nword\tmeaning\tipa\tword type\texample\tsynonyms`)
                          openPopup({
                            show: true,
                            type: "success",
                            message: "Đã copy prompt.",
                          })
                        }}
                        className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#e2d2bf] bg-white px-5 font-bold text-[#2d241d] transition hover:bg-[#fff8f1]"
                      >
                        Copy Prompt
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-6 rounded-[2rem] border border-[#e2d2bf] bg-white p-5">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#8d6542]">Mẫu dữ liệu</p>
                <pre className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#5f5043]">
{`dissemination	sự lan truyền	/dɪˌsemɪˈneɪʃən/	noun	The dissemination of fake news spreads rapidly.	spread, distribution`}
                </pre>
              </div>

              <textarea
                value={aiText}
                onChange={(event) => setAiText(event.target.value)}
                placeholder="Paste danh sách từ vựng vào đây... (Mỗi từ cách nhau bởi dấu Tab, mỗi dòng là một từ mới)"
                className="mt-6 min-h-[280px] w-full resize-none rounded-[2rem] border border-[#dbc7b4] bg-[#fffdf9] px-5 py-4 text-sm text-[#241c17] outline-none transition placeholder:text-[#9a8673] focus:border-[#d96d32]"
              />
            </div>

            <div className="flex flex-wrap gap-3 border-t border-[#ead8c4] px-6 py-5 md:px-8">
              <button
                onClick={parseImportText}
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-[#d96d32] px-6 font-black text-white transition hover:bg-[#c25f29]"
              >
                Import
              </button>
              <button
                onClick={() => setShowImport(false)}
                className="inline-flex h-14 items-center justify-center rounded-2xl border border-[#e2d2bf] bg-white px-6 font-bold text-[#2d241d] transition hover:bg-[#fff8f1]"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="relative mx-auto max-w-7xl">
        <div className="rounded-[2.5rem] border border-[#ead8c4] bg-[linear-gradient(135deg,#fff8ef_0%,#f7eadb_100%)] p-6 shadow-[0_18px_48px_rgba(84,58,33,0.08)] md:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-[#fff1dd] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#c96d35]">
                  {isEditMode ? <PencilLine className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Thông tin tổng quan
                </p>
                <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#241c17] md:text-5xl">
                  {isEditMode ? "Chỉnh sửa bộ từ" : "Tạo bộ từ mới"}
                </h1>
                <p className="mt-3 max-w-3xl text-base leading-8 text-[#66584b]">
                  
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-[#ead8c4] bg-[#fffaf3] px-5 py-4">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#8d6542]">Tên bộ từ</p>
                <p className="mt-2 text-lg font-black text-[#241c17]">{title.trim() || "Chưa đặt tên bộ từ"}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[1.75rem] border border-[#ead8c4] bg-[#fffaf3] p-5">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#8d6542]">Trạng thái</p>
                <div className="mt-4 flex items-center gap-3 text-[#241c17]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1f1a17] text-white">
                    {isPublic ? <Globe className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-black">{isPublic ? "Công khai" : "Riêng tư"}</p>
                    <p className="text-sm text-[#7b6a5d]">{isPublic ? "Có thể chia sẻ với cộng đồng" : "Chỉ mình bạn nhìn thấy"}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-[#ead8c4] bg-[#fffaf3] p-5">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#8d6542]">Tổng từ</p>
                <div className="mt-4 flex items-center gap-3 text-[#241c17]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d96d32] text-white">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-black">{words.filter((word) => word.word.trim()).length} mục</p>
                    <p className="text-sm text-[#7b6a5d]">Đang chuẩn bị cho bộ từ này</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-[#ead8c4] bg-[#fffaf3] p-5">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#8d6542]">Từ hợp lệ</p>
                <div className="mt-4 flex items-center gap-3 text-[#241c17]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f2c96d] text-[#241c17]">
                    <Check className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-black">{words.filter((word) => word.word.trim() && word.meaning.trim()).length} / {words.length}</p>
                    <p className="text-sm text-[#7b6a5d]">Số từ đã đủ Word và Meaning</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-[#ead8c4] bg-[#fffaf3] p-5">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#8d6542]">Tiến độ</p>
                <div className="mt-4 flex items-center gap-3 text-[#241c17]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#efe2d3] text-[#241c17]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-black">{hasChanges ? "Đang có thay đổi" : "Đã đồng bộ"}</p>
                    <p className="text-sm text-[#7b6a5d]">{isEditMode ? "Cập nhật xong nhớ bấm lưu" : "Bạn có thể lưu ngay khi sẵn sàng"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="space-y-8">
            <article className="rounded-[2.25rem] border border-[#ead8c4] bg-[#fffaf3] p-6 shadow-[0_18px_48px_rgba(84,58,33,0.08)] md:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-[#8d6542]">Thông tin bộ từ</p>
                  <h2 className="mt-2 text-3xl font-black text-[#241c17]">Phần mô tả và định vị bộ từ</h2>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowImport(true)}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#1f1a17] px-5 text-sm font-bold text-[#fff8f0] transition hover:bg-black"
                  >
                    <Import className="h-4 w-4" />
                    Thêm từ vựng nhanh
                  </button>

                  <button
                    onClick={() => setIsPublic((current) => !current)}
                    className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold transition ${
                      isPublic
                        ? "bg-[#d96d32] text-white hover:bg-[#c25f29]"
                        : "border border-[#e2d2bf] bg-white text-[#2d241d] hover:bg-[#fff8f1]"
                    }`}
                  >
                    {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    {isPublic ? "Công khai" : "Riêng tư"}
                  </button>
                </div>
              </div>

              <div className="mt-8 space-y-6">
                <div>
                  <FieldLabel label="Tên bộ từ" hint="Chọn tên ngắn gọn, dễ tìm và dễ nhớ." />
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Ví dụ: IELTS Vocabulary"
                    className="w-full rounded-[1.5rem] border border-[#dbc7b4] bg-[#fffdf9] px-5 py-4 text-[#241c17] outline-none transition placeholder:text-[#9a8673] focus:border-[#d96d32]"
                  />
                </div>

                <div>
                  <FieldLabel label="Mô tả" hint="Ghi nhanh mục tiêu học, ngữ cảnh sử dụng hoặc cấp độ." />
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Thêm mô tả cho bộ từ của bạn..."
                    className="min-h-32 w-full resize-none rounded-[1.5rem] border border-[#dbc7b4] bg-[#fffdf9] px-5 py-4 text-[#241c17] outline-none transition placeholder:text-[#9a8673] focus:border-[#d96d32]"
                  />
                </div>

                <div className="relative">
                  <FieldLabel label="Tag" hint="Dùng tag để lọc nhanh trong kho bộ từ." />
                  <button
                    type="button"
                    onClick={() => setShowTags((current) => !current)}
                    className="flex w-full items-center justify-between rounded-[1.5rem] border border-[#dbc7b4] bg-[#fffdf9] px-5 py-4 font-semibold text-[#241c17] transition hover:border-[#d96d32]"
                  >
                    <span>{tag}</span>
                    <ChevronDown className={`h-5 w-5 text-[#8d6542] transition ${showTags ? "rotate-180" : ""}`} />
                  </button>

                  {showTags ? (
                    <div className="absolute z-20 mt-3 w-full rounded-[1.5rem] border border-[#e2d2bf] bg-[#fffaf3] p-2 shadow-[0_18px_40px_rgba(84,58,33,0.14)]">
                      {TAG_OPTIONS.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            setTag(item)
                            setShowTags(false)
                          }}
                          className={`flex w-full items-center justify-between rounded-[1rem] px-4 py-3 text-left font-bold transition ${
                            tag === item ? "bg-[#1f1a17] text-[#fff8f0]" : "text-[#2d241d] hover:bg-[#f7efe5]"
                          }`}
                        >
                          <span>{item}</span>
                          {tag === item ? <Check className="h-4 w-4" /> : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </article>

            <article className="rounded-[2.25rem] border border-[#ead8c4] bg-[#fffaf3] p-6 shadow-[0_18px_48px_rgba(84,58,33,0.08)] md:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-[#8d6542]">Danh sách từ</p>
                  <h2 className="mt-2 text-3xl font-black text-[#241c17]">Thêm từ vựng theo từng thẻ từ</h2>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={addRow}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#d96d32] px-5 text-sm font-bold text-white transition hover:bg-[#c25f29]"
                  >
                    <Plus className="h-4 w-4" />
                    Thêm từ
                  </button>
                  <button
                    onClick={resetWords}
                    disabled={!hasWords}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#e2d2bf] bg-white px-5 text-sm font-bold text-[#2d241d] transition hover:bg-[#fff8f1] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Xóa toàn bộ
                  </button>
                </div>
              </div>

              <div className="mt-8 space-y-5">
                {words.map((word, index) => (
                  <div
                    key={index}
                    className={`rounded-[2rem] border p-5 transition md:p-6 ${
                      invalidIndexes.includes(index)
                        ? "border-[#f0beb5] bg-[#fff1ef] shadow-[0_14px_34px_rgba(208,77,53,0.08)]"
                        : "border-[#ead8c4] bg-[#fffdf9]"
                    }`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1f1a17] text-lg font-black text-[#fff8f0]">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-[#241c17]">Vocabulary</h3>
                          <p className="text-sm text-[#7b6a5d]">Nhập word, meaning, ví dụ và chi tiết bổ sung.</p>
                        </div>
                      </div>

                      {words.length > 1 ? (
                        <button
                          onClick={() => removeRow(index)}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#f0beb5] bg-[#fff7f5] px-4 text-sm font-bold text-[#c44b36] transition hover:bg-[#fff1ef]"
                        >
                          <Trash2 className="h-4 w-4" />
                          Xóa
                        </button>
                      ) : null}
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <input
                        value={word.word}
                        onChange={(event) => updateWord(index, "word", event.target.value)}
                        placeholder="Word"
                        className="rounded-[1.25rem] border border-[#e2d2bf] bg-white px-4 py-4 text-[#241c17] outline-none transition placeholder:text-[#9a8673] focus:border-[#d96d32]"
                      />
                      <input
                        value={word.meaning}
                        onChange={(event) => updateWord(index, "meaning", event.target.value)}
                        placeholder="Meaning"
                        className="rounded-[1.25rem] border border-[#e2d2bf] bg-white px-4 py-4 text-[#241c17] outline-none transition placeholder:text-[#9a8673] focus:border-[#d96d32]"
                      />
                      <input
                        value={word.ipa}
                        onChange={(event) => updateWord(index, "ipa", event.target.value)}
                        placeholder="IPA"
                        className="rounded-[1.25rem] border border-[#e2d2bf] bg-white px-4 py-4 text-[#241c17] outline-none transition placeholder:text-[#9a8673] focus:border-[#d96d32]"
                      />
                      <input
                        value={word.type}
                        onChange={(event) => updateWord(index, "type", event.target.value)}
                        placeholder="Word type"
                        className="rounded-[1.25rem] border border-[#e2d2bf] bg-white px-4 py-4 text-[#241c17] outline-none transition placeholder:text-[#9a8673] focus:border-[#d96d32]"
                      />
                      <textarea
                        value={word.example}
                        onChange={(event) => updateWord(index, "example", event.target.value)}
                        placeholder="Example sentence"
                        className="min-h-28 rounded-[1.25rem] border border-[#e2d2bf] bg-white px-4 py-4 text-[#241c17] outline-none transition placeholder:text-[#9a8673] focus:border-[#d96d32] md:col-span-2"
                      />
                      <input
                        value={word.synonyms}
                        onChange={(event) => updateWord(index, "synonyms", event.target.value)}
                        placeholder="Synonyms"
                        className="rounded-[1.25rem] border border-[#e2d2bf] bg-white px-4 py-4 text-[#241c17] outline-none transition placeholder:text-[#9a8673] focus:border-[#d96d32] md:col-span-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3 border-t border-[#ead8c4] pt-8 md:flex-row">
                <button
                  onClick={saveSet}
                  disabled={saving || !hasWords || !hasChanges}
                  className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-[#1f1a17] text-base font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-[#b8afa6]"
                >
                  {saving ? "Đang lưu..." : " Lưu bộ từ"}
                </button>

                <button
                  onClick={() => router.push("/folders")}
                  className="flex h-14 flex-1 items-center justify-center rounded-2xl border border-[#e2d2bf] bg-white text-base font-bold text-[#2d241d] transition hover:bg-[#fff8f1]"
                >
                  Về kho bộ từ
                </button>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}

export function EditVocabSetEditor({
  params,
}: {
  params: Promise<{
    id: string
  }>
}) {
  const { id } = use(params)
  return <VocabSetEditor mode="edit" id={id} />
}
