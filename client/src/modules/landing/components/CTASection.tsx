'use client'

import Link from 'next/link'

export function CTASection() {
  return (
    <section className="mx-auto max-w-[1100px] px-8 py-20">
      <div className="relative overflow-hidden rounded-[28px] bg-ink px-8 py-16 text-center">
        {/* Decorative background text */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap font-mono text-[180px] font-light leading-none tracking-[8px] text-white"
          style={{ opacity: 0.03 }}
          aria-hidden
        >
          日本語
        </div>

        <div className="relative z-10">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.1em] text-white/30">
            ✦ Bắt đầu ngay hôm nay
          </div>
          <h2 className="mb-2.5 text-[40px] font-light leading-tight tracking-[-1px] text-white">
            Hành trình
            <br />
            <strong className="font-semibold">日本語 bắt đầu từ đây</strong>
          </h2>
          <p className="mx-auto mb-8 max-w-[400px] text-[15px] text-white/45">
            Miễn phí hoàn toàn để bắt đầu. Không cần thẻ tín dụng. Không cần kinh nghiệm tiếng
            Nhật.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3.5 text-[15px] font-semibold text-ink transform-gpu will-change-transform transition-[transform,background-color] duration-200 hover:-translate-y-px hover:bg-surface"
          >
            Tạo tài khoản miễn phí →
          </Link>
          <div className="mt-4 text-xs text-white/25">
            Tham gia cùng 12,400+ học viên đang học mỗi ngày
          </div>
        </div>
      </div>
    </section>
  )
}
