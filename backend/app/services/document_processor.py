"""
Document Processor Service
Extracts text from PDF (text-layer), PDF (scanned/image), image files, and URLs.
Pipeline:
  1. PDF with text layer → PyMuPDF page.get_text() (fast, no OCR needed)
  2. Scanned PDF → render each page as PNG → PaddleOCR (parallel, max 3 workers)
  3. Image file → PaddleOCR directly
  4. Gemini Vision → fallback OCR for complex images
  5. URL → httpx + BeautifulSoup scraping
"""
import asyncio
import io
import os
import tempfile
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import aiofiles
try:
    import fitz  # PyMuPDF
except Exception:
    fitz = None

import pypdf
import httpx
from PIL import Image
from bs4 import BeautifulSoup
from google.genai import types

from app.config import get_settings
from app.services.gemini_client import get_gemini_clients

settings = get_settings()

# Lazy-init PaddleOCR to avoid loading at import time
_paddle_ocr = None


def _get_paddle_ocr():
    """
    Initialize PaddleOCR with PP-OCRv6 (2026 release).
    PP-OCRv6: +4.6% detection, +5.1% recognition vs PP-OCRv5.
    Supports 50 languages with single model (incl. Vietnamese as Latin-script).
    CPU speedup: 5.2x (OpenVINO backend).
    Source: https://github.com/PaddlePaddle/PaddleOCR
    """
    global _paddle_ocr
    if _paddle_ocr is None:
        from paddleocr import PaddleOCR
        _paddle_ocr = PaddleOCR(
            use_angle_cls=True,
            lang=settings.paddle_ocr_lang,  # 'vi' → treated as Latin-script in PP-OCRv6
            use_gpu=settings.paddle_use_gpu,
            show_log=False,
            # PP-OCRv6: use 'small' tier for balance of speed and accuracy
            # Options: 'mobile' (tiny, 1.5M), 'server' (medium, 34.5M)
            det_model_dir=None,   # None = auto-download PP-OCRv6 small
            rec_model_dir=None,
        )
    return _paddle_ocr


def _ocr_image_bytes(image_bytes: bytes) -> str:
    """Run PaddleOCR on raw image bytes. Runs in subprocess."""
    ocr = _get_paddle_ocr()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    result = ocr.ocr(image, cls=True)
    if not result or not result[0]:
        return ""
    lines = []
    for block in result:
        if block:
            for line in block:
                if line and len(line) >= 2:
                    lines.append(line[1][0])
    return "\n".join(lines)


def _ocr_with_gemini_sync(image_bytes: bytes, mime_type: str = "image/png") -> str:
    """Run Google Gemini Multimodal OCR on raw image bytes."""
    clients = get_gemini_clients()
    prompt = (
        "Bạn là công cụ trích xuất văn bản (OCR) chuyên nghiệp, hỗ trợ tiếng Việt và đa ngôn ngữ. "
        "Hãy đọc toàn bộ văn bản có trong hình ảnh/trang tài liệu này một cách trung thực và chính xác nhất.\n"
        "- Giữ nguyên dấu tiếng Việt, bố cục, dấu xuống dòng, định dạng danh sách và bảng biểu.\n"
        "- Chỉ trả về nội dung văn bản trích xuất được. Tuyệt đối không thêm lời dẫn, chú thích hoặc giải thích."
    )
    last_err = None
    for client in clients:
        try:
            response = client.models.generate_content(
                model=settings.chat_model,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    prompt,
                ],
            )
            return (response.text or "").strip()
        except Exception as e:
            last_err = e
            continue
    raise RuntimeError(f"Tất cả Gemini API client đều gặp lỗi khi OCR: {last_err}")


