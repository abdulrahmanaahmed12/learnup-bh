'use client'

import Link from 'next/link'

export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { box: 'w-8 h-8 text-sm', text: 'text-base' },
    md: { box: 'w-10 h-10 text-base', text: 'text-xl' },
    lg: { box: 'w-14 h-14 text-xl', text: 'text-3xl' },
  }
  const s = sizes[size]

  return (
    <Link href="/" className="flex items-center gap-2 group">
      <div
        className={`${s.box} rounded-xl flex items-center justify-center font-black text-white border-2 border-white/30 transition-all group-hover:border-white/60`}
        style={{ background: 'linear-gradient(135deg, #500078, #32004d)' }}
      >
        LU
      </div>
      <span className={`${s.text} font-bold text-white`}>LearnUp.bh</span>
    </Link>
  )
}
