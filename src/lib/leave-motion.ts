export const leaveMs = 300;

export function motionReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
