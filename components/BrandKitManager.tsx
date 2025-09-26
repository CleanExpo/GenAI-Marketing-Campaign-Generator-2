// components/BrandKitManager.tsx

import React, { useState, useEffect } from 'react';
import { BrandKitService, BrandKit, BrandAssets, BrandGuidelines, BrandTemplate } from '../services/brandKitService';

interface BrandKitManagerProps {
  isVisible: boolean;
  onClose: () => void;
  onBrandKitUpdate?: (brandKit: BrandKit) => void;
}

export const BrandKitManager: React.FC<BrandKitManagerProps> = ({
  isVisible,
  onClose,
  onBrandKitUpdate
}) => {
  const [brandKit, setBrandKit] = useState<BrandKit>(BrandKitService.getCurrentBrandKit());
  const [activeTab, setActiveTab] = useState<'assets' | 'guidelines' | 'templates' | 'export'>('assets');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BrandTemplate['category'] | 'all'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<BrandTemplate | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setBrandKit(BrandKitService.getCurrentBrandKit());
      setUnsavedChanges(false);
    }
  }, [isVisible]);

  const handleSave = () => {
    const updatedKit = BrandKitService.saveBrandKit(brandKit);
    setBrandKit(updatedKit);
    setUnsavedChanges(false);
    onBrandKitUpdate?.(updatedKit);

    // Apply CSS variables immediately
    const cssVars = BrandKitService.generateCSSVariables(updatedKit);
    const styleElement = document.getElementById('brand-kit-styles') || document.createElement('style');
    styleElement.id = 'brand-kit-styles';
    styleElement.textContent = cssVars;
    document.head.appendChild(styleElement);
  };

  const handleReset = () => {
    if (confirm('Reset to default ZENITH brand kit? This will lose all customizations.')) {
      const defaultKit = BrandKitService.resetToDefault();
      setBrandKit(defaultKit);
      setUnsavedChanges(false);
      onBrandKitUpdate?.(defaultKit);
    }
  };

  const updateAssets = (updates: Partial<BrandAssets>) => {
    setBrandKit(prev => ({
      ...prev,
      assets: { ...prev.assets, ...updates }
    }));
    setUnsavedChanges(true);
  };

  const updateGuidelines = (updates: Partial<BrandGuidelines>) => {
    setBrandKit(prev => ({
      ...prev,
      guidelines: { ...prev.guidelines, ...updates }
    }));
    setUnsavedChanges(true);
  };

  const handleColorChange = (path: string, value: string) => {
    const keys = path.split('.');
    setBrandKit(prev => {
      const newKit = { ...prev };
      let target = newKit.assets.colors as any;

      for (let i = 0; i < keys.length - 1; i++) {
        target = target[keys[i]];
      }
      target[keys[keys.length - 1]] = value;

      return newKit;
    });
    setUnsavedChanges(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateAssets({
          logo: {
            ...brandKit.assets.logo,
            primary: reader.result as string
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-4xl mx-4 h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-white">ZENITH Brand Kit Manager</h2>
            <p className="text-gray-400 text-sm mt-1">Customize your brand identity and maintain consistency</p>
          </div>
          <div className="flex items-center gap-3">
            {unsavedChanges && (
              <span className="text-yellow-400 text-sm">● Unsaved changes</span>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700">
          {[
            { id: 'assets', label: '🎨 Assets', description: 'Colors, logos, fonts' },
            { id: 'guidelines', label: '📋 Guidelines', description: 'Voice, style, usage' },
            { id: 'templates', label: '📄 Templates', description: 'Pre-built components' },
            { id: 'export', label: '📤 Export/Import', description: 'Backup and sharing' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-left transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <div className="font-medium">{tab.label}</div>
              <div className="text-xs opacity-75">{tab.description}</div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'assets' && (
            <div className="space-y-6">
              {/* Logo Section */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-white font-medium mb-4">Logo & Branding</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Primary Logo</label>
                    <div className="border border-gray-600 rounded-lg p-4 bg-gray-800">
                      {brandKit.assets.logo.primary ? (
                        <img
                          src={brandKit.assets.logo.primary}
                          alt="Brand Logo"
                          className="max-h-16 mx-auto"
                        />
                      ) : (
                        <div className="text-gray-400 text-center py-4">No logo uploaded</div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="mt-2 block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-cyan-600 file:text-white hover:file:bg-cyan-700"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Brand Name</label>
                    <input
                      type="text"
                      value={brandKit.name}
                      onChange={(e) => setBrandKit(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Colors Section */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-white font-medium mb-4">Brand Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Primary</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandKit.assets.colors.primary}
                        onChange={(e) => handleColorChange('primary', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-600"
                      />
                      <input
                        type="text"
                        value={brandKit.assets.colors.primary}
                        onChange={(e) => handleColorChange('primary', e.target.value)}
                        className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Secondary</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandKit.assets.colors.secondary}
                        onChange={(e) => handleColorChange('secondary', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-600"
                      />
                      <input
                        type="text"
                        value={brandKit.assets.colors.secondary}
                        onChange={(e) => handleColorChange('secondary', e.target.value)}
                        className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Text Primary</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandKit.assets.colors.text.primary}
                        onChange={(e) => handleColorChange('text.primary', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-600"
                      />
                      <input
                        type="text"
                        value={brandKit.assets.colors.text.primary}
                        onChange={(e) => handleColorChange('text.primary', e.target.value)}
                        className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Text Secondary</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandKit.assets.colors.text.secondary}
                        onChange={(e) => handleColorChange('text.secondary', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-600"
                      />
                      <input
                        type="text"
                        value={brandKit.assets.colors.text.secondary}
                        onChange={(e) => handleColorChange('text.secondary', e.target.value)}
                        className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Typography Section */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-white font-medium mb-4">Typography</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Heading Font</label>
                    <select
                      value={brandKit.assets.typography.headings.family}
                      onChange={(e) => updateAssets({
                        typography: {
                          ...brandKit.assets.typography,
                          headings: {
                            ...brandKit.assets.typography.headings,
                            family: e.target.value
                          }
                        }
                      })}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Arial">Arial</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Times New Roman">Times New Roman</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Body Font</label>
                    <select
                      value={brandKit.assets.typography.body.family}
                      onChange={(e) => updateAssets({
                        typography: {
                          ...brandKit.assets.typography,
                          body: {
                            ...brandKit.assets.typography.body,
                            family: e.target.value
                          }
                        }
                      })}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Arial">Arial</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Times New Roman">Times New Roman</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guidelines' && (
            <div className="space-y-6">
              {/* Voice & Tone */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-white font-medium mb-4">Voice & Tone</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Brand Tone</label>
                    <select
                      value={brandKit.guidelines.voice.tone}
                      onChange={(e) => updateGuidelines({
                        voice: {
                          ...brandKit.guidelines.voice,
                          tone: e.target.value as any
                        }
                      })}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly</option>
                      <option value="authoritative">Authoritative</option>
                      <option value="playful">Playful</option>
                      <option value="technical">Technical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Visual Style</label>
                    <select
                      value={brandKit.guidelines.visual.style}
                      onChange={(e) => updateGuidelines({
                        visual: {
                          ...brandKit.guidelines.visual,
                          style: e.target.value as any
                        }
                      })}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="modern">Modern</option>
                      <option value="classic">Classic</option>
                      <option value="minimal">Minimal</option>
                      <option value="bold">Bold</option>
                      <option value="organic">Organic</option>
                      <option value="industrial">Industrial</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Messaging */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-white font-medium mb-4">Brand Messaging</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Tagline</label>
                    <input
                      type="text"
                      value={brandKit.guidelines.messaging.tagline || ''}
                      onChange={(e) => updateGuidelines({
                        messaging: {
                          ...brandKit.guidelines.messaging,
                          tagline: e.target.value
                        }
                      })}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      placeholder="Your brand tagline"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Value Proposition</label>
                    <textarea
                      value={brandKit.guidelines.messaging.value_proposition}
                      onChange={(e) => updateGuidelines({
                        messaging: {
                          ...brandKit.guidelines.messaging,
                          value_proposition: e.target.value
                        }
                      })}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      rows={3}
                      placeholder="What value does your brand provide?"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-6">
              {/* Template Categories */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600'
                  }`}
                >
                  All Templates ({brandKit.templates.length})
                </button>
                {BrandKitService.getTemplateCategoriesWithCounts().map(category => (
                  <button
                    key={category.category}
                    onClick={() => setSelectedCategory(category.category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category.category
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600'
                    }`}
                  >
                    {category.icon} {category.name} ({category.count})
                  </button>
                ))}
              </div>

              {/* Templates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(selectedCategory === 'all'
                  ? brandKit.templates
                  : brandKit.templates.filter(t => t.category === selectedCategory)
                ).map(template => (
                  <div key={template.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-cyan-500 transition-colors">
                    {/* Template Preview */}
                    <div className="aspect-video bg-gray-800 rounded-md mb-4 relative overflow-hidden">
                      <div
                        className="w-full h-full flex items-center justify-center text-white text-xs"
                        style={{
                          ...template.component_overrides,
                          fontSize: '10px',
                          transform: 'scale(0.4)',
                          transformOrigin: 'center'
                        }}
                      >
                        <div className="bg-white/10 backdrop-blur-sm rounded p-2">
                          <div className="font-bold">{template.name}</div>
                          <div className="text-xs opacity-75 mt-1">{template.description}</div>
                        </div>
                      </div>

                      {/* Category Badge */}
                      <div className="absolute top-2 right-2">
                        <span className="bg-gray-900/80 text-white text-xs px-2 py-1 rounded">
                          {template.category.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Template Info */}
                    <div className="mb-4">
                      <h4 className="text-white font-medium mb-1">{template.name}</h4>
                      <p className="text-gray-400 text-sm">{template.description}</p>
                    </div>

                    {/* Template Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowTemplateEditor(true);
                        }}
                        className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => {
                          BrandKitService.duplicateTemplate(template.id);
                          setBrandKit(BrandKitService.getCurrentBrandKit());
                          setUnsavedChanges(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => {
                          BrandKitService.applyBrandColorsToTemplate(template.id);
                          setBrandKit(BrandKitService.getCurrentBrandKit());
                          setUnsavedChanges(true);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                      >
                        🎨
                      </button>
                      {template.id.startsWith('custom_') && (
                        <button
                          onClick={() => {
                            if (confirm('Delete this custom template?')) {
                              BrandKitService.deleteTemplate(template.id);
                              setBrandKit(BrandKitService.getCurrentBrandKit());
                              setUnsavedChanges(true);
                            }
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                        >
                          🗑️
                        </button>
                      )}
                    </div>

                    {/* CSS Variables Preview */}
                    <div className="mt-4 p-3 bg-gray-800 rounded text-xs">
                      <div className="text-gray-400 mb-2">CSS Variables:</div>
                      <div className="space-y-1">
                        {Object.entries(template.css_variables).slice(0, 3).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-cyan-400">{key}:</span>
                            <span className="text-gray-300">{value}</span>
                          </div>
                        ))}
                        {Object.keys(template.css_variables).length > 3 && (
                          <div className="text-gray-500">+{Object.keys(template.css_variables).length - 3} more...</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Custom Template */}
              <div className="bg-gray-700 rounded-lg p-6 border border-gray-600 border-dashed text-center">
                <div className="text-4xl mb-4">➕</div>
                <h3 className="text-white font-medium mb-2">Create Custom Template</h3>
                <p className="text-gray-400 mb-4">Design your own branded template</p>
                <button
                  onClick={() => {
                    const newTemplate: Omit<BrandTemplate, 'id'> = {
                      name: 'Custom Template',
                      category: 'web',
                      description: 'A custom template created by you',
                      css_variables: {
                        '--custom-bg': brandKit.assets.colors.primary,
                        '--custom-text': brandKit.assets.colors.text.primary
                      },
                      component_overrides: {
                        backgroundColor: 'var(--custom-bg)',
                        color: 'var(--custom-text)',
                        padding: '2rem'
                      }
                    };
                    BrandKitService.addTemplate(newTemplate);
                    setBrandKit(BrandKitService.getCurrentBrandKit());
                    setUnsavedChanges(true);
                  }}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Create Template
                </button>
              </div>

              {/* Template Usage Guide */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="text-blue-400 font-medium mb-2">💡 Template Usage Tips</h4>
                <ul className="text-blue-300 text-sm space-y-1">
                  <li>• <strong>Edit:</strong> Customize colors, styles and properties</li>
                  <li>• <strong>Duplicate:</strong> Create variations of existing templates</li>
                  <li>• <strong>Apply Colors:</strong> Update template with current brand colors</li>
                  <li>• <strong>Categories:</strong> Templates are organized by use case</li>
                  <li>• <strong>CSS Export:</strong> Copy styles to use in your projects</li>
                </ul>
              </div>
            </div>
          )}

          {/* Template Editor Modal */}
          {showTemplateEditor && selectedTemplate && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-white">Edit Template: {selectedTemplate.name}</h3>
                    <button
                      onClick={() => {
                        setShowTemplateEditor(false);
                        setSelectedTemplate(null);
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Template Basic Info */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Template Name</label>
                      <input
                        type="text"
                        value={selectedTemplate.name}
                        onChange={(e) => setSelectedTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Description</label>
                      <textarea
                        value={selectedTemplate.description}
                        onChange={(e) => setSelectedTemplate(prev => prev ? { ...prev, description: e.target.value } : null)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Category</label>
                      <select
                        value={selectedTemplate.category}
                        onChange={(e) => setSelectedTemplate(prev => prev ? { ...prev, category: e.target.value as BrandTemplate['category'] } : null)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="social_media">Social Media</option>
                        <option value="web">Web Components</option>
                        <option value="email">Email Marketing</option>
                        <option value="presentation">Presentations</option>
                        <option value="print">Print Materials</option>
                      </select>
                    </div>
                  </div>

                  {/* CSS Variables Editor */}
                  <div className="mb-6">
                    <h4 className="text-white font-medium mb-3">CSS Variables</h4>
                    <div className="space-y-3">
                      {Object.entries(selectedTemplate.css_variables).map(([key, value]) => (
                        <div key={key} className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={key}
                            onChange={(e) => {
                              const newVars = { ...selectedTemplate.css_variables };
                              delete newVars[key];
                              newVars[e.target.value] = value;
                              setSelectedTemplate(prev => prev ? { ...prev, css_variables: newVars } : null);
                            }}
                            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                            placeholder="Variable name"
                          />
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => {
                              const newVars = { ...selectedTemplate.css_variables };
                              newVars[key] = e.target.value;
                              setSelectedTemplate(prev => prev ? { ...prev, css_variables: newVars } : null);
                            }}
                            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                            placeholder="Variable value"
                          />
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newVars = { ...selectedTemplate.css_variables };
                          newVars['--new-variable'] = '#06b6d4';
                          setSelectedTemplate(prev => prev ? { ...prev, css_variables: newVars } : null);
                        }}
                        className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded text-sm"
                      >
                        + Add Variable
                      </button>
                    </div>
                  </div>

                  {/* Generated CSS Preview */}
                  <div className="mb-6">
                    <h4 className="text-white font-medium mb-3">Generated CSS</h4>
                    <div className="bg-gray-900 rounded p-3 text-sm text-gray-300 overflow-x-auto">
                      <pre>{BrandKitService.generateTemplateCSS(selectedTemplate)}</pre>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowTemplateEditor(false);
                        setSelectedTemplate(null);
                      }}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (selectedTemplate) {
                          BrandKitService.updateTemplate(selectedTemplate.id, selectedTemplate);
                          setBrandKit(BrandKitService.getCurrentBrandKit());
                          setUnsavedChanges(true);
                          setShowTemplateEditor(false);
                          setSelectedTemplate(null);
                        }
                      }}
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg"
                    >
                      Save Template
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-6">
              {/* Export */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-white font-medium mb-4">Export Brand Kit</h3>
                <p className="text-gray-400 mb-4">Download your brand kit as JSON for backup or sharing</p>
                <button
                  onClick={() => {
                    const jsonString = BrandKitService.exportBrandKit();
                    const blob = new Blob([jsonString], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${brandKit.name.replace(/\s+/g, '_')}_BrandKit.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg"
                >
                  📥 Download Brand Kit
                </button>
              </div>

              {/* Import */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-white font-medium mb-4">Import Brand Kit</h3>
                <p className="text-gray-400 mb-4">Upload a brand kit JSON file to restore or apply settings</p>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const result = event.target?.result as string;
                          const importedKit = BrandKitService.importBrandKit(result);
                          setBrandKit(importedKit);
                          setUnsavedChanges(true);
                        } catch (error) {
                          alert('Invalid brand kit file');
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                  className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-cyan-600 file:text-white hover:file:bg-cyan-700"
                />
              </div>

              {/* CSS Variables */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-white font-medium mb-4">CSS Variables</h3>
                <p className="text-gray-400 mb-4">Copy these CSS variables for use in custom development</p>
                <div className="bg-gray-900 rounded p-3 text-sm text-gray-300 overflow-x-auto">
                  <pre>{BrandKitService.generateCSSVariables(brandKit)}</pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-700 p-4 flex justify-between items-center">
          <button
            onClick={handleReset}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            🔄 Reset to Default
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!unsavedChanges}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                unsavedChanges
                  ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              💾 Save Brand Kit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};