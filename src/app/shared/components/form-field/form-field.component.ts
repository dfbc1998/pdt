// src/app/shared/components/form-field/form-field.component.ts
import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import {
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonNote
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonNote
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormFieldComponent),
      multi: true
    }
  ],
  template: `
    <div class="form-field">
      @if (label) {
        <label class="form-label">{{ label }}</label>
      }
      
      <ion-item [class.ion-invalid]="hasError" class="form-input-item">
        @switch (type) {
          @case ('textarea') {
            <ion-textarea
              [placeholder]="placeholder"
              [readonly]="readonly"
              [disabled]="disabled"
              [rows]="rows"
              [value]="value"
              (ionInput)="onInput($event)"
              (ionBlur)="onBlur()">
            </ion-textarea>
          }
          @case ('select') {
            <ion-select
              [placeholder]="placeholder"
              [disabled]="disabled"
              [value]="value"
              (ionChange)="onInput($event)">
              @for (option of options; track option.value) {
                <ion-select-option [value]="option.value">
                  {{ option.label }}
                </ion-select-option>
              }
            </ion-select>
          }
          @default {
            <ion-input
              [type]="type"
              [placeholder]="placeholder"
              [readonly]="readonly"
              [disabled]="disabled"
              [value]="value"
              (ionInput)="onInput($event)"
              (ionBlur)="onBlur()">
            </ion-input>
          }
        }
      </ion-item>
      
      @if (errorMessage && hasError) {
        <ion-note color="danger" class="error-message">
          {{ errorMessage }}
        </ion-note>
      }
      
      @if (hint && !hasError) {
        <ion-note color="medium" class="hint-message">
          {{ hint }}
        </ion-note>
      }
    </div>
  `,
  styles: [`
    .form-field {
      margin-bottom: 1rem;
    }
    
    .form-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #374151;
    }
    
    .form-input-item {
      --background: white;
      --border-radius: 0.5rem;
      --border-color: #d1d5db;
      --border-width: 1px;
      --border-style: solid;
    }
    
    .form-input-item.ion-invalid {
      --border-color: #ef4444;
    }
    
    .error-message, .hint-message {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.75rem;
    }
  `]
})
export class FormFieldComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() type: string = 'text';
  @Input() readonly: boolean = false;
  @Input() disabled: boolean = false;
  @Input() rows: number = 3;
  @Input() errorMessage?: string;
  @Input() hint?: string;
  @Input() hasError: boolean = false;
  @Input() options: { value: any; label: string }[] = [];

  value: any = '';

  private onChange = (value: any) => { };
  private onTouched = () => { };

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: any): void {
    const value = event.detail?.value ?? event.target?.value;
    this.value = value;
    this.onChange(value);
  }

  onBlur(): void {
    this.onTouched();
  }
}

