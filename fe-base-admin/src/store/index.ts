/**
 * Global store — chỉ chứa state thực sự global:
 * auth status, theme, locale, notifications.
 *
 * State của từng feature nằm trong modules/<feature>/store/
 *
 * Pattern này dùng React Context + useReducer (zero dependency).
 * Swap sang Redux Toolkit hoặc Zustand nếu cần middleware / devtools.
 */

export { AppStoreProvider, useAppStore } from './app-store'
export type { AppState, AppAction } from './app-store'
