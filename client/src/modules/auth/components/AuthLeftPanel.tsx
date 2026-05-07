'use client'

import { useEffect, useState } from 'react'
import { cn } from '@shared/utils'

const FEATURES = [
  { icon: '🃏', text: 'SRS thông minh — nhớ lâu hơn 3x' },
  { icon: '🏆', text: 'Mock Test sát đề thi JLPT chính thức' },
  { icon: '🤖', text: 'AI Sensei luyện hội thoại 24/7' },
  { icon: '📊', text: 'Phân tích tiến độ chi tiết theo từng kỹ năng' },
  { icon: '🔥', text: 'Streak system giúp bạn duy trì thói quen' },
]

const TESTIMONIALS = [
  {
    quote: 'Sau 4 tháng dùng Nihongo, tôi đã pass N3 với số điểm cao hơn mong đợi. SRS thật sự hiệu quả hơn học thẻ giấy rất nhiều.',
    initials: 'HN',
    name: 'Hà Nguyên',
    meta: 'Đạt N3 · 4 tháng học',
    avatarClass: 'bg-teal-600',
  },
  {
    quote: 'Streak system giúp tôi không bỏ ngày nào trong suốt 90 ngày. Tôi hoàn thành N4 nhanh hơn tôi nghĩ rất nhiều.',
    initials: 'MT',
    name: 'Minh Tú',
    meta: 'Đạt N4 · 3 tháng học',
    avatarClass: 'bg-indigo-500',
  },
  {
    quote: 'Mock Test của Nihongo sát với đề thật đến mức tôi cảm thấy quen thuộc khi vào phòng thi. Đậu N2 ngay lần đầu!',
    initials: 'PL',
    name: 'Phương Linh',
    meta: 'Đạt N2 · 8 tháng học',
    avatarClass: 'bg-violet-500',
  },
  {
    quote: 'AI Sensei giúp tôi luyện hội thoại mỗi ngày. Sau 6 tháng tôi đã có thể giao tiếp tự tin với đồng nghiệp người Nhật.',
    initials: 'TK',
    name: 'Thanh Khoa',
    meta: 'Giao tiếp N3 · 6 tháng học',
    avatarClass: 'bg-amber-600',
  },
]

interface Props {
  className?: string
}

export function AuthLeftPanel({ className }: Props) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setActiveIdx((i) => (i + 1) % TESTIMONIALS.length)
        setVisible(true)
      }, 350)
    }, 4500)
    return () => clearInterval(timer)
  }, [])

  const t = TESTIMONIALS[activeIdx]

  return (
    <div className={cn('relative flex flex-col overflow-hidden bg-[#0D0D0F] px-10 py-10', className)}>
      {/* Decorative circles */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-48 -top-48 h-[500px] w-[500px] rounded-full bg-white/[0.03]" />
        <div className="absolute -bottom-24 -left-24 h-[300px] w-[300px] rounded-full bg-white/[0.03]" />
      </div>

      {/* Logo */}
      <a href="/" className="relative mb-auto flex items-center gap-2 no-underline">
        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-white/[0.12]">
          <span className="font-mono text-[13px] text-white">日</span>
        </div>
        <span className="text-base font-semibold tracking-tight text-white">Nihongo</span>
      </a>

      {/* Content */}
      <div className="relative flex flex-1 flex-col justify-center py-8">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.1em] text-white/35">
          Học tiếng Nhật thông minh
        </p>
        <h2 className="mb-5 text-4xl font-light leading-[1.15] tracking-tight text-white">
          Lộ trình
          <br />
          <strong className="font-semibold">cá nhân hoá</strong>
          <br />
          cho từng bạn
        </h2>

        <ul className="mb-10 flex flex-col gap-2.5">
          {FEATURES.map((f) => (
            <li key={f.icon} className="flex items-center gap-2.5 text-[13px] text-white/60">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-white/[0.08] text-xs">
                {f.icon}
              </span>
              {f.text}
            </li>
          ))}
        </ul>

        {/* Testimonial */}
        <div
          className={cn(
            'rounded-2xl border border-white/[0.08] bg-white/[0.06] px-5 py-4 transition-all duration-500',
            visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
          )}
        >
          <p className="mb-3 text-[13px] leading-relaxed text-white/70">"{t.quote}"</p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white',
                  t.avatarClass,
                )}
              >
                {t.initials}
              </div>
              <div>
                <p className="text-xs font-medium text-white/80">{t.name}</p>
                <p className="text-[11px] text-white/35">{t.meta}</p>
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
              {TESTIMONIALS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1 rounded-full transition-all duration-300',
                    i === activeIdx ? 'w-4 bg-white/50' : 'w-1 bg-white/20',
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="relative text-[11px] text-white/20">© 2025 Nihongo · Học tiếng Nhật thông minh</p>
    </div>
  )
}
