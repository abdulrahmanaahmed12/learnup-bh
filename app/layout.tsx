import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-cairo',
})

export const metadata: Metadata = {
  title: 'LearnUp.bh - تعلّم بطريقتك الصح',
  description: 'منصة تعليمية متخصصة للطلاب في البحرين',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="min-h-screen" style={{ backgroundColor: '#32004d', color: '#ffffff', fontFamily: "'Cairo', sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
