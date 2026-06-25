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
    originalSection: document.getElementById('originalSection'),
    highlightedText: document.getElementById('highlightedText'),
    detectivePanel: document.getElementById('detectivePanel'),
    actionsPanel: document.getElementById('actionsPanel'),
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
    historyDetail: document.getElementById('historyDetail'),
    historyBackBtn: document.getElementById('historyBackBtn'),
    historyResultHost: document.getElementById('historyResultHost'),
    clearAllHistory: document.getElementById('clearAllHistory'),
    shareBtn: document.getElementById('shareBtn'),
    shareCardPreview: document.getElementById('shareCardPreview'),
    checkAnotherBtn: document.getElementById('checkAnotherBtn'),
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
    readOnlyMode: false,

    escapeHtml(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    },

    renderSignCards(signDetails, fallbackSigns) {
        const details = (signDetails || []).filter((s) => s.phrase || s.reason);
        if (details.length) {
            return details.map((sign, index) => `
                <article class="sign-card">
                    <p class="text-xs font-bold text-warning uppercase mb-2">Dấu hiệu ${index + 1}</p>
                    ${sign.phrase ? `<p class="sign-phrase">"${this.escapeHtml(sign.phrase)}"</p>` : ''}
                    <p class="text-slate-600 leading-relaxed">${this.escapeHtml(sign.reason || sign.phrase)}</p>
                </article>
            `).join('');
        }

        if (fallbackSigns?.length) {
            return fallbackSigns.map((sign, index) => `
                <article class="sign-card">
                    <p class="text-xs font-bold text-warning uppercase mb-2">Dấu hiệu ${index + 1}</p>
                    <p class="text-slate-600 leading-relaxed">${this.escapeHtml(sign)}</p>
                </article>
            `).join('');
        }

        return `<p class="text-slate-600 text-center py-4 bg-green-50 rounded-xl border border-green-200">Không thấy câu nào đặc biệt đáng ngờ trong tin này.</p>`;
    },

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

    renderResult(result, options = {}) {
        const readOnly = options.readOnly || false;
        this.readOnlyMode = readOnly;

        const host = options.container || null;
        const useHost = Boolean(host);

        // Risk Score & Circle
        const score = result.riskScore;
        const riskPercent = useHost ? null : this.riskPercent;
        const riskCircle = useHost ? null : this.riskCircle;
        const riskLevelBadge = useHost ? null : this.riskLevelBadge;
        const riskCard = useHost ? null : this.riskCard;
        const riskTitle = useHost ? null : this.riskTitle;
        const riskDesc = useHost ? null : this.riskDesc;

        if (useHost) {
            host.innerHTML = this.buildResultHtml(result, readOnly);
            this.bindResultInteractions(host, result, readOnly);
            return;
        }

        if (riskPercent) riskPercent.innerText = `${score}%`;
        if (riskCircle) riskCircle.setAttribute('stroke-dasharray', `${score}, 100`);
        
        let colorClass = 'bg-success';
        let strokeColor = '#22C55E';
        if (score > 70) {
            colorClass = 'bg-danger';
            strokeColor = '#EF4444';
        } else if (score > 30) {
            colorClass = 'bg-warning';
            strokeColor = '#F59E0B';
        }
        
        if (riskCircle) riskCircle.style.color = strokeColor;
        if (riskLevelBadge) {
            riskLevelBadge.className = `inline-block px-4 py-1 rounded-full text-white font-bold mb-4 text-sm ${colorClass}`;
            riskLevelBadge.innerText = result.riskLevel;
        }
        if (riskCard) {
            riskCard.className = `p-8 rounded-3xl mb-8 flex flex-col md:flex-row items-center gap-8 shadow-xl border-2 ${colorClass.replace('bg-', 'border-')}/20 ${colorClass.replace('bg-', 'bg-')}/5`;
        }
        if (riskTitle) riskTitle.innerText = result.riskTitle;
        if (riskDesc) riskDesc.innerText = result.riskDescription;

        this.populateResultPanels(result, readOnly);

        this.lastAnalysisContext = result;

        if (this.ttsEnabled && !readOnly) {
            const actions = result.actions || [];
            const firstAction = actions[0] || 'Hãy thận trọng với tin nhắn này';
            this.speak(`Kết quả phân tích: ${result.riskLevel}. ${result.riskTitle}. Lời khuyên: ${firstAction}`);
        }
    },

    populateResultPanels(result, readOnly = false) {
        const excerpts = result.excerpts || [];
        const originalText = result.originalText || '';
        const signDetails = result.signDetails || [];

        if (originalText && (excerpts.length || signDetails.some((s) => s.phrase))) {
            this.originalSection.classList.remove('hidden');
            this.highlightedText.innerHTML = buildHighlightedHtml(originalText, excerpts.length ? excerpts : signDetails.map((s) => s.phrase));
        } else {
            this.originalSection.classList.add('hidden');
        }

        this.signsList.innerHTML = this.renderSignCards(signDetails, result.signs);

        if (result.detectiveOpinion) {
            this.detectiveOpinion.textContent = `"${result.detectiveOpinion}"`;
            this.detectiveOpinion.classList.remove('hidden');
        } else {
            this.detectiveOpinion.classList.add('hidden');
        }

        const actions = result.actions || [
            ...(result.recommendations?.shouldDo || []),
            ...(result.recommendations?.shouldNotDo || [])
        ].slice(0, 3);

        this.shouldDo.innerHTML = actions.map((item, index) => `
            <li class="flex items-start gap-2 text-lg">
                <span class="text-primary font-bold">${index + 1}.</span>
                <span class="text-slate-700">${this.escapeHtml(item)}</span>
            </li>
        `).join('');

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
                        <span class="font-mono font-bold break-all text-base">${this.escapeHtml(link.url)}</span>
                        <span class="px-3 py-1 rounded-full text-xs font-bold text-white ${badge}">${this.escapeHtml(link.status)}</span>
                    </div>
                    <p class="text-sm text-slate-600">${this.escapeHtml(link.reason)}</p>
                    ${isDanger ? '<p class="text-danger font-bold text-sm mt-2">⚠️ KHÔNG bấm vào link này!</p>' : ''}
                </div>
            `}).join('');
        } else {
            this.linkAnalysisSection.classList.add('hidden');
        }

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

        this.resetCrisisSection(result, readOnly);
    },

    resetCrisisSection(result, readOnly) {
        this.crisisLocked = false;
        this.crisisResponse.classList.add('hidden');
        this.rescuerTimeline.innerHTML = '';
        this.crisisLoading.classList.add('hidden');
        this.crisisChoices.querySelectorAll('.crisis-btn').forEach((btn) => {
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'ring-4', 'ring-primary');
        });

        if (!readOnly && (result.riskLevel === 'Nghi ngờ' || result.riskLevel === 'Nguy hiểm')) {
            this.crisisSection.classList.remove('hidden');
        } else {
            this.crisisSection.classList.add('hidden');
        }
    },

    buildResultHtml(result, readOnly) {
        const score = result.riskScore;
        let colorClass = 'border-success/20 bg-success/5';
        let badgeClass = 'bg-success';
        if (score > 70) { colorClass = 'border-danger/20 bg-danger/5'; badgeClass = 'bg-danger'; }
        else if (score > 30) { colorClass = 'border-warning/20 bg-warning/5'; badgeClass = 'bg-warning'; }

        const excerpts = result.excerpts || [];
        const originalText = result.originalText || '';
        const signDetails = result.signDetails || [];
        const actions = (result.actions || []).slice(0, 3);

        const originalHtml = originalText && (excerpts.length || signDetails.some((s) => s.phrase))
            ? `<div class="character-panel result-span-full"><h4 class="text-xl font-bold mb-4">📄 Tin gốc (đoạn nghi ngờ được tô vàng)</h4><div class="original-message-box">${buildHighlightedHtml(originalText, excerpts.length ? excerpts : signDetails.map((s) => s.phrase))}</div></div>`
            : '';

        const psychHtml = result.psychologistOpinion
            ? `<div class="character-panel character-psychologist"><h4 class="text-xl font-bold mb-4">👩‍⚕️ Hiểu vì sao mình suýt tin (Cô tâm lý)</h4><p class="text-pink-900 text-lg leading-relaxed">"${this.escapeHtml(result.psychologistOpinion)}"</p></div>`
            : '';

        return `
            <div class="fade-in">
                <div class="p-6 rounded-3xl mb-6 border-2 ${colorClass} flex flex-wrap items-center gap-4">
                    <span class="px-4 py-1 rounded-full text-white font-bold ${badgeClass}">${this.escapeHtml(result.riskLevel)}</span>
                    <span class="text-3xl font-black">${score}%</span>
                    <div><h3 class="text-xl font-extrabold">${this.escapeHtml(result.riskTitle)}</h3><p class="text-muted">${this.escapeHtml(result.riskDescription)}</p></div>
                </div>
                <div class="result-grid">
                    ${originalHtml}
                    <div class="character-panel character-detective result-span-full">
                        <h4 class="text-xl font-bold mb-4">🕵️ Phân tích kỹ thuật (Thám tử)</h4>
                        ${result.detectiveOpinion ? `<p class="italic text-slate-600 mb-4">"${this.escapeHtml(result.detectiveOpinion)}"</p>` : ''}
                        <div class="signs-list">${this.renderSignCards(signDetails, result.signs)}</div>
                    </div>
                    ${psychHtml}
                    <div class="character-panel character-actions">
                        <h4 class="text-xl font-bold mb-4">✅ Nên làm gì tiếp theo</h4>
                        <ul class="space-y-2">${actions.map((a, i) => `<li class="flex gap-2"><span class="font-bold text-primary">${i + 1}.</span><span>${this.escapeHtml(a)}</span></li>`).join('')}</ul>
                    </div>
                </div>
            </div>
        `;
    },

    bindResultInteractions(host, result, readOnly) {
        // History read-only view — no crisis/share buttons
    },

    renderHistory(history, onView) {
        this.historyDetail.classList.add('hidden');

        if (history.length === 0) {
            this.historyList.innerHTML = '<div class="text-center py-12 text-muted bg-white rounded-3xl border border-slate-100">📋 Chưa có tin nào.<br><span class="text-sm">Hãy kiểm tra tin đầu tiên ở tab Kiểm tra.</span></div>';
            return;
        }

        this.historyList.innerHTML = history.map(item => `
            <button type="button" class="view-history-btn w-full text-left bg-white p-6 rounded-3xl border border-slate-100 hover:border-primary hover:shadow-lg transition-all" data-id="${item.id}">
                <div class="flex items-center gap-3 mb-1">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold text-white ${item.riskScore > 70 ? 'bg-danger' : (item.riskScore > 30 ? 'bg-warning' : 'bg-success')}">${item.riskLevel}</span>
                    <span class="text-[10px] font-bold text-muted uppercase tracking-widest">${item.timestamp}</span>
                </div>
                <p class="text-slate-700 font-bold line-clamp-2">${this.escapeHtml(item.text)}</p>
            </button>
        `).join('');

        document.querySelectorAll('.view-history-btn').forEach(btn => {
            btn.onclick = () => {
                const id = parseInt(btn.dataset.id);
                const item = history.find(h => h.id === id);
                if (!item) return;
                this.historyDetail.classList.remove('hidden');
                this.renderResult(item.fullResult, { readOnly: true, container: this.historyResultHost });
                this.historyDetail.scrollIntoView({ behavior: 'smooth' });
            };
        });

        if (this.historyBackBtn) {
            this.historyBackBtn.onclick = () => {
                this.historyDetail.classList.add('hidden');
            };
        }
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