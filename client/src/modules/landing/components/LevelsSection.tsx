'use client'

const levels = [
  {
    badge: 'N5',
    badgeClass: 'bg-pine-light text-pine',
    name: 'Sơ cấp',
    desc: 'Bảng chữ cái, chào hỏi, sinh hoạt cơ bản',
    count: '800 từ · 103 mẫu câu',
    featured: false,
  },
  {
    badge: 'N4',
    badgeClass: 'bg-[#E8F4FF] text-[#1565C0]',
    name: 'Cơ bản',
    desc: 'Hội thoại hàng ngày, mua sắm, đi lại',
    count: '1,500 từ · 181 mẫu câu',
    featured: false,
  },
  {
    badge: 'N3',
    badgeClass: 'bg-amber-light text-amber',
    name: 'Trung cấp',
    desc: 'Đọc báo đơn giản, làm việc môi trường Nhật',
    count: '3,750 từ · 240 mẫu câu',
    featured: false,
  },
  {
    badge: 'N2',
    badgeClass: 'bg-vermillion-light text-vermillion',
    name: 'Cao cấp',
    desc: 'Đọc hiểu phức tạp, hội thoại công việc',
    count: '6,000 từ · 312 mẫu câu',
    featured: false,
  },
  {
    badge: 'N1',
    badgeClass: 'bg-ink text-[#FFD700]',
    name: 'Thành thạo',
    desc: 'Báo chí, văn học, hội nghị chuyên ngành',
    count: '10,000+ từ · 400+ mẫu câu',
    featured: true,
  },
]

export function LevelsSection() {
  return (
    <section id="levels" className="mx-auto max-w-[1100px] px-8 py-20">
      <div className="mb-12 text-center">
        <div className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">
          ✦ Cấp độ
        </div>
        <h2 className="mb-3 text-[38px] font-light leading-tight tracking-[-1px] text-ink">
          Học từ <strong className="font-semibold">N5 đến N1</strong>
          <br />
          trong một nơi
        </h2>
        <p className="mx-auto max-w-[480px] text-[15px] leading-[1.7] text-ink-3">
          Dù bạn chưa biết gì hay đang chuẩn bị thi N1 — nội dung luôn đúng cấp độ của bạn.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {levels.map((lv) => (
          <div
            key={lv.badge}
            className={`rounded-xl border bg-card px-4 py-6 text-center will-change-transform transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(13,13,15,0.07)] ${
              lv.featured ? 'border-ink' : 'border-border'
            }`}
          >
            <div
              className={`mx-auto mb-3.5 flex h-11 w-11 items-center justify-center rounded-full font-mono text-[15px] font-bold ${lv.badgeClass}`}
            >
              {lv.badge}
            </div>
            <div className="mb-1 text-[13px] font-semibold text-ink">{lv.name}</div>
            <div className="mb-3 text-[11px] leading-[1.5] text-ink-4">{lv.desc}</div>
            <div className="text-[11px] font-medium text-ink-3">{lv.count}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
