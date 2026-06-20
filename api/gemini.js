import CONFIG from "./config.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        if (!CONFIG.GEMINI_API_KEY) {
            return res.status(500).json({
                error: "Missing GEMINI_API_KEY on backend"
            });
        }

        const { type, text, url } = req.body;

        let prompt = "";

        if (type === "message") {
            if (!text) {
                return res.status(400).json({ error: "Missing message text" });
            }

            prompt = `
Bạn là một chuyên gia bảo mật và tâm lý học tại Việt Nam. Hãy phân tích tin nhắn sau để tìm dấu hiệu lừa đảo:
"${text}"

Hãy trả về duy nhất JSON theo mẫu:
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

Chỉ trả về JSON, không thêm giải thích ngoài JSON.
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
  "status": "Nguy hiểm",
  "riskScore": 0,
  "analysis": "Phân tích chi tiết",
  "recommendation": "Lời khuyên cụ thể"
}

Chỉ trả về JSON, không thêm giải thích ngoài JSON.
`;
        } else {
            return res.status(400).json({ error: "Invalid request type" });
        }

        const response = await fetch(`${CONFIG.API_URL}?key=${CONFIG.GEMINI_API_KEY}`, {
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

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error("Gemini API error:", errData);

            return res.status(response.status).json({
                error: errData.error?.message || "Gemini API request failed"
            });
        }

        const data = await response.json();
        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!resultText) {
            return res.status(500).json({
                error: "Empty Gemini response"
            });
        }

        const jsonMatch = resultText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            return res.status(500).json({
                error: "Invalid Gemini JSON format"
            });
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return res.status(200).json(parsed);
    } catch (error) {
        console.error("Backend error:", error);

        return res.status(500).json({
            error: error.message || "Internal server error"
        });
    }
}


export async function handleFullAnalysis(text) {
    const detectiveResult = await analyzeMessageWithDetective(text); 
    
    let psychologistOpinion = null;
    let isPsychologistError = false;
    if (detectiveResult.riskLevel === "Nghi ngờ" || detectiveResult.riskLevel === "Nguy hiểm") {
        try {
            psychologistOpinion = await analyzeMessageWithPsychologist(text);
        } catch (error) {
            console.error("Lỗi tầng Cô tâm lý:", error);
            isPsychologistError = true;
            psychologistOpinion = "Bác ơi, hiện tại cô đang bận hỗ trợ một ca trực tuyến khác mất rồi. Bác xem trước kết quả từ Thám tử AI giúp cô và hãy thử hỏi lại cô sau nhé ạ!";
        }
    }

    return {
        detective: detectiveResult,
        psychologist: psychologistOpinion,
        isPsychologistError: isPsychologistError
    };
}