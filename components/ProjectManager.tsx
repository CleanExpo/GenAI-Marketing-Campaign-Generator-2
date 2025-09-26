/**
 * Project Manager Component
 * Comprehensive project management with accountability, milestone tracking, and team coordination
 */

import React, { useState, useEffect } from 'react';
import { airtableService, ProjectRecord, CampaignRecord, StaffMember, ClientRecord, ActivityLog } from '../services/airtableService';
import { useAuth } from '../services/authService';

interface ProjectManagerProps {
  onProjectSelect?: (project: ProjectRecord) => void;
  selectedProjectId?: string;
}

interface ProjectFormData {
  name: string;
  description: string;
  clientId: string;
  status: 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Cancelled';
  startDate: string;
  endDate: string;
  budget: number;
  assignedStaff: string[];
  projectManager: string;
  milestones: {
    name: string;
    description: string;
    dueDate: string;
    assignedTo: string;
    deliverables: string[];
  }[];
}

const ProjectManager: React.FC<ProjectManagerProps> = ({
  onProjectSelect,
  selectedProjectId
}) => {
  const { user, hasPermission } = useAuth();

  // State management
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [projectCampaigns, setProjectCampaigns] = useState<CampaignRecord[]>([]);
  const [projectActivity, setProjectActivity] = useState<ActivityLog[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'team' | 'milestones' | 'activity' | 'edit'>('overview');

  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    clientId: '',
    status: 'Planning',
    startDate: '',
    endDate: '',
    budget: 0,
    assignedStaff: [],
    projectManager: user?.id || '',
    milestones: []
  });

  // Load data on component mount
  useEffect(() => {
    if (user) {
      loadProjectData();
    }
  }, [user]);

  // Auto-select project if provided
  useEffect(() => {
    if (selectedProjectId && projects.length > 0) {
      const project = projects.find(p => p.id === selectedProjectId);
      if (project) {
        setSelectedProject(project);
        loadProjectDetails(project.id);
      }
    }
  }, [selectedProjectId, projects]);

  // Load project details when selected
  useEffect(() => {
    if (selectedProject) {
      loadProjectDetails(selectedProject.id);
    }
  }, [selectedProject]);

  const loadProjectData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const [projectsData, staffData, clientsData] = await Promise.all([
        airtableService.getProjects(),
        airtableService.getStaffMembers(),
        airtableService.getClients()
      ]);

      setProjects(projectsData);
      setStaffMembers(staffData);
      setClients(clientsData);

      // Auto-select first project if none selected
      if (!selectedProject && projectsData.length > 0) {
        setSelectedProject(projectsData[0]);
      }

    } catch (error) {
      console.error('Error loading project data:', error);
      setError('Failed to load project data. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectDetails = async (projectId: string): Promise<void> => {
    try {
      const [campaigns, activity] = await Promise.all([
        airtableService.getCampaigns({ projectId }),
        airtableService.getActivityLogs({
          resourceType: 'Project',
          resourceId: projectId,
          limit: 20
        })
      ]);

      setProjectCampaigns(campaigns);
      setProjectActivity(activity);
    } catch (error) {
      console.error('Error loading project details:', error);
      setError('Failed to load project details.');
    }
  };

  const handleProjectSelect = (project: ProjectRecord): void => {
    setSelectedProject(project);
    setActiveTab('overview');
    onProjectSelect?.(project);
  };

  const handleCreateProject = async (): Promise<void> => {
    try {
      setError(null);

      if (!formData.name || !formData.clientId || !formData.projectManager) {
        throw new Error('Name, client, and project manager are required');
      }

      if (!hasPermission('projects:create')) {
        throw new Error('You do not have permission to create projects');
      }

      const newProject = await airtableService.createProject({
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        milestones: formData.milestones.map(m => ({
          ...m,
          id: Date.now().toString() + Math.random(),
          dueDate: new Date(m.dueDate),
          status: 'Pending' as const,
          completedAt: undefined
        }))
      });

      setProjects([...projects, newProject]);
      setSelectedProject(newProject);
      setIsCreating(false);
      resetForm();

      alert('Project created successfully!');

    } catch (error) {
      console.error('Error creating project:', error);
      setError(error instanceof Error ? error.message : 'Failed to create project');
    }
  };

  const handleUpdateProject = async (): Promise<void> => {
    if (!selectedProject) return;

    try {
      setError(null);

      if (!hasPermission('projects:update')) {
        throw new Error('You do not have permission to update projects');
      }

      const updatedProject = await airtableService.updateProject?.(selectedProject.id, {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        milestones: formData.milestones.map(m => ({
          ...m,
          id: m.id || Date.now().toString() + Math.random(),
          dueDate: new Date(m.dueDate),
          status: 'Pending' as const
        }))
      });

      if (updatedProject) {
        setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
        setSelectedProject(updatedProject);
      }

      setIsEditing(false);
      setActiveTab('overview');

      alert('Project updated successfully!');

    } catch (error) {
      console.error('Error updating project:', error);
      setError(error instanceof Error ? error.message : 'Failed to update project');
    }
  };

  const startEditingProject = (): void => {
    if (selectedProject) {
      setFormData({
        name: selectedProject.name,
        description: selectedProject.description,
        clientId: selectedProject.clientId,
        status: selectedProject.status,
        startDate: selectedProject.startDate.toISOString().split('T')[0],
        endDate: selectedProject.endDate ? selectedProject.endDate.toISOString().split('T')[0] : '',
        budget: selectedProject.budget,
        assignedStaff: selectedProject.assignedStaff,
        projectManager: selectedProject.projectManager,
        milestones: selectedProject.milestones.map(m => ({
          name: m.name,
          description: m.description,
          dueDate: m.dueDate.toISOString().split('T')[0],
          assignedTo: m.assignedTo,
          deliverables: m.deliverables
        }))
      });
      setIsEditing(true);
      setActiveTab('edit');
    }
  };

  const resetForm = (): void => {
    setFormData({
      name: '',
      description: '',
      clientId: '',
      status: 'Planning',
      startDate: '',
      endDate: '',
      budget: 0,
      assignedStaff: [],
      projectManager: user?.id || '',
      milestones: []
    });
  };

  const addMilestone = (): void => {
    setFormData({
      ...formData,
      milestones: [
        ...formData.milestones,
        {
          name: '',
          description: '',
          dueDate: '',
          assignedTo: '',
          deliverables: []
        }
      ]
    });
  };

  const removeMilestone = (index: number): void => {
    setFormData({
      ...formData,
      milestones: formData.milestones.filter((_, i) => i !== index)
    });
  };

  const updateMilestone = (index: number, field: string, value: any): void => {
    const updatedMilestones = [...formData.milestones];
    (updatedMilestones[index] as any)[field] = value;
    setFormData({ ...formData, milestones: updatedMilestones });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Planning': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'On Hold': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Completed': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getMilestoneStatusColor = (status: string): string => {
    switch (status) {
      case 'Completed': return 'bg-green-500/20 text-green-400';
      case 'In Progress': return 'bg-blue-500/20 text-blue-400';
      case 'Overdue': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateProjectProgress = (project: ProjectRecord): number => {
    if (!project.milestones || project.milestones.length === 0) {
      return project.status === 'Completed' ? 100 : 0;
    }

    const completedMilestones = project.milestones.filter(m => m.status === 'Completed').length;
    return Math.round((completedMilestones / project.milestones.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Projects Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
            {hasPermission('projects:create') && (
              <button
                onClick={() => setIsCreating(!isCreating)}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                + New Project
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Create Project Form */}
          {isCreating && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Create New Project</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Project Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <textarea
                  placeholder="Project Description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.company} - {client.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Budget"
                  value={formData.budget}
                  onChange={(e) => setFormData({...formData, budget: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleCreateProject}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Projects List */}
          <div className="space-y-2">
            {projects.map((project) => {
              const client = clients.find(c => c.id === project.clientId);
              const progress = calculateProjectProgress(project);

              return (
                <div
                  key={project.id}
                  onClick={() => handleProjectSelect(project)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedProject?.id === project.id
                      ? 'bg-blue-100 border-2 border-blue-300'
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {project.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mb-2">{client?.company || 'Unknown Client'}</p>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Progress: {progress}%</span>
                    <span>Campaigns: {project.campaigns?.length || 0}</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                    <span>Start: {formatDate(project.startDate)}</span>
                    {project.endDate && (
                      <span>End: {formatDate(project.endDate)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Project Details Panel */}
      <div className="flex-1 bg-white">
        {selectedProject ? (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{selectedProject.name}</h1>
                  <p className="text-gray-600 mt-1">{selectedProject.description}</p>
                  <div className="flex items-center space-x-4 mt-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedProject.status)}`}>
                      {selectedProject.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      Progress: {calculateProjectProgress(selectedProject)}%
                    </span>
                    <span className="text-sm text-gray-500">
                      Budget: ${selectedProject.budget.toLocaleString()}
                    </span>
                  </div>
                </div>
                {hasPermission('projects:update') && (
                  <button
                    onClick={startEditingProject}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Edit Project
                  </button>
                )}
              </div>

              {/* Tab Navigation */}
              <div className="flex space-x-6 mt-6 border-b border-gray-200">
                {['overview', 'campaigns', 'team', 'milestones', 'activity', 'edit'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-3">Project Details</h3>
                      <div className="space-y-2">
                        <p><strong>Client:</strong> {clients.find(c => c.id === selectedProject.clientId)?.company || 'Unknown'}</p>
                        <p><strong>Start Date:</strong> {formatDate(selectedProject.startDate)}</p>
                        {selectedProject.endDate && (
                          <p><strong>End Date:</strong> {formatDate(selectedProject.endDate)}</p>
                        )}
                        <p><strong>Budget:</strong> ${selectedProject.budget.toLocaleString()}</p>
                        <p><strong>Status:</strong>
                          <span className={`ml-2 px-2 py-1 rounded text-sm ${getStatusColor(selectedProject.status)}`}>
                            {selectedProject.status}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-3">Progress Overview</h3>
                      <div className="space-y-2">
                        <p><strong>Overall Progress:</strong> {calculateProjectProgress(selectedProject)}%</p>
                        <p><strong>Total Campaigns:</strong> {projectCampaigns.length}</p>
                        <p><strong>Team Members:</strong> {selectedProject.assignedStaff.length}</p>
                        <p><strong>Milestones:</strong>
                          {selectedProject.milestones ?
                            `${selectedProject.milestones.filter(m => m.status === 'Completed').length}/${selectedProject.milestones.length}` :
                            '0'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'campaigns' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Project Campaigns</h3>
                  {projectCampaigns.length > 0 ? (
                    <div className="space-y-3">
                      {projectCampaigns.map((campaign) => (
                        <div key={campaign.id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{campaign.title}</h4>
                              <p className="text-sm text-gray-600">{campaign.description}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(campaign.status)}`}>
                              {campaign.status}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span>Progress: {campaign.completionPercentage}%</span>
                            <span>Team: {campaign.assignedStaff?.length || 0}</span>
                            {campaign.dueDate && <span>Due: {formatDate(campaign.dueDate)}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No campaigns assigned to this project yet.</p>
                  )}
                </div>
              )}

              {activeTab === 'team' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Team Members</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedProject.assignedStaff.map((staffId) => {
                      const staff = staffMembers.find(s => s.id === staffId);
                      if (!staff) return null;

                      const isManager = staff.id === selectedProject.projectManager;

                      return (
                        <div key={staff.id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {staff.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium">{staff.name}</h4>
                                {isManager && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                                    Manager
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{staff.department}</p>
                              <p className="text-sm text-gray-500">{staff.role}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex justify-between text-sm">
                            <span className="text-gray-500">Workload: {staff.workloadScore}%</span>
                            <span className="text-yellow-500">{'★'.repeat(staff.performanceRating)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'milestones' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Project Milestones</h3>
                  {selectedProject.milestones && selectedProject.milestones.length > 0 ? (
                    <div className="space-y-3">
                      {selectedProject.milestones.map((milestone) => {
                        const assignedStaff = staffMembers.find(s => s.id === milestone.assignedTo);
                        const isOverdue = new Date(milestone.dueDate) < new Date() && milestone.status !== 'Completed';

                        return (
                          <div key={milestone.id} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium">{milestone.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                  Assigned to: {assignedStaff?.name || 'Unassigned'}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  isOverdue ? getMilestoneStatusColor('Overdue') : getMilestoneStatusColor(milestone.status)
                                }`}>
                                  {isOverdue ? 'Overdue' : milestone.status}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">
                                  Due: {formatDate(milestone.dueDate)}
                                </p>
                              </div>
                            </div>
                            {milestone.deliverables.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm font-medium text-gray-700">Deliverables:</p>
                                <ul className="text-sm text-gray-600 mt-1">
                                  {milestone.deliverables.map((deliverable, index) => (
                                    <li key={index} className="ml-2">• {deliverable}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-600">No milestones defined for this project.</p>
                  )}
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Recent Activity</h3>
                  <div className="space-y-3">
                    {projectActivity.length > 0 ? (
                      projectActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{activity.action}</p>
                            <p className="text-sm text-gray-600">{activity.details}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(activity.timestamp)} • {staffMembers.find(s => s.id === activity.staffId)?.name || 'Unknown'}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600">No recent activity found.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'edit' && isEditing && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Edit Project</h3>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                        <select
                          value={formData.clientId}
                          onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.company} - {client.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="Planning">Planning</option>
                          <option value="Active">Active</option>
                          <option value="On Hold">On Hold</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                        <input
                          type="number"
                          value={formData.budget}
                          onChange={(e) => setFormData({...formData, budget: Number(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={4}
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={handleUpdateProject}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setActiveTab('overview');
                      }}
                      className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-4 text-lg font-medium">No Project Selected</h3>
              <p className="mt-2">Choose a project from the list to view details and manage accountability.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectManager;