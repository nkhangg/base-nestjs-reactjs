'use client'

const steps = [
  {
    num: '01',
    icon: '🎯',
    title: 'Chọn mục tiêu',
    desc: 'Du lịch, JLPT, công việc hay anime — hệ thống tự xây lộ trình phù hợp nhất.',
  },
  {
    num: '02',
    icon: '📊',
    title: 'Kiểm tra trình độ',
    desc: 'Quiz nhanh 5 phút xác định bạn đang ở đâu — sơ cấp, trung cấp hay nâng cao.',
  },
  {
    num: '03',
    icon: '📅',
    title: 'Học theo lịch',
    desc: 'Hệ thống giao bài mỗi ngày, tự động ôn đúng lúc bạn sắp quên theo SRS.',
  },
  {
    num: '04',
    icon: '🚀',
    title: 'Đạt mục tiêu',
    desc: 'Theo dõi tiến độ, thi thử JLPT và biết chính xác khi nào bạn sẵn sàng.',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how" className="bg-ink py-20">
      <div className="mx-auto max-w-[1100px] px-8">
        <div className="mb-14 text-center">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.1em] text-white/35">
            ✦ Cách hoạt động
          </div>
          <h2 className="mb-2.5 text-[38px] font-light leading-tight tracking-[-1px] text-white">
            Bắt đầu học trong
            <br />
            <strong className="font-semibold">5 phút</strong>
          </h2>
          <p className="mx-auto max-w-[440px] text-[15px] text-white/45">
            Không cần chuẩn bị gì — hệ thống tự điều chỉnh theo trình độ và mục tiêu của bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.num}
              className="rounded-xl border border-white/[0.08] bg-white/[0.05] p-6 transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.08]"
            >
              <div className="mb-4 font-mono text-[11px] tracking-[0.06em] text-white/25">
                {step.num}
              </div>
              <div className="mb-3.5 text-[28px]">{step.icon}</div>
              <div className="mb-1.5 text-[15px] font-semibold tracking-[-0.2px] text-white">
                {step.title}
              </div>
              <div className="text-[12.5px] leading-[1.6] text-white/45">{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
