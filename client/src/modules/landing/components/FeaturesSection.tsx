'use client'

const features = [
  {
    icon: '🃏',
    iconBg: 'bg-ink',
    iconStyle: { filter: 'invert(1)' } as React.CSSProperties,
    title: 'SRS Flashcard 2 chiều',
    desc: 'Không chỉ nhận diện — bạn nhìn nghĩa tiếng Việt và tự viết tiếng Nhật. Khoảng cách ôn tập được tính theo thuật toán, đúng lúc bạn sắp quên.',
    tag: 'Cốt lõi',
    tagClass: 'bg-ink text-white',
    featured: true,
  },
  {
    icon: '📝',
    iconBg: 'bg-pine-light',
    title: 'Ngữ pháp có bối cảnh',
    desc: 'Học mẫu câu qua tình huống thực, so sánh các mẫu dễ nhầm lẫn. Không chỉ lý thuyết khô khan.',
    tag: 'Ngữ pháp',
    tagClass: 'bg-pine-light text-pine',
  },
  {
    icon: '🏆',
    iconBg: 'bg-amber-light',
    title: 'Mock Test JLPT chuẩn',
    desc: 'Đề thi N5→N1 mô phỏng format thật, tính giờ, chấm điểm tự động và phân tích điểm yếu sau mỗi lần thi.',
    tag: 'Luyện thi',
    tagClass: 'bg-amber-light text-amber',
  },
  {
    icon: '🤖',
    iconBg: 'bg-vermillion-light',
    title: 'Hội thoại AI Sensei',
    desc: 'Luyện nói với AI đóng vai nhân vật Nhật Bản. Sửa lỗi ngữ pháp inline, gợi ý cách diễn đạt tự nhiên hơn.',
    tag: 'AI',
    tagClass: 'bg-vermillion-light text-vermillion',
  },
  {
    icon: '📖',
    iconBg: 'bg-[#EDE8FE]',
    title: 'Đọc hiểu từ điển nhúng',
    desc: 'Đọc báo, truyện, văn bản Nhật thực — click vào từ bất kỳ để tra nghĩa tức thì và thêm vào bộ ôn ngay.',
    tag: 'Đọc hiểu',
    tagClass: 'bg-[#EDE8FE] text-[#5B45C7]',
  },
  {
    icon: '🗺️',
    iconBg: 'bg-surface',
    title: 'Lộ trình cá nhân hóa',
    desc: 'Quiz đầu vào xác định trình độ, hệ thống tự tạo lộ trình học và điều chỉnh tốc độ theo từng người.',
    tag: 'Kế hoạch',
    tagClass: 'bg-surface text-ink-3',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-[1100px] px-8 py-20">
      <div className="mb-14 text-center">
        <div className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">
          ✦ Tính năng
        </div>
        <h2 className="mb-3 text-[38px] font-light leading-tight tracking-[-1px] text-ink">
          Mọi thứ bạn cần để
          <br />
          <strong className="font-semibold">học tiếng Nhật thật sự</strong>
        </h2>
        <p className="mx-auto max-w-[480px] text-[15px] leading-[1.7] text-ink-3">
          Không phải app học cho vui — được thiết kế để bạn đạt được mục tiêu cụ thể, dù là JLPT,
          công việc hay du lịch.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className={`cursor-default rounded-xl border bg-card p-6 will-change-transform transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(13,13,15,0.06)] ${
              f.featured ? 'border-ink' : 'border-border hover:border-border/80'
            }`}
          >
            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg text-xl ${f.iconBg}`}>
              <span style={f.iconStyle}>{f.icon}</span>
            </div>
            <div className="mb-1.5 text-base font-semibold tracking-[-0.2px] text-ink">
              {f.title}
            </div>
            <div className="text-[13px] leading-[1.65] text-ink-3">{f.desc}</div>
            <span className={`mt-3 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${f.tagClass}`}>
              {f.tag}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
