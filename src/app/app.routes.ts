// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { BuilderComponent } from './features/builder/builder.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'builder',
    pathMatch: 'full'
  },
  {
    path: 'builder',
    component: BuilderComponent
  }
];

// ===================================
// src/app/app.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }
  `]
})
export class App {}
