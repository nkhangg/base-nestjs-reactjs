import type { AxiosError } from 'axios'

export interface AppError {
  message: string
  status?: number
  code?: string
}

export function handleApiError(error: AxiosError): AppError {
  if (error.response) {
    const status = error.response.status
    const data = error.response.data as Record<string, unknown>

    const message =
      typeof data?.message === 'string'
        ? data.message
        : HTTP_STATUS_MESSAGES[status] ?? 'Đã có lỗi xảy ra'

    return { message, status, code: typeof data?.code === 'string' ? data.code : undefined }
  }

  if (error.request) {
    return { message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.' }
  }

  return { message: error.message ?? 'Đã có lỗi xảy ra' }
}

const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: 'Yêu cầu không hợp lệ',
  401: 'Phiên đăng nhập đã hết hạn',
  403: 'Bạn không có quyền thực hiện thao tác này',
  404: 'Không tìm thấy dữ liệu',
  409: 'Dữ liệu đã tồn tại',
  422: 'Dữ liệu không hợp lệ',
  429: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
  500: 'Lỗi máy chủ nội bộ',
  502: 'Máy chủ tạm thời không khả dụng',
  503: 'Dịch vụ đang bảo trì',
}
