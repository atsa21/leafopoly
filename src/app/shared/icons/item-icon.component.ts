import { Component, inject, input, computed, ViewEncapsulation } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

// stroke ink + cream fill match the prototype's I / F styles
const I = 'fill="none" stroke="#2a241d" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"';
const F = 'fill="#ddcfa8" stroke="#2a241d" stroke-width="2.3" stroke-linejoin="round"';

const ART: Record<string, string> = {
  juice: `<rect x="20" y="24" width="20" height="28" rx="4" ${F}/><rect x="26" y="14" width="8" height="11" rx="2" ${F}/><rect x="23" y="9" width="14" height="6" rx="1" ${F}/><rect x="22" y="33" width="16" height="11" rx="1" ${I}/><circle cx="30" cy="38.5" r="2.4" fill="#2a241d"/>`,
  bread: `<path d="M13 38 Q13 24 30 24 Q47 24 47 38 Q47 42 43 42 L17 42 Q13 42 13 38 Z" ${F}/><line x1="21" y1="31" x2="25" y2="27" ${I}/><line x1="28" y1="31" x2="32" y2="27" ${I}/><line x1="35" y1="31" x2="39" y2="27" ${I}/>`,
  cookies: `<circle cx="30" cy="34" r="16" ${F}/><circle cx="24" cy="30" r="2" fill="#2a241d"/><circle cx="35" cy="28" r="2" fill="#2a241d"/><circle cx="37" cy="38" r="2" fill="#2a241d"/><circle cx="25" cy="40" r="2" fill="#2a241d"/><circle cx="31" cy="35" r="2" fill="#2a241d"/>`,
  mug: `<rect x="18" y="24" width="22" height="22" rx="3" ${F}/><path d="M40 28 h5 a5 5 0 0 1 0 12 h-5" ${I}/><path d="M23 20 q2 -4 4 0" ${I}/><path d="M30 20 q2 -4 4 0" ${I}/>`,
  plant: `<path d="M22 44 h16 l-2 8 h-12 z" ${F}/><line x1="30" y1="44" x2="30" y2="26" ${I}/><circle cx="30" cy="20" r="6" ${F}/><path d="M30 34 q-9 -2 -11 -9" ${I}/><path d="M30 36 q9 -2 11 -9" ${I}/>`,
  fern: `<path d="M30 50 V18" ${I}/><path d="M30 24 q-9 -2 -12 -8" ${I}/><path d="M30 31 q-10 -1 -13 -7" ${I}/><path d="M30 38 q-9 0 -12 -5" ${I}/><path d="M30 24 q9 -2 12 -8" ${I}/><path d="M30 31 q10 -1 13 -7" ${I}/><path d="M30 38 q9 0 12 -5" ${I}/>`,
  cactus: `<rect x="23" y="42" width="14" height="10" rx="2" ${F}/><path d="M27 42 V24 a3 3 0 0 1 6 0 v18" ${F}/><path d="M27 33 h-5 a3 3 0 0 0 -3 3 v4" ${I}/><path d="M33 29 h5 a3 3 0 0 1 3 3 v4" ${I}/>`,
  rug: `<rect x="13" y="24" width="34" height="20" rx="2" ${F}/><line x1="13" y1="30" x2="47" y2="30" ${I}/><line x1="13" y1="38" x2="47" y2="38" ${I}/><line x1="22" y1="24" x2="22" y2="44" ${I}/><line x1="30" y1="24" x2="30" y2="44" ${I}/><line x1="38" y1="24" x2="38" y2="44" ${I}/>`,
  // sitting cat, full body — bell-shaped seat, perked ears, curling tail
  cat: `<path d="M44 45 q11 3 9 -8 q-1 -5 -6 -4" ${I}/><path d="M30 26 C20 26 16 37 17 47 Q17 51 21 51 L39 51 Q43 51 43 47 C44 37 40 26 30 26 Z" ${F}/><path d="M30 45 V51" ${I}/><circle cx="30" cy="18" r="9" ${F}/><path d="M22 11 l-3 -8 8 4 z" ${F}/><path d="M38 11 l3 -8 -8 4 z" ${F}/><circle cx="26" cy="18" r="1.7" fill="#2a241d"/><circle cx="34" cy="18" r="1.7" fill="#2a241d"/><path d="M28 21 q2 2 4 0" ${I}/><line x1="18" y1="20" x2="26" y2="21" ${I}/><line x1="42" y1="20" x2="34" y2="21" ${I}/>`,
  // sitting dog, full body — bell-shaped seat, floppy ears, wagging tail
  dog: `<path d="M43 47 q10 -2 9 -11 q-1 -3 -4 -2" ${I}/><path d="M30 27 C21 27 17 38 18 47 Q18 51 22 51 L38 51 Q42 51 42 47 C43 38 39 27 30 27 Z" ${F}/><path d="M30 45 V51" ${I}/><circle cx="30" cy="19" r="9" ${F}/><path d="M21 14 q-6 4 -3 13 q5 -1 6 -8 z" ${F}/><path d="M39 14 q6 4 3 13 q-5 -1 -6 -8 z" ${F}/><circle cx="26" cy="18" r="1.7" fill="#2a241d"/><circle cx="34" cy="18" r="1.7" fill="#2a241d"/><ellipse cx="30" cy="22" rx="2.7" ry="2" fill="#2a241d"/><path d="M30 24 v3" ${I}/>`,
  fish: `<path d="M16 33 q10 -11 24 0 q-10 11 -24 0 z" ${F}/><path d="M40 33 l8 -6 v12 z" ${F}/><circle cx="23" cy="31" r="1.8" fill="#2a241d"/><path d="M30 26 q3 7 0 14" ${I}/>`,
  lamp: `<path d="M22 22 h16 l4 12 h-24 z" ${F}/><line x1="30" y1="34" x2="30" y2="48" ${I}/><path d="M24 48 h12" ${I}/><line x1="26" y1="16" x2="30" y2="22" ${I}/>`,
  poster: `<rect x="18" y="15" width="24" height="31" rx="1" ${F}/><path d="M22 40 l6 -10 5 6 4 -5 5 9 z" ${I}/><circle cx="34" cy="23" r="3" ${I}/>`,
  shelf: `<rect x="16" y="20" width="28" height="26" rx="2" ${F}/><line x1="16" y1="33" x2="44" y2="33" ${I}/><line x1="22" y1="20" x2="22" y2="33" ${I}/><line x1="28" y1="20" x2="28" y2="33" ${I}/><line x1="34" y1="20" x2="34" y2="33" ${I}/><line x1="22" y1="33" x2="22" y2="46" ${I}/><line x1="30" y1="33" x2="30" y2="46" ${I}/><line x1="38" y1="33" x2="38" y2="46" ${I}/>`,
  teddy: `<ellipse cx="30" cy="40" rx="10" ry="9" ${F}/><circle cx="30" cy="25" r="8" ${F}/><circle cx="23" cy="19" r="3.5" ${F}/><circle cx="37" cy="19" r="3.5" ${F}/><circle cx="27" cy="24" r="1.5" fill="#2a241d"/><circle cx="33" cy="24" r="1.5" fill="#2a241d"/><circle cx="30" cy="28" r="1.6" fill="#2a241d"/>`,
  paints: `<path d="M30 17 q14 0 14 12 q0 6 -7 6 q-4 0 -4 4 q0 6 -6 6 q-12 0 -12 -14 q0 -14 15 -14 z" ${F}/><circle cx="24" cy="26" r="2.4" fill="#2a241d"/><circle cx="33" cy="24" r="2.4" fill="#2a241d"/><circle cx="38" cy="30" r="2.4" fill="#2a241d"/><circle cx="24" cy="34" r="2.4" fill="#2a241d"/>`,
  // a little pile of leaves — the game's currency motif (pale leaf behind, green leaf in front)
  leaves: `<g transform="translate(24 25) rotate(-32) scale(0.72)"><path d="M0 -17 C11 -8 11 9 0 17 C-11 9 -11 -8 0 -17 Z" fill="#c2cdaa" stroke="#2a241d" stroke-width="3" stroke-linejoin="round"/><path d="M0 -13 L0 13" fill="none" stroke="#2a241d" stroke-width="2.4" stroke-linecap="round"/></g><g transform="translate(34 34) rotate(20)"><path d="M0 -17 C11 -8 11 9 0 17 C-11 9 -11 -8 0 -17 Z" fill="#6e9c4f" stroke="#2a241d" stroke-width="2.3" stroke-linejoin="round"/><path d="M0 -13 L0 13" fill="none" stroke="#2a241d" stroke-width="1.8" stroke-linecap="round"/></g><path d="M30 47 q-2 4 1 7" fill="none" stroke="#2a241d" stroke-width="2.3" stroke-linecap="round"/>`,
  // leaves caught by a gust and blown away — the OOPS / lost-leaves motif
  gust: `<path class="gust-line" d="M8 22 q11 -3 19 0" fill="none" stroke="#2a241d" stroke-width="2.2" stroke-linecap="round"/><path class="gust-line gust-line-2" d="M6 31 q13 -3 22 0" fill="none" stroke="#2a241d" stroke-width="2.2" stroke-linecap="round"/><path class="gust-line gust-line-3" d="M10 40 q10 -3 17 0" fill="none" stroke="#2a241d" stroke-width="2.2" stroke-linecap="round"/><g transform="translate(40 25) rotate(38) scale(0.66)"><path d="M0 -17 C11 -8 11 9 0 17 C-11 9 -11 -8 0 -17 Z" fill="#6e9c4f" stroke="#2a241d" stroke-width="2.6" stroke-linejoin="round"/><path d="M0 -13 L0 13" fill="none" stroke="#2a241d" stroke-width="2" stroke-linecap="round"/></g><g transform="translate(34 43) rotate(-22) scale(0.48)"><path d="M0 -17 C11 -8 11 9 0 17 C-11 9 -11 -8 0 -17 Z" fill="#c2cdaa" stroke="#2a241d" stroke-width="3" stroke-linejoin="round"/><path d="M0 -13 L0 13" fill="none" stroke="#2a241d" stroke-width="2.4" stroke-linecap="round"/></g>`,
  window: `<rect x="13" y="44" width="34" height="5" rx="1" ${F}/><rect x="16" y="13" width="28" height="31" rx="2" ${F}/><line x1="30" y1="13" x2="30" y2="44" ${I}/><line x1="16" y1="28.5" x2="44" y2="28.5" ${I}/>`,
  // open stage curtains — drawn in a tall 60x88 viewBox: a rod with finials, a
  // scalloped valance, and two side panels cinched by tiebacks and flaring at the hem
  curtain: `<rect x="2" y="6.5" width="56" height="2.8" rx="1.4" ${F}/><circle cx="3" cy="7.9" r="2.3" ${F}/><circle cx="57" cy="7.9" r="2.3" ${F}/><path d="M5 11 C3 24 6 33 9 40 C5 56 2 69 3 82 Q9 87 15 83 Q23 87 30 82 C25 63 19 51 17 40 C21 31 25 21 25 11 Z" ${F}/><path d="M55 11 C57 24 54 33 51 40 C55 56 58 69 57 82 Q51 87 45 83 Q37 87 30 82 C35 63 41 51 43 40 C39 31 35 21 35 11 Z" ${F}/><path d="M11 15 C10 26 9 34 11 40 C9 56 8 69 9 80" ${I}/><path d="M17 16 C17 27 13 34 14 40 C13 56 12 69 14 80" ${I}/><path d="M49 15 C50 26 51 34 49 40 C51 56 52 69 51 80" ${I}/><path d="M43 16 C43 27 47 34 46 40 C47 56 48 69 46 80" ${I}/><path d="M4 9 H56 V11 Q47 24 38 11 Q30 25 22 11 Q13 24 4 11 Z" ${F}/><path d="M6 38 Q12 45 18 38 Q12 49 6 38 Z" ${F}/><path d="M54 38 Q48 45 42 38 Q48 49 54 38 Z" ${F}/>`,
  rain: `<path d="M19 32 a7 7 0 0 1 3 -13 a8 8 0 0 1 15 1 a6 6 0 0 1 2 12 z" ${F}/><line x1="23" y1="38" x2="21" y2="45" ${I}/><line x1="30" y1="38" x2="28" y2="45" ${I}/><line x1="37" y1="38" x2="35" y2="45" ${I}/>`,
  lemonade: `<path d="M20 23 h20 l-2 21 a3 3 0 0 1 -3 3 h-10 a3 3 0 0 1 -3 -3 z" ${F}/><path d="M40 27 h3 a4 4 0 0 1 0 8 h-3" ${I}/><line x1="35" y1="18" x2="31" y2="42" ${I}/><circle cx="29" cy="33" r="4.5" ${I}/><path d="M29 28.5 v9 M24.5 33 h9" fill="none" stroke="#2a241d" stroke-width="1.6"/>`,
  gift: `<rect x="16" y="22" width="28" height="8" rx="1.5" ${F}/><rect x="18" y="30" width="24" height="18" rx="1.5" ${F}/><line x1="30" y1="22" x2="30" y2="48" ${I}/><path d="M30 22 q-7 -11 -11 -4 q-2 4 11 4" ${F}/><path d="M30 22 q7 -11 11 -4 q2 4 -11 4" ${F}/>`,
  // a leafy tree — the START home base. Brown trunk, full green canopy.
  tree: `<rect x="27" y="33" width="6" height="18" rx="1.5" fill="#9a7448" stroke="#2a241d" stroke-width="2.3" stroke-linejoin="round"/><path d="M30 9 C19 9 15 18 19 24 C12 26 14 35 23 34 C25 39 35 39 37 34 C46 35 48 26 41 24 C45 18 41 9 30 9 Z" fill="#6e9c4f" stroke="#2a241d" stroke-width="2.3" stroke-linejoin="round"/><path d="M30 24 v14" fill="none" stroke="#2a241d" stroke-width="1.8" stroke-linecap="round"/>`,
};

@Component({
  selector: 'app-item-icon',
  templateUrl: './item-icon.component.html',
  styleUrl: './item-icon.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ItemIconComponent {
  key = input.required<string>();
  stretch = input(false);
  viewBox = input('0 0 60 60');

  private san = inject(DomSanitizer);

  ratio = computed(() => (this.stretch() ? 'none' : 'xMidYMid meet'));
  // Build the whole <svg> as a string and set innerHTML on an HTML wrapper.
  // Binding [innerHTML] directly on an <svg> element calls setProperty(svg,
  // 'innerHTML', …), which the SSR/prerender DOM doesn't implement (throws
  // NotYetImplemented). HTML elements do support the innerHTML setter there.
  svg = computed(() =>
    this.san.bypassSecurityTrustHtml(
      `<svg viewBox="${this.viewBox()}" width="100%" height="100%"` +
        ` preserveAspectRatio="${this.ratio()}" aria-hidden="true" focusable="false">` +
        `${ART[this.key()] ?? ''}</svg>`,
    ),
  );
}
