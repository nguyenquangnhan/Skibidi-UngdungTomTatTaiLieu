import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
})

export const metadata = {
  title: 'Skibidi — Ứng Dụng Tóm Tắt & Hỏi Đáp Tài Liệu Thông Minh',
  description: 'Nền tảng tóm tắt và hỏi đáp tài liệu thông minh kết hợp GraphRAG, PP-OCRv6 và Google Gemini AI',
  keywords: ['Skibidi', 'RAG', 'AI', 'document', 'tóm tắt tài liệu', 'Gemini', 'knowledge graph'],
}

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className="dark">
      <body className={`${inter.variable} font-sans`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
