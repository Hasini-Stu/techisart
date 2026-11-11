import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const signedInGuard: CanActivateFn = (_r, state) =>
  inject(AuthService).signedIn() || inject(Router).createUrlTree(['/signin'], { queryParams: { returnTo: state.url } });

export const creatorGuard: CanActivateFn = (_r, state) => {
  const auth = inject(AuthService), router = inject(Router);
  if (!auth.signedIn()) return router.createUrlTree(['/signin'], { queryParams: { returnTo: state.url } });
  return auth.isCreator() || router.createUrlTree(['/verify']);
};
