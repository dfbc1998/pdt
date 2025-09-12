import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { IonApp, IonRouterOutlet, IonLoading } from '@ionic/angular/standalone';
import { AuthService } from './core/services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    IonApp,
    IonRouterOutlet,
    IonLoading
  ],
  templateUrl: 'app.component.html',
  styleUrls: [`app.component.scss`]
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);

  isLoading$: Observable<boolean> = this.authService.isLoading$;

  ngOnInit() {
    // Initialize app
    this.initializeApp();
  }

  private async initializeApp() {
    // Any additional initialization logic
    console.log('FreelancePro app initialized');
  }
}