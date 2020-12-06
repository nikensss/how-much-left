import { Component } from '@angular/core';
import { WeekDay } from '@angular/common';
import { AngularFireAuth } from '@angular/fire/auth';

@Component({
  selector: 'app-how-much-left',
  templateUrl: './how-much-left.component.html',
  styleUrls: ['./how-much-left.component.scss'],
})
export class HowMuchLeftComponent {
  public doNotCountToday: boolean = false;
  public totalAmountLeft: number = 0;
  public nextPayDay: Date;
  public differenceInDays: number = 0;
  public averageToSpendPerDay: string;

  public static readonly MS_IN_DAY = 24 * 60 * 60 * 1000;
  constructor(public auth: AngularFireAuth) {}

  calculate(val?: string): void {
    this.totalAmountLeft = parseFloat(val);

    if (isNaN(this.totalAmountLeft)) {
      console.log('Not a number');
      this.totalAmountLeft = 0;
      return;
    }

    this.nextPayDay = this.findNextPayDay();
    this.differenceInDays = this.dayDifference();
    this.averageToSpendPerDay = (
      this.totalAmountLeft / this.differenceInDays
    ).toFixed(2);
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

  dayDifference() {
    const now = new Date();
    if (this.doNotCountToday)
      now.setTime(now.getTime() + HowMuchLeftComponent.MS_IN_DAY);

    const diff = Math.ceil(
      (this.nextPayDay.getTime() - now.getTime()) /
        HowMuchLeftComponent.MS_IN_DAY
    );

    return diff;
  }
}
