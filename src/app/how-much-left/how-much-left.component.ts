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

  public static readonly MS_IN_A_DAY = 24 * 60 * 60 * 1000;

  constructor(public auth: AngularFireAuth, private db: AngularFirestore) {}

  ngOnInit(): void {
    this.disableOperations();
  }

  private disableOperations() {
    this.canSave = false;
    this.canPop = false;
  }

  private enableOperations() {
    this.canSave = true;
    this.canPop = true;
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
    let monthNextPayDay =
      now.getDate() < 24 ? now.getMonth() + 1 : now.getMonth() + 2;
    let yearNextPayDay;
    if (monthNextPayDay <= 12) {
      yearNextPayDay = now.getFullYear();
    } else {
      monthNextPayDay = 1;
      yearNextPayDay = now.getFullYear() + 1;
    }
    const nextPayDay = new Date(
      yearNextPayDay + '/' + monthNextPayDay + '/' + 24
    );
    while (
      nextPayDay.getDay() === WeekDay.Saturday ||
      nextPayDay.getDay() === WeekDay.Sunday
    ) {
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
      if (!docs[0]) {
        return;
      }
      const idOfLastDoc = docs[0].id;
      this.db
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
