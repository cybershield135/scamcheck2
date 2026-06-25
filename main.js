import { UI } from './ui.js';
import { analyzeMessage } from './gemini.js';
import { saveToHistory, getHistory, clearAllHistory } from './storage.js';
import { initQuiz, initLibrary, initLinkScanner, initCanvasShare } from './features.js';
import { callRescuer, NOTHING_PRAISE } from './rescuer.js';

const MAX_MESSAGE_LENGTH = 5000;

function validateMessage(text) {
    if (!text.trim()) {
        return 'Bác vui lòng dán nội dung tin nhắn trước khi bấm Kiểm tra nhé.';
    }
    if (text.length > MAX_MESSAGE_LENGTH) {
        return `Tin nhắn quá dài (${text.length} ký tự). Bác hãy rút gọn dưới ${MAX_MESSAGE_LENGTH} ký tự rồi thử lại.`;
    }
    return null;
}

function getFriendlyErrorMessage(error) {
    const message = (error?.message || '').toLowerCase();

    if (!navigator.onLine || message.includes('failed to fetch') || message.includes('network')) {
        return 'Mất kết nối mạng. Bác kiểm tra Wi‑Fi/4G rồi thử lại nhé.';
    }
    if (message.includes('safety') || message.includes('blocked') || message.includes('refus')) {
        return 'AI không thể phân tích nội dung này. Bác hãy thử tin khác hoặc hỏi người thân.';
    }
    if (message.includes('json') || message.includes('invalid')) {
        return 'Kết quả phân tích chưa đầy đủ. Bác thử lại sau vài giây nhé.';
    }
    if (message.includes('quota') || message.includes('429')) {
        return 'Hệ thống đang quá tải. Bác chờ 1 phút rồi thử lại nhé.';
    }
    return 'Có lỗi khi phân tích. Bác thử lại sau hoặc hỏi người thân trước khi làm theo tin nhắn.';
}

function initCrisisFlow() {
    UI.crisisChoices.querySelectorAll('.crisis-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
            if (UI.crisisLocked) return;

            const scenario = btn.dataset.scenario;
            const ctx = UI.lastAnalysisContext;
            if (!ctx) return;

            UI.lockCrisisChoice(btn);
            UI.rescuerTimeline.innerHTML = '';
            UI.crisisResponse.classList.add('hidden');

            if (scenario === 'nothing') {
                UI.showCrisisPraise(NOTHING_PRAISE);
                return;
            }

            UI.crisisLoading.classList.remove('hidden');

            try {
                const data = await callRescuer({
                    text: ctx.originalText || '',
                    riskLevel: ctx.riskLevel,
                    scenario,
                    riskTitle: ctx.riskTitle
                });
                UI.crisisLoading.classList.add('hidden');
                UI.renderRescuerSteps(data.steps);
            } catch (error) {
                UI.crisisLoading.classList.add('hidden');
                UI.showCrisisPraise(
                    'Không tải được hướng dẫn khẩn cấp. Bác gọi ngay 113 hoặc tổng đài ngân hàng in trên thẻ.'
                );
                console.error(error);
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initQuiz();
    initLibrary();
    initLinkScanner(UI);
    initCrisisFlow();

    let lastResult = null;

    UI.ttsToggle.addEventListener('click', () => {
        UI.ttsEnabled = !UI.ttsEnabled;
        UI.ttsToggle.innerText = UI.ttsEnabled ? '🔊' : '🔇';
        UI.ttsToggle.classList.toggle('bg-slate-100');
        UI.ttsToggle.classList.toggle('bg-primary');
        UI.ttsToggle.classList.toggle('text-white');
    });

    UI.renderHistory(getHistory(), (result) => {
        UI.renderResult(result);
        lastResult = result;
        UI.resultArea.classList.remove('hidden');
        UI.resultDashboard.classList.remove('hidden');
        UI.resultArea.scrollIntoView({ behavior: 'smooth' });
    });

    UI.checkBtn.addEventListener('click', async () => {
        const text = UI.messageInput.value;
        const validationError = validateMessage(text);
        if (validationError) {
            alert(validationError);
            return;
        }

        UI.showLoading();

        try {
            const result = await analyzeMessage(text.trim());
            UI.hideLoading();
            UI.renderResult(result);
            lastResult = result;

            const newHistory = saveToHistory(text.trim(), result);
            UI.renderHistory(newHistory, (res) => {
                UI.renderResult(res);
                lastResult = res;
                UI.resultArea.classList.remove('hidden');
                UI.resultDashboard.classList.remove('hidden');
                UI.resultArea.scrollIntoView({ behavior: 'smooth' });
            });
        } catch (error) {
            UI.hideLoading();
            alert(getFriendlyErrorMessage(error));
            console.error(error);
        }
    });

    document.querySelectorAll('.sample-card').forEach(card => {
        card.addEventListener('click', () => {
            UI.messageInput.value = card.dataset.text;
            UI.messageInput.focus();
            UI.checkBtn.scrollIntoView({ behavior: 'smooth' });
        });
    });

    UI.pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            UI.messageInput.value = text;
        } catch (err) {
            console.error('Failed to read clipboard:', err);
            alert('Không đọc được clipboard. Bác thử dán thủ công (giữ và chọn Dán).');
        }
    });

    UI.voiceBtn.addEventListener('click', () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.');
            return;
        }
        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'vi-VN';
        recognition.start();
        UI.voiceBtn.innerText = 'Đang nghe...';
        recognition.onresult = (event) => {
            UI.messageInput.value = event.results[0][0].transcript;
            UI.voiceBtn.innerText = '🎤 Giọng nói';
        };
        recognition.onerror = () => {
            UI.voiceBtn.innerText = '🎤 Giọng nói';
        };
    });

    UI.clearAllHistory.addEventListener('click', () => {
        if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử?')) {
            UI.renderHistory(clearAllHistory(), () => {});
        }
    });

    UI.shareBtn.addEventListener('click', () => {
        if (lastResult) {
            initCanvasShare(lastResult);
        } else {
            alert('Vui lòng thực hiện kiểm tra trước khi lưu thẻ!');
        }
    });
});
