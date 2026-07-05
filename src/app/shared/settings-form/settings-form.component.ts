import { Component, input } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';

export interface SettingsFormModel {
  name: string;
  startingLeaves: number;
  passGoBonus: number;
  categoryGoal: number;
}

@Component({
  selector: 'app-settings-form',
  imports: [FormField],
  templateUrl: './settings-form.component.html',
  styleUrl: './settings-form.component.scss',
})
export class SettingsFormComponent {
  readonly field = input.required<FieldTree<SettingsFormModel>>();
}
