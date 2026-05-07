import { cn } from '@shared/utils'
import type { QuestionData } from '../types'

interface QuestionPreviewCardProps {
  questionData: QuestionData
  className?: string
}

export function QuestionPreviewCard({ questionData, className }: QuestionPreviewCardProps) {
  const { type, prompt, choices, answer, explanation } = questionData

  return (
    <div className={cn('rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm space-y-3', className)}>
      {/* Prompt */}
      {prompt && (
        <p className="font-medium text-gray-900 leading-snug">{prompt}</p>
      )}

      {/* Quiz choices */}
      {type === 'quiz' && choices && choices.length > 0 && (
        <div className="space-y-1.5">
          {choices.map((choice, i) => {
            const isAnswer = choice === answer
            return (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs',
                  isAnswer
                    ? 'border-green-300 bg-green-50 font-medium text-green-700'
                    : 'border-gray-200 bg-white text-gray-600',
                )}
              >
                <span className="font-mono text-gray-400 w-4 shrink-0">
                  {String.fromCharCode(65 + i)}.
                </span>
                {choice}
                {isAnswer && <span className="ml-auto text-[10px] text-green-600">✓ Đáp án</span>}
              </div>
            )
          })}
        </div>
      )}

      {/* Fill in blank answer */}
      {type === 'fill_in_blank' && !!answer && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5">
          <span className="text-xs text-blue-500 font-medium">Đáp án:</span>
          <span className="text-xs font-semibold text-blue-700">{String(answer)}</span>
        </div>
      )}

      {/* Matching pairs */}
      {type === 'matching' && choices && Array.isArray(answer) && (
        <div className="space-y-1">
          {choices.map((left, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="min-w-0 flex-1 rounded bg-purple-50 px-2 py-1 text-purple-700 font-medium truncate">
                {left}
              </span>
              <span className="text-gray-400 shrink-0">→</span>
              <span className="min-w-0 flex-1 rounded bg-orange-50 px-2 py-1 text-orange-700 font-medium truncate">
                {(answer as string[])[i] ?? ''}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Explanation */}
      {explanation && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2 text-xs text-yellow-800">
          <span className="font-medium">Giải thích: </span>
          {explanation}
        </div>
      )}
    </div>
  )
}
