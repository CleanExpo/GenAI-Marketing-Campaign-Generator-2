/**
 * Performance Service for Core Web Vitals and SEO Performance Optimization
 * Tracks and optimizes performance metrics for better SEO rankings
 */

interface PerformanceMetrics {
  firstContentfulPaint: number | null;
  largestContentfulPaint: number | null;
  firstInputDelay: number | null;
  cumulativeLayoutShift: number | null;
  timeToInteractive: number | null;
  totalBlockingTime: number | null;
  speedIndex: number | null;
  loadTime: number;
  domContentLoaded: number;
}

interface WebVitalsThresholds {
  fcp: { good: number; poor: number };
  lcp: { good: number; poor: number };
  fid: { good: number; poor: number };
  cls: { good: number; poor: number };
  tti: { good: number; poor: number };
  tbt: { good: number; poor: number };
}

class PerformanceService {
  private static instance: PerformanceService;
  private metrics: PerformanceMetrics = {
    firstContentfulPaint: null,
    largestContentfulPaint: null,
    firstInputDelay: null,
    cumulativeLayoutShift: null,
    timeToInteractive: null,
    totalBlockingTime: null,
    speedIndex: null,
    loadTime: 0,
    domContentLoaded: 0
  };

  private thresholds: WebVitalsThresholds = {
    fcp: { good: 1800, poor: 3000 },
    lcp: { good: 2500, poor: 4000 },
    fid: { good: 100, poor: 300 },
    cls: { good: 0.1, poor: 0.25 },
    tti: { good: 3800, poor: 7300 },
    tbt: { good: 200, poor: 600 }
  };

  private observers: PerformanceObserver[] = [];

  public static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  /**
   * Initialize performance monitoring
   */
  public init(): void {
    if (typeof window === 'undefined') return;

    this.measureNavigationTiming();
    this.setupWebVitalsObservers();
    this.trackResourceTiming();
    this.optimizeImageLoading();
    this.setupIntersectionObserver();
  }

