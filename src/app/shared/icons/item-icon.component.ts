import { Component, inject, input, computed, ViewEncapsulation } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { ART } from './icon-art';

function innerArt(svg: string): string {
  const open = svg.indexOf('>', svg.indexOf('<svg'));
  const close = svg.lastIndexOf('</svg>');
  return open >= 0 && close > open ? svg.slice(open + 1, close) : svg;
}

const INNER: Record<string, string> = Object.fromEntries(
  Object.entries(ART).map(([key, svg]) => [key, innerArt(svg)]),
);

@Component({
  selector: 'app-item-icon',
  templateUrl: './item-icon.component.html',
  styleUrl: './item-icon.component.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.crisp]': 'crisp()',
  },
})
export class ItemIconComponent {
  key = input.required<string>();
  stretch = input(false);
  crisp = input(false);
  viewBox = input('0 0 60 60');

  private san = inject(DomSanitizer);

  ratio = computed(() => (this.stretch() ? 'none' : 'xMidYMid meet'));
  svg = computed(() =>
    this.san.bypassSecurityTrustHtml(
      `<svg viewBox="${this.viewBox()}" width="100%" height="100%"` +
        ` preserveAspectRatio="${this.ratio()}" aria-hidden="true" focusable="false">` +
        `${INNER[this.key()] ?? ''}</svg>`,
    ),
  );
}
