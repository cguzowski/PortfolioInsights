import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-holding-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './holding-form.component.html',
  styleUrl: './holding-form.component.css'
})
export class HoldingFormComponent {
  readonly form = input.required<FormGroup>();
  readonly editing = input(false);
  readonly saving = input(false);
  readonly errorMessage = input('');

  readonly submitted = output<void>();
  readonly cancelled = output<void>();
}
