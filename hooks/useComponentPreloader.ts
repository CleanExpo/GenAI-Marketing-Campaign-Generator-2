// hooks/useComponentPreloader.ts

import { useEffect, useCallback } from 'react';

interface PreloadStrategy {
  component: string;
  delay?: number;
  priority?: 'high' | 'medium' | 'low';
  condition?: () => boolean;
}

// Component preloading configurations
const PRELOAD_STRATEGIES: PreloadStrategy[] = [
  {
    component: 'ExportManager',
    delay: 2000, // Preload after 2 seconds
    priority: 'high',
  },
  {
    component: 'CampaignManager',
    delay: 1000, // Preload after 1 second
    priority: 'high',
  },
  {
    component: 'BrandKitManager',
    delay: 3000,
    priority: 'medium',
  },
  {
    component: 'CRMManager',
    delay: 3000,
    priority: 'medium',
  },
  {
    component: 'StaffManager',
    delay: 5000,
    priority: 'low',
    condition: () => !!import.meta.env.VITE_AIRTABLE_API_KEY,
  },
  {
    component: 'ProjectManager',
    delay: 5000,
    priority: 'low',
    condition: () => !!import.meta.env.VITE_AIRTABLE_API_KEY,
  },
];

// Component import functions
const componentImports = {
  ExportManager: () => import('../components/ExportManager'),
  CampaignManager: () => import('../components/CampaignManager'),
  BrandKitManager: () => import('../components/BrandKitManager'),
  CRMManager: () => import('../components/CRMManager'),
  StaffManager: () => import('../components/StaffManager'),
  ProjectManager: () => import('../components/ProjectManager'),
};

// Cache for preloaded components
const preloadCache = new Map<string, Promise<any>>();

export const useComponentPreloader = (enabled: boolean = true) => {
  const preloadComponent = useCallback(async (componentName: string) => {
    if (preloadCache.has(componentName)) {
      return preloadCache.get(componentName);
    }

    const importFn = componentImports[componentName as keyof typeof componentImports];
    if (!importFn) {
      console.warn(`Unknown component for preloading: ${componentName}`);
      return;
    }

    try {
      const promise = importFn();
      preloadCache.set(componentName, promise);

      const result = await promise;
      console.log(`✅ Preloaded component: ${componentName}`);
      return result;
    } catch (error) {
      console.warn(`Failed to preload component ${componentName}:`, error);
      preloadCache.delete(componentName);
    }
  }, []);

  const preloadPDFLibrary = useCallback(async () => {
    try {
      // Temporarily disabled jsPDF preloading to resolve deployment issues
      if (!preloadCache.has('jsPDF')) {
        const promise = Promise.resolve();
        preloadCache.set('jsPDF', promise);
        await promise;
        console.log('⚠️ PDF library temporarily disabled');
      }
    } catch (error) {
      console.warn('Failed to preload PDF library:', error);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Preload components based on strategy
    PRELOAD_STRATEGIES.forEach((strategy) => {
      // Check condition if provided
      if (strategy.condition && !strategy.condition()) {
        return;
      }

      const timer = setTimeout(() => {
        // Use requestIdleCallback for low priority components
        if (strategy.priority === 'low' && 'requestIdleCallback' in window) {
          window.requestIdleCallback(() => {
            preloadComponent(strategy.component);
          });
        } else {
          preloadComponent(strategy.component);
        }
      }, strategy.delay || 0);

      // Cleanup timer on unmount
      return () => clearTimeout(timer);
    });

    // Preload PDF library for export functionality
    const pdfTimer = setTimeout(() => {
      preloadPDFLibrary();
    }, 4000);

    return () => clearTimeout(pdfTimer);
  }, [enabled, preloadComponent, preloadPDFLibrary]);

  // Manual preload function for immediate use
  const manualPreload = useCallback((componentName: string) => {
    return preloadComponent(componentName);
  }, [preloadComponent]);

  return {
    preloadComponent: manualPreload,
    isPreloaded: (componentName: string) => preloadCache.has(componentName),
    preloadCache,
  };
};

// Hook for intelligent preloading based on user interaction
export const useIntelligentPreloader = () => {
  const { preloadComponent } = useComponentPreloader();

  const onUserInteraction = useCallback((interactionType: string) => {
    switch (interactionType) {
      case 'campaign-generated':
        // User just generated a campaign, likely to export next
        preloadComponent('ExportManager');
        break;
      case 'advanced-settings-opened':
        // User opened advanced settings, might use brand kit
        preloadComponent('BrandKitManager');
        break;
      case 'enterprise-view':
        // User accessed enterprise features
        preloadComponent('StaffManager');
        preloadComponent('ProjectManager');
        break;
      case 'crm-button-hover':
        // User hovered over CRM button
        preloadComponent('CRMManager');
        break;
      default:
        break;
    }
  }, [preloadComponent]);

  return { onUserInteraction };
};