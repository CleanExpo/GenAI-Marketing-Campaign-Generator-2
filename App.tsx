import React, { useState, useCallback, ChangeEvent } from 'react';
import { generateMarketingCampaign } from './services/geminiService';
import { CampaignResult, AdvancedSettings, SocialMediaLink } from './types';
import { ResultsDisplay } from './components/ResultsDisplay';
import { INSPIRATION_PROMPTS, NATIONAL_LANGUAGES, TARGET_PLATFORMS } from './constants';
import { LoadingSpinner, ChevronDownIcon, TrashIcon } from './components/icons';

const initialAdvancedSettings: AdvancedSettings = {
  companyName: '',
  companyWebsite: '',
  brandColors: { primary: '#0891B2', secondary: '#64748B' },
  companyLogo: '',
  socialMediaLinks: [],
  semrushApiKey: '',
  insertWatermark: true,
  generateVerifiableText: true,
  nationalLanguage: 'American English',
  useGoogleEAT: true,
  useHemingwayStyle: true,
  generateBacklinks: true,
  findTrendingTopics: true,
  targetPlatforms: [],
}

const App: React.FC = () => {
  const [productDescription, setProductDescription] = useState<string>('');
  const [generateMedia, setGenerateMedia] = useState<boolean>(true);
  const [results, setResults] = useState<CampaignResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>(initialAdvancedSettings);

  const handleGenerateClick = useCallback(async () => {
    if (!productDescription.trim()) {
      setError("Please describe your product first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResults(null);
    try {
      const campaignResults = await generateMarketingCampaign(productDescription, generateMedia, advancedSettings);
      setResults(campaignResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please check the console and try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [productDescription, generateMedia, advancedSettings]);

  const handleAdvancedChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;
    setAdvancedSettings(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
  };

  const handleColorChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAdvancedSettings(prev => ({
        ...prev,
        brandColors: { ...prev.brandColors, [name]: value }
    }));
  };
  
  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            setAdvancedSettings(prev => ({ ...prev, companyLogo: loadEvent.target?.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSocialLinkChange = (id: number, field: 'platform' | 'url', value: string) => {
      setAdvancedSettings(prev => ({
          ...prev,
          socialMediaLinks: prev.socialMediaLinks.map(link => link.id === id ? { ...link, [field]: value } : link)
      }));
  };

  const addSocialLink = () => {
      setAdvancedSettings(prev => ({
          ...prev,
          socialMediaLinks: [...prev.socialMediaLinks, { id: Date.now(), platform: '', url: '' }]
      }));
  };

  const removeSocialLink = (id: number) => {
      setAdvancedSettings(prev => ({
          ...prev,
          socialMediaLinks: prev.socialMediaLinks.filter(link => link.id !== id)
      }));
  };

  const handlePlatformSelect = (platform: string) => {
    setAdvancedSettings(prev => {
        const newPlatforms = prev.targetPlatforms.includes(platform)
            ? prev.targetPlatforms.filter(p => p !== platform)
            : [...prev.targetPlatforms, platform];
        return { ...prev, targetPlatforms: newPlatforms };
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-10">
          <div className="flex justify-center items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-slate-800 border-2 border-cyan-400 flex items-center justify-center rounded-lg font-bold text-cyan-400 text-xl">AI</div>
              <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-cyan-400 to-teal-500 text-transparent bg-clip-text">
                  GenAI Marketing Campaign Generator
              </h1>
          </div>
          <p className="text-slate-400 mt-2 text-lg max-w-2xl mx-auto">
              Describe your product, and we'll generate a complete marketing strategy with visuals, copy, SEO keywords, and more.
          </p>
        </header>

        <div className="bg-slate-800/50 rounded-lg p-6 shadow-lg border border-slate-700 space-y-6">
          <div>
            <textarea
              id="productDescription"
              className="w-full h-32 p-4 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors font-sans text-base placeholder:text-slate-500"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              placeholder="e.g., A smart, eco-friendly water bottle that tracks your hydration..."
            />
          </div>

          <div>
              <p className="text-sm text-slate-400 mb-2">Need inspiration? Try an example:</p>
              <div className="flex flex-wrap gap-2">
                  {INSPIRATION_PROMPTS.map(prompt => (
                      <button key={prompt} onClick={() => setProductDescription(prompt)} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-full transition-colors">
                          {prompt}
                      </button>
                  ))}
              </div>
          </div>

          <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700">
             <div className="flex items-center justify-between cursor-pointer" onClick={() => setGenerateMedia(!generateMedia)}>
                <div>
                    <label htmlFor="generateMedia" className="font-medium text-slate-200 cursor-pointer">Generate Media Assets</label>
                    <p className="text-sm text-slate-400">Also generate images and videos. (This will take longer)</p>
                </div>
                <div className="relative">
                    <input type="checkbox" id="generateMedia" className="sr-only" checked={generateMedia} onChange={() => {}} />
                    <div className={`block w-14 h-8 rounded-full transition-colors ${generateMedia ? 'bg-cyan-600' : 'bg-slate-600'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${generateMedia ? 'transform translate-x-6' : ''}`}></div>
                </div>
            </div>
            
            <div className="border-t border-slate-700 mt-4 pt-4">
                 <div onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center justify-between cursor-pointer">
                    <h3 className="font-medium text-slate-200">Advanced Settings</h3>
                    <ChevronDownIcon className={showAdvanced ? 'transform rotate-180' : ''} />
                </div>

                {showAdvanced && (
                    <div className="mt-4 space-y-6 animate-fade-in">
                        {/* Company Branding */}
                        <div className="space-y-4 p-4 bg-slate-800/50 rounded-md border border-slate-600">
                            <h4 className="font-semibold text-cyan-400">Company Branding</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Company Name</label>
                                    <input type="text" name="companyName" value={advancedSettings.companyName} onChange={handleAdvancedChange} className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Company Website</label>
                                    <input type="url" name="companyWebsite" value={advancedSettings.companyWebsite} onChange={handleAdvancedChange} className="input-field" placeholder="https://..."/>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Primary Color</label>
                                        <input type="color" name="primary" value={advancedSettings.brandColors.primary} onChange={handleColorChange} className="h-10 w-16 rounded-md" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Secondary Color</label>
                                        <input type="color" name="secondary" value={advancedSettings.brandColors.secondary} onChange={handleColorChange} className="h-10 w-16 rounded-md" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Company Logo</label>
                                    <input type="file" onChange={handleLogoUpload} accept="image/*" className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-900 file:text-cyan-300 hover:file:bg-cyan-800"/>
                                </div>
                            </div>
                            <div>
                               <label className="block text-sm font-medium text-slate-300 mb-2">Social Media Links</label>
                               <div className="space-y-2">
                                   {advancedSettings.socialMediaLinks.map(link => (
                                       <div key={link.id} className="flex items-center gap-2">
                                           <input type="text" placeholder="Platform (e.g., Twitter)" value={link.platform} onChange={e => handleSocialLinkChange(link.id, 'platform', e.target.value)} className="input-field flex-1" />
                                           <input type="url" placeholder="URL" value={link.url} onChange={e => handleSocialLinkChange(link.id, 'url', e.target.value)} className="input-field flex-2" />
                                           <button onClick={() => removeSocialLink(link.id)}><TrashIcon className="h-5 w-5 text-slate-400 hover:text-red-400" /></button>
                                       </div>
                                   ))}
                               </div>
                               <button onClick={addSocialLink} className="text-sm text-cyan-400 hover:text-cyan-300 mt-2">+ Add Link</button>
                            </div>
                        </div>

                         {/* Content & SEO */}
                        <div className="space-y-4 p-4 bg-slate-800/50 rounded-md border border-slate-600">
                           <h4 className="font-semibold text-cyan-400">Content & SEO</h4>
                           <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">National Language</label>
                                <select name="nationalLanguage" value={advancedSettings.nationalLanguage} onChange={handleAdvancedChange} className="input-field">
                                    {NATIONAL_LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                                </select>
                           </div>
                           <div className="flex items-center gap-4 flex-wrap">
                                <label className="flex items-center gap-2"><input type="checkbox" name="useGoogleEAT" checked={advancedSettings.useGoogleEAT} onChange={handleAdvancedChange} className="checkbox-field" /> Use Google E-E-A-T</label>
                                <label className="flex items-center gap-2"><input type="checkbox" name="useHemingwayStyle" checked={advancedSettings.useHemingwayStyle} onChange={handleAdvancedChange} className="checkbox-field" /> Use Hemingway Style</label>
                           </div>
                        </div>

                        {/* Strategic Directives */}
                        <div className="space-y-4 p-4 bg-slate-800/50 rounded-md border border-slate-600">
                           <h4 className="font-semibold text-cyan-400">Strategic Directives</h4>
                           <div className="flex items-center gap-4 flex-wrap">
                                <label className="flex items-center gap-2"><input type="checkbox" name="generateBacklinks" checked={advancedSettings.generateBacklinks} onChange={handleAdvancedChange} className="checkbox-field" /> Generate Backlink Strategy</label>
                                <label className="flex items-center gap-2"><input type="checkbox" name="findTrendingTopics" checked={advancedSettings.findTrendingTopics} onChange={handleAdvancedChange} className="checkbox-field" /> Find Trending Topics</label>
                           </div>
                        </div>

                         {/* Advanced Media Generation */}
                         <div className="space-y-4 p-4 bg-slate-800/50 rounded-md border border-slate-600">
                           <h4 className="font-semibold text-cyan-400">Advanced Media Generation</h4>
                           <div className="flex items-center gap-4 flex-wrap">
                                <label className="flex items-center gap-2"><input type="checkbox" name="insertWatermark" checked={advancedSettings.insertWatermark} onChange={handleAdvancedChange} className="checkbox-field" /> Compose images for watermark</label>
                                <label className="flex items-center gap-2"><input type="checkbox" name="generateVerifiableText" checked={advancedSettings.generateVerifiableText} onChange={handleAdvancedChange} className="checkbox-field" /> Generate images with verifiable text</label>
                           </div>
                        </div>

                        {/* Platform Targeting */}
                        <div className="p-4 bg-slate-800/50 rounded-md border border-slate-600">
                           <h4 className="font-semibold text-cyan-400 mb-2">Target Platforms</h4>
                           <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {TARGET_PLATFORMS.map(platform => (
                                    <button key={platform} onClick={() => handlePlatformSelect(platform)} className={`text-sm p-2 rounded-md transition-colors ${advancedSettings.targetPlatforms.includes(platform) ? 'bg-cyan-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>
                                        {platform}
                                    </button>
                                ))}
                           </div>
                        </div>
                    </div>
                )}
            </div>
          </div>
          
          {error && <p className="text-red-400 text-center -mb-2">{error}</p>}

          <div className="mt-4 text-center">
            <button
              onClick={handleGenerateClick}
              disabled={isLoading}
              className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 disabled:bg-slate-600 disabled:from-slate-600 disabled:cursor-not-allowed text-white font-bold py-4 px-10 rounded-lg shadow-lg transition-all transform hover:scale-105 w-full md:w-auto flex items-center justify-center text-lg animate-gradient-x"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  <span className="ml-3">Generating...</span>
                </>
              ) : (
                'Generate Campaign'
              )}
            </button>
          </div>
        </div>

        <ResultsDisplay results={results} isLoading={isLoading} error={error} companyName={advancedSettings.companyName} />
      </main>
      <footer className="text-center py-6 text-slate-500 text-sm">
        <p>Powered by Google Gemini. Campaign Generator v1.0</p>
      </footer>
      <style>{`
        .input-field {
            width: 100%;
            background-color: #1E293B;
            border: 1px solid #475569;
            border-radius: 0.375rem;
            padding: 0.5rem 0.75rem;
            color: #E2E8F0;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-field:focus {
            outline: none;
            border-color: #0891B2;
            box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.5);
        }
        .checkbox-field {
            height: 1rem;
            width: 1rem;
            border-radius: 0.25rem;
            background-color: #334155;
            border-color: #475569;
            color: #0891B2;
            cursor: pointer;
        }
        .checkbox-field:checked {
            background-color: #0891B2;
        }
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
