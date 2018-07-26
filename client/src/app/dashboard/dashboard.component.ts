import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

import { Observable, BehaviorSubject, of, concat } from 'rxjs';
import {
  concatMap,
  map,
  tap,
  delay,
  skip
} from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  searchText = {
    name: ''
  };
  polledCricketEvents$: Observable<any[]>;
  load$ = new BehaviorSubject('');

  constructor(
    private auth: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const cricket$ = this.http.get(
      'https://www.lotusbook.com/api/exchange/eventType/4'
    );

    const whenToRefresh$ = of('').pipe(
      delay(300),
      tap(_ => this.load$.next('')),
      skip(1)
    );

    this.polledCricketEvents$ = this.load$.pipe(
      concatMap(_ => concat(cricket$, whenToRefresh$)),
      map((response: { result: any[] }) => response.result)
    );
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['login']);
  }

  trackByEventID(index: number, event: { id: string }): number { return Number(event.id); }
}
