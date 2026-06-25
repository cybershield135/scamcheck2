import { parseDetectiveResult } from "./parseResult.js";
import { analyzeLinksInText, analyzeSingleLink } from "./linkUtils.js";

export async function analyzeMessage(text) {
    return handleFullAnalysis(text);
}

export async function scanLink(url) {
    return analyzeSingleLink(url);
}

async function callBackend(payload) {
    const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Backend request failed");
    }

    return response.json();
}

function normalizeSignsFromApi(raw) {
    if (!Array.isArray(raw?.signs)) return raw;

    const signs = [];
    const excerpts = [];

    for (const item of raw.signs) {
        if (typeof item === "string") {
            signs.push(item);
            continue;
        }
        if (item && typeof item === "object") {
            const description = item.description || item.sign || "";
            const excerpt = item.excerpt || item.quote || "";
            if (description) signs.push(description);
            if (excerpt) excerpts.push(excerpt);
        }
    }

    return {
        ...raw,
        signs,
        excerpts: excerpts.length ? excerpts : raw.excerpts
    };
}

export async function handleFullAnalysis(text) {
    const rawDetective = await callBackend({ type: "detective", text });
    const normalizedRaw = normalizeSignsFromApi(rawDetective);
    const detectiveResult = parseDetectiveResult(normalizedRaw, text);

    let psychologistOpinion = null;
    let isPsychologistError = false;

    if (
        detectiveResult.riskLevel === "Nghi ngờ" ||
        detectiveResult.riskLevel === "Nguy hiểm"
    ) {
        try {
            const psychResponse = await callBackend({
                type: "psychologist",
                text,
                riskLevel: detectiveResult.riskLevel
            });
            psychologistOpinion = psychResponse.opinion?.trim() || null;
        } catch (error) {
            console.error("Lỗi tầng Cô tâm lý:", error);
            isPsychologistError = true;
            psychologistOpinion =
                "Cô tâm lý đang bận, vui lòng thử lại sau. Bác xem trước kết quả phân tích kỹ thuật từ Thám tử AI nhé.";
        }
    }

    const links = await analyzeLinksInText(text).catch(() => []);

    return {
        ...detectiveResult,
        psychologistOpinion,
        isPsychologistError,
        links: links.map((l) => ({
            url: l.url,
            status: l.status,
            reason: l.reason
        })),
        recommendations: {
            shouldDo: detectiveResult.actions.filter((a) => !/^không/i.test(a)),
            shouldNotDo: detectiveResult.actions.filter((a) => /^không/i.test(a))
        }
    };
}
