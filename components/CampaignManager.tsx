// components/CampaignManager.tsx

import React, { useState, useEffect } from 'react';
import { SavedCampaign, CampaignTemplate } from '../types';
import { CampaignStorageService } from '../services/campaignStorage';

interface CampaignManagerProps {
  onLoadCampaign: (campaign: SavedCampaign) => void;
  onUseTemplate: (template: CampaignTemplate) => void;
  currentCampaign?: SavedCampaign;
  onSaveCurrent: (name: string, description: string, tags: string[]) => void;
  // Add props to check if we have unsaved results
  hasUnsavedResults?: boolean;
  resultsExist?: boolean;
}

export const CampaignManager: React.FC<CampaignManagerProps> = ({
  onLoadCampaign,
  onUseTemplate,
  currentCampaign,
  onSaveCurrent,
  hasUnsavedResults = false,
  resultsExist = false
}) => {
  const [campaigns, setCampaigns] = useState<SavedCampaign[]>([]);
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates'>('campaigns');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Save dialog state
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saveTags, setSaveTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setCampaigns(CampaignStorageService.getAllCampaigns());
    setTemplates(CampaignStorageService.getTemplates());
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSaveCurrent = () => {
    if (!saveName.trim()) return;

    onSaveCurrent(saveName, saveDescription, saveTags);
    setShowSaveDialog(false);
    setSaveName('');
    setSaveDescription('');
    setSaveTags([]);
    loadData();
  };

  const handleDeleteCampaign = async (id: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      await CampaignStorageService.deleteCampaign(id);
      loadData();
    }
  };

  const addTag = () => {
    if (newTag.trim() && !saveTags.includes(newTag.trim())) {
      setSaveTags([...saveTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSaveTags(saveTags.filter(tag => tag !== tagToRemove));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: SavedCampaign['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'draft': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'archived': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'template': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Campaign Manager</h2>
        <button
          onClick={() => setShowSaveDialog(true)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            resultsExist && !currentCampaign
              ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
              : currentCampaign && hasUnsavedResults
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
          disabled={!resultsExist}
          title={
            !resultsExist
              ? 'Generate a campaign first to enable saving'
              : currentCampaign && !hasUnsavedResults
                ? 'Campaign already saved (no changes to save)'
                : resultsExist && !currentCampaign
                  ? 'Save this campaign to your library'
                  : 'Update saved campaign with changes'
          }
        >
          💾 {currentCampaign && !hasUnsavedResults
            ? 'Campaign Saved'
            : currentCampaign && hasUnsavedResults
              ? 'Save Changes'
              : 'Save Current Campaign'
          }
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-700 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`flex-1 px-4 py-2 rounded-md transition-all ${
            activeTab === 'campaigns'
              ? 'bg-cyan-600 text-white font-medium'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📁 My Campaigns ({campaigns.length})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 px-4 py-2 rounded-md transition-all ${
            activeTab === 'templates'
              ? 'bg-cyan-600 text-white font-medium'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📋 Templates ({templates.length})
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search campaigns and templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none"
        />
        <div className="absolute right-3 top-3 text-gray-400">🔍</div>
      </div>

      {/* Content */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {activeTab === 'campaigns' ? (
          filteredCampaigns.length > 0 ? (
            filteredCampaigns.map((campaign) => (
              <div key={campaign.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-white font-medium text-lg">{campaign.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{campaign.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded border text-xs font-medium ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </div>

                {/* Tags */}
                {campaign.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {campaign.tags.map((tag) => (
                      <span key={tag} className="bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Metadata */}
                <div className="flex justify-between items-center text-sm text-gray-400 mb-3">
                  <span>Created: {formatDate(campaign.createdAt)}</span>
                  <span>Version: {campaign.version}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onLoadCampaign(campaign)}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                  >
                    📂 Load
                  </button>
                  <button
                    onClick={() => handleDeleteCampaign(campaign.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-4">📁</div>
              <p>No campaigns found</p>
              <p className="text-sm">Create your first campaign to get started</p>
            </div>
          )
        ) : (
          templates.length > 0 ? (
            templates.map((template) => (
              <div key={template.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-white font-medium text-lg">{template.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{template.description}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded border text-xs font-medium ${
                      template.category === 'saas' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                      template.category === 'ecommerce' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      template.category === 'healthcare' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      'bg-gray-500/20 text-gray-400 border-gray-500/30'
                    }`}>
                      {template.category}
                    </span>
                    <p className="text-gray-400 text-xs mt-1">Used {template.usageCount} times</p>
                  </div>
                </div>

                <button
                  onClick={() => onUseTemplate(template)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                >
                  🚀 Use Template
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-4">📋</div>
              <p>No templates available</p>
            </div>
          )
        )}
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Save Campaign</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Campaign Name*</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none"
                  placeholder="My Awesome Campaign"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Description</label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none"
                  rows={3}
                  placeholder="Brief description of this campaign..."
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none"
                    placeholder="Add tag..."
                  />
                  <button
                    onClick={addTag}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-2 rounded-lg"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {saveTags.map((tag) => (
                    <span key={tag} className="bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded text-sm flex items-center gap-1">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-cyan-300">×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCurrent}
                disabled={!saveName.trim()}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Save Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};