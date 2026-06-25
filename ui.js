import { buildHighlightedHtml } from './parseResult.js';

export const UI = {
    // Elements
    messageInput: document.getElementById('messageInput'),
    inputBox: document.getElementById('inputBox'),
    inputError: document.getElementById('inputError'),
    charCount: document.getElementById('charCount'),
    checkBtn: document.getElementById('checkBtn'),
    voiceBtn: document.getElementById('voiceBtn'),
    pasteBtn: document.getElementById('pasteBtn'),
    resultArea: document.getElementById('resultArea'),
    loadingState: document.getElementById('loadingState'),
    resultDashboard: document.getElementById('resultDashboard'),
    riskCard: document.getElementById('riskCard'),
    riskCircle: document.getElementById('riskCircle'),
    riskPercent: document.getElementById('riskPercent'),
    riskLevelBadge: document.getElementById('riskLevelBadge'),
    riskTitle: document.getElementById('riskTitle'),
    riskDesc: document.getElementById('riskDesc'),
    signsList: document.getElementById('signsList'),
    highlightedText: document.getElementById('highlightedText'),
    shouldDo: document.getElementById('shouldDo'),
    detectiveOpinion: document.getElementById('detectiveOpinion'),
    psychologistCard: document.getElementById('psychologistCard'),
    psychologistOpinion: document.getElementById('psychologistOpinion'),
    crisisSection: document.getElementById('crisisSection'),
    crisisChoices: document.getElementById('crisisChoices'),
    crisisResponse: document.getElementById('crisisResponse'),
    rescuerTimeline: document.getElementById('rescuerTimeline'),
    crisisLoading: document.getElementById('crisisLoading'),
    historyList: document.getElementById('historyList'),
    clearAllHistory: document.getElementById('clearAllHistory'),
    shareBtn: document.getElementById('shareBtn'),
    linkAnalysisSection: document.getElementById('linkAnalysisSection'),
    linksList: document.getElementById('linksList'),
    linkInput: document.getElementById('linkInput'),
    scanLinkBtn: document.getElementById('scanLinkBtn'),
    linkScanResult: document.getElementById('linkScanResult'),
    linkScanError: document.getElementById('linkScanError'),
    shareNotice: document.getElementById('shareNotice'),
    libraryGrid: document.getElementById('libraryGrid'),
    ttsToggle: document.getElementById('ttsToggle'),

    // State
    ttsEnabled: true,
    crisisLocked: false,
    lastAnalysisContext: null,

    showInputError(message) {
        this.inputError.textContent = message;
        this.inputError.classList.remove('hidden');
        this.inputBox.classList.remove('border-slate-100', 'focus-within:border-primary/30');
        this.inputBox.classList.add('border-danger', 'border-2');
        this.messageInput.focus();
        this.inputError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    clearInputError() {
        this.inputError.textContent = '';
        this.inputError.classList.add('hidden');
        this.inputBox.classList.remove('border-danger');
        this.inputBox.classList.add('border-slate-100');
    },

    updateCharCount(length, max = 5000) {
        this.charCount.textContent = `${length} / ${max} ký tự`;
        if (length > max) {
            this.charCount.className = 'text-sm text-danger font-bold';
        } else if (length > max * 0.9) {
            this.charCount.className = 'text-sm text-warning font-bold';
        } else {
            this.charCount.className = 'text-sm text-muted font-semibold';
        }
    },

    showLinkError(message) {
        this.linkScanError.textContent = message;
        this.linkScanError.classList.remove('hidden');
        this.linkScanResult.classList.add('hidden');
        this.linkScanError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    clearLinkError() {
        this.linkScanError.textContent = '';
        this.linkScanError.classList.add('hidden');
    },

    showShareNotice(message, type = 'warning') {
        this.shareNotice.textContent = message;
        this.shareNotice.classList.remove('hidden', 'bg-amber-50', 'border-amber-200', 'text-amber-900', 'bg-green-50', 'border-green-200', 'text-green-800');
        if (type === 'success') {
            this.shareNotice.classList.add('bg-green-50', 'border-green-200', 'text-green-800');
        } else {
            this.shareNotice.classList.add('bg-amber-50', 'border-amber-200', 'text-amber-900');
        }
        this.shareNotice.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    clearShareNotice() {
        this.shareNotice.classList.add('hidden');
        this.shareNotice.textContent = '';
    },

    showLoading() {
        this.clearInputError();
        this.resultArea.classList.remove('hidden');
        this.loadingState.classList.remove('hidden');
        this.resultDashboard.classList.add('hidden');
        this.resultArea.scrollIntoView({ behavior: 'smooth' });
    },

    hideLoading() {
        this.loadingState.classList.add('hidden');
        this.resultDashboard.classList.remove('hidden');
    },

    renderResult(result) {
        // Risk Score & Circle
        const score = result.riskScore;
        this.riskPercent.innerText = `${score}%`;
        this.riskCircle.setAttribute('stroke-dasharray', `${score}, 100`);
        
        let colorClass = 'bg-success';
        let strokeColor = '#22C55E';
        if (score > 70) {
            colorClass = 'bg-danger';
            strokeColor = '#EF4444';
        } else if (score > 30) {
            colorClass = 'bg-warning';
            strokeColor = '#F59E0B';
        }
        
        this.riskCircle.style.color = strokeColor;
        this.riskLevelBadge.className = `inline-block px-4 py-1 rounded-full text-white font-bold mb-4 text-sm ${colorClass}`;
        this.riskLevelBadge.innerText = result.riskLevel;
        this.riskCard.className = `p-8 rounded-3xl mb-8 flex flex-col md:flex-row items-center gap-8 shadow-xl border-2 ${colorClass.replace('bg-', 'border-')}/20 ${colorClass.replace('bg-', 'bg-')}/5`;

        this.riskTitle.innerText = result.riskTitle;
        this.riskDesc.innerText = result.riskDescription;

        // Signs
        this.signsList.innerHTML = result.signs.map(sign => `
            <div class="flex items-start gap-3">
                <span class="text-warning text-xl">⚠️</span>
                <p class="font-medium text-slate-700">${sign}</p>
            </div>
        `).join('');

        const excerpts = result.excerpts || [];
        const originalText = result.originalText || '';
        this.highlightedText.innerHTML = buildHighlightedHtml(originalText, excerpts);

        // Recommendations — exactly 3 actions (L2-05)
        const actions = result.actions || [
            ...(result.recommendations?.shouldDo || []),
            ...(result.recommendations?.shouldNotDo || [])
        ].slice(0, 3);

        this.shouldDo.innerHTML = actions.map((item, index) => `
            <li class="flex items-start gap-2 mb-2 text-lg">
                <span class="text-primary font-bold">${index + 1}.</span>
                <span class="text-slate-700">${item}</span>
            </li>
        `).join('');

        // Link Analysis (Cấp 4-B)
        if (result.links && result.links.length > 0) {
            this.linkAnalysisSection.classList.remove('hidden');
            this.linksList.innerHTML = result.links.map(link => {
                const isDanger = link.status === 'Nguy hiểm';
                const isWarn = link.status === 'Nghi ngờ';
                const border = isDanger ? 'border-danger/20 bg-danger/5' : isWarn ? 'border-warning/20 bg-warning/5' : 'border-success/20 bg-success/5';
                const badge = isDanger ? 'bg-danger' : isWarn ? 'bg-warning' : 'bg-success';
                return `
                <div class="p-4 rounded-2xl border-2 ${border}">
                    <div class="flex flex-wrap justify-between items-center gap-2 mb-2">
                        <span class="font-mono font-bold break-all text-base">${link.url}</span>
                        <span class="px-3 py-1 rounded-full text-xs font-bold text-white ${badge}">${link.status}</span>
                    </div>
                    <p class="text-sm text-slate-600">${link.reason}</p>
                    ${isDanger ? '<p class="text-danger font-bold text-sm mt-2">⚠️ KHÔNG bấm vào link này!</p>' : ''}
                </div>
            `}).join('');
        } else {
            this.linkAnalysisSection.classList.add('hidden');
        }

        // Opinions
        this.detectiveOpinion.innerText = `"${result.detectiveOpinion}"`;
        if (result.psychologistOpinion) {
            this.psychologistCard.classList.remove('hidden');
            this.psychologistOpinion.innerText = `"${result.psychologistOpinion}"`;
            if (result.isPsychologistError) {
                this.psychologistOpinion.classList.add('text-slate-500', 'italic');
            } else {
                this.psychologistOpinion.classList.remove('text-slate-500', 'italic');
            }
        } else {
            this.psychologistCard.classList.add('hidden');
        }

        // Crisis section (Cấp 5) — show for risky messages
        this.lastAnalysisContext = result;
        this.crisisLocked = false;
        this.crisisResponse.classList.add('hidden');
        this.rescuerTimeline.innerHTML = '';
        this.crisisLoading.classList.add('hidden');
        this.crisisChoices.querySelectorAll('.crisis-btn').forEach((btn) => {
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'ring-4', 'ring-primary');
        });

        if (result.riskLevel === 'Nghi ngờ' || result.riskLevel === 'Nguy hiểm') {
            this.crisisSection.classList.remove('hidden');
        } else {
            this.crisisSection.classList.add('hidden');
        }

        // Speak
        if (this.ttsEnabled) {
            const firstAction = actions[0] || 'Hãy thận trọng với tin nhắn này';
            this.speak(`Kết quả phân tích: ${result.riskLevel}. ${result.riskTitle}. Lời khuyên: ${firstAction}`);
        }
    },

    renderHistory(history, onView) {
        if (history.length === 0) {
            this.historyList.innerHTML = '<div class="text-center py-12 text-muted bg-white rounded-3xl border border-slate-100">Chưa có lịch sử kiểm tra nào.</div>';
            return;
        }

        this.historyList.innerHTML = history.map(item => `
            <div class="bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center group hover:border-primary hover:shadow-lg transition-all">
                <div class="flex-grow">
                    <div class="flex items-center gap-3 mb-1">
                        <span class="text-[10px] font-bold text-muted uppercase tracking-widest">${item.timestamp}</span>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold text-white ${item.riskScore > 70 ? 'bg-danger' : (item.riskScore > 30 ? 'bg-warning' : 'bg-success')}">${item.riskLevel}</span>
                    </div>
                    <p class="text-slate-700 font-bold line-clamp-1">${item.text}</p>
                </div>
                <button class="view-history-btn text-primary font-bold px-6 py-2 rounded-xl hover:bg-blue-50 transition-colors" data-id="${item.id}">Xem lại</button>
            </div>
        `).join('');

        document.querySelectorAll('.view-history-btn').forEach(btn => {
            btn.onclick = () => {
                const id = parseInt(btn.dataset.id);
                const item = history.find(h => h.id === id);
                onView(item.fullResult);
            };
        });
    },

    renderRescuerSteps(steps) {
        this.rescuerTimeline.innerHTML = (steps || []).map((step, index) => `
            <div class="flex gap-4 fade-in">
                <div class="flex flex-col items-center">
                    <div class="w-10 h-10 bg-danger text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 shadow-lg shadow-red-200">${index + 1}</div>
                    ${index < steps.length - 1 ? '<div class="w-0.5 h-full bg-danger/20 my-1"></div>' : ''}
                </div>
                <div class="pb-6 flex-grow">
                    <p class="text-lg font-bold text-slate-800 mb-2">${step.action}</p>
                    ${step.script ? `<p class="text-slate-600 italic bg-white p-4 rounded-xl border border-slate-200">📞 "${step.script}"</p>` : ''}
                </div>
            </div>
        `).join('');
        this.rescuerTimeline.scrollIntoView({ behavior: 'smooth' });
    },

    showCrisisPraise(message) {
        this.crisisResponse.classList.remove('hidden');
        this.crisisResponse.className = 'p-6 rounded-2xl bg-green-50 border border-green-200 mb-6 text-lg leading-relaxed text-green-900 font-medium';
        this.crisisResponse.textContent = message;
    },

    lockCrisisChoice(selectedBtn) {
        this.crisisLocked = true;
        this.crisisChoices.querySelectorAll('.crisis-btn').forEach((btn) => {
            btn.disabled = true;
            btn.classList.add('opacity-50');
        });
        selectedBtn.classList.remove('opacity-50');
        selectedBtn.classList.add('ring-4', 'ring-primary');
    },

    renderLinkScan(result) {
        this.linkScanResult.classList.remove('hidden');
        const color = result.status === 'Nguy hiểm' ? 'danger' : (result.status === 'An toàn' ? 'success' : 'warning');
        this.linkScanResult.innerHTML = `
            <div class="p-8 bg-white rounded-3xl border-2 border-${color}/20 shadow-xl text-left">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <span class="px-4 py-1 rounded-full text-white font-bold text-sm bg-${color}">${result.status}</span>
                        <h4 class="text-2xl font-extrabold mt-3 break-all">${result.url}</h4>
                    </div>
                    <div class="text-right">
                        <span class="text-4xl font-black text-${color}">${result.riskScore}%</span>
                        <p class="text-xs font-bold text-muted">RỦI RO</p>
                    </div>
                </div>
                <p class="text-slate-700 mb-6 leading-relaxed">${result.analysis}</p>
                <div class="p-4 bg-${color}/5 rounded-2xl border-l-4 border-${color}">
                    <p class="font-bold text-${color}">💡 Lời khuyên:</p>
                    <p class="text-slate-800">${result.recommendation}</p>
                </div>
            </div>
        `;
        this.linkScanResult.scrollIntoView({ behavior: 'smooth' });
    },

    speak(text) {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }
};