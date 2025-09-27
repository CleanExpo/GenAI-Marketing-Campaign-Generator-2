// Enhanced Campaign Manager with Airtable Integration and Staff Accountability

import React, { useState, useEffect } from 'react';
import { SavedCampaign, CampaignTemplate } from '../types';
import { CampaignStorageService } from '../services/campaignStorage';
import { airtableService, CampaignRecord, StaffMember, ProjectRecord } from '../services/airtableService';
import { useAuth } from '../services/authService';

interface CampaignManagerProps {
  onLoadCampaign: (campaign: SavedCampaign) => void;
  onUseTemplate: (template: CampaignTemplate) => void;
  currentCampaign?: SavedCampaign;
  onSaveCurrent: (name: string, description: string, tags: string[]) => void;
  hasUnsavedResults?: boolean;
  resultsExist?: boolean;
  // New props for enhanced features
  currentCampaignData?: any; // The AI-generated campaign content
  onCampaignAssign?: (campaignId: string, staffIds: string[]) => void;
}

export const CampaignManager: React.FC<CampaignManagerProps> = ({
  onLoadCampaign,
  onUseTemplate,
  currentCampaign,
  onSaveCurrent,
  hasUnsavedResults = false,
  resultsExist = false,
  currentCampaignData,
  onCampaignAssign
}) => {
  // Authentication
  const { user, hasPermission } = useAuth();
  const [campaigns, setCampaigns] = useState<SavedCampaign[]>([]);
  const [airtableCampaigns, setAirtableCampaigns] = useState<CampaignRecord[]>([]);
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates' | 'airtable' | 'assignments'>('campaigns');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedCampaignForAssignment, setSelectedCampaignForAssignment] = useState<CampaignRecord | null>(null);
  const [isLoadingAirtable, setIsLoadingAirtable] = useState(false);
  const [airtableError, setAirtableError] = useState<string | null>(null);

  // Save dialog state
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saveTags, setSaveTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Enhanced save dialog state
  const [saveToAirtable, setSaveToAirtable] = useState(true);
  const [savePriority, setSavePriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [saveDueDate, setSaveDueDate] = useState('');
  const [saveAssignedStaff, setSaveAssignedStaff] = useState<string[]>([]);
  const [saveProjectId, setSaveProjectId] = useState('');
  const [saveEstimatedHours, setSaveEstimatedHours] = useState(8);

  useEffect(() => {
    loadData();
    if (user) {
      loadAirtableData();
    }
  }, [user]);

  const loadData = () => {
    setCampaigns(CampaignStorageService.getAllCampaigns());
    setTemplates(CampaignStorageService.getTemplates());
  };

  const loadAirtableData = async () => {
    try {
      setIsLoadingAirtable(true);
      setAirtableError(null);

      const [campaignsData, staffData, projectsData] = await Promise.all([
        airtableService.getCampaigns({ limit: 50 }),
        airtableService.getStaffMembers(),
        airtableService.getProjects({ status: ['Planning', 'Active'] })
      ]);

      setAirtableCampaigns(campaignsData);
      setStaffMembers(staffData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading Airtable data:', error);

      // Provide specific error messages based on the issue
      let errorMessage = 'Failed to load data from Airtable.';

      if (error.message?.includes('field') || error.message?.includes('Unknown field')) {
        errorMessage = 'Airtable table field structure incomplete. Please check AIRTABLE_CAMPAIGNS_SETUP.md for setup instructions.';
      } else if (error.message?.includes('authorized') || error.message?.includes('permission')) {
        errorMessage = 'Airtable access denied. Check your API key permissions.';
      } else if (error.message?.includes('table') || error.message?.includes('Could not find')) {
        errorMessage = 'Campaigns table not found. Please create the required tables in your Airtable base.';
      } else {
        errorMessage = 'Failed to load data from Airtable. Please check your connection and table setup.';
      }

      setAirtableError(errorMessage);
    } finally {
      setIsLoadingAirtable(false);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSaveCurrent = async () => {
    if (!saveName.trim() || !user) return;

    try {
      // Save to local storage first
      onSaveCurrent(saveName, saveDescription, saveTags);

      // Save to Airtable if enabled and user has permission
      if (saveToAirtable && hasPermission('campaigns:create')) {
        const campaignData: Omit<CampaignRecord, 'id' | 'createdAt' | 'updatedAt' | 'approvalHistory'> = {
          title: saveName,
          description: saveDescription,
          status: 'Draft',
          priority: savePriority,
          assignedStaff: saveAssignedStaff,
          createdBy: user.id,
          dueDate: saveDueDate ? new Date(saveDueDate) : undefined,
          tags: saveTags,
          campaignData: currentCampaignData,
          projectId: saveProjectId || undefined,
          estimatedHours: saveEstimatedHours,
          actualHours: 0,
          completionPercentage: 0
        };

        await airtableService.createCampaign(campaignData);
        await loadAirtableData();
      }

      setShowSaveDialog(false);
      resetSaveForm();
      loadData();
    } catch (error) {
      console.error('Error saving campaign:', error);
      alert('Failed to save campaign. Please try again.');
    }
  };

  const resetSaveForm = () => {
    setSaveName('');
    setSaveDescription('');
    setSaveTags([]);
    setSaveToAirtable(true);
    setSavePriority('Medium');
    setSaveDueDate('');
    setSaveAssignedStaff([]);
    setSaveProjectId('');
    setSaveEstimatedHours(8);
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'draft':
      case 'in review': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'archived': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'template': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in production': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'High': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handleAssignStaff = async (campaignId: string, staffIds: string[]) => {
    try {
      await airtableService.updateCampaign(campaignId, {
        assignedStaff: staffIds
      }, user?.id || 'unknown');

      await loadAirtableData();
      setShowAssignDialog(false);
      setSelectedCampaignForAssignment(null);

      onCampaignAssign?.(campaignId, staffIds);
    } catch (error) {
      console.error('Error assigning staff:', error);
      alert('Failed to assign staff to campaign.');
    }
  };

  const openAssignDialog = (campaign: CampaignRecord) => {
    setSelectedCampaignForAssignment(campaign);
    setSaveAssignedStaff(campaign.assignedStaff || []);
    setShowAssignDialog(true);
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

      {/* Error Display */}
      {airtableError && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
          <div className="flex items-start space-x-3">
            <div className="text-red-400 text-lg">⚠️</div>
            <div className="flex-1">
              <p className="font-medium">{airtableError}</p>
              {airtableError.includes('field structure') && (
                <div className="mt-2 text-sm text-red-300">
                  <p>The Campaigns table exists but has no fields defined.</p>
                  <p>See <code className="bg-red-800 px-1 rounded">AIRTABLE_CAMPAIGNS_SETUP.md</code> for setup instructions.</p>
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={loadAirtableData}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-medium"
                >
                  Retry
                </button>
                {airtableError.includes('field structure') && (
                  <button
                    onClick={() => window.open('https://airtable.com/app7oLoqjWJjWlfCq', '_blank')}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
                  >
                    Open Airtable Base
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
        ) : activeTab === 'airtable' ? (
          !isLoadingAirtable && airtableCampaigns.length > 0 ? (
            airtableCampaigns.map((campaign) => (
              <div key={campaign.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-white font-medium text-lg">{campaign.title}</h3>
                    <p className="text-gray-400 text-sm mt-1">{campaign.description}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span className={`px-2 py-1 rounded border text-xs font-medium ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                    <span className={`px-2 py-1 rounded border text-xs font-medium ${getPriorityColor(campaign.priority)}`}>
                      {campaign.priority}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                  <div className="text-gray-400">
                    <span className="font-medium">Progress:</span> {campaign.completionPercentage}%
                  </div>
                  <div className="text-gray-400">
                    <span className="font-medium">Hours:</span> {campaign.actualHours}/{campaign.estimatedHours}
                  </div>
                  {campaign.dueDate && (
                    <div className="text-gray-400">
                      <span className="font-medium">Due:</span> {formatDate(campaign.dueDate)}
                    </div>
                  )}
                  <div className="text-gray-400">
                    <span className="font-medium">Team:</span> {campaign.assignedStaff?.length || 0} members
                  </div>
                </div>

                {campaign.tags && campaign.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {campaign.tags.map((tag) => (
                      <span key={tag} className="bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {campaign.assignedStaff && campaign.assignedStaff.length > 0 && (
                  <div className="mb-3">
                    <p className="text-gray-400 text-sm mb-1">Assigned to:</p>
                    <div className="flex flex-wrap gap-1">
                      {campaign.assignedStaff.map((staffId) => {
                        const staff = staffMembers.find(s => s.id === staffId);
                        return (
                          <span key={staffId} className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">
                            {staff?.name || 'Unknown'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const savedCampaign: SavedCampaign = {
                        id: campaign.id,
                        name: campaign.title,
                        description: campaign.description,
                        tags: campaign.tags || [],
                        createdAt: campaign.createdAt,
                        updatedAt: campaign.updatedAt,
                        version: 1,
                        status: 'active',
                        metadata: {
                          airtableId: campaign.id,
                          priority: campaign.priority,
                          assignedStaff: campaign.assignedStaff
                        },
                        data: campaign.campaignData
                      };
                      onLoadCampaign(savedCampaign);
                    }}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                  >
                    📂 Load
                  </button>
                  {hasPermission('campaigns:assign') && (
                    <button
                      onClick={() => openAssignDialog(campaign)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                    >
                      👥 Assign
                    </button>
                  )}
                  {hasPermission('campaigns:update') && (
                    <button
                      onClick={async () => {
                        const newStatus = campaign.status === 'Draft' ? 'In Review' :
                                         campaign.status === 'In Review' ? 'Approved' : 'Completed';
                        await airtableService.updateCampaign(campaign.id, { status: newStatus }, user?.id || 'unknown');
                        await loadAirtableData();
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                    >
                      ✅ Progress
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : !isLoadingAirtable ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-4">🌐</div>
              <p>No team campaigns found</p>
              <p className="text-sm">Save a campaign to Airtable to see it here</p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
              <p>Loading team campaigns...</p>
            </div>
          )
        ) : activeTab === 'assignments' ? (
          <div className="space-y-4">
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <h3 className="text-white font-medium text-lg mb-4">📊 Team Workload Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staffMembers.map((staff) => {
                  const assignedCampaigns = airtableCampaigns.filter(c =>
                    c.assignedStaff?.includes(staff.id)
                  );
                  return (
                    <div key={staff.id} className="bg-gray-600 rounded-lg p-3">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {staff.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{staff.name}</p>
                          <p className="text-gray-400 text-xs">{staff.department}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Active Campaigns:</span>
                          <span className="text-white">{assignedCampaigns.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Workload:</span>
                          <span className={`font-medium ${
                            staff.workloadScore > 80 ? 'text-red-400' :
                            staff.workloadScore > 60 ? 'text-yellow-400' : 'text-green-400'
                          }`}>
                            {staff.workloadScore}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Rating:</span>
                          <span className="text-yellow-400">{'★'.repeat(staff.performanceRating)}{'☆'.repeat(5 - staff.performanceRating)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
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
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-gray-300 text-sm font-medium mb-2">Priority</label>
                  <select
                    value={savePriority}
                    onChange={(e) => setSavePriority(e.target.value as any)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
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

              {user && hasPermission('campaigns:create') && (
                <div>
                  <label className="flex items-center space-x-2 mb-4">
                    <input
                      type="checkbox"
                      checked={saveToAirtable}
                      onChange={(e) => setSaveToAirtable(e.target.checked)}
                      className="rounded border-gray-600 bg-gray-700 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-gray-300 text-sm font-medium">Save to Team Dashboard (Airtable)</span>
                  </label>

                  {saveToAirtable && (
                    <div className="space-y-4 p-4 bg-gray-600 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-300 text-sm font-medium mb-2">Due Date</label>
                          <input
                            type="datetime-local"
                            value={saveDueDate}
                            onChange={(e) => setSaveDueDate(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-300 text-sm font-medium mb-2">Estimated Hours</label>
                          <input
                            type="number"
                            min="1"
                            max="200"
                            value={saveEstimatedHours}
                            onChange={(e) => setSaveEstimatedHours(Number(e.target.value))}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Assign to Project (Optional)</label>
                        <select
                          value={saveProjectId}
                          onChange={(e) => setSaveProjectId(e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                        >
                          <option value="">No Project</option>
                          {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Assign to Team Members</label>
                        <div className="max-h-32 overflow-y-auto space-y-2">
                          {staffMembers.map((staff) => (
                            <label key={staff.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={saveAssignedStaff.includes(staff.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSaveAssignedStaff([...saveAssignedStaff, staff.id]);
                                  } else {
                                    setSaveAssignedStaff(saveAssignedStaff.filter(id => id !== staff.id));
                                  }
                                }}
                                className="rounded border-gray-600 bg-gray-700 text-cyan-600 focus:ring-cyan-500"
                              />
                              <span className="text-gray-300 text-sm">{staff.name} ({staff.department})</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

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

      {/* Staff Assignment Dialog */}
      {showAssignDialog && selectedCampaignForAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">
              Assign Team to: {selectedCampaignForAssignment.title}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-3">Select Team Members:</label>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {staffMembers.map((staff) => (
                    <label key={staff.id} className="flex items-center space-x-3 p-2 bg-gray-700 rounded">
                      <input
                        type="checkbox"
                        checked={saveAssignedStaff.includes(staff.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSaveAssignedStaff([...saveAssignedStaff, staff.id]);
                          } else {
                            setSaveAssignedStaff(saveAssignedStaff.filter(id => id !== staff.id));
                          }
                        }}
                        className="rounded border-gray-600 bg-gray-700 text-cyan-600 focus:ring-cyan-500"
                      />
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{staff.name}</p>
                        <p className="text-gray-400 text-xs">{staff.department}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`text-xs ${
                            staff.workloadScore > 80 ? 'text-red-400' :
                            staff.workloadScore > 60 ? 'text-yellow-400' : 'text-green-400'
                          }`}>
                            Workload: {staff.workloadScore}%
                          </span>
                          <span className="text-yellow-400 text-xs">
                            {'★'.repeat(staff.performanceRating)}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="text-sm text-gray-400 bg-gray-700 p-3 rounded">
                <p className="mb-1"><strong>Selected:</strong> {saveAssignedStaff.length} team members</p>
                <p><strong>Current Status:</strong> {selectedCampaignForAssignment.status}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAssignDialog(false);
                  setSelectedCampaignForAssignment(null);
                  setSaveAssignedStaff([]);
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAssignStaff(selectedCampaignForAssignment.id, saveAssignedStaff)}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg"
              >
                Assign Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};