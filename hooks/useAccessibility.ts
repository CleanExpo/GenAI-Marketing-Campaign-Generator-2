/**
 * Accessibility Hook for React Components
 * Provides comprehensive accessibility utilities and ARIA management
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseAccessibilityOptions {
  announcePageChanges?: boolean;
  manageFocus?: boolean;
  trapFocus?: boolean;
  enableKeyboardNavigation?: boolean;
}

interface AriaLiveRegion {
  message: string;
  priority: 'polite' | 'assertive';
}

export const useAccessibility = (options: UseAccessibilityOptions = {}) => {
  const [announcements, setAnnouncements] = useState<AriaLiveRegion[]>([]);
  const focusTrapRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // ARIA Live Region for screen reader announcements
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement: AriaLiveRegion = { message, priority };
    setAnnouncements(prev => [...prev, announcement]);

    // Clear announcement after a delay
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a !== announcement));
    }, 1000);
  }, []);

  // Focus management utilities
  const focusElement = useCallback((selector: string | HTMLElement) => {
    const element = typeof selector === 'string'
      ? document.querySelector(selector) as HTMLElement
      : selector;

    if (element) {
      element.focus();
      // Announce focus change to screen readers
      if (element.getAttribute('aria-label') || element.textContent) {
        announce(`Focused on ${element.getAttribute('aria-label') || element.textContent}`, 'polite');
      }
    }
  }, [announce]);

  // Focus trap for modals and dialogs
  const trapFocus = useCallback((container: HTMLElement) => {
    if (!options.trapFocus) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [options.trapFocus]);

  // Enhanced keyboard navigation
  const setupKeyboardNavigation = useCallback((container: HTMLElement) => {
    if (!options.enableKeyboardNavigation) return;

    const handleKeyboardNavigation = (e: KeyboardEvent) => {
      const focusableElements = Array.from(
        container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ) as HTMLElement[];

      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % focusableElements.length;
          focusableElements[nextIndex]?.focus();
          break;

        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          const prevIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
          focusableElements[prevIndex]?.focus();
          break;

        case 'Home':
          e.preventDefault();
          focusableElements[0]?.focus();
          break;

        case 'End':
          e.preventDefault();
          focusableElements[focusableElements.length - 1]?.focus();
          break;

        case 'Escape':
          if (previousFocusRef.current) {
            previousFocusRef.current.focus();
          } else {
            (document.activeElement as HTMLElement)?.blur();
          }
          break;
      }
    };

    container.addEventListener('keydown', handleKeyboardNavigation);
    return () => container.removeEventListener('keydown', handleKeyboardNavigation);
  }, [options.enableKeyboardNavigation]);

  // ARIA attributes helper
  const getAriaAttributes = useCallback((config: {
    label?: string;
    labelledBy?: string;
    describedBy?: string;
    expanded?: boolean;
    selected?: boolean;
    checked?: boolean;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    live?: 'polite' | 'assertive' | 'off';
    atomic?: boolean;
    role?: string;
    level?: number;
  }) => {
    const attributes: Record<string, any> = {};

    if (config.label) attributes['aria-label'] = config.label;
    if (config.labelledBy) attributes['aria-labelledby'] = config.labelledBy;
    if (config.describedBy) attributes['aria-describedby'] = config.describedBy;
    if (config.expanded !== undefined) attributes['aria-expanded'] = config.expanded;
    if (config.selected !== undefined) attributes['aria-selected'] = config.selected;
    if (config.checked !== undefined) attributes['aria-checked'] = config.checked;
    if (config.disabled !== undefined) attributes['aria-disabled'] = config.disabled;
    if (config.required !== undefined) attributes['aria-required'] = config.required;
    if (config.invalid !== undefined) attributes['aria-invalid'] = config.invalid;
    if (config.live) attributes['aria-live'] = config.live;
    if (config.atomic !== undefined) attributes['aria-atomic'] = config.atomic;
    if (config.role) attributes['role'] = config.role;
    if (config.level) attributes['aria-level'] = config.level;

    return attributes;
  }, []);

  // Form accessibility helpers
  const getFormFieldAttributes = useCallback((config: {
    id: string;
    label: string;
    required?: boolean;
    invalid?: boolean;
    errorMessage?: string;
    helpText?: string;
  }) => {
    const helpId = config.helpText ? `${config.id}-help` : undefined;
    const errorId = config.invalid && config.errorMessage ? `${config.id}-error` : undefined;
    const describedBy = [helpId, errorId].filter(Boolean).join(' ');

    return {
      fieldAttributes: {
        id: config.id,
        'aria-required': config.required,
        'aria-invalid': config.invalid,
        'aria-describedby': describedBy || undefined,
      },
      labelAttributes: {
        htmlFor: config.id,
      },
      helpAttributes: helpId ? {
        id: helpId,
        role: 'note',
      } : {},
      errorAttributes: errorId ? {
        id: errorId,
        role: 'alert',
        'aria-live': 'polite' as const,
      } : {},
    };
  }, []);

  // Color contrast utilities
  const checkColorContrast = useCallback((foreground: string, background: string): number => {
    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    // Calculate relative luminance
    const getLuminance = (rgb: {r: number, g: number, b: number}) => {
      const { r, g, b } = rgb;
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const fgRgb = hexToRgb(foreground);
    const bgRgb = hexToRgb(background);

    if (!fgRgb || !bgRgb) return 0;

    const fgLuminance = getLuminance(fgRgb);
    const bgLuminance = getLuminance(bgRgb);

    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);

    return (lighter + 0.05) / (darker + 0.05);
  }, []);

  // Screen reader detection
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);

  useEffect(() => {
    // Detect screen reader usage
    const detectScreenReader = () => {
      // Check for common screen reader indicators
      const hasScreenReader = !!(
        window.navigator.userAgent.includes('NVDA') ||
        window.navigator.userAgent.includes('JAWS') ||
        window.speechSynthesis ||
        document.body.getAttribute('aria-hidden') !== null
      );

      setIsScreenReaderActive(hasScreenReader);
    };

    detectScreenReader();

    // Listen for accessibility preferences
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', detectScreenReader);

    return () => mediaQuery.removeEventListener('change', detectScreenReader);
  }, []);

  // Page announcement effect
  useEffect(() => {
    if (options.announcePageChanges) {
      announce('Page loaded', 'polite');
    }
  }, [announce, options.announcePageChanges]);

  return {
    // Core functions
    announce,
    focusElement,
    trapFocus,
    setupKeyboardNavigation,

    // ARIA helpers
    getAriaAttributes,
    getFormFieldAttributes,

    // Accessibility checks
    checkColorContrast,
    isScreenReaderActive,

    // Live regions
    announcements,

    // Refs for focus management
    focusTrapRef,
    previousFocusRef,

    // Utility functions
    setFocusTrap: (element: HTMLElement | null) => {
      focusTrapRef.current = element;
      if (element && options.trapFocus) {
        previousFocusRef.current = document.activeElement as HTMLElement;
        trapFocus(element);
      }
    },

    releaseFocusTrap: () => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
      focusTrapRef.current = null;
    },
  };
};

// Component for rendering ARIA live regions
export const AriaLiveRegion: React.FC<{
  announcements: AriaLiveRegion[];
}> = ({ announcements }) => {
  return (
    <>
      {announcements.map((announcement, index) => (
        <div
          key={index}
          className="sr-only"
          aria-live={announcement.priority}
          aria-atomic="true"
        >
          {announcement.message}
        </div>
      ))}
    </>
  );
};

export default useAccessibility;