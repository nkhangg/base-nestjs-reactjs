'use client'

import { HeroSection } from './HeroSection'
import { SocialProofBar } from './SocialProofBar'
import { FeaturesSection } from './FeaturesSection'
import { HowItWorksSection } from './HowItWorksSection'
import { LevelsSection } from './LevelsSection'
import { TestimonialsSection } from './TestimonialsSection'
import { CTASection } from './CTASection'

export function LandingPage() {
  return (
    <main>
      <HeroSection />
      <SocialProofBar />
      <FeaturesSection />
      <HowItWorksSection />
      <LevelsSection />
      <TestimonialsSection />
      <CTASection />
    </main>
  )
}
