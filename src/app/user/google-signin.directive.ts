import { Directive, HostListener } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import firebase from 'firebase/app';

@Directive({
  selector: '[appGoogleSignin]',
})
export class GoogleSigninDirective {
  constructor(private auth: AngularFireAuth) {}

  @HostListener('click')
  onClick() {
    this.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }
}
