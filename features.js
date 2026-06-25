import { scanLink } from './gemini.js';

const CATEGORY_STYLES = {
    bank: { badge: 'bg-red-100 text-red-600', label: 'Giả ngân hàng' },
    police: { badge: 'bg-orange-100 text-orange-600', label: 'Giả công an' },
    gift: { badge: 'bg-blue-100 text-blue-600', label: 'Trúng thưởng' },
    delivery: { badge: 'bg-teal-100 text-teal-600', label: 'Giả giao hàng' }
};

const SITE_URL = 'https://scamcheck-mu.vercel.app/';

let libraryData = [];

async function loadLibrary() {
    const response = await fetch('/data/library.json');
    libraryData = await response.json();
    return libraryData;
}

async function loadTraining() {
    const response = await fetch('/data/training.json');
    return response.json();
}

export async function initLibrary() {
    const grid = document.getElementById('libraryGrid');
    const filters = document.querySelectorAll('.lib-filter');
    const modal = document.getElementById('libraryModal');
    const modalTitle = document.getElementById('libraryModalTitle');
    const modalBody = document.getElementById('libraryModalBody');
    const modalClose = document.getElementById('libraryModalClose');

    await loadLibrary();

    function openDetail(item) {
        const style = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.bank;
        modalTitle.textContent = item.title;
        modalBody.innerHTML = `
            <span class="${style.badge} px-3 py-1 rounded-full text-xs font-bold uppercase">${item.groupLabel}</span>
            <p class="text-muted text-lg mt-4 leading-relaxed">${item.description}</p>
            <div class="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span class="text-xs font-bold text-muted uppercase">Ví dụ tin nhắn:</span>
                <p class="mt-2 italic text-slate-700 leading-relaxed">"${item.example}"</p>
            </div>
            <button id="tryInChecker" class="mt-6 bg-primary text-white px-6 py-3 rounded-2xl font-bold btn-hover w-full md:w-auto">
                Dùng mẫu này để kiểm tra →
            </button>
        `;
        modal.classList.remove('hidden');
        document.getElementById('tryInChecker').onclick = () => {
            document.getElementById('messageInput').value = item.example;
            document.getElementById('messageInput').dispatchEvent(new Event('input'));
            modal.classList.add('hidden');
            window.location.hash = '#/';
            document.getElementById('checker').scrollIntoView({ behavior: 'smooth' });
        };
    }

    function render(filter = 'all') {
        const filtered = filter === 'all'
            ? libraryData
            : libraryData.filter((i) => i.category === filter);

        grid.innerHTML = filtered.map((item) => {
            const style = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.bank;
            return `
                <div class="library-item bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 fade-in cursor-pointer" data-id="${item.id}">
                    <span class="${style.badge} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">${style.label}</span>
                    <h5 class="text-xl font-extrabold mt-4 mb-2 text-slate-900">${item.title}</h5>
                    <p class="text-muted text-sm leading-relaxed mb-4 line-clamp-2">${item.description}</p>
                    <span class="text-primary font-bold flex items-center gap-1">Chi tiết <span class="text-lg">→</span></span>
                </div>
            `;
        }).join('');

        grid.querySelectorAll('.library-item').forEach((el) => {
            el.onclick = () => {
                const item = libraryData.find((i) => i.id === el.dataset.id);
                if (item) openDetail(item);
            };
        });
    }

    filters.forEach((btn) => {
        btn.onclick = () => {
            filters.forEach((b) => {
                b.classList.remove('bg-primary', 'text-white');
                b.classList.add('bg-slate-100', 'text-muted');
            });
            btn.classList.remove('bg-slate-100', 'text-muted');
            btn.classList.add('bg-primary', 'text-white');
            render(btn.dataset.filter);
        };
    });

    modalClose.onclick = () => modal.classList.add('hidden');
    modal.onclick = (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    };

    render();
}

