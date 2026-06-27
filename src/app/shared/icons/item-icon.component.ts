import { Component, inject, input, computed, ViewEncapsulation } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import juice from '@assets/icons/juice.svg';
import clock from '@assets/icons/clock.svg';
import books from '@assets/icons/books.svg';
import mug from '@assets/icons/mug.svg';
import plant from '@assets/icons/plant.svg';
import fern from '@assets/icons/fern.svg';
import cactus from '@assets/icons/cactus.svg';
import rug from '@assets/icons/rug.svg';
import cat from '@assets/icons/cat.svg';
import dog from '@assets/icons/dog.svg';
import fish from '@assets/icons/fish.svg';
import lamp from '@assets/icons/lamp.svg';
import poster from '@assets/icons/poster.svg';
import shelf from '@assets/icons/shelf.svg';
import teddy from '@assets/icons/teddy.svg';
import guitar from '@assets/icons/guitar.svg';
import leaves from '@assets/icons/leaves.svg';
import leaf from '@assets/icons/leaf.svg';
import gust from '@assets/icons/gust.svg';
import windowSvg from '@assets/icons/window.svg';
import curtain from '@assets/icons/curtain.svg';
import rain from '@assets/icons/rain.svg';
import lemonade from '@assets/icons/lemonade.svg';
import gift from '@assets/icons/gift.svg';
import tree from '@assets/icons/tree.svg';
import table from '@assets/icons/table.svg';
import bed from '@assets/icons/bed.svg';
import petBed from '@assets/icons/pet_bed.svg';
import desk from '@assets/icons/desk.svg';
import deskRoom from '@assets/icons/desk_room.svg';
import bedRoom from '@assets/icons/bed_room.svg';
import curtainRoom from '@assets/icons/curtain_room.svg';
import lampRoom from '@assets/icons/lamp_room.svg';
import windowRoom from '@assets/icons/window_room.svg';
import shelfRoom from '@assets/icons/shelf_room.svg';

const ART: Record<string, string> = {
  juice, clock, books, mug, plant, fern, cactus, rug, cat, dog, fish, lamp,
  poster, shelf, teddy, guitar, leaves, leaf, gust, window: windowSvg, curtain, rain,
  lemonade, gift, tree, table, bed, pet_bed: petBed, desk,
  bed_room: bedRoom, desk_room: deskRoom, curtain_room: curtainRoom, lamp_room: lampRoom, window_room: windowRoom, shelf_room: shelfRoom,
};

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
