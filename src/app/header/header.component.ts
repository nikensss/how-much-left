import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  BreakpointObserver,
  Breakpoints,
  BreakpointState
} from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { NbThemeService } from '@nebular/theme';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  public theme: 'cosmic' | 'corporate' = 'cosmic';
  public icon: 'moon' | 'sun-outline' = 'moon';

  public isHandset$: Observable<boolean> = this.breakpointObserver
    .observe([Breakpoints.Handset])
    .pipe(
      map((result) => result.matches),
      shareReplay()
    );

  public label = 'Login';
  constructor(
    public auth: AngularFireAuth,
    public breakpointObserver: BreakpointObserver,
    private themeService: NbThemeService
  ) {
    this.themeService.changeTheme(this.theme);
  }

  ngOnInit(): void {
    this.auth.onAuthStateChanged((user) => {
      this.label = user ? 'My HML' : 'Login';
    });
  }

  switchTheme() {
    this.theme = this.theme === 'cosmic' ? 'corporate' : 'cosmic';
    this.icon = this.icon === 'moon' ? 'sun-outline' : 'moon';
    this.themeService.changeTheme(this.theme);
  }
}
