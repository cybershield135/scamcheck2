const DEFAULT_RESULT = {
    riskScore: 50,
    riskLevel: "Nghi ngờ",
    riskTitle: "Không thể phân tích đầy đủ",
    riskDescription: "Hệ thống chưa nhận được kết quả đúng định dạng. Bác hãy thận trọng và không bấm link, không chuyển tiền cho đến khi kiểm tra lại.",
    signs: ["Kết quả phân tích chưa đầy đủ — hãy thử lại hoặc hỏi người thân."],
    excerpts: [],
    actions: [
        "Không bấm vào bất kỳ đường dẫn nào trong tin nhắn.",
        "Gọi tổng đài ngân hàng in trên thẻ nếu tin liên quan đến tài khoản.",
        "Hỏi con cháu hoặc người thân trước khi làm theo yêu cầu trong tin."
    ],
    detectiveOpinion: "Phân tích tạm thời chưa đủ dữ liệu. Bác nên giữ bình tĩnh và không thực hiện giao dịch nào."
};

function asString(value, fallback = "") {
    if (typeof value === "string") return value.trim();
    if (value == null) return fallback;
    return String(value).trim();
}

function asArray(value) {
    if (Array.isArray(value)) {
        return value.map((item) => asString(item)).filter(Boolean);
    }
    if (typeof value === "string" && value.trim()) {
        return [value.trim()];
    }
    return [];
}

function normalizeRiskLevel(level, score) {
    const normalized = asString(level);
    if (["An toàn", "Nghi ngờ", "Nguy hiểm"].includes(normalized)) {
        return normalized;
    }
    if (score <= 30) return "An toàn";
    if (score <= 70) return "Nghi ngờ";
    return "Nguy hiểm";
}

function normalizeActions(raw) {
    const fromRecommendations = raw?.recommendations;
    if (Array.isArray(fromRecommendations)) {
        return fromRecommendations.map((item) => asString(item)).filter(Boolean).slice(0, 3);
    }

    const shouldDo = asArray(fromRecommendations?.shouldDo);
    const shouldNotDo = asArray(fromRecommendations?.shouldNotDo);
    const combined = [];

    for (const item of shouldDo) combined.push(item);
    for (const item of shouldNotDo) combined.push(`Không ${item.replace(/^không\s+/i, "")}`);

    if (combined.length >= 3) return combined.slice(0, 3);

    const direct = asArray(raw?.actions);
    if (direct.length >= 3) return direct.slice(0, 3);

    return DEFAULT_RESULT.actions;
}

function normalizeExcerpts(raw) {
    const excerpts = asArray(raw?.excerpts);
    if (excerpts.length > 0) return excerpts;

    if (Array.isArray(raw?.signs)) {
        const fromSigns = raw.signs
            .map((item) => (typeof item === "object" ? item?.excerpt : null))
            .filter(Boolean)
            .map((item) => asString(item))
            .filter(Boolean);
        if (fromSigns.length) return fromSigns;
    }

    const highlighted = raw?.highlightedText;
    if (Array.isArray(highlighted)) return asArray(highlighted);
    if (typeof highlighted === "string" && highlighted.trim()) return [highlighted.trim()];

    return [];
}

function normalizeSignDescriptions(raw) {
    if (!Array.isArray(raw?.signs)) return asArray(raw?.signs);

    return raw.signs
        .map((item) => {
            if (typeof item === "string") return item;
            if (item && typeof item === "object") {
                return asString(item.description || item.sign);
            }
            return "";
        })
        .filter(Boolean);
}

export function parseDetectiveResult(raw, originalText = "") {
    if (!raw || typeof raw !== "object") {
        return { ...DEFAULT_RESULT, originalText };
    }

    const riskScore = Number.isFinite(Number(raw.riskScore))
        ? Math.max(0, Math.min(100, Math.round(Number(raw.riskScore))))
        : DEFAULT_RESULT.riskScore;

    const actions = normalizeActions(raw);
    const excerpts = normalizeExcerpts(raw);

    return {
        riskScore,
        riskLevel: normalizeRiskLevel(raw.riskLevel, riskScore),
        riskTitle: asString(raw.riskTitle, DEFAULT_RESULT.riskTitle),
        riskDescription: asString(raw.riskDescription, DEFAULT_RESULT.riskDescription),
        signs: normalizeSignDescriptions(raw).length ? normalizeSignDescriptions(raw) : DEFAULT_RESULT.signs,
        excerpts,
        actions: actions.length === 3 ? actions : DEFAULT_RESULT.actions,
        detectiveOpinion: asString(raw.detectiveOpinion, DEFAULT_RESULT.detectiveOpinion),
        originalText,
        links: Array.isArray(raw.links) ? raw.links.filter(Boolean) : [],
        emergencyActions: raw.emergencyActions || null
    };
}

export function buildHighlightedHtml(originalText, excerpts) {
    if (!originalText) return "";
    if (!excerpts.length) {
        return `<span class="whitespace-pre-wrap">${escapeHtml(originalText)}</span>`;
    }

    let html = escapeHtml(originalText);
    const sorted = [...excerpts].sort((a, b) => b.length - a.length);

    for (const excerpt of sorted) {
        const trimmed = excerpt.trim();
        if (!trimmed) continue;
        const escaped = escapeHtml(trimmed);
        if (!html.includes(escaped)) continue;
        html = html.replace(
            escaped,
            `<mark class="bg-yellow-200 px-1 rounded">${escaped}</mark>`
        );
    }

    return `<span class="whitespace-pre-wrap">${html}</span>`;
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
