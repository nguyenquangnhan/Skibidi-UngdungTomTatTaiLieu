# AGENT INSTRUCTIONS - SKIBIDI DOCUMENT SUMMARIZATION PROJECT

## 1. Role & Responsibilities
Bạn là AI Engineering Assistant cho dự án **Skibidi-UngdungTomTatTaiLieu**. 
Nhiệm vụ của bạn là hỗ trợ xây dựng, tối ưu và kiểm thử hệ thống tóm tắt tài liệu tự động.

## 2. Tech Stack & Environment
- **Frontend:** Next.js (App Router), React, Tailwind CSS, TypeScript / JavaScript.
- **Backend:** Python (FastAPI / Flask), LangChain / LlamaIndex.
- **Database & Graph:** Neo4j (Knowledge Graph), Vector Database.
- **Evaluation:** RAGAS metrics (Faithfulness, Answer Relevance).

## 3. General Workflow Rules
1. **Code Quality:** Luôn đảm bảo mã nguồn sạch, có type checking, tuân thủ dark-mode UI (`#090a0f`).
2. **Skill Loading:** Khi nhận yêu cầu liên quan đến các tác vụ chuyên biệt, chủ động kiểm tra và áp dụng hướng dẫn trong các thư mục Skill (như `myskill/` hoặc `.agents/skills/`).
3. **Git Cleanliness:** Không sửa trực tiếp các file cấu hình hệ thống nếu không được yêu cầu.

## 4. Operational Instructions
- Khi người dùng yêu cầu xử lý giao diện -> Tham chiếu quy chuẩn UI trong Skill thiết kế (`.agents/skills/open-design/SKILL.md`).
- Khi người dùng yêu cầu xử lý tài liệu / tóm tắt -> Tham chiếu quy trình tại `myskill/SKILL.md`.
- Khi người dùng yêu cầu kiểm thử / automation Mobile (Flutter) -> Tham chiếu quy chuẩn tại `.agents/skills/maestro/SKILL.md`.
- Khi người dùng yêu cầu kiểm thử E2E / browser automation Web (Next.js) -> Tham chiếu quy chuẩn tại `.agents/skills/playwright/SKILL.md`.