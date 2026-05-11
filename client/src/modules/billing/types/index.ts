export type BillingPlanId = 'free' | 'pro' | 'team'

export type BillingPeriod = 'monthly' | 'annual'

export type CurrentPlanStatus = 'active' | 'trialing' | 'cancelled' | 'past_due'

export interface PlanFeature {
  label: string
  included: boolean
  emphasis?: boolean
}

export interface Plan {
  id: BillingPlanId
  name: string
  priceMonthly: number
  priceAnnualPerMonth: number
  popular: boolean
  features: PlanFeature[]
}

export interface Subscription {
  planId: BillingPlanId
  planName: string
  tagline: string
  status: CurrentPlanStatus
  period: BillingPeriod
  renewalDate: string | null
  amount: number
}

export interface UsageStat {
  id: string
  label: string
  used: number | string
  limit: number | string
  percent: number
  tone: 'neutral' | 'warning' | 'danger'
  sub: string
  upgradeLink?: boolean
}

export type PaymentMethodBrand = 'visa' | 'mastercard' | 'momo' | 'zalopay'

export interface PaymentMethod {
  id: string
  brand: PaymentMethodBrand
  label: string
  meta: string
  isDefault: boolean
  disabled?: boolean
}

export type InvoiceStatus = 'paid' | 'failed' | 'pending'

export interface Invoice {
  id: string
  description: string
  date: string
  amount: number
  status: InvoiceStatus
}

export interface UpgradePayload {
  planId: BillingPlanId
  period: BillingPeriod
  paymentMethodId: string
}
