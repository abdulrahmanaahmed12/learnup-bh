'use client'

import { useEffect, useRef } from 'react'

interface Props {
  studentName: string
  subjectName: string
  completedAt: string
}

export default function CertificateCanvas({ studentName, subjectName, completedAt }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = 1200
    const H = 800
    canvas.width = W
    canvas.height = H

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, '#210340')
    grad.addColorStop(0.5, '#32004d')
    grad.addColorStop(1, '#210340')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Decorative border
    ctx.strokeStyle = '#c084fc'
    ctx.lineWidth = 4
    ctx.strokeRect(24, 24, W - 48, H - 48)
    ctx.strokeStyle = 'rgba(192,132,252,0.3)'
    ctx.lineWidth = 1
    ctx.strokeRect(36, 36, W - 72, H - 72)

    // Corner decorations
    const corners = [[60, 60], [W - 60, 60], [60, H - 60], [W - 60, H - 60]]
    corners.forEach(([x, y]) => {
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.fillStyle = '#c084fc'
      ctx.fill()
    })

    // LU Logo area
    ctx.fillStyle = '#500078'
    ctx.beginPath()
    ctx.roundRect(W / 2 - 50, 70, 100, 100, 20)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 42px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('LU', W / 2, 140)

    // LearnUp.bh
    ctx.font = 'bold 22px Arial'
    ctx.fillStyle = '#c084fc'
    ctx.textAlign = 'center'
    ctx.fillText('LearnUp.bh', W / 2, 210)

    // Certificate title (Arabic-style, using available fonts)
    ctx.font = 'bold 48px Arial'
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.fillText('شهادة إتمام', W / 2, 290)

    // Divider line
    ctx.beginPath()
    ctx.moveTo(W / 2 - 200, 315)
    ctx.lineTo(W / 2 + 200, 315)
    const lineGrad = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0)
    lineGrad.addColorStop(0, 'transparent')
    lineGrad.addColorStop(0.5, '#c084fc')
    lineGrad.addColorStop(1, 'transparent')
    ctx.strokeStyle = lineGrad
    ctx.lineWidth = 1.5
    ctx.stroke()

    // "Presented to"
    ctx.font = '22px Arial'
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.textAlign = 'center'
    ctx.fillText('تُمنح هذه الشهادة إلى', W / 2, 370)

    // Student name
    ctx.font = 'bold 52px Arial'
    ctx.fillStyle = '#c084fc'
    ctx.textAlign = 'center'
    ctx.fillText(studentName, W / 2, 445)

    // "for completing"
    ctx.font = '22px Arial'
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.textAlign = 'center'
    ctx.fillText('لإتمامه/ها جميع دروس مادة', W / 2, 505)

    // Subject name
    ctx.font = 'bold 38px Arial'
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.fillText(subjectName, W / 2, 560)

    // Platform description
    ctx.font = '18px Arial'
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.textAlign = 'center'
    ctx.fillText('عبر منصة LearnUp.bh التعليمية', W / 2, 605)

    // Date
    ctx.font = '18px Arial'
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.textAlign = 'center'
    ctx.fillText(`تاريخ الإنجاز: ${completedAt}`, W / 2, 645)

    // Trophy emoji area
    ctx.font = '48px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('🏆', W / 2, 730)

    // Decorative stars
    ctx.font = '20px Arial'
    ctx.fillText('✦  ✦  ✦', W / 2, 760)
  }, [studentName, subjectName, completedAt])

  function download() {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.download = `شهادة-${subjectName}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
  }

  return (
    <div className="space-y-4">
      <canvas
        ref={canvasRef}
        className="w-full rounded-2xl border border-white/10"
        style={{ maxWidth: '100%' }}
      />
      <button
        onClick={download}
        className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #500078, #6b009f)' }}
      >
        ⬇ تحميل الشهادة PNG
      </button>
    </div>
  )
}
