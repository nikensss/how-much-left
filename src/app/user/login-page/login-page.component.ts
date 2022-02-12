import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent implements OnInit {
  public payDay = 24;
  public daysInMonth: number[] = [];
  private uid: string;
  constructor(public afAuth: AngularFireAuth, private db: AngularFirestore) {}

  ngOnInit(): void {
    if (this.daysInMonth.length === 0) {
      for (let i = 1; i <= 31; this.daysInMonth.push(i++));
    }

    this.afAuth.onAuthStateChanged(async (user) => {
      if (!user) {
        this.uid = '';
        return;
      }

      this.uid = user.uid;
      const general = await this.db
        .doc<Record<string, number>>(`users/${user.uid}/preferences/general`)
        .get()
        .toPromise();

      if (!general.exists) await general.ref.set({ payDay: 24 });
      this.payDay = (await general.ref.get()).data().payDay;
    });
  }

  async payDaySelected(payDay: number) {
    if (!this.uid) return;

    const general = await this.db
      .doc(`users/${this.uid}/preferences/general`)
      .get()
      .toPromise();

    if (!general) return;

    await general.ref.set({ payDay }, { merge: true });
  }
}
