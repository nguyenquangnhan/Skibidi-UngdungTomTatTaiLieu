# UI/UX Design Guide — Skibidi

## 1. Visual Direction
- **Theme:** Dark-Mode First, cảm hứng không gian tri thức tối giản (Obsidian Knowledge Workspace).
- **Primary Background:** `#090a0f`
- **Surface / Card:** `#11131a` với viền mảnh `rgba(255, 255, 255, 0.08)`
- **Accent:** Indigo / Violet gradient cho CTA chính và trạng thái AI đang suy luận.
- **Status Badges:**
  - `pending`: Xám/Vàng nhạt (`Chờ xử lý`)
  - `processing`: Xanh dương có animation (`Đang xử lý`)
  - `completed`: Xanh lá (`Hoàn tất`)
  - `failed`: Đỏ (`Lỗi`) kèm `error_message` rõ ràng.

## 2. Anti-Slop & Quality Rules
- Không dùng text placeholder vô nghĩa hay số liệu giả trong production UI.
- Mọi thao tác bất đồng bộ (Upload file, Xử lý RAG, Chat SSE) phải có phản hồi tiến trình thật (Progress `%`, trạng thái polling, streaming token).
- Thư viện đồ thị (`react-force-graph-2d`) bắt buộc load bằng `next/dynamic(..., { ssr: false })` và tự co giãn theo `ResizeObserver`.
- Tham chiếu thêm `.agents/skills/open-design/SKILL.md` khi thiết kế hoặc nâng cấp component mới.

