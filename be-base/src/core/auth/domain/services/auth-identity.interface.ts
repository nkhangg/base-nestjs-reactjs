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
   * Role tùy chọn — dùng cho RBAC (user/merchant validators)
   * @example 'super-admin' | 'editor' | undefined
   */
  role?: string;

  /** Set true cho admin identities — đưa vào JWT để guard check */
  isAdmin?: boolean;
}