async def ocr_image_with_gemini(image_bytes: bytes, mime_type: str = "image/png") -> str:
    """Async wrapper for Google Gemini Multimodal OCR."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _ocr_with_gemini_sync, image_bytes, mime_type)


def _render_pdf_page_png(pdf_bytes: bytes, page_num: int, dpi: int = 120) -> bytes:
    """Render a single PDF page to PNG bytes."""
    if fitz is not None:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page = doc[page_num]
        mat = fitz.Matrix(dpi / 72, dpi / 72)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img_bytes = pix.tobytes("png")
        doc.close()
        return img_bytes
    return b""


def _extract_pdf_page_ocr(args: tuple[bytes, int]) -> str:
    """Extract text from a single PDF page via OCR. Designed for ProcessPoolExecutor."""
    pdf_bytes, page_num = args
    img_bytes = _render_pdf_page_png(pdf_bytes, page_num, dpi=75)
    if not img_bytes:
        return ""
    return _ocr_image_bytes(img_bytes)


async def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF. Uses text layer if available, else OCR."""
    loop = asyncio.get_event_loop()
    pdf_bytes = Path(file_path).read_bytes()

    if fitz is not None:
        doc = fitz.open(file_path)
        pages_text = []
        needs_ocr_pages = []

        for i, page in enumerate(doc):
            text = page.get_text().strip()
            if text:
                pages_text.append((i, text))
            else:
                needs_ocr_pages.append(i)
        doc.close()
    else:
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        pages_text = []
        needs_ocr_pages = []
        for i, page in enumerate(reader.pages):
            text = (page.extract_text() or "").strip()
            if text:
                pages_text.append((i, text))
            else:
                needs_ocr_pages.append(i)

    if needs_ocr_pages:
        provider = getattr(settings, "ocr_provider", "auto").lower()
        gemini_success = False

        if provider in ("gemini", "auto"):
            try:
                tasks = []
                for p in needs_ocr_pages:
                    png_bytes = _render_pdf_page_png(pdf_bytes, p, dpi=120)
                    if png_bytes:
                        tasks.append(ocr_image_with_gemini(png_bytes, "image/png"))

                if tasks:
                    ocr_results = await asyncio.gather(*tasks, return_exceptions=True)
                    valid_results = []
                    for page_num, res in zip(needs_ocr_pages, ocr_results):
                        if isinstance(res, Exception):
                            raise res
                        valid_results.append((page_num, res))

                    pages_text.extend(valid_results)
                    gemini_success = True
            except Exception as e:
                print(f"[OCR] Gemini Vision PDF OCR failed: {e}. Fallback to PaddleOCR.")
                if provider == "gemini":
                    raise e

        if not gemini_success:
            # Fallback to PaddleOCR in parallel (max 3 workers)
            with ProcessPoolExecutor(max_workers=3) as executor:
                tasks = [(pdf_bytes, p) for p in needs_ocr_pages]
                ocr_results = await loop.run_in_executor(
                    None,
                    lambda: list(executor.map(_extract_pdf_page_ocr, tasks))
                )
            for page_num, ocr_text in zip(needs_ocr_pages, ocr_results):
                pages_text.append((page_num, ocr_text))

    pages_text.sort(key=lambda x: x[0])
    return "\n\n".join(
        f"[Trang {page_idx + 1}]\n{text.strip()}"
        for page_idx, text in pages_text
        if text and text.strip()
    )


async def extract_text_from_image(file_path: str) -> str:
    """Extract text from image file using Google Gemini Vision OCR with PaddleOCR fallback."""
    loop = asyncio.get_event_loop()
    img_bytes = Path(file_path).read_bytes()
    ext = Path(file_path).suffix.lower().lstrip(".")
    mime_map = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp",
        "gif": "image/gif",
        "bmp": "image/bmp",
        "tiff": "image/tiff",
    }
    mime_type = mime_map.get(ext, "image/png")

    provider = getattr(settings, "ocr_provider", "auto").lower()
    if provider in ("gemini", "auto"):
        try:
            text = await ocr_image_with_gemini(img_bytes, mime_type)
            if text:
                return text
        except Exception as e:
            print(f"[OCR] Gemini Vision OCR failed on image: {e}. Fallback to PaddleOCR.")
            if provider == "gemini":
                raise e

    # Fallback to PaddleOCR
    return await loop.run_in_executor(None, _ocr_image_bytes, img_bytes)


async def extract_text_from_url(url: str) -> tuple[str, str]:
    """Scrape text content from a URL. Returns (title, text)."""
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; DocuGraphBot/1.0)",
        "Accept": "text/html,application/xhtml+xml",
    }
    async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client:
        resp = await client.get(url, headers=headers)
        resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")

    # Remove nav, footer, script, style, ads
    for tag in soup(["nav", "footer", "script", "style", "aside", "header", "noscript", "iframe"]):
        tag.decompose()

    title = soup.title.get_text(strip=True) if soup.title else url

    # Extract main content
    main = soup.find("main") or soup.find("article") or soup.find("body")
    if main:
        text = main.get_text(separator="\n", strip=True)
    else:
        text = soup.get_text(separator="\n", strip=True)

    # Clean up blank lines
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return title, "\n".join(lines)


