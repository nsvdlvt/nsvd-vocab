import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return Response.json(
      { error: "Thiếu cấu hình GEMINI_API_KEY trên server." },
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
        { error: "Vui lòng nhập nội dung cần hỏi Gemini." },
        { status: 400 }
      )
    }

    const client = new GoogleGenerativeAI(apiKey)
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" })

    const result = await model.generateContent([
      "Bạn là trợ lý học từ vựng tiếng Anh cho ứng dụng NSVD Vocab.",
      "Trả lời ngắn gọn, rõ ràng, ưu tiên tiếng Việt.",
      "Nếu phù hợp, hãy đưa ví dụ hoặc gợi ý học từ vựng thực tế.",
      prompt,
    ])

    const text = result.response.text().trim()

    return Response.json({
      text: text || "Gemini chưa trả về nội dung.",
    })
  } catch (error) {
    console.error("Gemini route error:", error)

    return Response.json(
      { error: "Không thể gọi Gemini lúc này. Vui lòng thử lại sau." },
      { status: 500 }
    )
  }
}
