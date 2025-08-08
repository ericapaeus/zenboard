import React from 'react';

export interface RouteConfig {
  path: string;
  label: string;
  icon?: React.ReactNode;
  children?: RouteConfig[];
  meta?: {
    hiddenInSidebar?: boolean;
    title?: string;
    requiresAuth?: boolean;
    roles?: string[];
  };
}

export interface RouteMeta {
  title?: string;
  requiresAuth?: boolean;
  roles?: string[];
} 