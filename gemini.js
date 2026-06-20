import CONFIG from './config.js';

export async function analyzeMessage(text) {
    const prompt = `
    Bạn là một chuyên gia bảo mật và tâm lý học tại Việt Nam. Hãy phân tích tin nhắn sau để tìm dấu hiệu lừa đảo:
    "${text}"

    Hãy trả về kết quả dưới định dạng JSON như sau:
    {
      "riskScore": (số từ 0-100),
      "riskLevel": "An toàn" | "Nghi ngờ" | "Nguy hiểm",
      "riskTitle": "Tiêu đề ngắn gọn về kết quả",
      "riskDescription": "Mô tả chi tiết về rủi ro",
      "signs": ["dấu hiệu 1", "dấu hiệu 2", ...],
      "highlightedText": "Đoạn văn bản chứa nội dung nghi vấn nhất",
      "recommendations": {
        "shouldDo": ["hành động nên làm 1", "hành động nên làm 2"],
        "shouldNotDo": ["hành động không nên làm 1", "hành động không nên làm 2"]
      },
      "detectiveOpinion": "Phân tích logic, kỹ thuật của thám tử",
      "psychologistOpinion": "Lời khuyên nhẹ nhàng, ấm áp của cô tâm lý (chỉ cần nếu rủi ro >= Nghi ngờ)",
      "emergencyActions": {
        "transfer": ["bước 1", "bước 2"],
        "link": ["bước 1", "bước 2"],
        "otp": ["bước 1", "bước 2"]
      },
      "links": [
        { "url": "url 1", "status": "Nguy hiểm" | "Cảnh báo" | "An toàn", "reason": "lý do" }
      ]
    }
    Lưu ý: Chỉ trả về duy nhất JSON, không thêm văn bản khác. Nếu không có link, để mảng links trống.
    `;

    return callGemini(prompt);
}

export async function scanLink(url) {
    const prompt = `
    Bạn là chuyên gia phân tích bảo mật. Hãy soi đường dẫn (URL) sau: "${url}"
    Hãy kiểm tra xem nó có phải là link giả mạo ngân hàng, link rút gọn chứa mã độc, hay domain bất thường không.
    Trả về JSON:
    {
      "url": "${url}",
      "status": "Nguy hiểm" | "Cảnh báo" | "An toàn",
      "riskScore": (0-100),
      "analysis": "Phân tích chi tiết về domain và độ tin cậy",
      "recommendation": "Lời khuyên cụ thể cho người dùng"
    }
    `;
    return callGemini(prompt);
}

async function callGemini(prompt) {
    try {
        // Đảm bảo URL luôn đúng phiên bản v1
        const apiUrl = CONFIG.API_URL;

        const response = await fetch(`${apiUrl}?key=${CONFIG.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            console.error('API Error Details:', errData);
            throw new Error(errData.error?.message || 'API request failed');
        }
        
        const data = await response.json();
        const resultText = data.candidates[0].content.parts[0].text;
        
        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error('Invalid AI response format');
    } catch (error) {
        console.error('Error calling Gemini:', error);
        throw error;
    }
}
