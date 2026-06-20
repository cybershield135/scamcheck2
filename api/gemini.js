const API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            return res.status(500).json({
                error: "Missing GEMINI_API_KEY on backend"
            });
        }

        const { type, text, url } = req.body || {};

        let prompt = "";

        if (type === "message") {
            if (!text) {
                return res.status(400).json({ error: "Missing message text" });
            }

            prompt = `
Bạn là một chuyên gia bảo mật và tâm lý học tại Việt Nam. Hãy phân tích tin nhắn sau:
"${text}"

Trả về duy nhất JSON:
{
  "riskScore": 0,
  "riskLevel": "An toàn",
  "riskTitle": "Tiêu đề ngắn gọn",
  "riskDescription": "Mô tả chi tiết",
  "signs": [],
  "highlightedText": "",
  "recommendations": {
    "shouldDo": [],
    "shouldNotDo": []
  },
  "detectiveOpinion": "",
  "psychologistOpinion": "",
  "emergencyActions": {
    "transfer": [],
    "link": [],
    "otp": []
  },
  "links": []
}
`;
        } else if (type === "link") {
            if (!url) {
                return res.status(400).json({ error: "Missing URL" });
            }

            prompt = `
Bạn là chuyên gia phân tích bảo mật. Hãy soi đường dẫn sau:
"${url}"

Trả về duy nhất JSON:
{
  "url": "${url}",
  "status": "Cảnh báo",
  "riskScore": 0,
  "analysis": "Phân tích chi tiết",
  "recommendation": "Lời khuyên cụ thể"
}
`;
        } else {
            return res.status(400).json({ error: "Invalid request type" });
        }

        const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: prompt }]
                    }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini API error:", data);
            return res.status(response.status).json({
                error: data.error?.message || "Gemini API request failed"
            });
        }

        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!resultText) {
            return res.status(500).json({
                error: "Empty Gemini response"
            });
        }

        const jsonMatch = resultText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            return res.status(500).json({
                error: "Invalid Gemini JSON format",
                raw: resultText
            });
        }

        return res.status(200).json(JSON.parse(jsonMatch[0]));
    } catch (error) {
        console.error("Backend error:", error);
        return res.status(500).json({
            error: error.message || "Internal server error"
        });
    }
}