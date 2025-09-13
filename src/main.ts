import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';

// Firebase imports
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth, setPersistence, browserLocalPersistence } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(),

    // Firebase providers with persistence configuration
    provideFirebaseApp(() => {
      const app = initializeApp(environment.firebaseConfig);
      return app;
    }),
    provideAuth(() => {
      const auth = getAuth();

      // Configurar persistencia para mantener el login al recargar la página
      setPersistence(auth, browserLocalPersistence).catch((error) => {
        console.error('Error configuring Firebase Auth persistence:', error);
      });

      return auth;
    }),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage())
  ],
}).catch(err => console.error(err));