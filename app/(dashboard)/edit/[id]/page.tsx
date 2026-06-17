"use client"

import { EditVocabSetEditor } from "@/components/dashboard/vocab-set-editor"

export default function EditPage({
  params,
}: {
  params: Promise<{
    id: string
  }>
}) {
  return <EditVocabSetEditor params={params} />
}
