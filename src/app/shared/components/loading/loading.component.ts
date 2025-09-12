// src/app/shared/components/loading/loading.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonSpinner } from '@ionic/angular/standalone';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule, IonSpinner],
  template: `
    <div class="flex items-center justify-center" [class]="containerClass">
      <div class="text-center">
        <ion-spinner [name]="spinner" [color]="color"></ion-spinner>
        @if (message) {
          <p class="mt-2 text-sm text-gray-600">{{ message }}</p>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class LoadingComponent {
  @Input() message?: string;
  @Input() spinner: string = 'crescent';
  @Input() color: string = 'primary';
  @Input() containerClass: string = 'min-h-32';
}

