# ScamCheck — Bảo vệ bạn khỏi lừa đảo

Ứng dụng web giúp nhận diện tin nhắn lừa đảo bằng Gemini AI, hướng tới người dùng từ 45 tuổi trở lên.

> ScamCheck là công cụ giáo dục do nhóm học viên phát triển và đánh giá của ứng dụng không thay thế cảnh báo chính thức từ ngân hàng hoặc cơ quan chức năng.

**Live:** https://scamcheck-mu.vercel.app/

## Tính năng theo cấp

| Cấp | Tính năng |
|-----|-----------|
| 1 | Giao diện, Gemini, cảnh báo pháp lý, deploy |
| 2 | Thám tử AI, thẻ rủi ro, tô vàng, 3 hành động, tin mẫu, lịch sử, xử lý lỗi |
| 3 | Cô tâm lý (gọi tuần tự, chỉ khi Nghi ngờ/Nguy hiểm) |
| 4 | **A** Thư viện 14 kiểu lừa đảo · **B** Soi link + tên miền giả · **C** Luyện tập 10 câu · **D** Thẻ cảnh báo PNG + QR |
| 5 | Người ứng cứu: 4 tình huống, hotline từ `data/hotlines.json`, không gọi AI khi "Chưa làm gì" |

## Chạy local

```bash
# Tạo .env.local từ .env.example, điền GEMINI_API_KEY
npx vercel dev
```

## Deploy (Vercel)

1. Push lên GitHub
2. Import vào Vercel
3. Thêm biến môi trường `GEMINI_API_KEY`
4. Redeploy

## Cấu trúc

```
index.html          Giao diện
main.js             Luồng chính + Người ứng cứu
ui.js               Hiển thị kết quả
gemini.js           Gọi AI tuần tự
parseResult.js      Parse JSON + fallback
linkUtils.js        Regex link + phát hiện domain giả
rescuer.js          Luồng Cấp 5
features.js         Thư viện, luyện tập, thẻ PNG
storage.js          Lịch sử localStorage
api/gemini.js       Backend proxy Gemini
data/
  library.json      14 kiểu lừa đảo (4 nhóm)
  training.json     10 câu luyện tập
  hotlines.json     Số tổng đài chính thức
  legitimate-domains.json
```

## Thành viên nhóm

| Họ tên | Vai trò |
|--------|---------|
| (điền tên) | |
