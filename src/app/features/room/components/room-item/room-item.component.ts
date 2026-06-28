import { Component, computed, input, output } from '@angular/core';
import { ItemIconComponent } from '@shared/icons/item-icon.component';
import { ITEMS } from '@core/constants';
import { RoomItem } from '@core/models';
import { itemHeight, itemSize } from '../../room-item.metrics';

const WALL = { x: 58, y: 58, w: 604, h: 324 };
const PANE_OFF = 32;

@Component({
  selector: 'app-room-item',
  imports: [ItemIconComponent],
  templateUrl: './room-item.component.html',
  styleUrl: './room-item.component.scss',
  host: {
    class: 'thing',
    '[class.lamp]': 'isLamp()',
    '[class.locked]': '!canEdit()',
    '[style.left.px]': 'left()',
    '[style.top.px]': 'top()',
    '[style.width.px]': 'width()',
    '[style.height.px]': 'pxHeight()',
    '[attr.aria-label]': 'label()',
    '(pointerdown)': 'onDown($event)',
  },
})
export class RoomItemComponent {
  item = input.required<RoomItem>();
  scale = input(1);
  isMobile = input(false);
  canEdit = input(true);

  pickup = output<PointerEvent>();

  protected isLamp = computed(() => {
    const key = this.item().key;
    return key === 'lamp' || key === 'ceiling_lamp';
  });
  protected isCeiling = computed(() => this.item().key === 'ceiling_lamp');
  protected isWindow = computed(() => this.item().key === 'window');

  protected left = computed(() => this.item().x * this.scale());
  protected top = computed(() => this.item().y * this.scale());

  protected sceneSize = computed(() => {
    const s = this.scale();
    return `${WALL.w * s}px ${WALL.h * s}px`;
  });
  protected scenePos = computed(() => {
    const s = this.scale();
    const it = this.item();
    const x = (WALL.x - (it.x + PANE_OFF)) * s;
    const y = (WALL.y - (it.y + PANE_OFF)) * s;
    return `${x}px ${y}px`;
  });
  protected width = computed(() => itemSize(this.item().key) * this.scale());
  protected pxHeight = computed(() => itemHeight(this.item().key) * this.scale());
  protected label = computed(() => ITEMS[this.item().key]?.name ?? this.item().key);
  protected isRoomIcon = computed(() => ITEMS[this.item().key]?.isRoomIcon ?? false);
  protected isVerical = computed(() => this.item().key === 'bed' || this.item().key == 'desk');

  protected onDown(event: PointerEvent): void {
    this.pickup.emit(event);
  }
}
