import React, { useState, useEffect, Suspense, lazy } from 'react';
import { generateMarketingCampaign } from './services/geminiService';
import { CampaignResult, AdvancedSettings, SavedCampaign, CampaignTemplate } from './types';
import { ResultsDisplay } from './components/ResultsDisplay';
import { LoadingSpinner, ChevronDownIcon, TrashIcon } from './components/icons';
import ProductDescriptionForm from './components/ProductDescriptionForm';
import AdvancedSettingsForm from './components/AdvancedSettingsForm';
import ErrorBoundary from './components/ErrorBoundary';
// Import only what we need for better tree shaking
import {
    INSPIRATION_PROMPTS,
    NATIONAL_LANGUAGES,
    TARGET_PLATFORMS,
    ARTISTIC_STYLES
} from './constants';
import { isSEMrushAvailable } from './services/semrushService';
import { CampaignStorageService } from './services/campaignStorage';
import { BrandKitService, BrandKit } from './services/brandKitService';
import { CRMIntegrationService, CRMSyncResult, CRMConnection } from './services/crmIntegration';

// Import security components
import SecureInput, { SecureURLInput, SecureEmailInput } from './components/SecureInput';
import { SecurityServiceAPI } from './services/securityService';

// New comprehensive Airtable integration imports
import { useAuth, authService } from './services/authService';
import { airtableService, initializeAirtable } from './services/airtableService';

// Performance optimization hooks
import { useComponentPreloader, useIntelligentPreloader } from './hooks/useComponentPreloader';

// SEO and Accessibility imports
import { seoService } from './services/seoService';
import useAccessibility, { AriaLiveRegion } from './hooks/useAccessibility';
import { performanceService } from './services/performanceService';

// Optimized lazy loading with error boundaries and preloading
const CampaignManager = lazy(() =>
  import('./components/CampaignManager')
    .then(module => ({ default: module.CampaignManager }))
    .catch(error => {
      console.error('Failed to load CampaignManager:', error);
      throw error;
    })
);

const ExportManager = lazy(() =>
  import('./components/ExportManager')
    .then(module => ({ default: module.ExportManager }))
    .catch(error => {
      console.error('Failed to load ExportManager:', error);
      throw error;
    })
);

const BrandKitManager = lazy(() =>
  import('./components/BrandKitManager')
    .then(module => ({ default: module.BrandKitManager }))
    .catch(error => {
      console.error('Failed to load BrandKitManager:', error);
      throw error;
    })
);

const CRMManager = lazy(() =>
  import('./components/CRMManager')
    .then(module => ({ default: module.CRMManager }))
    .catch(error => {
      console.error('Failed to load CRMManager:', error);
      throw error;
    })
);

const StaffManager = lazy(() =>
  import('./components/StaffManager')
    .catch(error => {
      console.error('Failed to load StaffManager:', error);
      throw error;
    })
);

const ProjectManager = lazy(() =>
  import('./components/ProjectManager')
    .catch(error => {
      console.error('Failed to load ProjectManager:', error);
      throw error;
    })
);

