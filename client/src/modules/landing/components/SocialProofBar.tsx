'use client'

const stats = [
  { num: '12,400+', label: 'Học viên đang học' },
  { num: '2.8M+', label: 'Flashcard đã ôn' },
  { num: '87%', label: 'Tỉ lệ nhớ từ sau 30 ngày' },
  { num: '94%', label: 'Học viên JLPT đỗ kỳ đầu' },
  { num: '★ 4.9', label: 'Đánh giá trung bình' },
]

export function SocialProofBar() {
  return (
    <div className="border-b border-t border-border bg-card py-5">
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-center gap-8 px-8 lg:gap-10">
        {stats.map((stat, i) => (
          <div key={stat.label} className="flex items-center gap-8 lg:gap-10">
            <div className="text-center">
              <div className="text-[22px] font-semibold tracking-[-0.5px] text-ink">{stat.num}</div>
              <div className="mt-0.5 text-[11px] text-ink-4">{stat.label}</div>
            </div>
            {i < stats.length - 1 && (
              <div className="hidden h-7 w-px bg-border lg:block" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
