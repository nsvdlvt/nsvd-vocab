import { openai } from "@/lib/openai"

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
      prompt?: string
    }

    const prompt = body.prompt?.trim()

    if (!prompt) {
      return Response.json(
        { error: "Vui lòng nhập nội dung cần hỏi OpenAI." },
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
                "Bạn là trợ lý học từ vựng tiếng Anh cho ứng dụng NSVD Vocab. Trả lời ngắn gọn, rõ ràng, ưu tiên tiếng Việt. Nếu phù hợp, hãy đưa ví dụ hoặc gợi ý học từ vựng thực tế.",
            },
          ],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: prompt }],
        },
      ],
    })

    const text = response.output_text.trim()

    return Response.json({
      text: text || "OpenAI chưa trả về nội dung.",
    })
  } catch (error) {
    console.error("OpenAI route error:", error)

    return Response.json(
      { error: "Không thể gọi OpenAI lúc này. Vui lòng thử lại sau." },
      { status: 500 }
    )
  }
}
