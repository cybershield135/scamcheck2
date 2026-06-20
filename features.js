import { scanLink } from './gemini.js';

// Quiz Data
const QUIZ_QUESTIONS = [
    {
        text: "[VCB] Tai khoan cua ban bi khoa. Vui long dang nhap http://vcb-security.xyz de xac thuc.",
        type: "scam",
        explanation: "Ngân hàng không bao giờ gửi link yêu cầu đăng nhập qua SMS với tên miền lạ (.xyz)."
    },
    {
        text: "Mã OTP của bạn là 123456. KHÔNG chia sẻ mã này cho bất kỳ ai, kể cả nhân viên ngân hàng.",
        type: "safe",
        explanation: "Đây là tin nhắn OTP chuẩn, có cảnh báo không chia sẻ mã."
    },
    {
        text: "Chúc mừng! Bạn đã trúng thưởng iPhone 15 Pro Max từ Shopee. Liên hệ Zalo 09xx để nhận giải.",
        type: "scam",
        explanation: "Các chương trình trúng thưởng yêu cầu liên hệ Zalo cá nhân thường là lừa đảo."
    }
];

// Library Data
const LIBRARY_DATA = [
    { category: 'bank', title: 'Khóa tài khoản VCB', desc: 'Tin nhắn thông báo tài khoản bị khóa và yêu cầu truy cập link lạ.', type: 'Giả mạo NH', color: 'red' },
    { category: 'police', title: 'Lệnh bắt giữ khẩn cấp', desc: 'Kẻ xấu giả danh công an gọi điện hoặc nhắn tin đe dọa liên quan đến vụ án.', type: 'Giả mạo CA', color: 'orange' },
    { category: 'gift', title: 'Trúng thưởng tri ân', desc: 'Thông báo trúng xe máy, điện thoại và yêu cầu đóng phí vận chuyển.', type: 'Lừa đảo quà tặng', color: 'blue' },
    { category: 'bank', title: 'Nâng cấp hạn mức thẻ', desc: 'Yêu cầu cung cấp thông tin thẻ để nâng cấp hạn mức tín dụng.', type: 'Giả mạo NH', color: 'red' },
    { category: 'police', title: 'Phạt nguội giao thông', desc: 'Yêu cầu nộp phạt qua link thay vì đến trụ sở công an.', type: 'Giả mạo CA', color: 'orange' },
    { category: 'gift', title: 'Việc làm tại nhà', desc: 'Mời chào làm nhiệm vụ Shopee/TikTok nhận hoa hồng cao.', type: 'Việc làm online', color: 'green' }
];

export function initQuiz() {
    let currentQuestion = 0;
    let score = 0;
    const questionEl = document.getElementById('quizQuestion');
    const progressEl = document.getElementById('quizProgress');
    const scoreEl = document.getElementById('quizScore');
    const buttons = document.querySelectorAll('.quiz-choice-btn');

    function loadQuestion() {
        const q = QUIZ_QUESTIONS[currentQuestion];
        questionEl.innerText = q.text;
        progressEl.innerText = `Câu hỏi ${currentQuestion + 1}/${QUIZ_QUESTIONS.length}`;
        scoreEl.innerText = `Điểm: ${score}`;
    }

    buttons.forEach(btn => {
        btn.onclick = () => {
            const choice = btn.dataset.choice;
            const q = QUIZ_QUESTIONS[currentQuestion];
            
            if (choice === q.type) {
                score += 10;
                alert('Chính xác! ' + q.explanation);
            } else {
                alert('Sai rồi! ' + q.explanation);
            }

            currentQuestion++;
            if (currentQuestion >= QUIZ_QUESTIONS.length) {
                alert(`Chúc mừng! Bạn đã hoàn thành bài tập với số điểm: ${score}`);
                currentQuestion = 0;
                score = 0;
            }
            loadQuestion();
        };
    });

    loadQuestion();
}

export function initLibrary() {
    const grid = document.getElementById('libraryGrid');
    const filters = document.querySelectorAll('.lib-filter');

    function render(filter = 'all') {
        const filtered = filter === 'all' ? LIBRARY_DATA : LIBRARY_DATA.filter(i => i.category === filter);
        grid.innerHTML = filtered.map(item => `
            <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 fade-in">
                <span class="bg-${item.color}-100 text-${item.color}-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">${item.type}</span>
                <h5 class="text-xl font-extrabold mt-4 mb-2 text-slate-900">${item.title}</h5>
                <p class="text-muted text-sm leading-relaxed mb-6">${item.desc}</p>
                <button class="text-primary font-bold hover:gap-2 flex items-center gap-1 transition-all">Chi tiết <span class="text-lg">→</span></button>
            </div>
        `).join('');
    }

    filters.forEach(btn => {
        btn.onclick = () => {
            filters.forEach(b => b.classList.remove('bg-primary', 'text-white'));
            filters.forEach(b => b.classList.add('bg-slate-100', 'text-muted'));
            btn.classList.remove('bg-slate-100', 'text-muted');
            btn.classList.add('bg-primary', 'text-white');
            render(btn.dataset.filter);
        };
    });

    render();
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

export function initCanvasShare(result) {
    const canvas = document.getElementById('shareCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    // BG
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 800, 600);
    
    // Gradient Header
    const grad = ctx.createLinearGradient(0, 0, 800, 0);
    grad.addColorStop(0, '#2563EB');
    grad.addColorStop(1, '#0EA5E9');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 120);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 42px Inter, sans-serif';
    ctx.fillText('ScamCheck AI - CẢNH BÁO', 40, 75);

    // Card
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 160, 720, 400);

    // Score
    const color = result.riskScore > 70 ? '#EF4444' : (result.riskScore > 30 ? '#F59E0B' : '#22C55E');
    ctx.fillStyle = color;
    ctx.font = 'black 100px Inter, sans-serif';
    ctx.fillText(`${result.riskScore}%`, 500, 320);
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText('RỦI RO ĐƯỢC PHÁT HIỆN', 490, 350);

    // Level
    ctx.fillStyle = color;
    ctx.fillRect(80, 200, 200, 50);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText(result.riskLevel, 100, 235);

    // Text
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 30px Inter, sans-serif';
    ctx.fillText(result.riskTitle, 80, 320);

    ctx.fillStyle = '#64748B';
    ctx.font = '20px Inter, sans-serif';
    const desc = result.riskDescription.substring(0, 100) + '...';
    ctx.fillText(desc, 80, 370);

    // Footer
    ctx.fillStyle = '#2563EB';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText('Kiểm tra tại: scamcheck.ai', 40, 585);

    const link = document.createElement('a');
    link.download = `scamcheck-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
}
