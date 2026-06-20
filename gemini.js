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

    const responseText = await response.text();

    let data;
    try {
        data = JSON.parse(responseText);
    } catch {
        data = { error: responseText };
    }

    if (!response.ok) {
        console.error("Backend status:", response.status);
        console.error("Backend response:", data);
        throw new Error(data.error || `Backend error ${response.status}`);
    }

    return data;
}
