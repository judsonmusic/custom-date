import { FocusMonitor } from "@angular/cdk/a11y";
import { coerceBooleanProperty } from "@angular/cdk/coercion";
import {
  Component,
  ElementRef,
  Input,
  OnInit,
  Optional,
  Self,
  DoCheck,
  ViewChild,
  HostBinding
} from "@angular/core";
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  NgControl,
  ValidationErrors,
  Validators
} from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { Subject } from "rxjs";

@Component({
  host: {
    "[id]": "id",
    "[attr.aria-describedby]": "describedBy"
  },
  selector: "app-custom-field",
  templateUrl: "./custom-field.component.html",
  styleUrls: ["./custom-field.component.css"],
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: CustomFieldComponent
    }
  ]
})
export class CustomFieldComponent
  implements OnInit, DoCheck, ControlValueAccessor {
  static nextId = 0;
  @HostBinding() id = `input-${CustomFieldComponent.nextId++}`;

  @ViewChild("input") input: ElementRef;

  @Input("value") _value: any;
  get value(): any {
    return this._value;
  }
  set value(value) {
    this._value = value;
    this.onChange(value);
    this.stateChanges.next();
  }
  @Input() disabled: boolean;

  @Input()
  get placeholder() {
    return this._placeholder;
  }
  set placeholder(plh) {
    this._placeholder = plh;
    this.stateChanges.next();
  }
  public _placeholder: string;

  @Input()
  get required() {
    return this._required;
  }
  set required(req) {
    this._required = coerceBooleanProperty(req);
    this.stateChanges.next();
  }
  public _required = false;

  get empty() {
    const text = this.input.nativeElement.value.trim();
    return text ? false : true;
  }

  formControl = new FormControl();
  stateChanges = new Subject<void>();
  errorState: any;
  touched: any;
  focused: any;

  constructor(
    @Optional() @Self() public ngControl: NgControl,
    public focusMonitor: FocusMonitor,
    public elementRef: ElementRef<HTMLElement>,
    public fm: FocusMonitor
  ) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
      ngControl.valueAccessor = this;
    }
    fm.monitor(elementRef.nativeElement, true).subscribe(origin => {
      this.focused = !!origin;
      this.stateChanges.next();
    });
  }

  ngOnInit() {
    this.setUpValidators();
  }

  ngDoCheck(): void {
    if (this.ngControl) {
      this.errorState = this.ngControl.invalid && this.ngControl.touched;
      this.stateChanges.next();
    }
  }

  validate(control: AbstractControl): ValidationErrors | null {
    console.log("Validating...");
    const isValid = false;
    if (control.validator) {
      const validator = control.validator({} as AbstractControl);
      if ((validator && validator.required) || this.required) {
        console.log("We have a valdator", validator, control.value);
        return !control.value ? { invalid: true } : null;
      }
    }
    return null;
  }

  setUpValidators(): void {
    const control = this.ngControl && this.ngControl.control;
    const myValidators = [this.validate];
    if (this.required) {
      myValidators.push(Validators.required);
    }
    if (control) {
      const validators = control.validator
        ? [control.validator, ...myValidators]
        : myValidators;
      control.setValidators(validators);
      control.updateValueAndValidity();
    }
  }

  onChange = (value: any) => {
    console.log("On Change...", value);
  };

  onTouched = () => {
    this.touched = true;
  };
  writeValue(value: any): void {
    this._value = value;
  }
  registerOnChange(fn: (v: any) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onInput(ev: any) {
    const value = ev.target.value.replace("/", "");
    const length = value.length;
    if (this.keyIsBackSpace(ev)) {
      this.value = ev.target.value;
      return;
    }
    if (!this.keyIsValid(ev)) {
      console.log("The key is not valid!");
      const newVal = ev.target.value.slice(0, -1);
      this.value = newVal;
      ev.target.value = newVal;
      return;
    }

    if (length === 4) {
      ev.target.value = value;
    } else if (length === 6) {
      ev.target.value = value.substring(0, 2) + "/" + value.substring(2);
    } else if (length === 8) {
      ev.target.value =
        value.substring(0, 2) +
        "/" +
        value.substring(2, 4) +
        "/" +
        value.substring(4);
    }

    if (this.onChange) {
      this.onChange(ev.target.value);
    }
    if (this.onTouched) {
      this.onTouched();
    }
    this.stateChanges.next();
  }

  keyIsBackSpace(ev: any): boolean {
    const backspace = [8]; // backspace
    if (backspace.indexOf(ev.which) > -1) {
      return true;
    } else {
      return false;
    }
  }

  keyIsValid(ev: any): boolean {
    const regEx = new RegExp(/^[0-9]+$/g);
    return regEx.test(ev.key);
  }
}
