import { Component, inject } from '@angular/core';
import { SoundService } from '@core/services/sound.service';

@Component({
  selector: 'app-mute-button',
  templateUrl: './mute-button.component.html',
  styleUrl: './mute-button.component.scss',
})
export class MuteButtonComponent {
  protected sound = inject(SoundService);
}
