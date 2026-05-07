'use client'

import { cn } from '@shared/utils'

interface Props {
  password: string
}

function getStrength(val: string) {
  if (!val) return { score: 0, label: 'Tối thiểu 8 ký tự, gồm chữ và số', colorClass: '' }
  let score = 0
  if (val.length >= 8) score++
  if (/[A-Z]/.test(val)) score++
  if (/[0-9]/.test(val)) score++
  if (/[^A-Za-z0-9]/.test(val)) score++

  const configs = [
    { label: 'Tối thiểu 8 ký tự, gồm chữ và số', colorClass: '' },
    { label: 'Quá yếu — thêm chữ hoa hoặc số', colorClass: 'bg-red-500' },
    { label: 'Trung bình — thêm ký tự đặc biệt', colorClass: 'bg-amber-500' },
    { label: 'Khá tốt — gần đủ mạnh', colorClass: 'bg-amber-400' },
    { label: '✓ Mật khẩu mạnh', colorClass: 'bg-teal-600' },
  ]

  return { score, ...configs[score] }
}

export function PasswordStrengthBar({ password }: Props) {
  const { score, label, colorClass } = getStrength(password)
  const width = score === 0 ? '0%' : `${score * 25}%`

  return (
    <div className="mt-1.5">
      <div className="h-[3px] w-full overflow-hidden rounded-full bg-[#E8E8E4]">
        <div
          className={cn('h-full rounded-full transition-all duration-300', colorClass)}
          style={{ width }}
        />
      </div>
      <p
        className={cn(
          'mt-1 text-[11px]',
          score === 0 && 'text-[#ADADB8]',
          score === 1 && 'text-red-500',
          score === 2 && 'text-amber-500',
          score === 3 && 'text-amber-400',
          score === 4 && 'text-teal-600',
        )}
      >
        {label}
      </p>
    </div>
  )
}
