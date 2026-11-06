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
    // Volta do Google/Apple (com ou sem sessão: é aqui que ela nasce)
    path: 'entrar/social',
    loadComponent: () => import('./features/auth/social-callback/social-callback.component').then((m) => m.SocialCallbackComponent),
  },
  {
    // Link de convite: abre com ou sem login
    path: 'convite/:code',
    loadComponent: () => import('./features/invite/invite.component').then((m) => m.InviteComponent),
  },
  {
    path: 'cadastro',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    // Boas-vindas logo após o cadastro (tela cheia, sem o menu do app)
    path: 'boas-vindas',
    canActivate: [authGuard],
    loadComponent: () => import('./features/onboarding/onboarding.component').then((m) => m.OnboardingComponent),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        data: { keep: 'tab' },
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'experiencias',
        data: { keep: 'tab' },
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
        data: { keep: 'stack' },
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
        data: { keep: 'tab' },
        loadComponent: () => import('./features/discover/discover.component').then((m) => m.DiscoverComponent),
      },
      // A busca de restaurantes agora faz parte de "Descobrir"
      { path: 'restaurantes', pathMatch: 'full', redirectTo: 'descobrir' },
      {
        path: 'restaurantes/:id',
        data: { keep: 'stack' },
        loadComponent: () =>
          import('./features/restaurants/restaurant-detail/restaurant-detail.component').then(
            (m) => m.RestaurantDetailComponent,
          ),
      },
      { path: 'mapa', redirectTo: 'inicio' },
      {
        path: 'notificacoes',
        data: { keep: 'stack' },
        loadComponent: () =>
          import('./features/notifications/notifications.component').then((m) => m.NotificationsComponent),
      },
      {
        path: 'social',
        data: { keep: 'tab' },
        loadComponent: () => import('./features/social/feed/feed.component').then((m) => m.FeedComponent),
      },
      {
        path: 'amigos',
        data: { keep: 'stack' },
        loadComponent: () =>
          import('./features/social/friends-search/friends-search.component').then((m) => m.FriendsSearchComponent),
      },
      {
        path: 'retrospectiva',
        data: { keep: 'stack' },
        loadComponent: () =>
          import('./features/retrospective/retrospective.component').then((m) => m.RetrospectiveComponent),
      },
      {
        path: 'quero-ir',
        data: { keep: 'stack' },
        loadComponent: () => import('./features/saved/saved.component').then((m) => m.SavedComponent),
      },
      {
        path: 'favoritos',
        data: { keep: 'stack' },
        loadComponent: () => import('./features/favorites/favorites.component').then((m) => m.FavoritesComponent),
      },
      {
        path: 'colecoes/:id',
        data: { keep: 'stack' },
        loadComponent: () =>
          import('./features/favorites/collection-detail/collection-detail.component').then(
            (m) => m.CollectionDetailComponent,
          ),
      },
      {
        path: 'perfil',
        data: { keep: 'tab' },
        loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'perfil/:username',
        data: { keep: 'stack' },
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
