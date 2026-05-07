'use client'

import { useState } from 'react'
import { AuthLeftPanel } from './AuthLeftPanel'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { ForgotPasswordInline } from './ForgotPasswordInline'

type Tab = 'login' | 'register'

interface Props {
  defaultTab?: Tab
}

export function AuthPage({ defaultTab = 'login' }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab)
  const [showForgot, setShowForgot] = useState(false)

  const switchTab = (tab: Tab) => {
    setActiveTab(tab)
    setShowForgot(false)
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left panel — desktop only */}
      <AuthLeftPanel className="hidden lg:flex" />

      {/* Right panel */}
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8] px-5 py-10 lg:px-10">
        <div className="w-full max-w-[400px]">

          {/* Logo — mobile only */}
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[#0D0D0F]">
              <span className="font-mono text-[13px] text-white">日</span>
            </div>
            <span className="text-base font-semibold tracking-tight text-[#0D0D0F]">Nihongo</span>
          </div>

          {/* Tab switcher — hidden khi đang ở forgot password state */}
          {!showForgot && (
            <div className="mb-8 flex gap-0.5 rounded-2xl bg-[#F2F2EF] p-[3px]">
              {(['login', 'register'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => switchTab(tab)}
                  className={[
                    'flex-1 rounded-lg py-2 text-[13px] font-medium transition-all',
                    activeTab === tab
                      ? 'bg-white text-[#0D0D0F] shadow-[0_1px_4px_rgba(13,13,15,0.1)]'
                      : 'text-[#7A7A85] hover:text-[#3A3A40]',
                  ].join(' ')}
                >
                  {tab === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                </button>
              ))}
            </div>
          )}

          {/* Forms */}
          {activeTab === 'login' && !showForgot && (
            <LoginForm
              onForgotPassword={() => setShowForgot(true)}
              onSwitchToRegister={() => switchTab('register')}
            />
          )}

          {activeTab === 'login' && showForgot && (
            <ForgotPasswordInline onBack={() => setShowForgot(false)} />
          )}

          {activeTab === 'register' && (
            <RegisterForm onSwitchToLogin={() => switchTab('login')} />
          )}

        </div>
      </div>
    </div>
  )
}
