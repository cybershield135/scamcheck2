# ScamCheck AI - Bảo vệ bạn khỏi lừa đảo

Ứng dụng web chuyên nghiệp giúp nhận diện tin nhắn lừa đảo bằng trí tuệ nhân tạo (Gemini AI).

## Tính năng chính
- **Phân tích AI**: Sử dụng Gemini 1.5 Flash để phân tích nội dung tin nhắn.
- **Lịch sử tìm kiếm**: Lưu trữ 10 kết quả gần nhất trong LocalStorage.
- **Thư viện lừa đảo**: Các mẫu tin nhắn lừa đảo phổ biến.
- **Luyện tập**: Bài trắc nghiệm giúp nâng cao cảnh giác.
- **Thẻ chia sẻ**: Xuất kết quả phân tích thành ảnh PNG để cảnh báo người thân.
- **Responsive**: Tối ưu cho mọi thiết bị (Mobile First).

## Cài đặt
1. Clone thư mục `scamcheck`.
2. Copy `config.example.js` thành `config.js`.
3. Điền Gemini API Key của bạn vào `config.js`.
4. Mở `index.html` bằng trình duyệt (Yêu cầu chạy qua một local server để sử dụng ES Modules).

## Cấu trúc thư mục
- `index.html`: Giao diện chính.
- `js/`: Chứa các module xử lý logic.
- `css/`: Các tùy chỉnh CSS bổ sung.
- `assets/`: Hình ảnh và icon.

## Tác giả
Phát triển bởi Manus AI.
