# Hướng dẫn sử dụng (User Manual) — Skibidi

## 1. Đăng nhập & Khởi tạo
1. Mở ứng dụng Web tại `http://localhost:3000` (hoặc ứng dụng Mobile Flutter).
2. Chọn **Đăng ký** (Email + Mật khẩu + Họ tên) hoặc **Đăng nhập bằng Google**.
3. Sau khi đăng nhập, bạn được đưa tới danh sách **Sổ tay (Notebooks)**.

## 2. Quản lý Sổ tay & Nạp tài liệu
1. Nhấn **Tạo sổ tay mới**, nhập tiêu đề và mô tả ngắn.
2. Trong sổ tay, chọn **Thêm nguồn tài liệu**:
   - **Tải tệp lên:** Hỗ trợ `.pdf`, `.docx`, `.txt`, `.png`, `.jpg`, `.jpeg` (bao gồm PDF scan/ảnh chụp). Thanh tiến trình hiển thị `%` tải lên từ `0%` → `100%`.
   - **Nhập URL:** Dán đường dẫn bài viết/tài liệu web công khai.
3. Sau khi tải lên, nguồn sẽ ở trạng thái `Chờ xử lý` (`pending`) → `Đang xử lý` (`processing`) và tự động cập nhật sang `Hoàn tất` (`completed`) mà không cần tải lại trang.

## 3. Tóm tắt, Hỏi đáp & Knowledge Graph
- **Tóm tắt / Hỏi đáp:** Nhập câu hỏi vào khung chat (ví dụ: *"Tóm tắt các điểm cốt lõi của tài liệu này"*). Hệ thống trả lời theo thời gian thực (SSE) dựa trên tài liệu đã nạp.
- **Knowledge Graph:** Chuyển sang tab **Đồ thị tri thức** để xem các thực thể (Entities) và mối quan hệ được trích xuất từ tài liệu.

## 4. Xử lý sự cố thường gặp (FAQ)
- **Nguồn báo `Lỗi` (`failed`):** Kiểm tra file có bị mã hóa mật khẩu, hỏng định dạng, hoặc URL có chặn bot không. Bạn có thể xóa nguồn lỗi và tải lại.
- **Tài liệu đang `Chờ xử lý` lâu:** Nếu file PDF có nhiều trang scan, Gemini Multimodal OCR có thể mất 15–60 giây để trích xuất và tạo vector + đồ thị.
- **Không thấy đồ thị:** Đảm bảo nguồn tài liệu đã chuyển sang trạng thái `Hoàn tất` (`completed`) và dịch vụ Neo4j đang chạy.

