# ScamCheck — Bảo vệ bạn khỏi lừa đảo

Ứng dụng web giúp nhận diện tin nhắn lừa đảo bằng Gemini AI, hướng tới người dùng từ 45 tuổi trở lên.

> ScamCheck là công cụ giáo dục do nhóm học viên phát triển và đánh giá của ứng dụng không thay thế cảnh báo chính thức từ ngân hàng hoặc cơ quan chức năng.

## Tính năng đã có

| Cấp | Tính năng |
|-----|-----------|
| 1 | Giao diện nhập liệu, gọi Gemini, dòng cảnh báo pháp lý |
| 2 | Thám tử AI, thẻ màu rủi ro, tô vàng đoạn trích, 3 hành động, tin mẫu, lịch sử 10 tin, xử lý lỗi |
| 3 | Cô tâm lý (gọi tuần tự sau Thám tử, chỉ khi Nghi ngờ/Nguy hiểm) |
| 4 (sơ bộ) | Thư viện, luyện tập, soi link, thẻ cảnh báo — cần hoàn thiện thêm |

## Chạy trên máy

1. Cài [Vercel CLI](https://vercel.com/docs/cli) hoặc dùng Live Server cho giao diện tĩnh.
2. Tạo file `.env.local` từ `.env.example`, điền `GEMINI_API_KEY` mentor cấp.
3. Chạy local với Vercel (cần cho `/api/gemini`):

```bash
npx vercel dev
```

4. Mở trình duyệt, dán tin mẫu, bấm **Kiểm tra ngay**.

## Đưa lên mạng

- **Frontend + API**: Deploy lên [Vercel](https://vercel.com) (Import repo GitHub → thêm env `GEMINI_API_KEY`).
- **GitHub Pages** chỉ host file tĩnh — không chạy được `/api/gemini`. Hỏi mentor cách phù hợp.

## Cấu trúc thư mục

```
index.html       Giao diện chính
main.js          Luồng kiểm tra, lịch sử
ui.js            Hiển thị kết quả
gemini.js        Gọi API tuần tự (Thám tử → Cô tâm lý)
parseResult.js   Đọc JSON AI + giá trị mặc định khi lỗi
storage.js       Lịch sử localStorage
features.js      Thư viện, luyện tập, soi link, thẻ PNG
api/gemini.js    Backend proxy Gemini (giữ key an toàn)
config.example.js  Mẫu cấu hình — copy thành config.js (local)
```

## Thành viên nhóm

| Họ tên | Vai trò |
|--------|---------|
| (điền tên) | |
| (điền tên) | |
