import { describe, it, expect } from 'vitest'
import { handleApiError } from '@lib/error-handler'
import type { AxiosError } from 'axios'

function makeAxiosError(overrides: Partial<AxiosError> = {}): AxiosError {
  return {
    isAxiosError: true,
    message: 'Network Error',
    name: 'AxiosError',
    request: undefined,
    response: undefined,
    config: {} as AxiosError['config'],
    toJSON: () => ({}),
    ...overrides,
  } as AxiosError
}

describe('handleApiError()', () => {
  describe('response errors', () => {
    it.each([
      [400, 'Yêu cầu không hợp lệ'],
      [401, 'Phiên đăng nhập đã hết hạn'],
      [403, 'Bạn không có quyền thực hiện thao tác này'],
      [404, 'Không tìm thấy dữ liệu'],
      [409, 'Dữ liệu đã tồn tại'],
      [422, 'Dữ liệu không hợp lệ'],
      [429, 'Quá nhiều yêu cầu, vui lòng thử lại sau'],
      [500, 'Lỗi máy chủ nội bộ'],
      [502, 'Máy chủ tạm thời không khả dụng'],
      [503, 'Dịch vụ đang bảo trì'],
    ])('maps HTTP %i to correct message', (status, expectedMessage) => {
      const error = makeAxiosError({ response: { status, data: {} } as AxiosError['response'] })
      const result = handleApiError(error)
      expect(result.message).toBe(expectedMessage)
      expect(result.status).toBe(status)
    })

    it('uses message from response data when present', () => {
      const error = makeAxiosError({
        response: { status: 400, data: { message: 'Custom server message' } } as AxiosError['response'],
      })
      expect(handleApiError(error).message).toBe('Custom server message')
    })

    it('extracts code from response data', () => {
      const error = makeAxiosError({
        response: { status: 400, data: { code: 'VALIDATION_FAILED' } } as AxiosError['response'],
      })
      expect(handleApiError(error).code).toBe('VALIDATION_FAILED')
    })

    it('returns undefined code when not in data', () => {
      const error = makeAxiosError({
        response: { status: 500, data: {} } as AxiosError['response'],
      })
      expect(handleApiError(error).code).toBeUndefined()
    })

    it('falls back to generic message for unknown status', () => {
      const error = makeAxiosError({
        response: { status: 418, data: {} } as AxiosError['response'],
      })
      expect(handleApiError(error).message).toBe('Đã có lỗi xảy ra')
    })
  })

  describe('network errors (no response)', () => {
    it('returns network unavailable message when request was made but no response', () => {
      const error = makeAxiosError({ request: {} })
      expect(handleApiError(error).message).toBe(
        'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.',
      )
    })
  })

  describe('setup errors (no request)', () => {
    it('returns the axios error message', () => {
      const error = makeAxiosError({ message: 'Timeout exceeded' })
      expect(handleApiError(error).message).toBe('Timeout exceeded')
    })

    it('falls back to generic when message is empty', () => {
      const error = makeAxiosError({ message: '' })
      expect(handleApiError(error).message).toBe('Đã có lỗi xảy ra')
    })
  })
})
