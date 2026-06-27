import { Component, inject, computed } from '@angular/core';
import { GameService } from '@core/services/game.service';
import { SHOPS } from '@core/constants';

import { ItemIconComponent } from '@shared/icons/item-icon.component';

@Component({
  selector: 'app-shop',
  imports: [ItemIconComponent],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.scss',
})
export class ShopComponent {
  game = inject(GameService);
  shop = computed(() => SHOPS[this.game.activeShop()!]);
  items = computed(() => {
    const me = this.game.cur();
    const disc = me.coupons.length > 0;
    const owned = me.room.reduce<Record<string, number>>((acc, r) => {
      acc[r.key] = (acc[r.key] ?? 0) + 1;
      return acc;
    }, {});
    return this.shop().items.map((it) => {
      const disp = disc ? Math.max(1, Math.round(it.price * (1 - me.coupons[0] / 100))) : it.price;
      return { ...it, disp, disc, afford: me.leaves >= disp, owned: owned[it.key] ?? 0 };
    });
  });
}
