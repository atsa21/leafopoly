import { Component, inject, input, computed, ViewEncapsulation, model } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { ART } from './icon-art';

function innerArt(svg: string): string {
  const open = svg.indexOf('>', svg.indexOf('<svg'));
  const close = svg.lastIndexOf('</svg>');
  return open >= 0 && close > open ? svg.slice(open + 1, close) : svg;
}

function viewBoxOf(svg: string): string | undefined {
  return svg.match(/viewBox="([^"]+)"/)?.[1];
}

const INNER: Record<string, string> = Object.fromEntries(
  Object.entries(ART).map(([key, svg]) => [key, innerArt(svg)]),
);

const VIEW_BOX: Record<string, string | undefined> = Object.fromEntries(
  Object.entries(ART).map(([key, svg]) => [key, viewBoxOf(svg)]),
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
  isMobileSize = input(false);

  private san = inject(DomSanitizer);

  private resolvedKey = computed(() => {
    const key = this.key();
    const mobileKey = `${key}_mobile`;

    return this.isMobileSize() && mobileKey in INNER ? mobileKey : key;
  });

  private effectiveViewBox = computed(() => {
    const resolved = this.resolvedKey();
    if (resolved !== this.key()) {
      return VIEW_BOX[resolved] ?? this.viewBox();
    }
    return this.viewBox();
  });

  ratio = computed(() => (this.stretch() ? 'none' : 'xMidYMid meet'));
  svg = computed(() =>
    this.san.bypassSecurityTrustHtml(
      `<svg viewBox="${this.effectiveViewBox()}" width="100%" height="100%"` +
        ` preserveAspectRatio="${this.ratio()}" aria-hidden="true" focusable="false">` +
        `${INNER[this.resolvedKey()] ?? ''}</svg>`,
    ),
  );
}
