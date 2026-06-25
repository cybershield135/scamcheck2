const API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const DETECTIVE_PROMPT = (text) => `
Bạn là Thám tử AI — chuyên gia phân tích lừa đảo tại Việt Nam.
Giọng khô khan, lý tính, như điều tra viên. Không trấn an, không đồng cảm.

Phân tích tin nhắn sau:
"${text}"

Trả về DUY NHẤT JSON với cấu trúc cố định:
{
  "riskScore": 0,
  "riskLevel": "An toàn",
  "riskTitle": "Tiêu đề ngắn gọn",
  "riskDescription": "Mô tả chi tiết",
  "signs": [
    { "description": "Mô tả dấu hiệu", "excerpt": "Đoạn trích nguyên văn từ tin gốc" }
  ],
  "actions": ["Hành động 1", "Hành động 2", "Hành động 3"],
  "detectiveOpinion": "2-4 câu phân tích kỹ thuật"
}

Quy tắc:
- riskLevel chỉ được là "An toàn", "Nghi ngờ" hoặc "Nguy hiểm".
- signs: mỗi dấu hiệu phải có excerpt là đoạn trích NGUYÊN VĂN từ tin gốc.
- actions: đúng 3 hành động cụ thể người dùng nên làm hoặc không nên làm.
- Không markdown, không giải thích ngoài JSON.
`;

const PSYCHOLOGIST_PROMPT = (text, riskLevel) => `
Bạn là Cô tâm lý — giọng gần gũi, ấm áp.
Xưng "cô", gọi người dùng là "bác". Không hù doạ, không lên giọng dạy dỗ.

Tin nhắn nghi ngờ (mức ${riskLevel}):
"${text}"

Viết đúng 2-3 câu giải thích chiêu thức tâm lý kẻ lừa đảo đã dùng.
Không phân tích kỹ thuật, không liệt kê bằng chứng, không nhắc số hotline.
Chỉ trả về văn bản thuần, không JSON, không markdown.
`;

const LINK_PROMPT = (url) => `
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

async function callGemini(apiKey, prompt) {
    const response = await fetch(`${API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || "Gemini API request failed");
    }

    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) {
        throw new Error("Empty Gemini response");
    }

    return resultText;
}

function extractJson(text) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("Invalid Gemini JSON format");
    }
    return JSON.parse(jsonMatch[0]);
}

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

        const { type, text, url, riskLevel } = req.body || {};
        let prompt = "";

        if (type === "detective") {
            if (!text) {
                return res.status(400).json({ error: "Missing message text" });
            }
            prompt = DETECTIVE_PROMPT(text);
        } else if (type === "psychologist") {
            if (!text) {
                return res.status(400).json({ error: "Missing message text" });
            }
            prompt = PSYCHOLOGIST_PROMPT(text, riskLevel || "Nghi ngờ");
        } else if (type === "link") {
            if (!url) {
                return res.status(400).json({ error: "Missing URL" });
            }
            prompt = LINK_PROMPT(url);
        } else if (type === "message") {
            if (!text) {
                return res.status(400).json({ error: "Missing message text" });
            }
            prompt = DETECTIVE_PROMPT(text);
        } else {
            return res.status(400).json({ error: "Invalid request type" });
        }

        const resultText = await callGemini(GEMINI_API_KEY, prompt);

        if (type === "psychologist") {
            return res.status(200).json({ opinion: resultText.trim() });
        }

        return res.status(200).json(extractJson(resultText));
    } catch (error) {
        console.error("Backend error:", error);
        return res.status(500).json({
            error: error.message || "Internal server error"
        });
    }
}
