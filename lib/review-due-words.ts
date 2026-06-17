import { supabase } from "@/lib/supabase"
import { isDueForReviewToday } from "@/lib/review-due"
import { SRS_REVIEW_LEVEL } from "@/lib/spaced-repetition"

export const REVIEW_DUE_SET_ID = "review-due"

export const isReviewDueSet = (setId: string) => setId === REVIEW_DUE_SET_ID

type DueProgressRow = {
  word_id?: string | null
  repetitions?: number | null
  review_at?: string | null
  last_reviewed_at?: string | null
  mastered_at?: string | null
  proficient_at?: string | null
  fluent_at?: string | null
  level_changed_at?: string | null
}

export const fetchDueWordsForCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, words: [] }
  }

  const { data: progressRows } = await supabase
    .from("user_word_progress")
    .select(`
      word_id,
      repetitions,
      review_at,
      last_reviewed_at,
      mastered_at,
      proficient_at,
      fluent_at,
      level_changed_at
    `)
    .eq("user_id", user.id)
    .gte("repetitions", SRS_REVIEW_LEVEL)

  const dueRows = ((progressRows || []) as DueProgressRow[]).filter((row) =>
    isDueForReviewToday(row)
  )

  const wordIds = dueRows
    .map((row) => row.word_id)
    .filter(Boolean) as string[]

  if (wordIds.length === 0) {
    return { user, words: [] }
  }

  const { data: vocabRows } = await supabase
    .from("vocab_words")
    .select("*")
    .in("id", wordIds)

  const progressMap = new Map<string, number>()
  dueRows.forEach((row) => {
    if (!row.word_id) return
    progressMap.set(row.word_id, Number(row.repetitions ?? 0))
  })

  const words = (vocabRows || []).map((word) => ({
    ...word,
    memoryStrength: progressMap.get(word.id) ?? 0,
  }))

  return { user, words }
}
