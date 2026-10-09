import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'entrar',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'cadastro',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'experiencias',
        loadComponent: () =>
          import('./features/experiences/experience-list/experience-list.component').then((m) => m.ExperienceListComponent),
      },
      {
        path: 'experiencias/nova',
        loadComponent: () =>
          import('./features/experiences/experience-form/experience-form.component').then((m) => m.ExperienceFormComponent),
      },
      {
        path: 'experiencias/:id',
        loadComponent: () =>
          import('./features/experiences/experience-detail/experience-detail.component').then(
            (m) => m.ExperienceDetailComponent,
          ),
      },
      {
        path: 'experiencias/:id/editar',
        loadComponent: () =>
          import('./features/experiences/experience-form/experience-form.component').then((m) => m.ExperienceFormComponent),
      },
      {
        path: 'descobrir',
        loadComponent: () => import('./features/discover/discover.component').then((m) => m.DiscoverComponent),
      },
      // A busca de restaurantes agora faz parte de "Descobrir"
      { path: 'restaurantes', pathMatch: 'full', redirectTo: 'descobrir' },
      {
        path: 'restaurantes/:id',
        loadComponent: () =>
          import('./features/restaurants/restaurant-detail/restaurant-detail.component').then(
            (m) => m.RestaurantDetailComponent,
          ),
      },
      { path: 'mapa', redirectTo: 'inicio' },
      {
        path: 'notificacoes',
        loadComponent: () =>
          import('./features/notifications/notifications.component').then((m) => m.NotificationsComponent),
      },
      {
        path: 'social',
        loadComponent: () => import('./features/social/feed/feed.component').then((m) => m.FeedComponent),
      },
      {
        path: 'amigos',
        loadComponent: () =>
          import('./features/social/friends-search/friends-search.component').then((m) => m.FriendsSearchComponent),
      },
      {
        path: 'retrospectiva',
        loadComponent: () =>
          import('./features/retrospective/retrospective.component').then((m) => m.RetrospectiveComponent),
      },
      {
        path: 'favoritos',
        loadComponent: () => import('./features/favorites/favorites.component').then((m) => m.FavoritesComponent),
      },
      {
        path: 'colecoes/:id',
        loadComponent: () =>
          import('./features/favorites/collection-detail/collection-detail.component').then(
            (m) => m.CollectionDetailComponent,
          ),
      },
      {
        path: 'perfil',
        loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'perfil/:username',
        loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'configuracoes',
        loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: 'privacidade',
        loadComponent: () => import('./features/settings/privacy/privacy.component').then((m) => m.PrivacyComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
