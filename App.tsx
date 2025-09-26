import React, { useState, useEffect } from 'react';
import { generateMarketingCampaign } from './services/geminiService';
import { CampaignResult, AdvancedSettings, SavedCampaign, CampaignTemplate } from './types';
import { ResultsDisplay } from './components/ResultsDisplay';
import { CampaignManager } from './components/CampaignManager';
import { ExportManager } from './components/ExportManager';
import { BrandKitManager } from './components/BrandKitManager';
import { LoadingSpinner, ChevronDownIcon, TrashIcon } from './components/icons';
import { INSPIRATION_PROMPTS, NATIONAL_LANGUAGES, TARGET_PLATFORMS, ARTISTIC_STYLES } from './constants';
import { isSEMrushAvailable } from './services/semrushService';
import { CampaignStorageService } from './services/campaignStorage';
import { BrandKitService, BrandKit } from './services/brandKitService';

const App: React.FC = () => {
    const [productDescription, setProductDescription] = useState<string>('');
    const [generateMedia, setGenerateMedia] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [results, setResults] = useState<CampaignResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

    // Campaign Management State
    const [currentCampaign, setCurrentCampaign] = useState<SavedCampaign | null>(null);
    const [showCampaignManager, setShowCampaignManager] = useState<boolean>(false);

    // Export Manager State
    const [showExportManager, setShowExportManager] = useState<boolean>(false);

    // Brand Kit Manager State
    const [showBrandKitManager, setShowBrandKitManager] = useState<boolean>(false);
    const [currentBrandKit, setCurrentBrandKit] = useState<BrandKit>(BrandKitService.getCurrentBrandKit());

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
                                📁 {showCampaignManager ? 'Hide' : 'Campaigns'}
                            </button>
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
                </header>

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

                {/* Campaign Manager */}
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
                        />
                    </div>
                )}

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
            </main>
        </div>
    );
};

export default App;