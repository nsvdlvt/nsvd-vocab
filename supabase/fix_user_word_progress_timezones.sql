alter table public.user_word_progress
  alter column review_at type timestamptz using review_at at time zone 'Asia/Bangkok',
  alter column last_reviewed_at type timestamptz using last_reviewed_at at time zone 'Asia/Bangkok',
  alter column created_at type timestamptz using created_at at time zone 'Asia/Bangkok',
  alter column updated_at type timestamptz using updated_at at time zone 'Asia/Bangkok',
  alter column mastered_at type timestamptz using mastered_at at time zone 'Asia/Bangkok',
  alter column proficient_at type timestamptz using proficient_at at time zone 'Asia/Bangkok',
  alter column fluent_at type timestamptz using fluent_at at time zone 'Asia/Bangkok',
  alter column level_changed_at type timestamptz using level_changed_at at time zone 'Asia/Bangkok';
