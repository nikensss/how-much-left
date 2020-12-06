import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  public label = 'Login';
  constructor(public auth: AngularFireAuth) {}

  ngOnInit(): void {
    this.auth.onAuthStateChanged((user) => {
      this.label = user ? 'Logout' : 'Login';
    });
  }
}
