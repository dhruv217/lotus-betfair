import { Component, Renderer2 } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(
    public auth: AuthService,
    private router: Router,
    private renderer: Renderer2
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        const currentUrlSlug = event.url.slice(1);
        if (currentUrlSlug === 'login') {
          this.renderer.addClass(document.body.parentElement, 'login-screen');
        } else {
          this.renderer.removeClass(document.body.parentElement, 'login-screen');
        }
      }
    });
  }
}
