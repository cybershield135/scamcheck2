export async function analyzeMessage(text) {
    return callBackend({
        type: "message",
        text
    });
}

export async function scanLink(url) {
    return callBackend({
        type: "link",
        url
    });
}

async function callBackend(payload) {
    const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Backend request failed");
    }

    return response.json();
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