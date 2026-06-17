export const MASTERED_LEVEL = 4
export const SRS_REVIEW_LEVEL = 3
export const PROFICIENT_LEVEL = 5
export const FLUENT_LEVEL = 6
export const SRS_EXIT_LEVEL = 2

export type SpacedRepetitionUpdate = {
  level: number
  intervalDays: number
  reviewAt: string
}

export const buildMasteryTimestampUpdate = (
  previousLevel: number,
  nextLevel: number,
  changedAt = new Date()
) => {
  const timestamp = changedAt.toISOString()
  const update: {
    mastered_at?: string
    proficient_at?: string
    fluent_at?: string
    level_changed_at?: string
  } = {}

  if (previousLevel !== nextLevel) {
    update.level_changed_at = timestamp
  }

  if (previousLevel < MASTERED_LEVEL && nextLevel >= MASTERED_LEVEL) {
    update.mastered_at = timestamp
  }

  if (previousLevel < PROFICIENT_LEVEL && nextLevel >= PROFICIENT_LEVEL) {
    update.proficient_at = timestamp
  }

  if (previousLevel < FLUENT_LEVEL && nextLevel >= FLUENT_LEVEL) {
    update.fluent_at = timestamp
  }

  return update
}

export const calculateSpacedRepetitionUpdate = (
  currentLevel: number,
  remembered: boolean,
  baseDate = new Date()
): SpacedRepetitionUpdate => {
  const nextLevel = remembered
    ? currentLevel < 0
      ? 1
      : Math.min(currentLevel + 1, MASTERED_LEVEL)
    : currentLevel <= 0
    ? -1
    : Math.max(currentLevel - 2, -1)

  const intervalDays = nextLevel >= SRS_REVIEW_LEVEL ? 3 : 1
  const reviewAt = new Date(baseDate)
  reviewAt.setDate(reviewAt.getDate() + intervalDays)

  return {
    level: nextLevel,
    intervalDays,
    reviewAt: reviewAt.toISOString(),
  }
}

export const calculateSrsReviewUpdate = (
  currentLevel: number,
  remembered: boolean,
  baseDate = new Date()
): SpacedRepetitionUpdate => {
  const currentSrsLevel = Math.max(currentLevel, MASTERED_LEVEL)
  const nextLevel = remembered
    ? Math.min(currentSrsLevel + 1, FLUENT_LEVEL)
    : SRS_EXIT_LEVEL

  const intervalDays = remembered
    ? currentSrsLevel >= PROFICIENT_LEVEL
      ? 7
      : 3
    : 1
  const reviewAt = new Date(baseDate)
  reviewAt.setDate(reviewAt.getDate() + intervalDays)

  return {
    level: nextLevel,
    intervalDays,
    reviewAt: reviewAt.toISOString(),
  }
}
