# Module: landing

Marketing landing page — static public page, no API calls.

## Structure

```
src/modules/landing/
├── components/
│   ├── LandingPage.tsx        ← top-level assembly (use client)
│   ├── HeroSection.tsx        ← 2-col hero + flashcard visual + float badges
│   ├── SocialProofBar.tsx     ← 5-stat social proof bar
│   ├── FeaturesSection.tsx    ← 6-feature card grid
│   ├── HowItWorksSection.tsx  ← dark bg 4-step section
│   ├── LevelsSection.tsx      ← N5–N1 level cards
│   ├── TestimonialsSection.tsx← 3 testimonials
│   └── CTASection.tsx         ← dark CTA box
└── index.ts
```

## Public API

```ts
import { LandingPage } from '@modules/landing'
```

## Route

`/` → `src/app/page.tsx` (server component) → `PublicLayout` → `LandingPage`

## API Endpoints

None — fully static.

## Notes

- All animations via Tailwind keyframes: `animate-float-up`, `animate-fade-up` (defined in `tailwind.config.js`)
- Floating badges use `animate-[float-up_3s_Xs_ease-in-out_infinite]` with delay per badge
- Hero entrance uses `animate-[fade-up_0.5s_Xs_ease_both]` with staggered delays
- `PublicLayout` nav updated to match Nihongo brand (日 mark, new links)
- Color classes: `text-ink`, `bg-pine-light`, `bg-vermillion-light`, `bg-amber-light` from design tokens
