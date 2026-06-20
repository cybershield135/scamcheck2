const HISTORY_KEY = 'scamcheck_history';
const MAX_HISTORY = 10;

export function saveToHistory(text, result) {
    let history = getHistory();
    const newItem = {
        id: Date.now(),
        timestamp: new Date().toLocaleString('vi-VN'),
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        riskLevel: result.riskLevel,
        riskScore: result.riskScore,
        fullResult: result
    };
    
    history.unshift(newItem);
    if (history.length > MAX_HISTORY) {
        history = history.slice(0, MAX_HISTORY);
    }
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return history;
}

export function getHistory() {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
}

export function deleteHistoryItem(id) {
    let history = getHistory();
    history = history.filter(item => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return history;
}

export function clearAllHistory() {
    localStorage.removeItem(HISTORY_KEY);
    return [];
}
