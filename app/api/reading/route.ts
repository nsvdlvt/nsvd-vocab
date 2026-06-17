import { openai } from "@/lib/openai"

type PromptWord = {
  word: string
  meaning: string
  example?: string
}

const extractJsonPayload = (raw: string) => {
  const fencedMatch = raw.match(/```json\s*([\s\S]*?)```/i)
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim()
  }

  const start = raw.indexOf("{")
  const end = raw.lastIndexOf("}")

  if (start >= 0 && end > start) {
    return raw.slice(start, end + 1)
  }

  return raw.trim()
}

const isValidReadingPayload = (value: unknown): value is {
  passage: {
    id: string
    title: string
    passage: string
    focusWords: string[]
    blanks: Array<{
      id: string
      answer: string
      meaning: string
    }>
    questions: Array<{
      id: string
      type: "mcq" | "true_false_not_given" | "short_answer"
      instruction: string
      prompt: string
      answer: string
      options?: string[]
    }>
  }
} => {
  if (!value || typeof value !== "object" || !("passage" in value)) {
    return false
  }

  const passage = (value as { passage?: unknown }).passage

  if (!passage || typeof passage !== "object") {
    return false
  }

  const candidate = passage as Record<string, unknown>
  const questions = candidate.questions

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.title !== "string" ||
    typeof candidate.passage !== "string" ||
    !Array.isArray(candidate.focusWords) ||
    !Array.isArray(candidate.blanks) ||
    candidate.blanks.length < 3 ||
    candidate.blanks.length > 5 ||
    !Array.isArray(questions) ||
    questions.length < 3 ||
    questions.length > 5
  ) {
    return false
  }

  const questionTypes = new Set(
    questions
      .filter((question) => question && typeof question === "object")
      .map((question) => (question as { type?: string }).type)
  )

  return questionTypes.size === 1
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return Response.json(
      { error: "Thiếu cấu hình OPENAI_API_KEY trên server." },
      { status: 500 }
    )
  }

  try {
    const body = (await request.json()) as {
      setTitle?: string
      wordGroup?: PromptWord[]
    }

    const wordGroup = (body.wordGroup || []).filter((word) => word.word && word.meaning)

    if (wordGroup.length === 0) {
      return Response.json(
        { error: "Không có dữ liệu từ vựng để tạo bài reading." },
        { status: 400 }
      )
    }

    const response = await openai.responses.create({
      model: "gpt-5.4-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "Bạn là trợ lý tạo bài đọc hiểu tiếng Anh cho ứng dụng học từ vựng. Chỉ tạo đúng 1 bài. Bài reading phải gồm đúng 2 đoạn văn riêng biệt, tổng khoảng 5 câu hoàn chỉnh, nội dung tự nhiên và mạch lạc. Toàn bộ passage phải là tiếng Anh thuần. Tuyệt đối không được chèn tiếng Việt, không thêm phần giải nghĩa trong ngoặc, không thêm chú thích như '(chăm sóc y tế)' hay '(ngân sách nhà nước)' vào trong passage. Từ vựng nên nhỉnh hơn mức cơ bản, thiên về pre-intermediate đến intermediate plus, nhưng vẫn phù hợp để học. Cố gắng dùng càng nhiều từ đã cho càng tốt, ưu tiên dùng hầu hết hoặc toàn bộ nhóm từ nếu hợp lý. Sau đó chọn 3-5 từ xuất hiện trong chính đoạn văn để khoét lỗ bằng marker chính xác dạng {{b1}}, {{b2}}, {{b3}}. Mỗi blank bắt buộc phải có meaning là gợi ý nghĩa tiếng Việt ngắn gọn, rõ ràng. Không được để passage không có marker, không được để blank thiếu meaning. Phần câu hỏi phải random đúng 1 trong 3 loại sau cho toàn bộ bài, không được trộn nhiều loại trong cùng một bài: mcq, true_false_not_given, short_answer. Nếu đã chọn mcq thì tất cả câu hỏi đều là mcq. Nếu đã chọn true_false_not_given thì tất cả câu hỏi đều là true_false_not_given. Nếu đã chọn short_answer thì tất cả câu hỏi đều là short_answer. Với mcq, phải có 4 đáp án ở options và instruction là 'Choose the correct answer.' Với true_false_not_given, instruction là 'Do the following statements agree with the information in the passage? Write TRUE, FALSE or NOT GIVEN.' Với short_answer, instruction là 'Answer the questions below. Write NO MORE THAN TWO WORDS.' hoặc giới hạn từ tương tự. Trả về JSON thuần, không markdown, theo đúng cấu trúc: {\"passage\":{\"id\":\"...\",\"title\":\"...\",\"passage\":\"paragraph 1...\\n\\nparagraph 2... {{b1}} ...\",\"focusWords\":[\"...\"],\"blanks\":[{\"id\":\"b1\",\"answer\":\"word\",\"meaning\":\"nghĩa tiếng Việt\"}],\"questions\":[{\"id\":\"q1\",\"type\":\"mcq|true_false_not_given|short_answer\",\"instruction\":\"...\",\"prompt\":\"...\",\"options\":[\"...\"],\"answer\":\"...\"}]}}",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                setTitle: body.setTitle || "",
                wordGroup,
              }),
            },
          ],
        },
      ],
    })

    const text = response.output_text.trim()
    const jsonText = extractJsonPayload(text)
    const parsed = JSON.parse(jsonText) as unknown

    if (!isValidReadingPayload(parsed)) {
      console.error("Invalid reading payload:", text)
      return Response.json(
        { error: "AI trả về dữ liệu bài reading không hợp lệ." },
        { status: 500 }
      )
    }

    return Response.json(parsed)
  } catch (error) {
    console.error("Reading generation error:", error)

    return Response.json(
      { error: "Không thể tạo bài reading lúc này. Vui lòng thử lại sau." },
      { status: 500 }
    )
  }
}