  /**
   * Measure basic navigation timing
   */
  private measureNavigationTiming(): void {
    if (!('performance' in window)) return;

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (navigation) {
        this.metrics.loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
      }
    });
  }

  /**
   * Setup Web Vitals observers
   */
  private setupWebVitalsObservers(): void {
    // First Contentful Paint (FCP)
    this.observePerformanceEntry('paint', (entries) => {
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.metrics.firstContentfulPaint = fcpEntry.startTime;
      }
    });

    // Largest Contentful Paint (LCP)
    this.observePerformanceEntry('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        this.metrics.largestContentfulPaint = lastEntry.startTime;
      }
    });

    // First Input Delay (FID)
    this.observePerformanceEntry('first-input', (entries) => {
      const firstInput = entries[0];
      if (firstInput) {
        this.metrics.firstInputDelay = firstInput.processingStart - firstInput.startTime;
      }
    });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    this.observePerformanceEntry('layout-shift', (entries) => {
      for (const entry of entries) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.metrics.cumulativeLayoutShift = clsValue;
    });

    // Total Blocking Time (TBT) - approximation
    this.observePerformanceEntry('longtask', (entries) => {
      let tbt = 0;
      for (const entry of entries) {
        if (entry.duration > 50) {
          tbt += entry.duration - 50;
        }
      }
      this.metrics.totalBlockingTime = tbt;
    });
  }

  /**
   * Generic performance observer setup
   */
  private observePerformanceEntry(
    entryType: string,
    callback: (entries: PerformanceEntry[]) => void
  ): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ entryTypes: [entryType] });
      this.observers.push(observer);
    } catch (e) {
      console.warn(`Performance observer for ${entryType} not supported:`, e);
    }
  }

  /**
   * Track resource loading performance
   */
  private trackResourceTiming(): void {
    window.addEventListener('load', () => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      const slowResources = resources.filter(resource => resource.duration > 1000);
      if (slowResources.length > 0) {
        console.warn('Slow loading resources detected:', slowResources);
        this.reportSlowResources(slowResources);
      }
    });
  }

  /**
   * Optimize image loading with lazy loading and WebP detection
   */
  private optimizeImageLoading(): void {
    // Check WebP support
    const supportsWebP = this.checkWebPSupport();

    // Lazy load images with Intersection Observer
    const images = document.querySelectorAll('img[data-src]');
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src || '';
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    }
  }

  /**
   * Setup Intersection Observer for performance monitoring
   */
  private setupIntersectionObserver(): void {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Track time to visible for above-the-fold content
          const element = entry.target as HTMLElement;
          const visibleTime = performance.now();
          element.setAttribute('data-visible-time', visibleTime.toString());
        }
      });
    }, { threshold: 0.1 });

    // Observe critical elements
    const criticalElements = document.querySelectorAll('.critical-content, h1, .hero-section');
    criticalElements.forEach(el => observer.observe(el));
  }

  /**
   * Check WebP support
   */
  private checkWebPSupport(): Promise<boolean> {
    return new Promise(resolve => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  /**
   * Get current performance score (0-100)
   */
  public getPerformanceScore(): number {
    const scores = {
      fcp: this.scoreMetric(this.metrics.firstContentfulPaint, this.thresholds.fcp),
      lcp: this.scoreMetric(this.metrics.largestContentfulPaint, this.thresholds.lcp),
      fid: this.scoreMetric(this.metrics.firstInputDelay, this.thresholds.fid),
      cls: this.scoreMetric(this.metrics.cumulativeLayoutShift, this.thresholds.cls, true),
      tbt: this.scoreMetric(this.metrics.totalBlockingTime, this.thresholds.tbt)
    };

    // Weight the scores
    const weights = { fcp: 0.15, lcp: 0.25, fid: 0.25, cls: 0.25, tbt: 0.1 };

    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(scores).forEach(([metric, score]) => {
      if (score !== null) {
        totalScore += score * weights[metric as keyof typeof weights];
        totalWeight += weights[metric as keyof typeof weights];
      }
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  /**
   * Score individual metric
   */
  private scoreMetric(
    value: number | null,
    threshold: { good: number; poor: number },
    reverse = false
  ): number | null {
    if (value === null) return null;

    const { good, poor } = threshold;

    if (reverse) {
      // For metrics where lower is better (like CLS)
      if (value <= good) return 100;
      if (value >= poor) return 0;
      return Math.round(100 - ((value - good) / (poor - good)) * 100);
    } else {
      // For metrics where lower is better (like FCP, LCP)
      if (value <= good) return 100;
      if (value >= poor) return 0;
      return Math.round(100 - ((value - good) / (poor - good)) * 100);
    }
  }

  /**
   * Get detailed performance report
   */
  public getPerformanceReport(): {
    score: number;
    metrics: PerformanceMetrics;
    recommendations: string[];
    coreWebVitals: { metric: string; value: number | null; score: number | null; status: string }[];
  } {
    const score = this.getPerformanceScore();
    const recommendations = this.generateRecommendations();
    const coreWebVitals = this.getCoreWebVitalsReport();

    return {
      score,
      metrics: this.metrics,
      recommendations,
      coreWebVitals
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.firstContentfulPaint && this.metrics.firstContentfulPaint > this.thresholds.fcp.good) {
      recommendations.push('Optimize First Contentful Paint by reducing server response time and eliminating render-blocking resources');
    }

    if (this.metrics.largestContentfulPaint && this.metrics.largestContentfulPaint > this.thresholds.lcp.good) {
      recommendations.push('Improve Largest Contentful Paint by optimizing images and critical rendering path');
    }

    if (this.metrics.firstInputDelay && this.metrics.firstInputDelay > this.thresholds.fid.good) {
      recommendations.push('Reduce First Input Delay by minimizing JavaScript execution time');
    }

    if (this.metrics.cumulativeLayoutShift && this.metrics.cumulativeLayoutShift > this.thresholds.cls.good) {
      recommendations.push('Minimize Cumulative Layout Shift by setting dimensions for images and avoiding dynamic content injection');
    }

    if (this.metrics.totalBlockingTime && this.metrics.totalBlockingTime > this.thresholds.tbt.good) {
      recommendations.push('Reduce Total Blocking Time by code splitting and deferring non-critical JavaScript');
    }

    return recommendations;
  }

  /**
   * Get Core Web Vitals report
   */
  private getCoreWebVitalsReport() {
    return [
      {
        metric: 'First Contentful Paint',
        value: this.metrics.firstContentfulPaint,
        score: this.scoreMetric(this.metrics.firstContentfulPaint, this.thresholds.fcp),
        status: this.getMetricStatus(this.metrics.firstContentfulPaint, this.thresholds.fcp)
      },
      {
        metric: 'Largest Contentful Paint',
        value: this.metrics.largestContentfulPaint,
        score: this.scoreMetric(this.metrics.largestContentfulPaint, this.thresholds.lcp),
        status: this.getMetricStatus(this.metrics.largestContentfulPaint, this.thresholds.lcp)
      },
      {
        metric: 'First Input Delay',
        value: this.metrics.firstInputDelay,
        score: this.scoreMetric(this.metrics.firstInputDelay, this.thresholds.fid),
        status: this.getMetricStatus(this.metrics.firstInputDelay, this.thresholds.fid)
      },
      {
        metric: 'Cumulative Layout Shift',
        value: this.metrics.cumulativeLayoutShift,
        score: this.scoreMetric(this.metrics.cumulativeLayoutShift, this.thresholds.cls, true),
        status: this.getMetricStatus(this.metrics.cumulativeLayoutShift, this.thresholds.cls, true)
      }
    ];
  }

  /**
   * Get metric status (good, needs improvement, poor)
   */
  private getMetricStatus(
    value: number | null,
    threshold: { good: number; poor: number },
    reverse = false
  ): string {
    if (value === null) return 'unknown';

    if (reverse) {
      if (value <= threshold.good) return 'good';
      if (value <= threshold.poor) return 'needs improvement';
      return 'poor';
    } else {
      if (value <= threshold.good) return 'good';
      if (value <= threshold.poor) return 'needs improvement';
      return 'poor';
    }
  }

  /**
   * Report slow resources
   */
  private reportSlowResources(resources: PerformanceResourceTiming[]): void {
    // In production, send to analytics service
    console.group('Performance Analysis - Slow Resources');
    resources.forEach(resource => {
      console.warn(`Slow resource: ${resource.name} (${Math.round(resource.duration)}ms)`);
    });
    console.groupEnd();
  }

  /**
   * Optimize critical resource hints
   */
  public addResourceHints(resources: { url: string; type: 'preload' | 'prefetch' | 'preconnect' }[]): void {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = resource.type;
      link.href = resource.url;

      if (resource.type === 'preload') {
        // Determine resource type
        if (resource.url.match(/\.(woff2?|ttf|otf)$/i)) {
          link.as = 'font';
          link.crossOrigin = 'anonymous';
        } else if (resource.url.match(/\.(css)$/i)) {
          link.as = 'style';
        } else if (resource.url.match(/\.(js)$/i)) {
          link.as = 'script';
        } else if (resource.url.match(/\.(jpg|jpeg|png|webp|svg)$/i)) {
          link.as = 'image';
        }
      }

      document.head.appendChild(link);
    });
  }

  /**
   * Cleanup observers
   */
  public cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

export const performanceService = PerformanceService.getInstance();
export default PerformanceService;