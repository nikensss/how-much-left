import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserRoutingModule } from './user-routing.module';
import { LoginPageComponent } from './login-page/login-page.component';
import { GoogleSigninDirective } from './google-signin.directive';
import { EmailLoginComponent } from './email-login/email-login.component';
import {
  NbAlertModule,
  NbButtonModule,
  NbCardModule,
  NbInputModule,
} from '@nebular/theme';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    LoginPageComponent,
    EmailLoginComponent,
    GoogleSigninDirective,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UserRoutingModule,
    NbCardModule,
    NbAlertModule,
    NbButtonModule,
    NbInputModule,
  ],
})
export class UserModule {}
