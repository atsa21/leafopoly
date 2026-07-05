You are an expert in TypeScript, Angular, and Three.js. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## Project: Leafopoly

Leafopoly is a cozy, plant-themed board game (Monopoly-like) built as an Angular SPA. Players roll a die, walk a 24-square board, buy items from shops, snip discount coupons, decorate a 3D room, and win by collecting a goal number of items in every category. It supports **solo** play and **two-player online multiplayer**, with an interactive **3D room** rendered in Three.js.

### Tech stack

- **Angular 22** — standalone components, signals, Signal Forms, `@Service` decorator
- **TypeScript 6** (strict) with path aliases
- **Three.js** (`three` ^0.185) — 3D room scene, models, and drag interaction
- **Firebase / Firestore** (`firebase` ^12) — real-time multiplayer sync (lazy-loaded)
- **Angular SSR** (`@angular/ssr`, Express 5) — server-side rendering with client hydration
- **Vitest** (`vitest`, `jsdom`) — unit tests (NOT Karma/Jasmine); spec files are `*.spec.ts`
- **Prettier** — formatting
- **Firebase Hosting** — deploy target (`npm run deploy`)

### Commands

- `npm start` — dev server (`ng serve`); `npm run start:local` for the `local` config
- `npm run build` — production build; `npm run watch` for a development watch build
- `npm test` — run Vitest
- `npm run deploy` — `firebase deploy`

## Architecture

```
src/app/
  app.ts                 root App component (class is `App`, selector `app-root`)
  app.config.ts          providers: router, client hydration, global error listeners
  app.routes.ts          lazy routes; `/` = start, `/game` = game (behind startedGuard)
  core/
    services/            GameService, MultiplayerService, SoundService, ViewportService
    models/              domain interfaces/types, re-exported via index.ts barrel
    constants/           board layout, shops, items, categories (index.ts barrel)
    enums/               EShopCategory, EConnectStatus (e-*.enum.ts, index.ts barrel)
    types/               *.type.ts (e.g. match-state.type.ts), index.ts barrel
    guards/              startedGuard (CanActivateFn)
    firebase.config.ts   Firebase project config + firebaseReady()
  features/              route/feature components (start, game, board, shop, coupon,
                         room, lobby, settings, win, controls) — each in its own folder
    room/three/          all Three.js code (scenes, models, geometry data) lives here
  shared/                reusable UI (logo, mute-button, settings-form, icons)
```

### State & data flow

- **`GameService`** (`@Service()`) is the single source of game truth: signals for players, board, current turn, dice, view (`board`/`shop`/`coupon`/`room`/`settings`), and derived `computed()` state (`winner`, `winProgress`, `isMyTurn`, `dicePips`). All game actions (`roll`, `buy`, `cut`, `openRoom`, …) live here.
- **Persistence**: game state and settings are saved to `localStorage` (keys `leafopoly_v2`, `leafopoly_settings_v1`), guarded with `try/catch` and merged on load so older saves gain new fields.
- **Multiplayer**: `MultiplayerService` owns the Firestore connection. Authoritative state is a `MatchSnapshot` (monotonic `seq`, higher wins); roll animations broadcast on a separate side channel. `GameService` wires `mp.onRemote`/`mp.onAnim` callbacks. Firebase modules are **dynamically imported** on first use — never import `firebase/*` at module top level.
- **3D room**: `RoomScene` (in `features/room/three/`) is a plain Three.js class, not a component. `Room3dComponent` owns the canvas, forwards pointer drags, and syncs items via an `effect()`. Heavy Three.js work stays out of components.

### SSR awareness

This app is server-rendered, so code must be SSR-safe:
- `localStorage`, `window`, and `document` do not exist on the server. Access them inside `afterNextRender`, or guard with `isPlatformBrowser(inject(PLATFORM_ID))` (see `startedGuard`).
- Do not assume browser globals are available at construction time.

## TypeScript Best Practices

- Use strict type checking; prefer type inference when the type is obvious.
- Avoid `any`; use `unknown` when a type is uncertain (e.g. parsing untrusted `localStorage` JSON), then narrow.
- Import across features using path aliases, not deep relative paths: `@core/*`, `@shared/*`, `@assets/*`.
- Re-export a folder's public API through its `index.ts` barrel and import from the barrel (`@core/models`, `@core/constants`, `@core/enums`).
- Name enums `E<Name>` in files `e-<name>.enum.ts`; name type-alias files `<name>.type.ts`.

## Angular Best Practices

- Standalone components only — no NgModules.
- Do NOT set `standalone: true`; it's the default in v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush`; `OnPush` is the default in v22+.
- Use signals for state; `computed()` for derived state; `effect()` to bridge signals into imperative APIs (e.g. Three.js).
- Use `inject()` — never constructor injection.
- Prefer the `@Service()` decorator for new singleton services (v22+) over `@Injectable({ providedIn: 'root' })`.
- Implement lazy loading for feature routes (see `app.routes.ts`).
- Do NOT use `@HostBinding`/`@HostListener`. Put bindings and listeners in the `host` object of the decorator (see `app.ts`, `room-3d.component.ts`).
- Use `NgOptimizedImage` for static images (it does not work for inline base64).

## Components

- Keep components small and single-responsibility; push game logic into `GameService`, not templates.
- Use `input()` / `output()` functions (with `input.required()` where appropriate), not decorators.
- Use `computed()` for derived state; `signal()` for local state.
- Always use separate `.html` and `.scss` files via `templateUrl` / `styleUrl` with paths relative to the component `.ts`. Do NOT inline `template` or `styles`.
- Mark template-only members `protected` and injected collaborators `private`.
- Feature components live in `features/<name>/` and are named `<Name>Component`; shared UI lives in `shared/`.

## Forms

- Prefer **Signal Forms** (`@angular/forms/signals`) for new forms — stable in v22+ (see `settings.component.ts` + `settings-form.component.ts`). Build the model as a `signal`, create the form with `form(model, schema)`, apply validators (`min`, `max`, `maxLength`, …) in the schema, and pass the `FieldTree` down via `input.required()`, binding fields with `FormField`.
- If Signal Forms don't fit, use Reactive forms — never Template-driven.

## Templates

- Keep templates simple; avoid complex logic.
- Use native control flow (`@if`, `@for`, `@switch`) — never `*ngIf`, `*ngFor`, `*ngSwitch`.
- Do NOT use `ngClass` or `ngStyle`; use `class` and `style` bindings.
- Use the `async` pipe for observables.
- Do not assume globals like `new Date()` are available.

## State Management

- Use signals for local component state and `computed()` for derived state.
- Keep state transformations pure and predictable (`GameService` updates players immutably via `players.update(list => list.map(...))`).
- Do NOT use `mutate` on signals; use `update` or `set`.

## Accessibility Requirements

- MUST pass all AXE checks.
- MUST meet WCAG AA minimums: focus management, color contrast, and ARIA attributes.
