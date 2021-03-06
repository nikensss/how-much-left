import { Component, NgZone, OnInit } from '@angular/core';
import { WeekDay } from '@angular/common';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { firestore } from 'firebase/app';
import { AmountDocument } from '../interfaces/AmountDocument.interface';

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
  public nextPayDay: Date;
  public averageToSpendPerDay: number;

  public canSave = false;
  public saveButtonTitle = 'Save';

  public canPop = false;
  public popButtonTitle = 'Pop';

  private unsubscribe: () => void;

  public static readonly MS_IN_A_DAY = 24 * 60 * 60 * 1000;

  constructor(
    public auth: AngularFireAuth,
    private db: AngularFirestore,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.disableOperations();
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
          this.ngZone.run(() => (this.canPop = snapshot.docs.length > 0));
        });
        return result;
      });
    });
  }

  private disableOperations() {
    this.canSave = false;
  }

  private enableOperations() {
    this.canSave = true;
  }

  calculate(val: string): void {
    this.totalAmountLeft = parseFloat(val);

    if (
      isNaN(this.totalAmountLeft) ||
      !isFinite(this.totalAmountLeft) ||
      this.totalAmountLeft < 0
    ) {
      this.totalAmountLeft = 0;
      this.disableOperations();
      return;
    }

    this.nextPayDay = this.findNextPayDay();
    this.averageToSpendPerDay = this.totalAmountLeft / this.differenceInDays();

    if (
      !isNaN(this.averageToSpendPerDay) &&
      isFinite(this.averageToSpendPerDay)
    ) {
      this.enableOperations();
    }
  }

  findNextPayDay() {
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

    const diff = Math.ceil(
      (this.nextPayDay.getTime() - now.getTime()) /
        HowMuchLeftComponent.MS_IN_A_DAY
    );

    return diff;
  }

  async save() {
    this.disableOperations();
    this.saveButtonTitle = 'Saving...';
    try {
      console.log('Saving to firestore!');
      //get the current user
      const user = await this.auth.currentUser;
      //add a new document to the amountsleft collection with the user's uid,
      //the remaining amount, and the date of today
      const amountsRef = await this.db
        .collection<AmountDocument>(`users/${user.uid}/amounts`)
        .add({
          amount: this.averageToSpendPerDay,
          date: firestore.FieldValue.serverTimestamp()
        });
      this.saveButtonTitle = 'Success!';
      return amountsRef.id;
    } catch (ex) {
      this.saveButtonTitle = 'Error!';
      console.error(ex);
    } finally {
      setTimeout(() => {
        this.saveButtonTitle = 'Save';
        this.enableOperations();
      }, 1500);
    }
  }

  async pop() {
    this.disableOperations();
    this.popButtonTitle = 'Removing...';

    try {
      const user = await this.auth.currentUser;

      const docs = (
        await this.db
          .collection<AmountDocument>(`users/${user.uid}/amounts`, (ref) =>
            ref.orderBy('date', 'desc').limit(1)
          )
          .get()
          .toPromise()
      ).docs;

      if (docs.length === 0) return;

      const idOfLastDoc = docs[0].id;
      await this.db
        .collection<AmountDocument>(`users/${user.uid}/amounts`)
        .doc(`${idOfLastDoc}`)
        .delete();
    } catch (ex) {
      this.popButtonTitle = 'Error!';
      console.error(ex);
    } finally {
      setTimeout(() => {
        this.popButtonTitle = 'Pop';
        this.enableOperations();
      }, 1500);
    }
  }
}
