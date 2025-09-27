import React from 'react';
import { AdvancedSettings } from '../types';
import SecureInput, { SecureURLInput } from './SecureInput';
import { ChevronDownIcon, TrashIcon } from './icons';
import { NATIONAL_LANGUAGES, TARGET_PLATFORMS } from '../constants';
import { isSEMrushAvailable } from '../services/semrushService';

interface AdvancedSettingsFormProps {
  settings: AdvancedSettings;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  onSettingChange: (field: keyof AdvancedSettings, value: string | number | boolean | string[] | { platform: string; url: string }[] | { url: string }[] | { primary: string; secondary: string }) => void;
  onValidationChange: (field: string, isValid: boolean, errors: string[]) => void;
  onUserInteraction: (action: string) => void;
  onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
  onAddSocialLink: () => void;
  onRemoveSocialLink: (index: number) => void;
  onSocialLinkChange: (index: number, field: 'platform' | 'url', value: string) => void;
  onAddCompetitor: () => void;
  onRemoveCompetitor: (index: number) => void;
  onCompetitorChange: (index: number, value: string) => void;
  onColorChange: (colorType: 'primary' | 'secondary', value: string) => void;
}

/**
 * Advanced Settings Form Component
 * Handles all advanced configuration options for campaign generation
 */
export const AdvancedSettingsForm: React.FC<AdvancedSettingsFormProps> = ({
  settings,
  showAdvanced,
  onToggleAdvanced,
  onSettingChange,
  onValidationChange,
  onUserInteraction,
  onLogoUpload,
  onRemoveLogo,
  onAddSocialLink,
  onRemoveSocialLink,
  onSocialLinkChange,
  onAddCompetitor,
  onRemoveCompetitor,
  onCompetitorChange,
  onColorChange
}) => {
  // Common CSS classes
  const formLabelClass = "text-sm font-semibold text-slate-300";
  const formInputClass = "w-full p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors text-sm";
  const formCheckboxClass = "h-4 w-4 rounded bg-slate-900 border-slate-500 text-cyan-600 focus:ring-cyan-500";

  return (
    <div>
      <button
        onClick={() => {
          onToggleAdvanced();
          if (!showAdvanced) {
            onUserInteraction('advanced-settings-opened');
          }
        }}
        className="flex items-center justify-between w-full text-left text-lg font-semibold text-slate-200"
        type="button"
      >
        Advanced Settings
        <ChevronDownIcon className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
      </button>

      {showAdvanced && (
        <div className="mt-4 p-4 bg-slate-900/70 border border-slate-700 rounded-lg space-y-6">
          {/* Branding Context */}
          <div>
            <h4 className={formLabelClass}>Branding Context</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <SecureInput
                value={settings.companyName}
                onChange={(value) => onSettingChange('companyName', value)}
                placeholder="Company Name"
                className={formInputClass}
                maxLength={200}
                onValidationChange={(isValid, errors) => onValidationChange('companyName', isValid, errors)}
                sanitizeOnBlur={true}
              />
              <SecureURLInput
                value={settings.companyWebsite}
                onChange={(value) => onSettingChange('companyWebsite', value)}
                placeholder="Company Website (for style analysis)"
                className={formInputClass}
                maxLength={500}
                onValidationChange={(isValid, errors) => onValidationChange('companyWebsite', isValid, errors)}
              />
              <div>
                <label htmlFor="primaryColor" className="block text-xs text-slate-400 mb-1">Primary Brand Color</label>
                <input
                  id="primaryColor"
                  type="color"
                  value={settings.brandColors.primary}
                  onChange={e => onColorChange('primary', e.target.value)}
                  className="w-full h-10 p-1 bg-slate-800 border border-slate-600 rounded-md cursor-pointer"
                />
              </div>
              <div>
                <label htmlFor="secondaryColor" className="block text-xs text-slate-400 mb-1">Secondary Brand Color</label>
                <input
                  id="secondaryColor"
                  type="color"
                  value={settings.brandColors.secondary}
                  onChange={e => onColorChange('secondary', e.target.value)}
                  className="w-full h-10 p-1 bg-slate-800 border border-slate-600 rounded-md cursor-pointer"
                />
              </div>
            </div>

            {/* Company Logo */}
            <div className="mt-4">
              <label className={formLabelClass}>Company Logo</label>
              {settings.companyLogo ? (
                <div className="mt-2 flex items-center gap-4">
                  <img
                    src={settings.companyLogo}
                    alt="Company Logo Preview"
                    className="h-16 w-16 object-contain rounded-md bg-slate-700 p-1 border border-slate-600"
                  />
                  <button
                    type="button"
                    onClick={onRemoveLogo}
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
                    onChange={onLogoUpload}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h4 className={formLabelClass}>Social Media Links</h4>
            {settings.socialMediaLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <SecureInput
                  value={link.platform}
                  onChange={(value) => onSocialLinkChange(index, 'platform', value)}
                  placeholder="Platform (e.g., Instagram)"
                  className={`${formInputClass} flex-1`}
                  maxLength={50}
                  onValidationChange={(isValid, errors) => onValidationChange(`socialPlatform_${index}`, isValid, errors)}
                />
                <SecureURLInput
                  value={link.url}
                  onChange={(value) => onSocialLinkChange(index, 'url', value)}
                  placeholder="URL"
                  className={`${formInputClass} flex-grow-[2]`}
                  maxLength={500}
                  onValidationChange={(isValid, errors) => onValidationChange(`socialUrl_${index}`, isValid, errors)}
                />
                <button
                  onClick={() => onRemoveSocialLink(index)}
                  className="p-2 text-slate-400 hover:text-red-400"
                  type="button"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
            <button
              onClick={onAddSocialLink}
              className="text-sm text-cyan-400 hover:text-cyan-300"
              type="button"
            >
              + Add Social Link
            </button>
          </div>

          {/* Content & SEO */}
          <div>
            <h4 className={formLabelClass}>Content & SEO</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <select
                value={settings.nationalLanguage}
                onChange={e => onSettingChange('nationalLanguage', e.target.value)}
                className={formInputClass}
              >
                {NATIONAL_LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
              </select>
              <div className="flex flex-col gap-2 justify-center">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.useGoogleEAT}
                    onChange={e => onSettingChange('useGoogleEAT', e.target.checked)}
                    className={formCheckboxClass}
                  />
                  Use Google E-E-A-T Guidelines
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.useHemingwayStyle}
                    onChange={e => onSettingChange('useHemingwayStyle', e.target.checked)}
                    className={formCheckboxClass}
                  />
                  Use Hemingway Writing Style
                </label>
              </div>
            </div>
          </div>

          {/* Strategic Directives */}
          <div>
            <h4 className={formLabelClass}>Strategic Directives</h4>
            <div className="flex flex-col gap-2 mt-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.generateBacklinks}
                  onChange={e => onSettingChange('generateBacklinks', e.target.checked)}
                  className={formCheckboxClass}
                />
                Generate Backlink Strategy
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.findTrendingTopics}
                  onChange={e => onSettingChange('findTrendingTopics', e.target.checked)}
                  className={formCheckboxClass}
                />
                Find Relevant Trending Topics
              </label>
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
            {settings.competitorWebsites.map((comp, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <SecureURLInput
                  value={comp.url}
                  onChange={(value) => onCompetitorChange(index, value)}
                  placeholder="https://competitor.com"
                  className={`${formInputClass} flex-1`}
                  maxLength={500}
                  onValidationChange={(isValid, errors) => onValidationChange(`competitorUrl_${index}`, isValid, errors)}
                />
                <button
                  onClick={() => onRemoveCompetitor(index)}
                  className="p-2 text-slate-400 hover:text-red-400"
                  type="button"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
            <button
              onClick={onAddCompetitor}
              className="text-sm text-cyan-400 hover:text-cyan-300"
              type="button"
            >
              + Add Competitor
            </button>
          </div>

          {/* Target Platforms */}
          <div>
            <h4 className={formLabelClass}>Target Platforms</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {TARGET_PLATFORMS.map(platform => (
                <label key={platform} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.targetPlatforms.includes(platform)}
                    onChange={e => {
                      const newPlatforms = e.target.checked
                        ? [...settings.targetPlatforms, platform]
                        : settings.targetPlatforms.filter(p => p !== platform);
                      onSettingChange('targetPlatforms', newPlatforms);
                    }}
                    className={formCheckboxClass}
                  />
                  {platform}
                </label>
              ))}
            </div>
          </div>

          {/* Content Quality */}
          <div>
            <h4 className={formLabelClass}>Content Quality</h4>
            <div className="flex flex-col gap-2 mt-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.insertWatermark}
                  onChange={e => onSettingChange('insertWatermark', e.target.checked)}
                  className={formCheckboxClass}
                />
                Insert AI Watermark
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.generateVerifiableText}
                  onChange={e => onSettingChange('generateVerifiableText', e.target.checked)}
                  className={formCheckboxClass}
                />
                Generate Verifiable Claims
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSettingsForm;