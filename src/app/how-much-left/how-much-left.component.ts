import { Component, NgZone, OnInit } from '@angular/core';
import { WeekDay } from '@angular/common';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AmountDocument } from '../interfaces/AmountDocument.interface';
import { NbToastrService } from '@nebular/theme';
import { serverTimestamp } from 'firebase/firestore';

@Component({
  selector: 'app-how-much-left',
  templateUrl: './how-much-left.component.html',
  styleUrls: ['./how-much-left.component.scss']
})
export class HowMuchLeftComponent implements OnInit {
  public doNotCountToday: boolean = false;
  public totalAmountLeft: number = 0;
  public averageToSpendPerDay: number;

  public canSave = false;
  public canPop = false;

  private unsubscribe: (() => void)[] = [];

  public static readonly MS_IN_A_DAY = 24 * 60 * 60 * 1000;

  private preferredPayDay = 24;

  constructor(
    public auth: AngularFireAuth,
    private db: AngularFirestore,
    private ngZone: NgZone,
    private toast: NbToastrService
  ) {}

  ngOnInit(): void {
    this.canSave = false;
    this.auth.onAuthStateChanged((user) => {
      if (!user) {
        for (const unsubscribe of this.unsubscribe) {
          unsubscribe();
        }
        return;
      }

      this.db.collection<AmountDocument>(`users/${user.uid}/amounts`, (ref) => {
        const result = ref.orderBy('date');
        this.unsubscribe.push(
          result.onSnapshot((snapshot) => {
            this.ngZone.run(() => {
              if (snapshot.metadata.hasPendingWrites) return;
              this.canPop = snapshot.docs.length > 0;
            });
          })
        );
        return result;
      });

      this.db
        .doc<{ payDay: number }>(`users/${user.uid}/preferences/general`)
        .get()
        .toPromise()
        .then((v) => (this.preferredPayDay = v.data().payDay));
    });
  }

  get now() {
    const n = new Date();
    if (this.doNotCountToday) {
      n.setTime(n.getTime() + HowMuchLeftComponent.MS_IN_A_DAY);
    }
    return n;
  }

  get nextPayDay() {
    const now = this.now;
    now.setHours(0, 0, 0, 0);
    let payDay = this.preferredPayDay;
    //getMonth() returns a 0-based index, but the month in new Date() requires
    //a 1-based index, that's why either 1 or 2 needs to be added.
    let month = now.getMonth() + (now.getDate() < payDay ? 0 : 1);
    let year = now.getFullYear();
    if (month >= 12) {
      month = 0;
      year += 1;
    }

    // if we are passed pay day, we know we are gonna get our salary next month
    // already; and then, in that month, we need to make sure that the pay day
    // exists, in case it is a shorter month or something
    payDay = Math.min(payDay, this.daysInMonth(year, month));
    const nextPayDay = new Date(year, month, payDay);

    while ([WeekDay.Saturday, WeekDay.Sunday].includes(nextPayDay.getDay())) {
      nextPayDay.setDate(nextPayDay.getDate() - 1);
    }

    return nextPayDay;
  }

  calculate(val: string): void {
    this.totalAmountLeft = parseFloat(val);

    if (
      isNaN(this.totalAmountLeft) ||
      !isFinite(this.totalAmountLeft) ||
      this.totalAmountLeft < 0
    ) {
      this.totalAmountLeft = 0;
      this.canSave = false;
      return;
    }

    this.averageToSpendPerDay = this.totalAmountLeft / this.differenceInDays();

    if (
      !isNaN(this.averageToSpendPerDay) &&
      isFinite(this.averageToSpendPerDay)
    ) {
      this.canSave = true;
    }
  }

  differenceInDays() {
    return Math.ceil(
      (this.nextPayDay.getTime() - this.now.getTime()) /
        HowMuchLeftComponent.MS_IN_A_DAY
    );
  }

  async save() {
    this.canSave = false;
    try {
      console.log('Saving to firestore!');
      const user = await this.auth.currentUser;
      await this.db
        .collection<AmountDocument>(`users/${user.uid}/amounts`)
        .add({
          amount: this.averageToSpendPerDay,
          date: serverTimestamp()
        });

      this.toast.success('Saved!');
    } catch (ex) {
      console.error(ex);
    } finally {
      this.canSave = true;
    }
  }

  async pop() {
    this.canPop = false;

    try {
      console.log('Deleting from firestore!');
      const mostRecentDoc = await this.getMostRecentDocument();
      if (!mostRecentDoc) return;

      const user = await this.auth.currentUser;
      await this.db
        .collection<AmountDocument>(`users/${user.uid}/amounts`)
        .doc(`${mostRecentDoc.id}`)
        .delete();
      this.toast.danger('Amount removed');
    } catch (ex) {
      console.error(ex);
    }
  }

  async getMostRecentDocument() {
    const user = await this.auth.currentUser;
    const queryResult = await this.db
      .collection<AmountDocument>(`users/${user.uid}/amounts`, (ref) =>
        ref.orderBy('date', 'desc').limit(1)
      )
      .get()
      .toPromise();

    return queryResult.docs[0];
  }

  // Month in JavaScript is 0-indexed (January is 0, February is 1, etc),
  // but by using 0 as the day it will give us the last day of the prior
  // month. So passing in 1 as the month number will return the last day
  // of January, not February. Since we are using Date objects, we have to
  // offset the month value by one to get the days in the given month using a
  // 0-based index.
  private daysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }
}