export async function initQuiz() {
    const questions = await loadTraining();
    let currentQuestion = 0;
    let score = 0;
    let answered = false;

    const questionEl = document.getElementById('quizQuestion');
    const progressEl = document.getElementById('quizProgress');
    const scoreEl = document.getElementById('quizScore');
    const feedbackEl = document.getElementById('quizFeedback');
    const nextWrap = document.getElementById('quizNextWrap');
    const nextBtn = document.getElementById('quizNextBtn');
    const summaryEl = document.getElementById('quizSummary');
    const buttons = document.querySelectorAll('.quiz-choice-btn');
    const quizContainer = document.getElementById('quizContainer');

    function showSummary() {
        const total = questions.length;
        const percent = Math.round((score / (total * 10)) * 100);
        let comment = 'Bác nên luyện thêm vài lần nữa để nhận ra tin lừa đảo nhanh hơn.';
        if (percent >= 80) comment = 'Xuất sắc! Bác đã có cảnh giác rất tốt.';
        else if (percent >= 50) comment = 'Khá tốt! Bác đã nhận ra được một số chiêu lừa đảo.';

        quizContainer.classList.add('hidden');
        summaryEl.classList.remove('hidden');
        summaryEl.innerHTML = `
            <div class="text-center fade-in">
                <div class="text-6xl mb-4">${percent >= 80 ? '🏆' : percent >= 50 ? '👍' : '📚'}</div>
                <h3 class="text-3xl font-extrabold mb-2">Kết quả: ${score}/${total * 10} điểm</h3>
                <p class="text-slate-300 text-lg mb-6">${comment}</p>
                <button id="quizRestart" class="bg-primary text-white px-8 py-4 rounded-2xl font-bold text-lg btn-hover">Luyện lại từ đầu</button>
            </div>
        `;
        document.getElementById('quizRestart').onclick = () => {
            currentQuestion = 0;
            score = 0;
            answered = false;
            summaryEl.classList.add('hidden');
            quizContainer.classList.remove('hidden');
            loadQuestion();
        };
    }

    function goNext() {
        currentQuestion++;
        if (currentQuestion >= questions.length) {
            showSummary();
        } else {
            loadQuestion();
        }
    }

    nextBtn.onclick = () => {
        if (!answered) return;
        goNext();
    };

    function loadQuestion() {
        answered = false;
        feedbackEl.classList.add('hidden');
        nextWrap.classList.add('hidden');
        buttons.forEach((b) => {
            b.disabled = false;
            b.classList.remove('opacity-50', 'ring-4', 'ring-white');
        });

        const q = questions[currentQuestion];
        questionEl.textContent = `"${q.text}"`;
        progressEl.textContent = `Câu hỏi ${currentQuestion + 1}/${questions.length}`;
        scoreEl.textContent = `Điểm: ${score}`;
    }

    buttons.forEach((btn) => {
        btn.onclick = () => {
            if (answered) return;
            answered = true;

            buttons.forEach((b) => {
                b.disabled = true;
                b.classList.add('opacity-50');
            });
            btn.classList.remove('opacity-50');
            btn.classList.add('ring-4', 'ring-white');

            const choice = btn.dataset.choice;
            const q = questions[currentQuestion];
            const correct = choice === q.label;

            if (correct) score += 10;

            feedbackEl.classList.remove('hidden');
            if (correct) {
                feedbackEl.className = 'mt-6 p-6 rounded-2xl text-lg leading-relaxed border-2 bg-green-500/20 text-green-100 border-green-400/50';
                feedbackEl.innerHTML = `<strong class="block text-xl mb-2">✅ Chính xác!</strong>${q.explanation}`;
            } else {
                feedbackEl.className = 'mt-6 p-6 rounded-2xl text-lg leading-relaxed border-2 bg-red-500/20 text-red-100 border-red-400/50';
                feedbackEl.innerHTML = `<strong class="block text-xl mb-2">❌ Chưa đúng</strong>${q.explanation}`;
            }

            scoreEl.textContent = `Điểm: ${score}`;

            if (currentQuestion >= questions.length - 1) {
                nextBtn.textContent = 'Xem kết quả →';
            } else {
                nextBtn.textContent = 'Câu tiếp theo →';
            }
            nextWrap.classList.remove('hidden');
            feedbackEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        };
    });

    loadQuestion();
}