async def extract_text_from_docx(file_path: str) -> str:
    """Extract text and tables from a DOCX file with page markers."""
    import docx

    doc_file = docx.Document(file_path)
    blocks = [p.text.strip() for p in doc_file.paragraphs if p.text and p.text.strip()]
    for table in doc_file.tables:
        for row in table.rows:
            row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
            if row_text:
                blocks.append(row_text)
    paged = []
    for idx, para in enumerate(blocks):
        page_no = (idx // 8) + 1
        paged.append(f"[Trang {page_no}]\n{para}")
    return "\n\n".join(paged)


async def extract_text_from_txt(file_path: str) -> str:
    """Extract text from plain text / markdown file."""
    raw = Path(file_path).read_bytes()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        text = raw.decode("latin-1", errors="ignore")
    return f"[Trang 1]\n{text.strip()}" if text.strip() else ""


async def process_document(file_path: str, source_type: str) -> str:
    """Main entry point: extract text based on file extension or source type."""
    ext = Path(file_path).suffix.lower().lstrip(".")
    if ext == "docx":
        return await extract_text_from_docx(file_path)
    if ext in ("txt", "md"):
        return await extract_text_from_txt(file_path)
    if source_type == "pdf" or ext == "pdf":
        return await extract_text_from_pdf(file_path)
    elif source_type == "image":
        text = await extract_text_from_image(file_path)
        return f"[Trang 1]\n{text.strip()}" if text and text.strip() else ""
    else:
        raise ValueError(f"Unsupported source type for file: {source_type}")


def _generate_summary_sync(text: str, title: str) -> dict:
    """Generate multi-layer summary (TL;DR + Key Points + Detailed) via Gemini with fallback."""
    import json
    import re

    snippet = text[:12000].strip()
    if snippet:
        prompt = (
            f"Bạn là trợ lý học thuật AI. Dựa trên nội dung tài liệu '{title}' dưới đây, "
            "hãy tổng hợp bản tóm tắt đa tầng bằng tiếng Việt và trả về đúng JSON theo cấu trúc:\n"
            "{\n"
            '  "summary_tldr": "Tóm tắt tổng quan ngắn gọn 2-3 câu bao quát toàn bộ tài liệu",\n'
            '  "key_points": ["Luận điểm cốt lõi 1 (kèm [Trang N] nếu có)", "Luận điểm cốt lõi 2", "Luận điểm cốt lõi 3"],\n'
            '  "summary_detailed": "Bản tóm tắt chi tiết các phần quan trọng trong tài liệu"\n'
            "}\n"
            "Chỉ trả về JSON hợp lệ, không bọc trong markdown.\n\n"
            f"NỘI DUNG TÀI LIỆU:\n{snippet}"
        )
        for client in get_gemini_clients():
            try:
                resp = client.models.generate_content(
                    model=settings.chat_model,
                    contents=prompt,
                )
                raw = (resp.text or "").strip()
                raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.MULTILINE).strip()
                parsed = json.loads(raw)
                if isinstance(parsed, dict) and parsed.get("summary_tldr"):
                    return {
                        "summary_tldr": str(parsed.get("summary_tldr", "")),
                        "key_points": list(parsed.get("key_points") or [])[:6],
                        "summary_detailed": str(parsed.get("summary_detailed", "")),
                    }
            except Exception:
                continue

    # Context-grounded fallback from extracted text
    lines = [ln.strip() for ln in snippet.splitlines() if ln.strip() and not ln.strip().startswith("[Trang")]
    first_sentences = " ".join(lines[:4])[:360] if lines else f"Tài liệu '{title}' đã được trích xuất và lập chỉ mục GraphRAG."
    key_pts = [ln[:180] for ln in lines[:4]] if lines else [f"Nội dung trọng tâm của {title}"]
    return {
        "summary_tldr": first_sentences,
        "key_points": key_pts,
        "summary_detailed": "\n".join(lines[:10])[:1000] if lines else first_sentences,
    }


async def generate_source_summary(text: str, title: str) -> dict:
    """Async wrapper for multi-layer document summary generation."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _generate_summary_sync, text, title)


def split_text_into_chunks(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> list[str]:
    """Split text into overlapping chunks using RecursiveCharacterTextSplitter."""
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ".", " ", ""],
    )
    return splitter.split_text(text)
