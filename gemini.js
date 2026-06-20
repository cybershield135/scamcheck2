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
