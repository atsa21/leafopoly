import { Service, signal } from '@angular/core';

const MOBILE_QUERY = '(max-width: 660px)';

@Service()
export class ViewportService {
  readonly isMobile = signal(false);

  constructor() {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(MOBILE_QUERY);
    this.isMobile.set(mql.matches);
    mql.addEventListener('change', (e) => this.isMobile.set(e.matches));
  }
}
