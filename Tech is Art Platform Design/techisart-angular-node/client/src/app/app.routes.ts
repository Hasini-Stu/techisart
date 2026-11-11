import { Routes } from '@angular/router';
import { signedInGuard, creatorGuard } from './core/guards';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home.page').then(m => m.HomePage) },
  { path: 'about', loadComponent: () => import('./pages/about.page').then(m => m.AboutPage) },
  { path: 'article/:slug', loadComponent: () => import('./pages/article.page').then(m => m.ArticlePage) },
  { path: 'explore/:pillar', loadComponent: () => import('./pages/explore.page').then(m => m.ExplorePage) },
  { path: 'research', loadComponent: () => import('./pages/research.page').then(m => m.ResearchPage) },
  { path: 'opportunities', loadComponent: () => import('./pages/opportunities.page').then(m => m.OpportunitiesPage) },
  { path: 'opportunities/new', loadComponent: () => import('./pages/opportunity-submit.page').then(m => m.OpportunitySubmitPage) },
  { path: 'opportunities/:id', loadComponent: () => import('./pages/opportunity-detail.page').then(m => m.OpportunityDetailPage) },
  { path: 'creator/:name', loadComponent: () => import('./pages/profile.page').then(m => m.ProfilePage) },
  { path: 'account', canActivate: [signedInGuard], loadComponent: () => import('./pages/account.page').then(m => m.AccountPage) },
  { path: 'workspace', canActivate: [creatorGuard], loadComponent: () => import('./pages/workspace.page').then(m => m.WorkspacePage) },
  { path: 'write', loadComponent: () => import('./pages/write.page').then(m => m.WritePage) },
  { path: 'verify', canActivate: [signedInGuard], loadComponent: () => import('./pages/verify.page').then(m => m.VerifyPage) },
  { path: 'subscribe', loadComponent: () => import('./pages/subscribe.page').then(m => m.SubscribePage) },
  { path: 'signin', loadComponent: () => import('./pages/auth.page').then(m => m.AuthPage) },
  { path: '**', redirectTo: '' }
];
