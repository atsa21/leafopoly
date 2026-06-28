import type { FirebaseOptions } from 'firebase/app';
import { environment } from '../../environments/environment';

// ─────────────────────────────────────────────────────────────────────────────
// Firebase config is sourced from the environment so real keys stay out of git.
//
//   • environment.ts            → committed, empty config (local hot-seat only)
//   • environment.local.ts      → gitignored, your real keys
//   • environment.local.example.ts → committed template
//
// Run with the `local` configuration to swap in your real keys:
//   ng serve --configuration development,local
//   ng build --configuration production,local
//
// Until apiKey is filled in, the game runs exactly as before (local hot-seat).
// ─────────────────────────────────────────────────────────────────────────────
export const firebaseConfig: FirebaseOptions = environment.firebase;

/** True once the config above has been filled in. */
export const firebaseReady = (): boolean => !!firebaseConfig.apiKey;
