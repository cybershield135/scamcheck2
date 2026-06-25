let hotlinesCache = null;

export async function loadHotlines() {
    if (hotlinesCache) return hotlinesCache;
    const response = await fetch("/data/hotlines.json");
    hotlinesCache = await response.json();
    return hotlinesCache;
}

export function formatHotlinesForPrompt(hotlines) {
    const lines = [];
    for (const bank of hotlines.banks) {
        lines.push(`${bank.name}: ${bank.phone}`);
    }
    for (const auth of hotlines.authorities) {
        lines.push(`${auth.name}: ${auth.phone}`);
    }
    return lines.join("\n");
}

export const SCENARIO_LABELS = {
    nothing: "Chưa làm gì",
    link: "Đã bấm vào đường dẫn",
    transfer: "Đã chuyển khoản",
    otp: "Đã cung cấp mã xác thực"
};

export const NOTHING_PRAISE =
    "Bác làm rất đúng khi chưa thực hiện gì và đã kiểm tra tin nhắn trước. Cứ giữ bình tĩnh, xóa tin nhắn lạ và chặn số gửi nhé.";

export async function callRescuer({ text, riskLevel, scenario, riskTitle }) {
    const hotlines = await loadHotlines();

    const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            type: "rescuer",
            text,
            riskLevel,
            scenario,
            riskTitle,
            hotlines
        })
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Không gọi được Người ứng cứu");
    }

    return response.json();
}
