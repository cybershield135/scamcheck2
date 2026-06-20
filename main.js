import { UI } from './ui.js';
import { analyzeMessage } from './gemini.js';
import { saveToHistory, getHistory, clearAllHistory } from './storage.js';
import { initQuiz, initLibrary, initLinkScanner, initCanvasShare } from './features.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Features
    initQuiz();
    initLibrary();
    initLinkScanner(UI);
    
    let lastResult = null;

    // TTS Toggle
    UI.ttsToggle.addEventListener('click', () => {
        UI.ttsEnabled = !UI.ttsEnabled;
        UI.ttsToggle.innerText = UI.ttsEnabled ? '🔊' : '🔇';
        UI.ttsToggle.classList.toggle('bg-slate-100');
        UI.ttsToggle.classList.toggle('bg-primary');
        UI.ttsToggle.classList.toggle('text-white');
    });

    // Initial history render
    UI.renderHistory(getHistory(), (result) => {
        UI.renderResult(result);
        lastResult = result;
        UI.resultArea.classList.remove('hidden');
        UI.resultDashboard.classList.remove('hidden');
        UI.resultArea.scrollIntoView({ behavior: 'smooth' });
    });

    // Check button click
    UI.checkBtn.addEventListener('click', async () => {
        const text = UI.messageInput.value.trim();
        if (!text) {
            alert('Vui lòng nhập nội dung tin nhắn!');
            return;
        }

        UI.showLoading();

        try {
            const result = await analyzeMessage(text);
            UI.hideLoading();
            UI.renderResult(result);
            lastResult = result;
            
            const newHistory = saveToHistory(text, result);
            UI.renderHistory(newHistory, (res) => {
                UI.renderResult(res);
                lastResult = res;
                UI.resultArea.classList.remove('hidden');
                UI.resultDashboard.classList.remove('hidden');
                UI.resultArea.scrollIntoView({ behavior: 'smooth' });
            });
        } catch (error) {
            UI.hideLoading();
            alert('Có lỗi xảy ra khi phân tích: ' + error.message);
            console.error(error);
        }
    });

    // Sample cards click
    document.querySelectorAll('.sample-card').forEach(card => {
        card.addEventListener('click', () => {
            UI.messageInput.value = card.dataset.text;
            UI.messageInput.focus();
            UI.checkBtn.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Paste button
    UI.pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            UI.messageInput.value = text;
        } catch (err) {
            console.error('Failed to read clipboard:', err);
        }
    });

    // Voice button (Mock)
    UI.voiceBtn.addEventListener('click', () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.');
            return;
        }
        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'vi-VN';
        recognition.start();
        UI.voiceBtn.innerText = 'Listening...';
        recognition.onresult = (event) => {
            UI.messageInput.value = event.results[0][0].transcript;
            UI.voiceBtn.innerText = '🎤 Giọng nói';
        };
        recognition.onerror = () => {
            UI.voiceBtn.innerText = '🎤 Giọng nói';
        };
    });

    // Emergency buttons
    document.querySelectorAll('.emergency-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            UI.renderEmergencyTimeline(btn.dataset.type);
        });
    });

    // Clear history
    UI.clearAllHistory.addEventListener('click', () => {
        if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử?')) {
            UI.renderHistory(clearAllHistory(), () => {});
        }
    });

    // Share button
    UI.shareBtn.addEventListener('click', () => {
        if (lastResult) {
            initCanvasShare(lastResult);
        } else {
            alert('Vui lòng thực hiện kiểm tra trước khi lưu thẻ!');
        }
    });
});
