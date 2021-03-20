import { Component, NgZone, OnInit } from '@angular/core';
import { WeekDay } from '@angular/common';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { firestore } from 'firebase/app';
import { AmountDocument } from '../interfaces/AmountDocument.interface';
import { NbToastrService } from '@nebular/theme';

interface AmountLeft {
  uid: string;
  amount: number;
  date: firestore.FieldValue;
}

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

  private unsubscribe: () => void;

  public static readonly MS_IN_A_DAY = 24 * 60 * 60 * 1000;

  constructor(
    public auth: AngularFireAuth,
    private db: AngularFirestore,
    private ngZone: NgZone,
    private toast: NbToastrService
  ) {}

  ngOnInit(): void {
    this.canSave = false;
    this.auth.onAuthStateChanged((user) => {
      if (!user && !this.unsubscribe) return;

      if (!user && this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
        return;
      }

      this.db.collection<AmountDocument>(`users/${user.uid}/amounts`, (ref) => {
        const result = ref.orderBy('date');
        this.unsubscribe = result.onSnapshot((snapshot) => {
          this.ngZone.run(() => {
            if (snapshot.metadata.hasPendingWrites) return;
            this.canPop = snapshot.docs.length > 0;
          });
        });
        return result;
      });
    });
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

  get nextPayDay() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    //getMonth() returns a 0-based index, but the month in new Date() requires
    //a 1-based index
    let monthNextPayDay = now.getMonth() + (now.getDate() < 24 ? 1 : 2);
    let yearNextPayDay = now.getFullYear();
    if (monthNextPayDay > 12) {
      monthNextPayDay = 1;
      yearNextPayDay += 1;
    }
    const nextPayDay = new Date(`${yearNextPayDay}/${monthNextPayDay}/${24}`);

    while (nextPayDay.getDay() > WeekDay.Saturday) {
      nextPayDay.setDate(nextPayDay.getDate() - 1);
    }

    return nextPayDay;
  }

  differenceInDays() {
    const now = new Date();
    if (this.doNotCountToday) {
      now.setTime(now.getTime() + HowMuchLeftComponent.MS_IN_A_DAY);
    }

    return Math.ceil(
      (this.nextPayDay.getTime() - now.getTime()) /
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
          date: firestore.FieldValue.serverTimestamp()
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
}