export async function initLinkScanner(UI) {
    UI.linkInput.addEventListener('input', () => {
        if (UI.linkInput.value.trim()) UI.clearLinkError();
    });

    UI.scanLinkBtn.onclick = async () => {
        const url = UI.linkInput.value.trim();
        if (!url) {
            UI.showLinkError('Bác vui lòng dán đường link vào ô trên trước khi bấm Soi ngay.');
            return;
        }

        UI.clearLinkError();
        UI.scanLinkBtn.innerText = '⏳ Đang soi...';
        UI.scanLinkBtn.disabled = true;

        try {
            const result = await scanLink(url);
            UI.renderLinkScan(result);
        } catch (error) {
            UI.showLinkError('Không soi được link này. Bác thử lại hoặc không bấm vào link lạ nhé.');
            console.error(error);
        } finally {
            UI.scanLinkBtn.innerText = 'Soi ngay';
            UI.scanLinkBtn.disabled = false;
        }
    };
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = String(text || '').split(' ');
    let line = '';
    let currentY = y;
    for (const word of words) {
        const test = line + word + ' ';
        if (ctx.measureText(test).width > maxWidth && line) {
            ctx.fillText(line.trim(), x, currentY);
            line = word + ' ';
            currentY += lineHeight;
        } else {
            line = test;
        }
    }
    if (line) ctx.fillText(line.trim(), x, currentY);
    return currentY;
}

export async function initCanvasShare(result, onDone, onFail) {
    const preview = document.getElementById('shareCardPreview');
    if (preview) {
        preview.classList.remove('hidden');
        preview.innerHTML = '<p class="text-muted font-semibold">Đang tạo thẻ...</p>';
    }

    try {
        if (typeof QRCode === 'undefined') {
            throw new Error('QR library not loaded');
        }

        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 800;
        const ctx = canvas.getContext('2d');

        const colors = {
            'An toàn': '#22C55E',
            'Nghi ngờ': '#F59E0B',
            'Nguy hiểm': '#EF4444'
        };
        const bg = colors[result.riskLevel] || '#F59E0B';

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 600, 800);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 600, 120);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 36px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(result.riskLevel.toUpperCase(), 300, 55);
        ctx.font = '20px Inter, Arial, sans-serif';
        ctx.fillText('ScamCheck', 300, 95);

        ctx.fillStyle = '#0F172A';
        ctx.textAlign = 'left';
        ctx.font = 'bold 48px Inter, Arial, sans-serif';
        ctx.fillText(`${result.riskScore}%`, 30, 175);

        ctx.font = 'bold 22px Inter, Arial, sans-serif';
        wrapCanvasText(ctx, result.riskTitle || 'Cảnh báo lừa đảo', 30, 210, 540, 28);

        ctx.font = '18px Inter, Arial, sans-serif';
        ctx.fillStyle = '#64748B';
        wrapCanvasText(ctx, result.riskDescription || '', 30, 260, 540, 24);

        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 20px Inter, Arial, sans-serif';
        ctx.fillText('Dấu hiệu chính:', 30, 340);

        ctx.font = '18px Inter, Arial, sans-serif';
        let y = 375;
        const signItems = (result.signDetails || []).slice(0, 3);
        const fallbackSigns = (result.signs || []).slice(0, 3);

        if (signItems.length) {
            signItems.forEach((sign) => {
                y = wrapCanvasText(ctx, `• ${sign.phrase || sign.reason}`, 30, y, 540, 24) + 30;
            });
        } else {
            fallbackSigns.forEach((sign) => {
                y = wrapCanvasText(ctx, `• ${sign}`, 30, y, 540, 24) + 30;
            });
        }

        const qrCanvas = document.createElement('canvas');
        await QRCode.toCanvas(qrCanvas, SITE_URL, { width: 140, margin: 1 });
        ctx.drawImage(qrCanvas, 230, 620, 140, 140);

        ctx.font = '16px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#64748B';
        ctx.fillText('Quét mã để dùng ScamCheck', 300, 780);

        const dataUrl = canvas.toDataURL('image/png');

        if (preview) {
            preview.innerHTML = `
                <img src="${dataUrl}" alt="Thẻ cảnh báo ScamCheck" class="rounded-2xl border-2 border-slate-200 shadow-lg mx-auto mb-4 max-w-full">
                <a href="${dataUrl}" download="scamcheck-canh-bao.png" class="inline-block bg-primary text-white px-6 py-3 rounded-2xl font-bold btn-hover">Tải ảnh về máy</a>
            `;
        }

        const link = document.createElement('a');
        link.download = `scamcheck-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();

        if (onDone) onDone();
    } catch (err) {
        if (preview) {
            preview.innerHTML = '<p class="text-danger font-semibold">Không tạo được thẻ. Bác thử lại sau nhé.</p>';
        }
        if (onFail) onFail(err);
    }
}
