import { Component, OnInit, Input, forwardRef, HostBinding } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-likert-five-input',
  templateUrl: './gb-likert-five-input.component.html',
  styleUrls: ['./gb-likert-five-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LikertFiveInputComponent),
      multi: true
    }
  ]
})
export class LikertFiveInputComponent implements OnInit {

  @Input() disabled = false;
  @Input() reverse = false;

  value: number;


  constructor() { }


  @HostBinding('style.opacity')
  get opacity() {
    return this.disabled ? 0.25 : 1;
  }

  onChange = (value: number) => { };
  onTouched = () => { };


  ngOnInit() { }


  writeValue(value: number): void {
    this.value = value;
    this.onChange(this.value);
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  updateValue(value: number): void {
    if (!this.disabled) {
      this.writeValue(value);
    }
  }

}
