import React, { useState, useEffect } from 'react';
import { generateMarketingCampaign } from './services/geminiService';
import { CampaignResult, AdvancedSettings, SavedCampaign, CampaignTemplate } from './types';
import { ResultsDisplay } from './components/ResultsDisplay';
import { CampaignManager } from './components/CampaignManager';
import { ExportManager } from './components/ExportManager';
import { BrandKitManager } from './components/BrandKitManager';
import { CRMManager } from './components/CRMManager';
import { LoadingSpinner, ChevronDownIcon, TrashIcon } from './components/icons';
import { INSPIRATION_PROMPTS, NATIONAL_LANGUAGES, TARGET_PLATFORMS, ARTISTIC_STYLES } from './constants';
import { isSEMrushAvailable } from './services/semrushService';
import { CampaignStorageService } from './services/campaignStorage';
import { BrandKitService, BrandKit } from './services/brandKitService';
import { CRMIntegrationService, CRMSyncResult, CRMConnection } from './services/crmIntegration';

// New comprehensive Airtable integration imports
import { useAuth, authService } from './services/authService';
import { airtableService, initializeAirtable } from './services/airtableService';
import StaffManager from './components/StaffManager';
import ProjectManager from './components/ProjectManager';

const App: React.FC = () => {
    // Authentication state
    const { user, isAuthenticated, login, logout, hasPermission } = useAuth();
    const [showLogin, setShowLogin] = useState<boolean>(false);
    const [loginCredentials, setLoginCredentials] = useState({ email: '', password: '' });

    // Core app state
    const [productDescription, setProductDescription] = useState<string>('');
    const [generateMedia, setGenerateMedia] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [results, setResults] = useState<CampaignResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

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
        } catch (error: any) {
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
        setIsLoading(true);
        setError(null);
        setResults(null);
        try {
            const campaignResults = await generateMarketingCampaign(productDescription, generateMedia, advancedSettings);
            setResults(campaignResults);

            // Auto-sync with CRM if user has an active connection and current campaign exists
            if (crmConnection && currentCampaign) {
                const updatedCampaign = {
                    ...currentCampaign,
                    result: campaignResults,
                    updatedAt: new Date()
                };
                await performCrmSync(updatedCampaign);
            }
        } catch (err: any) {
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
        } catch (err: any) {
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
        } catch (err: any) {
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

    const handleSettingChange = (field: keyof AdvancedSettings, value: any) => {
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


    return (
        <div className="bg-slate-900 text-white min-h-screen font-sans">
            <main className="max-w-4xl mx-auto p-4 md:p-8">
                <header className="text-center mb-8">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1"></div>
                        <div className="flex-1">
                            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                                AI Marketing Campaign Generator
                            </h1>
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
                                <>
                                    <button
                                        onClick={() => setActiveView('generator')}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                            activeView === 'generator'
                                                ? 'bg-cyan-600 text-white'
                                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                        }`}
                                        title="AI Campaign Generator"
                                    >
                                        🚀 Generator
                                    </button>
                                    <button
                                        onClick={() => setActiveView('campaigns')}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                            activeView === 'campaigns'
                                                ? 'bg-cyan-600 text-white'
                                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                        }`}
                                        title="Campaign & Project Management"
                                    >
                                        📁 Campaigns
                                    </button>
                                    <button
                                        onClick={() => setActiveView('staff')}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                            activeView === 'staff'
                                                ? 'bg-cyan-600 text-white'
                                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                        }`}
                                        title="Team Management & Accountability"
                                    >
                                        👥 Team
                                    </button>
                                    <button
                                        onClick={() => setActiveView('projects')}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                            activeView === 'projects'
                                                ? 'bg-cyan-600 text-white'
                                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                        }`}
                                        title="Project Management & Tracking"
                                    >
                                        📊 Projects
                                    </button>
                                </>
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
                    <div className="bg-slate-800/50 rounded-lg p-6 shadow-lg border border-slate-700">
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="productDescription" className="block text-lg font-medium text-slate-300 mb-2">
                                    Describe your product, service, or idea
                            </label>
                            <textarea
                                id="productDescription"
                                value={productDescription}
                                onChange={(e) => setProductDescription(e.target.value)}
                                className="w-full p-3 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors text-base"
                                placeholder="e.g., A subscription box for artisanal coffee from around the world."
                                rows={4}
                            />
                            <button onClick={handleInspirationClick} className="text-sm text-cyan-400 hover:text-cyan-300 mt-2">
                                ✨ Get Inspired
                            </button>
                        </div>

                        <div className="flex items-center justify-between bg-slate-700/50 p-3 rounded-md">
                           <label htmlFor="generateMedia" className="font-medium text-slate-200 flex-1 cursor-pointer">
                                Generate Media Assets (Image Prompts & Video Concepts)
                            </label>
                             <input
                                type="checkbox"
                                name="generateMedia"
                                id="generateMedia"
                                checked={generateMedia}
                                onChange={(e) => setGenerateMedia(e.target.checked)}
                                className="h-5 w-5 rounded bg-slate-900 border-slate-500 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                            />
                        </div>

                        {/* Advanced Settings */}
                        <div>
                            <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center justify-between w-full text-left text-lg font-semibold text-slate-200">
                                Advanced Settings
                                <ChevronDownIcon className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                            </button>
                            {showAdvanced && (
                                <div className="mt-4 p-4 bg-slate-900/70 border border-slate-700 rounded-lg space-y-6">
                                    {/* Branding Context */}
                                    <div>
                                        <h4 className={formLabelClass}>Branding Context</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                            <input type="text" placeholder="Company Name" value={advancedSettings.companyName} onChange={e => handleSettingChange('companyName', e.target.value)} className={formInputClass} />
                                            <input type="url" placeholder="Company Website (for style analysis)" value={advancedSettings.companyWebsite} onChange={e => handleSettingChange('companyWebsite', e.target.value)} className={formInputClass} />
                                            <div>
                                                <label htmlFor="primaryColor" className="block text-xs text-slate-400 mb-1">Primary Brand Color</label>
                                                <input
                                                    id="primaryColor"
                                                    type="color"
                                                    value={advancedSettings.brandColors.primary}
                                                    onChange={e => handleColorChange('primary', e.target.value)}
                                                    className="w-full h-10 p-1 bg-slate-800 border border-slate-600 rounded-md cursor-pointer"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="secondaryColor" className="block text-xs text-slate-400 mb-1">Secondary Brand Color</label>
                                                <input
                                                    id="secondaryColor"
                                                    type="color"
                                                    value={advancedSettings.brandColors.secondary}
                                                    onChange={e => handleColorChange('secondary', e.target.value)}
                                                    className="w-full h-10 p-1 bg-slate-800 border border-slate-600 rounded-md cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <label className={formLabelClass}>Company Logo</label>
                                            {advancedSettings.companyLogo ? (
                                                <div className="mt-2 flex items-center gap-4">
                                                    <img src={advancedSettings.companyLogo} alt="Company Logo Preview" className="h-16 w-16 object-contain rounded-md bg-slate-700 p-1 border border-slate-600" />
                                                    <button
                                                        type="button"
                                                        onClick={removeLogo}
                                                        className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
                                                    >
                                                        <TrashIcon className="h-4 w-4" /> Remove
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="mt-2">
                                                    <label htmlFor="logo-upload" className="cursor-pointer bg-slate-700 hover:bg-slate-600 text-cyan-300 text-sm font-medium px-4 py-2 rounded-md transition-colors">
                                                        Upload Image
                                                    </label>
                                                    <input
                                                        id="logo-upload"
                                                        type="file"
                                                        accept="image/png, image/jpeg, image/svg+xml, image/webp"
                                                        className="sr-only"
                                                        onChange={handleLogoUpload}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Social Media */}
                                    <div>
                                        <h4 className={formLabelClass}>Social Media Links</h4>
                                        {advancedSettings.socialMediaLinks.map((link, index) => (
                                            <div key={index} className="flex items-center gap-2 mb-2">
                                                <input type="text" placeholder="Platform (e.g., Instagram)" value={link.platform} onChange={e => handleSocialLinkChange(index, 'platform', e.target.value)} className={`${formInputClass} flex-1`} />
                                                <input type="url" placeholder="URL" value={link.url} onChange={e => handleSocialLinkChange(index, 'url', e.target.value)} className={`${formInputClass} flex-grow-[2]`} />
                                                <button onClick={() => removeSocialLink(index)} className="p-2 text-slate-400 hover:text-red-400"><TrashIcon className="h-5 w-5" /></button>
                                            </div>
                                        ))}
                                        <button onClick={addSocialLink} className="text-sm text-cyan-400 hover:text-cyan-300">+ Add Social Link</button>
                                    </div>
                                    
                                    {/* Content & SEO */}
                                    <div>
                                        <h4 className={formLabelClass}>Content & SEO</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                            <select value={advancedSettings.nationalLanguage} onChange={e => handleSettingChange('nationalLanguage', e.target.value)} className={formInputClass}>
                                                {NATIONAL_LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                                            </select>
                                            <div className="flex flex-col gap-2 justify-center">
                                                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={advancedSettings.useGoogleEAT} onChange={e => handleSettingChange('useGoogleEAT', e.target.checked)} className={formCheckboxClass} /> Use Google E-E-A-T Guidelines</label>
                                                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={advancedSettings.useHemingwayStyle} onChange={e => handleSettingChange('useHemingwayStyle', e.target.checked)} className={formCheckboxClass} /> Use Hemingway Writing Style</label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Strategic Directives */}
                                     <div>
                                        <h4 className={formLabelClass}>Strategic Directives</h4>
                                        <div className="flex flex-col gap-2 mt-2">
                                            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={advancedSettings.generateBacklinks} onChange={e => handleSettingChange('generateBacklinks', e.target.checked)} className={formCheckboxClass} /> Generate Backlink Strategy</label>
                                            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={advancedSettings.findTrendingTopics} onChange={e => handleSettingChange('findTrendingTopics', e.target.checked)} className={formCheckboxClass} /> Find Relevant Trending Topics</label>
                                        </div>
                                    </div>

                                    {/* Competitor Analysis */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className={formLabelClass}>Competitor Websites</h4>
                                            {isSEMrushAvailable() && (
                                                <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded border border-green-500/30">
                                                    ✓ SEMrush Enhanced
                                                </span>
                                            )}
                                        </div>
                                         {advancedSettings.competitorWebsites.map((comp, index) => (
                                            <div key={index} className="flex items-center gap-2 mb-2">
                                                <input type="url" placeholder="https://competitor.com" value={comp.url} onChange={e => handleCompetitorChange(index, e.target.value)} className={`${formInputClass} flex-1`} />
                                                <button onClick={() => removeCompetitor(index)} className="p-2 text-slate-400 hover:text-red-400"><TrashIcon className="h-5 w-5" /></button>
                                            </div>
                                        ))}
                                        <button onClick={addCompetitor} className="text-sm text-cyan-400 hover:text-cyan-300">+ Add Competitor</button>
                                    </div>
                                    
                                    {/* Platform Targeting */}
                                    <div>
                                        <h4 className={formLabelClass}>Target Platforms</h4>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {TARGET_PLATFORMS.map(platform => (
                                                <label key={platform} className={`${formChipClass} ${advancedSettings.targetPlatforms.includes(platform) ? formChipSelectedClass : formChipUnselectedClass}`}>
                                                    <input type="checkbox" checked={advancedSettings.targetPlatforms.includes(platform)} onChange={() => handlePlatformToggle(platform)} className="sr-only" />
                                                    {platform}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Media Generation */}
                                    {generateMedia && (
                                        <div>
                                            <h4 className={formLabelClass}>Media Generation</h4>
                                            <div className="flex flex-col gap-2 mt-2">
                                                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={advancedSettings.insertWatermark} onChange={e => handleSettingChange('insertWatermark', e.target.checked)} className={formCheckboxClass} /> Leave space for watermark in image prompts</label>
                                                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={advancedSettings.generateVerifiableText} onChange={e => handleSettingChange('generateVerifiableText', e.target.checked)} className={formCheckboxClass} /> Prioritize legible text in image prompts</label>
                                            </div>
                                            <div className="mt-4 p-3 bg-slate-800/50 border border-slate-700 rounded-md">
                                                <h5 className="text-xs font-semibold text-slate-400 mb-2">Image Generation Defaults</h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className={formLabelClass}>Aspect Ratio</label>
                                                        <select
                                                            value={advancedSettings.defaultAspectRatio}
                                                            onChange={(e) => handleSettingChange('defaultAspectRatio', e.target.value)}
                                                            className={formInputClass}
                                                        >
                                                            <option value="1:1">Square (1:1)</option>
                                                            <option value="16:9">Widescreen (16:9)</option>
                                                            <option value="9:16">Story (9:16)</option>
                                                            <option value="4:3">Landscape (4:3)</option>
                                                            <option value="3:4">Portrait (3:4)</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className={formLabelClass}>Artistic Style</label>
                                                        <select
                                                            value={advancedSettings.defaultImageStyle}
                                                            onChange={(e) => handleSettingChange('defaultImageStyle', e.target.value)}
                                                            className={formInputClass}
                                                        >
                                                            {ARTISTIC_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className={formLabelClass}>Negative Prompt</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g., text, blurry, watermark"
                                                            value={advancedSettings.defaultNegativePrompt}
                                                            onChange={(e) => handleSettingChange('defaultNegativePrompt', e.target.value)}
                                                            className={formInputClass}
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label htmlFor="default-creativity" className={formLabelClass}>
                                                            Creativity Level: <span className="font-bold text-cyan-400">{advancedSettings.defaultCreativityLevel}</span>
                                                        </label>
                                                        <input
                                                            id="default-creativity"
                                                            type="range"
                                                            min="1"
                                                            max="10"
                                                            value={advancedSettings.defaultCreativityLevel}
                                                            onChange={(e) => handleSettingChange('defaultCreativityLevel', Number(e.target.value))}
                                                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !productDescription.trim()}
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
                </div>
                )}

                {/* Dynamic Content Based on Active View */}
                {activeView === 'generator' && (
                    <>
                        {/* Campaign Manager - Legacy for backward compatibility */}
                        {showCampaignManager && (
                            <div className="mt-8">
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
                            <StaffManager currentUserId={user?.id} />
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
                            <ProjectManager />
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
                <ExportManager
                    campaign={currentCampaign}
                    results={results}
                    isVisible={showExportManager}
                    onClose={() => setShowExportManager(false)}
                />

                {/* Brand Kit Manager */}
                <BrandKitManager
                    isVisible={showBrandKitManager}
                    onClose={() => setShowBrandKitManager(false)}
                    onBrandKitUpdate={handleBrandKitUpdate}
                />

                {/* CRM Manager - only show in generator view */}
                {activeView === 'generator' && (
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