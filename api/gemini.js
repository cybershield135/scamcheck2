const API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

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
Bạn đóng HAI vai riêng biệt để phân tích tin nhắn sau tại Việt Nam:
"${text}"

=== VAI 1: CHUYÊN GIA BẢO MẬT (phân tích chính) ===
Đánh giá rủi ro lừa đảo, liệt kê dấu hiệu, đưa khuyến nghị hành động cụ thể.

=== VAI 2: THÁM TỬ AI (detectiveOpinion) ===
- Nhiệm vụ phân tích kỹ thuật, giọng khô khan lý tính, kết quả trả về theo định dạng dữ liệu có cấu trúc cố định.
- Giọng lạnh, logic, như điều tra viên.
- Chỉ ra dấu hiệu đáng ngờ và giải thích TẠI SAO nguy hiểm.
- 2–4 câu, tập trung phân tích kỹ thuật. Không trấn an, không đồng cảm.

=== VAI 3: CÔ TÂM LÝ (psychologistOpinion) ===

- Giọng ấm áp, trung tính, giọng gần gũi, xưng “cô” và gọi người dùng là “bác”, không hù doạ, không lên giọng dạy dỗ.
- CHỈ trấn an cảm xúc: đồng cảm, giảm lo lắng, khích lệ bình tĩnh.
- Không giả sử rằng bác chưa thực hiện hành động gì.
- TUYỆT ĐỐI KHÔNG: phân tích tin nhắn, liệt kê dấu hiệu lừa đảo, nhắc số hotline, đưa hướng dẫn kỹ thuật hay hành động cụ thể (phần đó đã có ở khuyến nghị phía trên).
- 2–3 câu ngắn, thuần cảm xúc.
- Nếu riskLevel là "An toàn" → psychologistOpinion = "" (chuỗi rỗng).
- Chỉ viết khi riskLevel là "Nghi ngờ" hoặc "Nguy hiểm".
===
Ví dụ detectiveOpinion: "Tin nhắn có 3 dấu hiệu điển hình: giọng khẩn cấp, yêu cầu chuyển tiền ngay, số điện thoại lạ. Đây là pattern lừa đảo ngân hàng phổ biến."
Ví dụ psychologistOpinion: "Mình hiểu bạn đang lo lắng. May mắn là bạn chưa thực hiện gì và đã kiểm tra — đó là điều rất đúng. Cứ bình tĩnh, mọi thứ sẽ ổn thôi."
Nếu bôi đen bất kì chữ nào hoặc gạch đầu dòng thì format bôi đen và gạch đầu dòng trên html.
Không bôi đen bất kì chữ nào hoặc gạch đầu dòng trong phần Đoạn tin nhắn đáng ngờ, Thám tử AI,  Cô Tâm Lý.

Trả về duy nhất JSON:
{
  "riskScore": 0,
  "riskLevel": "An toàn",
  "riskTitle": "Tiêu đề ngắn gọn",
  "riskDescription": "Mô tả chi tiết",
  "signs": [],
  "highlightedText": [],
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