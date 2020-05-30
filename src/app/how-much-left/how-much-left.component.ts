import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-how-much-left',
  templateUrl: './how-much-left.component.html',
  styleUrls: ['./how-much-left.component.scss'],
})
export class HowMuchLeftComponent {
  public doNotCountToday: boolean = false;
  public amount: number = 0;
  constructor() {}

  calculate(event: KeyboardEvent): void {
    this.amount = parseFloat((event.target as HTMLInputElement).value);
  }
}
