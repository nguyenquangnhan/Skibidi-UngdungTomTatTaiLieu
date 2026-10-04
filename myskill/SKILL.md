---
name: myskill
description: Quy chuẩn tóm tắt tài liệu chuẩn RAG cho dự án Skibidi. Tự động kích hoạt khi người dùng yêu cầu tóm tắt văn bản, trích xuất ý chính hoặc xử lý file PDF/DOCX/TXT.
---

# Document Summarizer Skill Guidelines

## 1. Mục tiêu
Đảm bảo bản tóm tắt tài liệu đạt độ chính xác cao, không tưởng tượng thông tin (hallucination) và sẵn sàng cho việc đánh giá bằng RAGAS.

## 2. Quy trình xử lý tóm tắt (3 bước)

### Bước 1: Phân loại tài liệu
- **Văn bản ngắn (< 2000 từ):** Tóm tắt trực tiếp dạng Bullet Points.
- **Tài liệu dài (PDF/DOCX nhiều trang):** Chia nhỏ theo Chunk (Chunk size: 1000 tokens, Overlap: 200 tokens).

### Bước 2: Định dạng đầu ra (Output Format)
Khi tạo bản tóm tắt, Agent BẮT BUỘC trả về cấu trúc Markdown sau:

1. **📌 Tóm tắt tổng quan (Executive Summary):** 2-3 câu ngắn gọn bao hàm nội dung chính.
2. **🔑 Các điểm cốt lõi (Key Findings):** 3-5 ý chính dạng danh sách gạch đầu dòng.
3. **🏷️ Từ khóa & Thực thể (Keywords & Entities):** Trích xuất 5-10 thuật ngữ/thực thể quan trọng để đưa vào Knowledge Graph (Neo4j).

## 3. Quy tắc an toàn & Chất lượng
- Không đưa vào các nhận định cá nhân ngoài nội dung tài liệu.
- Giữ nguyên các thông số kỹ thuật, ngày tháng, tên riêng và số liệu thống kê.
- Nếu tài liệu bị lỗi font hoặc thiếu thông tin, phải báo rõ cho người dùng.