// Enhanced loading component for Suspense fallbacks
const ComponentLoader: React.FC<{
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}> = ({
  message = "Loading component...",
  size = 'md',
  showProgress = false
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <div className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-cyan-500 mx-auto mb-3`}></div>
        <p className="text-slate-400 text-sm">{message}</p>
        {showProgress && (
          <div className="mt-2 w-32 bg-slate-700 rounded-full h-1 mx-auto">
            <div className="bg-cyan-500 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        )}
      </div>
    </div>
  );
};

// Error boundary component for lazy-loaded modules
class LazyLoadErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy load error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      if (FallbackComponent) {
        return <FallbackComponent />;
      }

      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-2">⚠️</div>
            <p className="text-slate-400 text-sm">Failed to load component</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-2 text-cyan-500 hover:text-cyan-400 text-xs underline"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
    // Authentication state
    const { user, isAuthenticated, login, logout, hasPermission } = useAuth();

    // Performance optimization hooks
    const { preloadComponent, isPreloaded } = useComponentPreloader(true);

    // SEO and Accessibility hooks
    const accessibility = useAccessibility({
        announcePageChanges: true,
        manageFocus: true,
        enableKeyboardNavigation: true,
    });
    const { onUserInteraction } = useIntelligentPreloader();
    const [showLogin, setShowLogin] = useState<boolean>(false);
    const [loginCredentials, setLoginCredentials] = useState({ email: '', password: '' });

    // Core app state
    const [productDescription, setProductDescription] = useState<string>('');
    const [generateMedia, setGenerateMedia] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [results, setResults] = useState<CampaignResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

    // Security and validation state
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
    const [isFormValid, setIsFormValid] = useState<boolean>(false);
    const [csrfToken, setCsrfToken] = useState<string>('');

    // Navigation state for new components
    const [activeView, setActiveView] = useState<'generator' | 'staff' | 'projects' | 'campaigns'>('generator');

    // Campaign Management State
    const [currentCampaign, setCurrentCampaign] = useState<SavedCampaign | null>(null);
    const [showCampaignManager, setShowCampaignManager] = useState<boolean>(false);

    // Export Manager State
    const [showExportManager, setShowExportManager] = useState<boolean>(false);

    // Brand Kit Manager State
    const [showBrandKitManager, setShowBrandKitManager] = useState<boolean>(false);
    const [currentBrandKit, setCurrentBrandKit] = useState<BrandKit>(BrandKitService.getCurrentBrandKit());

    // CRM Manager State
    const [showCRMManager, setShowCRMManager] = useState<boolean>(false);

    // Staff Manager State
    const [showStaffManager, setShowStaffManager] = useState<boolean>(false);

    // Project Manager State
    const [showProjectManager, setShowProjectManager] = useState<boolean>(false);

    // Airtable integration state
    const [airtableInitialized, setAirtableInitialized] = useState<boolean>(false);
    const [airtableError, setAirtableError] = useState<string | null>(null);

    // CRM Sync State
    const [crmSyncing, setCrmSyncing] = useState<boolean>(false);
    const [crmSyncStatus, setCrmSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
    const [crmSyncMessage, setCrmSyncMessage] = useState<string>('');
    const [crmConnection, setCrmConnection] = useState<CRMConnection | null>(null);
    const [crmNotifications, setCrmNotifications] = useState<Array<{
        id: string;
        type: 'success' | 'error' | 'warning';
        message: string;
        timestamp: Date;
    }>>([]);

    const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
        companyName: '',
        companyWebsite: '',
        companyLogo: '',
        brandColors: { primary: '#38bdf8', secondary: '#1d4ed8' },
        socialMediaLinks: [],
        nationalLanguage: 'American English',
        useGoogleEAT: true,
        useHemingwayStyle: false,
        generateBacklinks: true,
        findTrendingTopics: true,
        competitorWebsites: [],
        insertWatermark: false,
        generateVerifiableText: false,
        targetPlatforms: ['Website Blog', 'Facebook Post', 'X (Twitter) Post'],
        defaultAspectRatio: '1:1',
        defaultNegativePrompt: '',
        defaultImageStyle: 'Photorealistic',
        defaultCreativityLevel: 7,
    });

    // Initialize brand kit CSS variables on component mount
    useEffect(() => {
        const cssVars = BrandKitService.generateCSSVariables(currentBrandKit);
        const styleElement = document.createElement('style');
        styleElement.id = 'brand-kit-styles';
        styleElement.textContent = cssVars;
        document.head.appendChild(styleElement);

        // Apply initial brand kit settings to advanced settings
        const brandedSettings = BrandKitService.applyToCampaignSettings(advancedSettings);
        setAdvancedSettings(prev => ({
            ...prev,
            brandColors: brandedSettings.brandColors,
            companyLogo: brandedSettings.companyLogo,
            defaultImageStyle: brandedSettings.defaultImageStyle
        }));

        return () => {
            // Cleanup on unmount
            const existingStyle = document.getElementById('brand-kit-styles');
            if (existingStyle) {
                document.head.removeChild(existingStyle);
            }
        };
    }, []); // Empty dependency array for mount/unmount only

    // Initialize security features
    useEffect(() => {
        // Initialize CSRF token
        const token = SecurityServiceAPI.generateCSRFToken();
        setCsrfToken(token);
    }, []);

    // Validation helper functions
    const handleValidationChange = (field: string, isValid: boolean, errors: string[]) => {
        setValidationErrors(prev => ({
            ...prev,
            [field]: errors
        }));

        // Update overall form validity
        const allErrors = { ...validationErrors, [field]: errors };
        const hasErrors = Object.values(allErrors).some(errorList => errorList.length > 0);
        setIsFormValid(!hasErrors && productDescription.trim().length > 0);
    };

    const sanitizeUserInput = (input: string): string => {
        return SecurityServiceAPI.sanitizeInput(input);
    };

    // Initialize CRM connection status and Airtable service on component mount
    useEffect(() => {
        const activeConnection = CRMIntegrationService.getActiveConnection();
        if (activeConnection) {
            setCrmConnection(activeConnection);
            setCrmSyncStatus('idle');
            setCrmSyncMessage(`Connected to ${activeConnection.provider}`);
        }

        // Initialize Airtable service when user is authenticated
        if (isAuthenticated && !airtableInitialized) {
            initializeAirtableService();
        }
    }, [isAuthenticated, airtableInitialized]);

    const initializeAirtableService = async (): Promise<void> => {
        try {
            await initializeAirtable();
            setAirtableInitialized(true);
            setAirtableError(null);
            console.log('✅ Airtable service initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Airtable service:', error);
            setAirtableError('Failed to connect to Airtable. Please check your API configuration.');
        }
    };

    const handleLogin = async (): Promise<void> => {
        try {
            await login(loginCredentials);
            setShowLogin(false);
            setLoginCredentials({ email: '', password: '' });
        } catch (error) {
            console.error('Login failed:', error);
            alert('Login failed. Please check your credentials.');
        }
    };

    const handleLogout = (): void => {
        logout();
        setActiveView('generator');
        setAirtableInitialized(false);
    };

    // CRM Helper Functions
    const addCrmNotification = (type: 'success' | 'error' | 'warning', message: string) => {
        const notification = {
            id: `crm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            message,
            timestamp: new Date()
        };
        setCrmNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only 5 most recent

        // Auto-dismiss success and warning notifications after 5 seconds
        if (type !== 'error') {
            setTimeout(() => {
                setCrmNotifications(prev => prev.filter(n => n.id !== notification.id));
            }, 5000);
        }
    };

    const dismissCrmNotification = (id: string) => {
        setCrmNotifications(prev => prev.filter(n => n.id !== id));
    };

    const performCrmSync = async (campaign: SavedCampaign): Promise<boolean> => {
        if (!crmConnection) {
            return false; // Silent failure if no CRM connection
        }

        try {
            setCrmSyncing(true);
            setCrmSyncStatus('syncing');
            setCrmSyncMessage('Syncing with CRM...');

            const result = await CRMIntegrationService.syncCampaign(campaign);

            if (result.success) {
                setCrmSyncStatus('success');
                setCrmSyncMessage(`Successfully synced to ${crmConnection.provider}`);
                addCrmNotification('success', `Campaign "${campaign.name}" synced successfully to ${crmConnection.provider}`);
                return true;
            } else {
                setCrmSyncStatus('error');
                const errorMsg = result.errors.length > 0 ? result.errors[0].error : 'Unknown sync error';
                setCrmSyncMessage(`Sync failed: ${errorMsg}`);
                addCrmNotification('error', `Failed to sync campaign to ${crmConnection.provider}: ${errorMsg}`);
                return false;
            }
        } catch (error: unknown) {
            setCrmSyncStatus('error');
            setCrmSyncMessage(`Sync error: ${error.message}`);
            addCrmNotification('error', `CRM sync error: ${error.message}`);
            return false;
        } finally {
            setCrmSyncing(false);

            // Reset status after 3 seconds
            setTimeout(() => {
                setCrmSyncStatus('idle');
                setCrmSyncMessage(crmConnection ? `Connected to ${crmConnection.provider}` : '');
            }, 3000);
        }
    };

    const handleGenerate = async () => {
        if (!productDescription.trim()) {
            setError("Please enter a product description.");
            return;
        }

        // Validate form before generation
        if (!isFormValid) {
            setError("Please fix validation errors before generating campaign.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResults(null);
        try {
            // Sanitize all inputs before sending to AI service
            const sanitizedProductDescription = sanitizeUserInput(productDescription);
            const sanitizedSettings = {
                ...advancedSettings,
                companyName: sanitizeUserInput(advancedSettings.companyName),
                companyWebsite: SecurityServiceAPI.validateURL(advancedSettings.companyWebsite) ? advancedSettings.companyWebsite : '',
                socialMediaLinks: advancedSettings.socialMediaLinks.map(link => ({
                    platform: sanitizeUserInput(link.platform),
                    url: SecurityServiceAPI.validateURL(link.url) ? link.url : ''
                })),
                competitorWebsites: advancedSettings.competitorWebsites
                    .filter(comp => SecurityServiceAPI.validateURL(comp.url))
                    .map(comp => ({ url: comp.url }))
            };

            const campaignResults = await generateMarketingCampaign(sanitizedProductDescription, generateMedia, sanitizedSettings);
            setResults(campaignResults);

            // Trigger intelligent preloading after successful campaign generation
            onUserInteraction('campaign-generated');

            // Auto-sync with CRM if user has an active connection
            if (crmConnection) {
                // Create a saved campaign object for CRM sync
                const campaignForSync: SavedCampaign = currentCampaign ? {
                    ...currentCampaign,
                    result: campaignResults,
                    updatedAt: new Date()
                } : {
                    id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: `Campaign - ${new Date().toLocaleDateString()}`,
                    description: sanitizedProductDescription.slice(0, 100) + (sanitizedProductDescription.length > 100 ? '...' : ''),
                    productDescription: sanitizedProductDescription,
                    settings: sanitizedSettings,
                    result: campaignResults,
                    status: 'draft' as const,
                    tags: ['auto-generated'],
                    version: 1,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                // Perform auto-sync to CRM
                console.log('🔄 Auto-syncing campaign to CRM:', campaignForSync.name);
                await performCrmSync(campaignForSync);
            }
        } catch (err: unknown) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInspirationClick = () => {
        const randomPrompt = INSPIRATION_PROMPTS[Math.floor(Math.random() * INSPIRATION_PROMPTS.length)];
        setProductDescription(randomPrompt);
    };

    // Campaign Management Functions
    const handleLoadCampaign = (campaign: SavedCampaign) => {
        setCurrentCampaign(campaign);
        setProductDescription(campaign.productDescription);
        setAdvancedSettings(campaign.settings);
        setResults(campaign.result);
        setError(null);
        setShowCampaignManager(false);
    };

    const handleUseTemplate = (template: CampaignTemplate) => {
        // Merge template settings with current settings
        setAdvancedSettings(prev => ({ ...prev, ...template.settings }));
        setError(null);
        setShowCampaignManager(false);

        // Track template usage
        CampaignStorageService.useTemplate(template.id);
    };

    const handleSaveCurrent = async (name: string, description: string, tags: string[]) => {
        if (!results || !productDescription.trim()) {
            setError('No campaign to save. Please generate a campaign first.');
            return;
        }

        try {
            const savedCampaign = await CampaignStorageService.saveCampaign({
                name,
                description,
                productDescription,
                settings: advancedSettings,
                result: results,
                status: 'draft',
                tags
            });

            setCurrentCampaign(savedCampaign);
            setError(null);

            // Automatically sync with CRM if connection exists
            if (crmConnection) {
                await performCrmSync(savedCampaign);
            }
        } catch (err: unknown) {
            setError(`Failed to save campaign: ${err.message}`);
        }
    };

    const updateCurrentCampaign = async (updates: Partial<SavedCampaign>) => {
        if (!currentCampaign) return;

        try {
            const updated = await CampaignStorageService.updateCampaign(currentCampaign.id, {
                ...updates,
                result: results || currentCampaign.result,
                settings: advancedSettings
            });

            if (updated) {
                setCurrentCampaign(updated);
            }
        } catch (err: unknown) {
            setError(`Failed to update campaign: ${err.message}`);
        }
    };

    const handleBrandKitUpdate = (updatedBrandKit: BrandKit) => {
        setCurrentBrandKit(updatedBrandKit);

        // Apply brand kit to current advanced settings
        const brandedSettings = BrandKitService.applyToCampaignSettings(advancedSettings);
        setAdvancedSettings(brandedSettings);

        // Apply CSS variables to the page
        const cssVars = BrandKitService.generateCSSVariables(updatedBrandKit);
        const styleElement = document.getElementById('brand-kit-styles') || document.createElement('style');
        styleElement.id = 'brand-kit-styles';
        styleElement.textContent = cssVars;
        document.head.appendChild(styleElement);
    };

    const handleSettingChange = (field: keyof AdvancedSettings, value: string | number | boolean | string[] | { platform: string; url: string }[] | { url: string }[] | { primary: string; secondary: string }) => {
        setAdvancedSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleColorChange = (color: 'primary' | 'secondary', value: string) => {
        setAdvancedSettings(prev => ({
            ...prev,
            brandColors: { ...prev.brandColors, [color]: value }
        }));
    };
    
    const handleSocialLinkChange = (index: number, field: 'platform' | 'url', value: string) => {
        const newLinks = [...advancedSettings.socialMediaLinks];
        newLinks[index] = { ...newLinks[index], [field]: value };
        handleSettingChange('socialMediaLinks', newLinks);
    };

    const addSocialLink = () => {
        handleSettingChange('socialMediaLinks', [...advancedSettings.socialMediaLinks, { platform: '', url: '' }]);
    };

    const removeSocialLink = (index: number) => {
        const newLinks = advancedSettings.socialMediaLinks.filter((_, i) => i !== index);
        handleSettingChange('socialMediaLinks', newLinks);
    };
    
    const handleCompetitorChange = (index: number, value: string) => {
        const newCompetitors = [...advancedSettings.competitorWebsites];
        newCompetitors[index] = { url: value };
        handleSettingChange('competitorWebsites', newCompetitors);
    };

    const addCompetitor = () => {
        handleSettingChange('competitorWebsites', [...advancedSettings.competitorWebsites, { url: '' }]);
    };
    
    const removeCompetitor = (index: number) => {
        const newCompetitors = advancedSettings.competitorWebsites.filter((_, i) => i !== index);
        handleSettingChange('competitorWebsites', newCompetitors);
    };

    const handlePlatformToggle = (platform: string) => {
        const newPlatforms = advancedSettings.targetPlatforms.includes(platform)
            ? advancedSettings.targetPlatforms.filter(p => p !== platform)
            : [...advancedSettings.targetPlatforms, platform];
        handleSettingChange('targetPlatforms', newPlatforms);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleSettingChange('companyLogo', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeLogo = () => {
        handleSettingChange('companyLogo', '');
        const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };
    
    const formInputClass = "w-full p-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors text-sm";
    const formLabelClass = "block text-sm font-medium text-slate-300 mb-1";
    const formCheckboxClass = "h-4 w-4 rounded bg-slate-700 border-slate-500 text-cyan-600 focus:ring-cyan-500";
    const formChipClass = "cursor-pointer text-sm font-medium px-2.5 py-1.5 rounded-full transition-colors";
    const formChipSelectedClass = "bg-cyan-600 text-white";
    const formChipUnselectedClass = "bg-slate-700 hover:bg-slate-600 text-cyan-300";


    // Initialize SEO and Performance for the page
    useEffect(() => {
        seoService.updatePageSEO('/');
        seoService.trackSEOMetrics();
        performanceService.init();
        accessibility.announce('ZENITH AI Marketing Campaign Generator loaded');

        // Add critical resource hints for performance
        performanceService.addResourceHints([
            { url: 'https://fonts.googleapis.com', type: 'preconnect' },
            { url: 'https://aistudiocdn.com', type: 'preconnect' },
            { url: 'https://api.airtable.com', type: 'preconnect' },
            { url: 'https://generativelanguage.googleapis.com', type: 'preconnect' }
        ]);

        // Cleanup on unmount
        return () => {
            performanceService.cleanup();
        };
    }, []);

    // Update SEO when campaign is generated
    useEffect(() => {
        if (results) {
            const campaignSEO = seoService.generateCampaignSEO({
                productName: productDescription.split(' ').slice(0, 3).join(' '), // First 3 words as product name
                targetAudience: advancedSettings.targetAudience,
                campaignType: 'AI Generated Campaign'
            });
            seoService.updateMetaTags(campaignSEO);

            // Add campaign structured data
            seoService.addCampaignStructuredData({
                name: `Marketing Campaign for ${productDescription.slice(0, 50)}...`,
                description: results.content?.overview || 'AI-generated marketing campaign',
                dateCreated: new Date().toISOString(),
                targetAudience: advancedSettings.targetAudience
            });
        }
    }, [results, productDescription, advancedSettings.targetAudience]);

    return (
        <div className="bg-slate-900 text-white min-h-screen font-sans">
            {/* ARIA Live Region for screen reader announcements */}
            <AriaLiveRegion announcements={accessibility.announcements} />

            <main
                id="main-content"
                className="max-w-4xl mx-auto p-4 md:p-8"
                role="main"
                aria-label="Marketing Campaign Generator"
            >
                <header className="text-center mb-8" role="banner">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1"></div>
                        <div className="flex-1">
                            <h1
                                className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500"
                                {...accessibility.getAriaAttributes({
                                    level: 1,
                                    label: "ZENITH AI Marketing Campaign Generator - Main Application"
                                })}
                            >
                                AI Marketing Campaign Generator
                            </h1>
                            <p className="text-slate-400 mt-2 text-lg">
                                Generate comprehensive marketing campaigns with Google Gemini AI
                            </p>
                        </div>
                        <div className="flex-1 flex justify-end gap-2">
                            {/* Authentication Button */}
                            {!isAuthenticated ? (
                                <button
                                    onClick={() => setShowLogin(true)}
                                    className="px-4 py-2 rounded-lg font-medium transition-all bg-green-600 hover:bg-green-700 text-white"
                                    title="Login to access team features"
                                >
                                    🔐 Login
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 px-3 py-1 bg-green-600/20 text-green-400 rounded-lg border border-green-500/30">
                                        <span>👤</span>
                                        <span className="text-sm">{user?.name}</span>
                                        <span className="text-xs opacity-75">({user?.role})</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
                                        title="Logout"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}

                            {/* Navigation Tabs - only show if authenticated */}
                            {isAuthenticated && (
                                <nav
                                    id="navigation"
                                    role="navigation"
                                    aria-label="Main navigation"
                                    className="flex gap-2"
                                >
                                    <button
                                        onClick={() => {
                                            setActiveView('generator');
                                            accessibility.announce('Switched to Campaign Generator');
                                        }}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                            activeView === 'generator'
                                                ? 'bg-cyan-600 text-white'
                                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                        }`}
                                        {...accessibility.getAriaAttributes({
                                            label: "AI Campaign Generator",
                                            selected: activeView === 'generator'
                                        })}
                                        title="AI Campaign Generator"
                                    >
                                        🚀 Generator
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveView('campaigns');
                                            accessibility.announce('Switched to Campaign Management');
                                        }}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                            activeView === 'campaigns'
                                                ? 'bg-cyan-600 text-white'
                                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                        }`}
                                        {...accessibility.getAriaAttributes({
                                            label: "Campaign & Project Management",
                                            selected: activeView === 'campaigns'
                                        })}
                                        title="Campaign & Project Management"
                                    >
                                        📁 Campaigns
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveView('staff');
                                            accessibility.announce('Switched to Team Management');
                                        }}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                            activeView === 'staff'
                                                ? 'bg-cyan-600 text-white'
                                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                        }`}
                                        {...accessibility.getAriaAttributes({
                                            label: "Team Management & Accountability",
                                            selected: activeView === 'staff'
                                        })}
                                        title="Team Management & Accountability"
                                    >
                                        👥 Team
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveView('projects');
                                            accessibility.announce('Switched to Project Management');
                                        }}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                            activeView === 'projects'
                                                ? 'bg-cyan-600 text-white'
                                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                        }`}
                                        {...accessibility.getAriaAttributes({
                                            label: "Project Management & Tracking",
                                            selected: activeView === 'projects'
                                        })}
                                        title="Project Management & Tracking"
                                    >
                                        📊 Projects
                                    </button>
                                </nav>
                            )}

                            {/* Legacy buttons for backward compatibility */}
                            {isAuthenticated && activeView === 'generator' && (
                                <>
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowCRMManager(!showCRMManager)}
                                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                                showCRMManager
                                                    ? 'bg-cyan-600 text-white'
                                                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                            }`}
                                            title={crmConnection ? `CRM: Connected to ${crmConnection.provider}` : "Connect and sync with CRM systems"}
                                        >
                                            🔗 {showCRMManager ? 'Hide' : 'CRM'}
                                            {crmConnection && (
                                                <span className={`ml-1 w-2 h-2 rounded-full inline-block ${
                                                    crmSyncStatus === 'syncing' ? 'bg-yellow-400 animate-pulse' :
                                                    crmSyncStatus === 'success' ? 'bg-green-400' :
                                                    crmSyncStatus === 'error' ? 'bg-red-400' :
                                                    'bg-blue-400'
                                                }`}></span>
                                            )}
                                        </button>
                                        {crmSyncing && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3">
                                                <div className="w-3 h-3 bg-cyan-400 rounded-full animate-ping"></div>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setShowBrandKitManager(!showBrandKitManager)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                            showBrandKitManager
                                                ? 'bg-cyan-600 text-white'
                                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                        }`}
                                        title="Manage brand assets, colors, and guidelines"
                                    >
                                        🎨 {showBrandKitManager ? 'Hide' : 'Brand Kit'}
                                    </button>
                                    <button
                                        onClick={() => setShowCampaignManager(!showCampaignManager)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                            showCampaignManager
                                                ? 'bg-cyan-600 text-white'
                                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                        }`}
                                    >
                                        📁 {showCampaignManager ? 'Hide' : 'Local Campaigns'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    <p className="text-slate-400 mt-2 text-lg">
                        Instantly craft comprehensive marketing strategies from a simple product idea.
                    </p>
                    {currentCampaign && (
                        <div className="mt-4 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg inline-flex items-center gap-2 border border-cyan-500/30">
                            <span>📂</span>
                            <span>Loaded: {currentCampaign.name}</span>
                            <span className="text-xs opacity-75">(v{currentCampaign.version})</span>
                        </div>
                    )}

                    {/* CRM Status Bar */}
                    {(crmConnection || crmSyncMessage) && (
                        <div className={`mt-4 px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm border ${
                            crmSyncStatus === 'syncing' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                            crmSyncStatus === 'success' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                            crmSyncStatus === 'error' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                            'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        }`}>
                            {crmSyncStatus === 'syncing' ? (
                                <LoadingSpinner />
                            ) : (
                                <span>🔗</span>
                            )}
                            <span>{crmSyncMessage || `Connected to ${crmConnection?.provider}`}</span>
                        </div>
                    )}
                </header>

                {/* CRM Notifications */}
                {crmNotifications.length > 0 && (
                    <div className="space-y-2 mb-6">
                        {crmNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`px-4 py-3 rounded-lg flex items-start justify-between text-sm border ${
                                    notification.type === 'success' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                    notification.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                    'bg-red-500/20 text-red-400 border-red-500/30'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="mt-0.5">
                                        {notification.type === 'success' ? '✅' :
                                         notification.type === 'warning' ? '⚠️' : '❌'}
                                    </span>
                                    <div>
                                        <p>{notification.message}</p>
                                        <p className="text-xs opacity-75 mt-1">
                                            {notification.timestamp.toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => dismissCrmNotification(notification.id)}
                                    className="text-slate-400 hover:text-slate-200 ml-2 p-1"
                                    title="Dismiss notification"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Main Generator Form - only show in generator view */}
                {activeView === 'generator' && (
                    <ErrorBoundary
                        onError={(error, errorInfo) => {
                            console.error('Form error:', error, errorInfo);
                            onUserInteraction('form-error');
                        }}
                        resetKeys={[activeView, productDescription]}
                    >
                        <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
                            <ProductDescriptionForm
                                productDescription={productDescription}
                                onProductDescriptionChange={setProductDescription}
                                generateMedia={generateMedia}
                                onGenerateMediaChange={setGenerateMedia}
                                onInspirationClick={handleInspirationClick}
                                onValidationChange={handleValidationChange}
                                onUserInteraction={onUserInteraction}
                            />

                            <div className="mt-6">
                                <AdvancedSettingsForm
                                    settings={advancedSettings}
                                    showAdvanced={showAdvanced}
                                    onToggleAdvanced={() => {
                                        setShowAdvanced(!showAdvanced);
                                        if (!showAdvanced) {
                                            onUserInteraction('advanced-settings-opened');
                                        }
                                    }}
                                    onSettingChange={handleSettingChange}
                                    onValidationChange={handleValidationChange}
                                    onUserInteraction={onUserInteraction}
                                    onLogoUpload={handleLogoUpload}
                                    onRemoveLogo={removeLogo}
                                    onAddSocialLink={addSocialLink}
                                    onRemoveSocialLink={removeSocialLink}
                                    onSocialLinkChange={handleSocialLinkChange}
                                    onAddCompetitor={addCompetitor}
                                    onRemoveCompetitor={removeCompetitor}
                                    onCompetitorChange={handleCompetitorChange}
                                    onColorChange={handleColorChange}
                                />
                            </div>

                            <div className="mt-6">
                                <button
                                    type="submit"
                                    disabled={isLoading || !productDescription.trim() || !isFormValid}
                                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 flex items-center justify-center text-lg"
                                >
                                    {isLoading ? (
                                        <>
                                            <LoadingSpinner />
                                            <span className="ml-2">Generating...</span>
                                        </>
                                    ) : (
                                        '🚀 Generate Campaign'
                                    )}
                                </button>
                            </div>
                        </form>
                    </ErrorBoundary>
                )}

                {/* Dynamic Content Based on Active View */}
                {activeView === 'generator' && (
                    <>
                        {/* Campaign Manager - Legacy for backward compatibility */}
                        {showCampaignManager && (
                            <div className="mt-8">
                                <LazyLoadErrorBoundary>
                                    <Suspense fallback={<ComponentLoader message="Loading campaign manager..." showProgress />}>
                                        <CampaignManager
                                            onLoadCampaign={handleLoadCampaign}
                                            onUseTemplate={handleUseTemplate}
                                            currentCampaign={currentCampaign}
                                            onSaveCurrent={handleSaveCurrent}
                                            resultsExist={!!results}
                                            hasUnsavedResults={!!results && (!currentCampaign ||
                                                (currentCampaign && JSON.stringify(currentCampaign.result) !== JSON.stringify(results))
                                            )}
                                            currentCampaignData={results}
                                        />
                                    </Suspense>
                                </LazyLoadErrorBoundary>
                            </div>
                        )}
                    </>
                )}

                {/* Team Management View */}
                {activeView === 'staff' && isAuthenticated && (
                    <div className="mt-8">
                        {airtableError && (
                            <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
                                ⚠️ {airtableError}
                                <button
                                    onClick={initializeAirtableService}
                                    className="ml-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                                >
                                    Retry Connection
                                </button>
                            </div>
                        )}
                        {airtableInitialized ? (
                            <LazyLoadErrorBoundary>
                                <Suspense fallback={<ComponentLoader message="Loading team manager..." showProgress />}>
                                    <StaffManager currentUserId={user?.id} />
                                </Suspense>
                            </LazyLoadErrorBoundary>
                        ) : (
                            <div className="flex items-center justify-center py-16">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                                    <p className="text-gray-400">Initializing team management...</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Project Management View */}
                {activeView === 'projects' && isAuthenticated && (
                    <div className="mt-8">
                        {airtableError && (
                            <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
                                ⚠️ {airtableError}
                                <button
                                    onClick={initializeAirtableService}
                                    className="ml-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                                >
                                    Retry Connection
                                </button>
                            </div>
                        )}
                        {airtableInitialized ? (
                            <LazyLoadErrorBoundary>
                                <Suspense fallback={<ComponentLoader message="Loading project manager..." showProgress />}>
                                    <ProjectManager />
                                </Suspense>
                            </LazyLoadErrorBoundary>
                        ) : (
                            <div className="flex items-center justify-center py-16">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                                    <p className="text-gray-400">Initializing project management...</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Enhanced Campaign Management View */}
                {activeView === 'campaigns' && isAuthenticated && (
                    <div className="mt-8">
                        {airtableError && (
                            <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
                                ⚠️ {airtableError}
                                <button
                                    onClick={initializeAirtableService}
                                    className="ml-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                                >
                                    Retry Connection
                                </button>
                            </div>
                        )}
                        {airtableInitialized ? (
                            <LazyLoadErrorBoundary>
                                <Suspense fallback={<ComponentLoader message="Loading campaign manager..." showProgress />}>
                                    <CampaignManager
                                        onLoadCampaign={handleLoadCampaign}
                                        onUseTemplate={handleUseTemplate}
                                        currentCampaign={currentCampaign}
                                        onSaveCurrent={handleSaveCurrent}
                                        resultsExist={!!results}
                                        hasUnsavedResults={!!results && (!currentCampaign ||
                                            (currentCampaign && JSON.stringify(currentCampaign.result) !== JSON.stringify(results))
                                        )}
                                        currentCampaignData={results}
                                        onCampaignAssign={(campaignId, staffIds) => {
                                            console.log(`Campaign ${campaignId} assigned to:`, staffIds);
                                        }}
                                    />
                                </Suspense>
                            </LazyLoadErrorBoundary>
                        ) : (
                            <div className="flex items-center justify-center py-16">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                                    <p className="text-gray-400">Initializing campaign management...</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Results Display - only show in generator view */}
                {activeView === 'generator' && (
                    <ResultsDisplay
                        results={results}
                        isLoading={isLoading}
                        error={error}
                        companyName={advancedSettings.companyName}
                        defaultAspectRatio={advancedSettings.defaultAspectRatio}
                        defaultNegativePrompt={advancedSettings.defaultNegativePrompt}
                        defaultImageStyle={advancedSettings.defaultImageStyle}
                        defaultCreativityLevel={advancedSettings.defaultCreativityLevel}
                        onExportClick={() => setShowExportManager(true)}
                    />
                )}

                {/* Export Manager */}
                <LazyLoadErrorBoundary>
                    <Suspense fallback={<ComponentLoader message="Loading export manager..." showProgress />}>
                        <ExportManager
                            campaign={currentCampaign}
                            results={results}
                            isVisible={showExportManager}
                            onClose={() => setShowExportManager(false)}
                        />
                    </Suspense>
                </LazyLoadErrorBoundary>

                {/* Brand Kit Manager */}
                <LazyLoadErrorBoundary>
                    <Suspense fallback={<ComponentLoader message="Loading brand kit manager..." showProgress />}>
                        <BrandKitManager
                            isVisible={showBrandKitManager}
                            onClose={() => setShowBrandKitManager(false)}
                            onBrandKitUpdate={handleBrandKitUpdate}
                        />
                    </Suspense>
                </LazyLoadErrorBoundary>

                {/* CRM Manager - only show in generator view */}
                {activeView === 'generator' && (
                    <LazyLoadErrorBoundary>
                        <Suspense fallback={<ComponentLoader message="Loading CRM manager..." showProgress />}>
                            <CRMManager
                                isVisible={showCRMManager}
                                onClose={() => setShowCRMManager(false)}
                                onConnectionChange={() => {
                                    // Refresh CRM connection status when connections are modified
                                    const activeConnection = CRMIntegrationService.getActiveConnection();
                                    setCrmConnection(activeConnection);
                                    if (activeConnection) {
                                        setCrmSyncStatus('idle');
                                        setCrmSyncMessage(`Connected to ${activeConnection.provider}`);
                                        addCrmNotification('success', `CRM connection updated: ${activeConnection.provider}`);
                                    } else {
                                        setCrmSyncStatus('idle');
                                        setCrmSyncMessage('');
                                    }
                                }}
                            />
                        </Suspense>
                    </LazyLoadErrorBoundary>
                )}

                {/* Login Modal */}
                {showLogin && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 w-full max-w-md mx-4">
                            <h2 className="text-2xl font-bold text-white mb-6 text-center">
                                🔐 Team Login
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-slate-300 text-sm font-medium mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={loginCredentials.email}
                                        onChange={(e) => setLoginCredentials({...loginCredentials, email: e.target.value})}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
                                        placeholder="Enter your email"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-300 text-sm font-medium mb-2">Password</label>
                                    <input
                                        type="password"
                                        value={loginCredentials.password}
                                        onChange={(e) => setLoginCredentials({...loginCredentials, password: e.target.value})}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
                                        placeholder="Enter your password"
                                        onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                                    />
                                </div>

                                <div className="text-sm text-slate-400 bg-slate-700 p-3 rounded">
                                    <p className="font-medium mb-2">Demo Accounts:</p>
                                    <div className="space-y-1 text-xs">
                                        <p>• <strong>Admin:</strong> zenithfresh25@gmail.com (any password)</p>
                                        <p>• <strong>Manager:</strong> support@carsi.com.au (any password)</p>
                                        <p>• <strong>Creator:</strong> ranamuzamil1199@gmail.com (any password)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowLogin(false)}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLogin}
                                    disabled={!loginCredentials.email}
                                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-all"
                                >
                                    Login
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Airtable Status Indicator */}
                {isAuthenticated && (
                    <div className="fixed bottom-4 right-4 z-40">
                        <div className={`px-3 py-2 rounded-lg text-sm border flex items-center gap-2 ${
                            airtableInitialized
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : airtableError
                                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                    : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        }`}>
                            {airtableInitialized ? (
                                <>
                                    <span>✅</span>
                                    <span>Airtable Connected</span>
                                </>
                            ) : airtableError ? (
                                <>
                                    <span>❌</span>
                                    <span>Airtable Error</span>
                                </>
                            ) : (
                                <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-400"></div>
                                    <span>Connecting...</span>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;