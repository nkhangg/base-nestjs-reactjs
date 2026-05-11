import type {
  Invoice,
  PaymentMethod,
  Plan,
  Subscription,
  UpgradePayload,
  UsageStat,
} from '../types'

const FREE_PLAN: Plan = {
  id: 'free',
  name: 'Free',
  priceMonthly: 0,
  priceAnnualPerMonth: 0,
  popular: false,
  features: [
    { label: '20 flashcard/ngày', included: true },
    { label: 'Ngữ pháp N5–N4', included: true },
    { label: '1 Mock Test/tháng', included: true },
    { label: 'SRS không giới hạn', included: false },
    { label: 'AI Sensei', included: false },
  ],
}

const PRO_PLAN: Plan = {
  id: 'pro',
  name: 'Pro',
  priceMonthly: 199_000,
  priceAnnualPerMonth: 119_000,
  popular: true,
  features: [
    { label: 'Flashcard không giới hạn', included: true, emphasis: true },
    { label: 'Ngữ pháp N5 → N1 đầy đủ', included: true },
    { label: 'Mock Test không giới hạn', included: true },
    { label: 'AI Sensei hội thoại', included: true },
    { label: 'Nhật ký viết + AI sửa lỗi', included: true },
  ],
}

const MOCK_SUBSCRIPTION: Subscription = {
  planId: 'free',
  planName: 'Free',
  tagline: '20 flashcard/ngày · 1 Mock Test/tháng · Ngữ pháp N5–N4',
  status: 'active',
  period: 'monthly',
  renewalDate: null,
  amount: 0,
}

const MOCK_USAGE: UsageStat[] = [
  {
    id: 'flashcard',
    label: 'Flashcard hôm nay',
    used: 12,
    limit: 20,
    percent: 60,
    tone: 'warning',
    sub: 'Còn 8 thẻ trong ngày',
    upgradeLink: true,
  },
  {
    id: 'mock',
    label: 'Mock Test tháng này',
    used: 1,
    limit: 1,
    percent: 100,
    tone: 'danger',
    sub: 'Đã hết lượt · Reset 01/05',
  },
  {
    id: 'grammar',
    label: 'Ngữ pháp đã truy cập',
    used: 'N5 + N4',
    limit: 'N1',
    percent: 40,
    tone: 'neutral',
    sub: 'N3–N1 cần gói Pro',
  },
]

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'pm_visa_4242',
    brand: 'visa',
    label: 'Visa •••• •••• •••• 4242',
    meta: 'Hết hạn 12/2026',
    isDefault: true,
  },
  {
    id: 'pm_momo',
    brand: 'momo',
    label: 'MoMo · 0912 *** ***',
    meta: 'Đã liên kết',
    isDefault: false,
    disabled: true,
  },
]

const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv_2025_04',
    description: 'Nihongo Pro — Tháng 4/2025',
    date: '2025-04-01',
    amount: 199_000,
    status: 'paid',
  },
  {
    id: 'inv_2025_03',
    description: 'Nihongo Pro — Tháng 3/2025',
    date: '2025-03-01',
    amount: 199_000,
    status: 'paid',
  },
  {
    id: 'inv_2025_02',
    description: 'Nihongo Pro — Tháng 2/2025',
    date: '2025-02-01',
    amount: 199_000,
    status: 'paid',
  },
  {
    id: 'inv_2025_01',
    description: 'Nihongo Pro — Tháng 1/2025',
    date: '2025-01-01',
    amount: 199_000,
    status: 'failed',
  },
]

// TODO: replace mock stubs with apiClient calls once backend is ready.
export const billingService = {
  async getSubscription(): Promise<Subscription> {
    return MOCK_SUBSCRIPTION
  },

  async getPlans(): Promise<Plan[]> {
    return [FREE_PLAN, PRO_PLAN]
  },

  async getUsage(): Promise<UsageStat[]> {
    return MOCK_USAGE
  },

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return MOCK_PAYMENT_METHODS
  },

  async getInvoices(): Promise<Invoice[]> {
    return MOCK_INVOICES
  },

  async upgrade(_payload: UpgradePayload): Promise<Subscription> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...MOCK_SUBSCRIPTION,
          planId: 'pro',
          planName: 'Pro',
          tagline: 'Truy cập đầy đủ Flashcard, Mock Test, AI Sensei',
          status: 'trialing',
          renewalDate: '2025-05-23',
          amount: 199_000,
        })
      }, 600)
    })
  },
}
