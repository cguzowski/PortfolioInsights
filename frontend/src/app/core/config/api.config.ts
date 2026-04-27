import { InjectionToken, Provider } from '@angular/core';

export interface AtlasApiConfig {
  readonly baseUrl: string;
  readonly paths: {
    readonly portfolio: string;
    readonly portfolioCollection: string;
    readonly portfolioHoldings: string;
  };
}

export const DEFAULT_ATLAS_API_CONFIG: AtlasApiConfig = {
  baseUrl: 'http://localhost:8080/api',
  paths: {
    portfolio: 'portfolio',
    portfolioCollection: 'portfolio/all',
    portfolioHoldings: 'portfolio/holdings'
  }
};

export const ATLAS_API_CONFIG = new InjectionToken<AtlasApiConfig>('Atlas API configuration', {
  factory: () => DEFAULT_ATLAS_API_CONFIG
});

export function provideAtlasApiConfig(config: AtlasApiConfig = DEFAULT_ATLAS_API_CONFIG): Provider {
  return {
    provide: ATLAS_API_CONFIG,
    useValue: config
  };
}

export function apiResourceUrl(config: AtlasApiConfig, path: keyof AtlasApiConfig['paths']): string {
  const baseUrl = config.baseUrl.replace(/\/$/, '');
  const resourcePath = config.paths[path].replace(/^\//, '');
  return `${baseUrl}/${resourcePath}`;
}
