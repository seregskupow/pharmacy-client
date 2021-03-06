import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { BehaviorSubject, Subscription } from 'rxjs';
import { checkIfImage } from '@utils/imageExtention';
import { customPatternValid } from '@validators/pattern.validator';
import avatarPlaceholder from './avatar-placeholder';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit, OnDestroy {
  avatar = new BehaviorSubject<string>(avatarPlaceholder);
  imgError = '';
  responseError = '';
  loading = false;
  private registerSub!: Subscription;

  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(6)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      customPatternValid({
        pattern: /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/,
        msg: 'Invalid pattern',
      }),
    ]),
    repeatPassword: new FormControl('', [
      Validators.required,
      customPatternValid({
        pattern: /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/,
        msg: 'Invalid pattern',
      }),
      this.confirmPasswordValid.bind(this),
    ]),
  });

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {}
  ngOnDestroy(): void {
    this.registerSub?.unsubscribe();
  }

  onChange(event: any) {
    if (!event.target?.files?.length) return;
    if (!checkIfImage(event.target.value)) {
      this.imgError = 'Only .jpg, .jpeg, .png, .gif files are allowed';
      return;
    }
    if (event.target?.files[0].size > 5242880) {
      this.imgError = 'Maximum file size allowed is 5mb';
      return;
    }

    const file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.avatar.next(reader.result as string);
      this.imgError = '';
    };
  }

  resetImage() {
    this.avatar.next(avatarPlaceholder);
  }

  submit() {
    if (this.form.valid) {
      const { email, name, password } = this.form.value;
      this.loading = true;
      this.registerSub = this.authService
        .signup(email, name, password, this.avatar.value)
        .subscribe({
          next: (res) => {
            this.loading = false;
            this.router.navigate(['/']);
          },
          error: (error) => {
            this.loading = false;
            this.responseError = error;
          },
        });
    }
  }

  private confirmPasswordValid(control: AbstractControl): any {
    return control.value === this.form?.get('password')?.value
      ? null
      : {
          notEqual: 'passwords are not equal',
        };
  }
}
