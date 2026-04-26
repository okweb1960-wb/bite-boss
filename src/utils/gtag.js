export function gtag(...args) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  } else {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(args);
  }
}