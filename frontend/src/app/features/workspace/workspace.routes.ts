import { Routes } from '@angular/router';

import { DEFAULT_FEATURE_PAGE, FEATURE_PAGES } from './data/workspace-pages';
import { WorkspaceFeaturePageComponent } from './pages/workspace-feature/workspace-feature.page';

const featurePageRoutes: Routes = FEATURE_PAGES.map((page) => ({
  path: page.route,
  component: WorkspaceFeaturePageComponent,
  data: {
    pageId: page.id
  }
}));

export const workspaceRoutes: Routes = [
  {
    path: '',
    redirectTo: DEFAULT_FEATURE_PAGE.route,
    pathMatch: 'full'
  },
  ...featurePageRoutes,
  {
    path: 'portfolio-live',
    loadChildren: () => import('../portfolio/portfolio.routes').then((m) => m.portfolioRoutes)
  },
  {
    path: '**',
    redirectTo: DEFAULT_FEATURE_PAGE.route
  }
];
