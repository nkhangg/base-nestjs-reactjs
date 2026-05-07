'use client'

import { Button } from '@/shared/components/ui'
import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-10 px-8 pb-16 pt-20 lg:grid-cols-[1fr_420px] lg:gap-16">
      {/* Left */}
      <div>
        <div className="mb-6 inline-flex animate-[fade-up_0.5s_0.05s_ease_both] items-center gap-1.5 rounded-full bg-vermillion-light px-2.5 py-1 opacity-0">
          <span className="h-[5px] w-[5px] rounded-full bg-vermillion" />
          <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-vermillion">
            Học tiếng Nhật thông minh hơn
          </span>
        </div>

        <h1 className="mb-6 animate-[fade-up_0.5s_0.12s_ease_both] text-[42px] font-light leading-[1.08] tracking-[-1.5px] text-ink opacity-0 lg:text-[52px]">
          Thành thạo
          <br />
          <strong className="font-semibold">tiếng Nhật</strong>
          <br />
          <span className="font-light text-ink-3">日本語を話せる</span>
        </h1>

        <p className="mb-10 max-w-[440px] animate-[fade-up_0.5s_0.2s_ease_both] text-base leading-[1.7] text-ink-3 opacity-0 lg:text-[17px]">
          Hệ thống học từ vựng, ngữ pháp và luyện thi JLPT được cá nhân hóa — được thiết kế để
          bạn thực sự nhớ, không chỉ ôn rồi quên.
        </p>

        <div className="flex animate-[fade-up_0.5s_0.28s_ease_both] flex-wrap items-center gap-2.5 opacity-0">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-ink px-7 py-3.5 text-[15px] font-medium text-white transform-gpu will-change-transform transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(13,13,15,0.25)]"
          >
            Bắt đầu học miễn phí →
          </Link>
          <Link
            href="#how"
            className="rounded-lg bg-white border-[1.5px] border-border px-6 py-[13px] text-[15px] font-medium text-ink transition-all hover:border-ink-4 hover:bg-surface"
          >
          Xem cách hoạt động
          </Link>
        </div>

        <p className="mt-4 animate-[fade-up_0.5s_0.36s_ease_both] text-xs text-ink-4 opacity-0">
          Miễn phí · Không cần thẻ tín dụng ·{' '}
          <Link href="/login" className="text-ink-3 underline underline-offset-[3px] hover:text-ink">
            Đăng nhập
          </Link>
        </p>
      </div>

      {/* Right — visual */}
      <div className="relative animate-[fade-up_0.6s_0.2s_ease_both] opacity-0">
        {/* Float badge — streak */}
        <div className="absolute -right-4 -top-[18px] z-10 hidden animate-[float-up_3s_0.5s_ease-in-out_infinite] rounded-lg border border-border bg-white px-3.5 py-2.5 shadow-[0_8px_24px_rgba(13,13,15,0.07)] lg:block">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🔥</span>
            <div>
              <div className="text-xs font-medium text-ink-2">21 ngày liên tiếp</div>
              <div className="text-[11px] text-ink-4">Streak mới nhất</div>
            </div>
          </div>
        </div>

        {/* Float badge — words */}
        <div className="absolute -left-5 bottom-[60px] z-10 hidden animate-[float-up_3s_1.2s_ease-in-out_infinite] rounded-lg border border-border bg-white px-3.5 py-2.5 shadow-[0_8px_24px_rgba(13,13,15,0.07)] lg:block">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">✓</span>
            <div>
              <div className="text-xs font-medium text-ink-2">+12 từ hôm nay</div>
              <div className="text-[11px] text-ink-4">Đã ghi nhớ</div>
            </div>
          </div>
        </div>

        <FlashCard />
      </div>
    </section>
  )
}

function FlashCard() {
  return (
    <div className="rounded-[28px] border border-border bg-card p-8 shadow-[0_20px_60px_rgba(13,13,15,0.08)]">
      <div className="mb-7 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-ink-4">
          Từ vựng · N3
        </span>
        <span className="rounded-full bg-pine-light px-2 py-0.5 text-[10px] font-medium text-pine">
          SRS · Ôn lại sau 3 ngày
        </span>
      </div>

      <div className="text-center">
        <div className="font-light leading-none tracking-[4px] text-[72px] text-ink">桜</div>
        <div className="mt-1.5 font-mono text-[13px] text-ink-3">さくら / sakura</div>
      </div>

      <div className="my-5 h-px bg-border" />

      <div className="mb-6 text-center text-xl font-normal text-ink-2">hoa anh đào</div>

      <div className="mb-6 rounded-lg bg-surface px-4 py-3.5">
        <div className="mb-0.5 text-sm leading-[1.5] text-ink">毎年、桜の季節が楽しみです。</div>
        <div className="text-xs text-ink-3">Mỗi năm, tôi rất mong chờ mùa hoa anh đào.</div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        <button className="rounded-sm border-[1.5px] border-vermillion-mid bg-white py-2.5 text-xs font-medium text-vermillion transition-colors hover:bg-vermillion-light">
          Quên rồi
        </button>
        <button className="rounded-sm border-[1.5px] border-surface-2 bg-white py-2.5 text-xs font-medium text-ink-3 transition-colors hover:bg-surface">
          Còn khó
        </button>
        <button className="rounded-sm border-[1.5px] border-pine bg-white py-2.5 text-xs font-medium text-pine transition-colors hover:bg-pine-light">
          Nhớ ổn
        </button>
        <button className="rounded-sm border-[1.5px] border-ink bg-ink py-2.5 text-xs font-medium text-white transition-colors hover:bg-ink-2">
          Dễ lắm
        </button>
      </div>
    </div>
  )
}
