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
            modal.classList.add('hidden');
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
                <button id="quizRestart" class="bg-primary text-white px-8 py-4 rounded-2xl font-bold text-lg btn-hover">Luyện lại</button>
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

    function loadQuestion() {
        answered = false;
        feedbackEl.classList.add('hidden');
        buttons.forEach((b) => {
            b.disabled = false;
            b.classList.remove('opacity-50');
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

            const choice = btn.dataset.choice;
            const q = questions[currentQuestion];
            const correct = choice === q.label;

            if (correct) score += 10;

            feedbackEl.classList.remove('hidden');
            feedbackEl.className = `mt-6 p-4 rounded-2xl text-lg font-medium ${correct ? 'bg-success/20 text-green-100 border border-success/40' : 'bg-danger/20 text-red-100 border border-danger/40'}`;
            feedbackEl.textContent = (correct ? '✅ Chính xác! ' : '❌ Chưa đúng. ') + q.explanation;

            scoreEl.textContent = `Điểm: ${score}`;

            setTimeout(() => {
                currentQuestion++;
                if (currentQuestion >= questions.length) {
                    showSummary();
                } else {
                    loadQuestion();
                }
            }, 2500);
        };
    });

    loadQuestion();
}

export async function initLinkScanner(UI) {
    UI.scanLinkBtn.onclick = async () => {
        const url = UI.linkInput.value.trim();
        if (!url) return alert('Vui lòng nhập đường dẫn!');

        UI.scanLinkBtn.innerText = '⏳ Đang soi...';
        UI.scanLinkBtn.disabled = true;

        try {
            const result = await scanLink(url);
            UI.renderLinkScan(result);
        } catch (error) {
            alert('Lỗi khi soi link: ' + error.message);
        } finally {
            UI.scanLinkBtn.innerText = 'Soi ngay';
            UI.scanLinkBtn.disabled = false;
        }
    };
}

function drawQrPlaceholder(ctx, x, y, size, url) {
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
    ctx.fillStyle = '#2563EB';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('QR', x + size / 2 - 12, y + size / 2 + 4);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        ctx.drawImage(img, x, y, size, size);
    };
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
}

export function initCanvasShare(result) {
    const canvas = document.getElementById('shareCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 640;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 800, 640);

    const grad = ctx.createLinearGradient(0, 0, 800, 0);
    grad.addColorStop(0, '#2563EB');
    grad.addColorStop(1, '#0EA5E9');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 110);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillText('ScamCheck — CẢNH BÁO', 40, 68);

    const color = result.riskScore > 70 ? '#EF4444' : result.riskScore > 30 ? '#F59E0B' : '#22C55E';
    ctx.fillStyle = color;
    ctx.fillRect(40, 140, 180, 44);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillText(result.riskLevel, 55, 170);

    ctx.fillStyle = color;
    ctx.font = 'bold 72px Inter, sans-serif';
    ctx.fillText(`${result.riskScore}%`, 520, 210);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.fillText(result.riskTitle?.substring(0, 40) || 'Cảnh báo lừa đảo', 40, 240);

    ctx.fillStyle = '#64748B';
    ctx.font = '18px Inter, sans-serif';
    const desc = (result.riskDescription || '').substring(0, 90);
    ctx.fillText(desc, 40, 280);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText('Dấu hiệu chính:', 40, 330);

    ctx.font = '18px Inter, sans-serif';
    const signs = (result.signs || []).slice(0, 2);
    signs.forEach((sign, i) => {
        ctx.fillStyle = '#475569';
        ctx.fillText(`• ${sign.substring(0, 55)}`, 40, 365 + i * 30);
    });

    drawQrPlaceholder(ctx, 620, 420, 120, SITE_URL);

    ctx.fillStyle = '#64748B';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText('Quét mã để mở ScamCheck', 590, 560);

    ctx.fillStyle = '#2563EB';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText(SITE_URL, 40, 610);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '13px Inter, sans-serif';
    ctx.fillText('Công cụ giáo dục — không thay thế cảnh báo chính thức', 40, 632);

    const finalize = () => {
        const link = document.createElement('a');
        link.download = `scamcheck-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    setTimeout(finalize, 600);
}
