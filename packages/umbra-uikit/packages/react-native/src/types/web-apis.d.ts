// Web API type stubs for components that use browser-specific APIs on web platform.
// These are not available in React Native's TypeScript environment since "dom" is
// not included in the lib compiler option.

declare class MediaStream {}

declare class MutationObserver {
  constructor(callback: (mutations: any[], observer: any) => void);
  observe(target: any, options?: any): void;
  disconnect(): void;
}
