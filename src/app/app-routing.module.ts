import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HowMuchLeftComponent } from './how-much-left/how-much-left.component';

const routes: Routes = [
  { path: '', component: HowMuchLeftComponent },
  {
    path: 'login',
    loadChildren: () => import('./user/user.module').then((m) => m.UserModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
