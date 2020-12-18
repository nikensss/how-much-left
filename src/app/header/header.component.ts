import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import {
  BreakpointObserver,
  Breakpoints,
  BreakpointState,
} from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  public isHandset$: Observable<boolean> = this.breakpointObserver
    .observe([Breakpoints.Handset])
    .pipe(
      map((result) => result.matches),
      shareReplay()
    );

  public label = 'Login';
  constructor(
    public auth: AngularFireAuth,
    public breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.auth.onAuthStateChanged((user) => {
      this.label = user ? 'Logout' : 'Login';
    });
  }
}
