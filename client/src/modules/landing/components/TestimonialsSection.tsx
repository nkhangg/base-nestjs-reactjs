'use client'

const testimonials = [
  {
    quote:
      'Thi JLPT N3 lần đầu là đậu. Phần từ vựng và ngữ pháp gần như hoàn hảo nhờ luyện flashcard 2 chiều mỗi ngày trong 6 tháng.',
    name: 'Minh Tuấn',
    level: 'Đậu JLPT N3 · TP.HCM',
    initials: 'MT',
    avatarClass: 'bg-pine-light text-pine',
  },
  {
    quote:
      'Mình học tiếng Nhật tự túc để đi làm tại Nhật. Dashboard tiến độ giúp mình biết chính xác mình yếu ở đâu để tập trung đúng chỗ.',
    name: 'Lan Hương',
    level: 'Kỹ sư tại Tokyo · N2',
    initials: 'LH',
    avatarClass: 'bg-vermillion-light text-vermillion',
  },
  {
    quote:
      'Trước giờ học mà hay quên lắm. Từ lúc dùng SRS thì từ nào học là nhớ lâu hẳn. 3 tháng mà đã nhớ hơn 600 từ rồi.',
    name: 'Phúc Khang',
    level: 'Sinh viên năm 3 · Hà Nội',
    initials: 'PK',
    avatarClass: 'bg-amber-light text-amber',
  },
]

export function TestimonialsSection() {
  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-[1100px] px-8">
        <div className="mb-12 text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">
            ✦ Học viên nói gì
          </div>
          <h2 className="text-[38px] font-light leading-tight tracking-[-1px] text-ink">
            Họ đã làm được,
            <br />
            <strong className="font-semibold">bạn cũng vậy</strong>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-xl border border-border bg-card p-6">
              <div className="mb-3.5 text-[12px] tracking-[1px] text-amber">★★★★★</div>
              <p className="mb-4 text-[14px] italic leading-[1.7] text-ink-2">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${t.avatarClass}`}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="text-[13px] font-medium text-ink">{t.name}</div>
                  <div className="text-[11px] text-ink-4">{t.level}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
