export interface IAuthIdentity {
  /** ID của entity trong bảng tương ứng */
  id: string;

  email: string;

  /**
   * Phân biệt entity nào đang login
   * @example 'user' | 'merchant' | 'admin'
   */
  type: string;

  /**
   * Role tùy chọn — dùng cho RBAC
   * @example 'super-admin' | 'editor' | undefined
   */
  role?: string;
}
