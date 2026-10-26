# ReciclaPoint — Code Review Rules

Rules used by Gentleman Guardian Angel (`gga`) on every commit. Flag violations as blocking unless
marked as advice.

## Stack

- React 18 + Vite 6, TypeScript for new code (`.ts`/`.tsx`), legacy views stay in `.jsx`.
- Tailwind CSS 3 with the `dash.*` palette from `tailwind.config.js`; shared component styles live in
  `src/index.css`.
- 3D digital twin: three.js through `@react-three/fiber` 8 and `@react-three/drei` 9.
- Tests: Vitest (`src/**/*.test.ts`), pure logic only.

## Architecture

- Domain logic is pure and framework-free in `src/lib/` (discount, coupon, basket simulation).
  Components never compute discounts, sensor readings or state transitions themselves.
- Hooks in `src/hooks/` orchestrate timers and state; components in `src/components/` only render.
- The 3D twin is lazy-loaded. Only `TwinStage`, `TwinHud` and `twin/types` may be imported eagerly;
  `TwinCanvas` and every module that imports three.js load through `React.lazy`.
- Hardware constants (sensors, servo, part transforms, colours) live only in
  `src/lib/basket/config.ts`.
- One discount rule everywhere: `src/lib/discount.ts` (6 % per kg, capped at 30 % at 5 kg). Legacy
  views and the legacy store must call it (`calculateDiscount`, `discountForMilligrams`); never
  duplicate tiers or percentages in components, copy or `src/services/`.
- Legacy exception: the legacy views (`RegisterView`, `BalanceView`, `StoresView`, `PublicView`)
  and the legacy store (`src/store.jsx`) still read points (`src/services/points.js`) and data
  (`src/services/db.js`, `src/services/api.js`, `src/services/coupons.js`) from `src/services/`
  until they are migrated to `src/lib/`. Importing those services from the legacy views and the
  legacy store is not a violation; new code must not add more logic to `src/services/`.

## TypeScript

- No `any`, no non-null assertions on values that can really be null, no `@ts-ignore`.
- Export explicit types for public hook return values and reducer actions.

## UI and accessibility

- User-facing copy is Spanish (neutral, professional). Code, identifiers and comments are English.
- Every interactive element is a real `button`/`a`/`input` with an accessible name and a visible
  `focus-visible` state.
- Status changes are announced through an `aria-live` region.
- Respect `prefers-reduced-motion`: no auto-rotation or long tweens when it is set.
- No text smaller than 11px.

## Tests

- New or changed logic in `src/lib/` ships with Vitest coverage in the same commit.
- Randomness in simulations goes through a seeded RNG so tests are deterministic.

## Advice (non-blocking)

- Prefer small components with one responsibility.
- Keep large static assets (STL models) under `public/models/`.
