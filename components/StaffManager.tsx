/**
 * Staff Manager Component
 * Comprehensive staff management with accountability, workload tracking, and performance metrics
 */

import React, { useState, useEffect } from 'react';
import { airtableService, StaffMember, WorkloadAnalytics, ActivityLog } from '../services/airtableService';

interface StaffManagerProps {
  currentUserId?: string;
  onStaffSelect?: (staff: StaffMember) => void;
}

interface StaffFormData {
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Creator' | 'Viewer';
  department: string;
  phone: string;
  profilePhoto: string;
  isActive: boolean;
}

const StaffManager: React.FC<StaffManagerProps> = ({
  currentUserId,
  onStaffSelect
}) => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [staffWorkload, setStaffWorkload] = useState<WorkloadAnalytics | null>(null);
  const [staffActivity, setStaffActivity] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'activity' | 'edit'>('overview');

  const [formData, setFormData] = useState<StaffFormData>({
    name: '',
    email: '',
    role: 'Creator',
    department: '',
    phone: '',
    profilePhoto: '',
    isActive: true
  });

  // Load staff members on component mount
  useEffect(() => {
    loadStaffMembers();
  }, []);

  // Load workload and activity when staff is selected
  useEffect(() => {
    if (selectedStaff) {
      loadStaffDetails(selectedStaff.id);
    }
  }, [selectedStaff]);

  const loadStaffMembers = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const staff = await airtableService.getStaffMembers(false); // Include inactive staff
      setStaffMembers(staff);

      // Auto-select current user if provided
      if (currentUserId && staff.length > 0) {
        const currentUser = staff.find(s => s.id === currentUserId);
        if (currentUser) {
          setSelectedStaff(currentUser);
        }
      }

    } catch (error) {
      console.error('Error loading staff members:', error);
      setError('Failed to load staff members. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStaffDetails = async (staffId: string): Promise<void> => {
    try {
      const [workload, activity] = await Promise.all([
        airtableService.getStaffWorkload(staffId),
        airtableService.getActivityLogs({
          staffId,
          limit: 20
        })
      ]);

      setStaffWorkload(workload);
      setStaffActivity(activity);
    } catch (error) {
      console.error('Error loading staff details:', error);
      setError('Failed to load staff details.');
    }
  };

  const handleStaffSelect = (staff: StaffMember): void => {
    setSelectedStaff(staff);
    setActiveTab('overview');
    onStaffSelect?.(staff);
  };

  const handleCreateStaff = async (): Promise<void> => {
    try {
      setIsCreating(true);
      setError(null);

      // Validate form
      if (!formData.name || !formData.email) {
        throw new Error('Name and email are required');
      }

      const newStaff = await airtableService.createStaffMember({
        ...formData,
        assignedProjects: [],
        lastActivity: new Date()
      });

      setStaffMembers([...staffMembers, newStaff]);
      setSelectedStaff(newStaff);

      // Reset form
      setFormData({
        name: '',
        email: '',
        role: 'Creator',
        department: '',
        phone: '',
        profilePhoto: '',
        isActive: true
      });

      alert('Staff member created successfully!');

    } catch (error) {
      console.error('Error creating staff member:', error);
      setError(error instanceof Error ? error.message : 'Failed to create staff member');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStaff = async (): Promise<void> => {
    if (!selectedStaff) return;

    try {
      setError(null);

      const updatedStaff = await airtableService.updateStaffMember(selectedStaff.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        phone: formData.phone,
        profilePhoto: formData.profilePhoto,
        isActive: formData.isActive
      });

      // Update in local state
      setStaffMembers(staffMembers.map(s => s.id === updatedStaff.id ? updatedStaff : s));
      setSelectedStaff(updatedStaff);
      setIsEditing(false);
      setActiveTab('overview');

      alert('Staff member updated successfully!');

    } catch (error) {
      console.error('Error updating staff member:', error);
      setError('Failed to update staff member');
    }
  };

  const startEditingStaff = (): void => {
    if (selectedStaff) {
      setFormData({
        name: selectedStaff.name,
        email: selectedStaff.email,
        role: selectedStaff.role,
        department: selectedStaff.department || '',
        phone: selectedStaff.phone || '',
        profilePhoto: selectedStaff.profilePhoto || '',
        isActive: selectedStaff.isActive
      });
      setIsEditing(true);
      setActiveTab('edit');
    }
  };

  const cancelEditing = (): void => {
    setIsEditing(false);
    setActiveTab('overview');
    setFormData({
      name: '',
      email: '',
      role: 'Creator',
      department: '',
      phone: '',
      profilePhoto: '',
      isActive: true
    });
  };

  const getRoleColor = (role: string): string => {
    const colors = {
      Admin: 'bg-red-100 text-red-800',
      Manager: 'bg-blue-100 text-blue-800',
      Creator: 'bg-green-100 text-green-800',
      Viewer: 'bg-gray-100 text-gray-800'
    };
    return colors[role as keyof typeof colors] || colors.Viewer;
  };

  const getPerformanceColor = (rating: number): string => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading staff members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Staff List Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              + Add Staff
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Create Staff Form */}
          {isCreating && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Add New Staff Member</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="Creator">Creator</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                  <option value="Viewer">Viewer</option>
                </select>
                <input
                  type="text"
                  placeholder="Department"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleCreateStaff}
                    disabled={isCreating}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {isCreating ? 'Creating...' : 'Create'}
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

          {/* Staff Members List */}
          <div className="space-y-2">
            {staffMembers.map((staff) => (
              <div
                key={staff.id}
                onClick={() => handleStaffSelect(staff)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedStaff?.id === staff.id
                    ? 'bg-blue-100 border-2 border-blue-300'
                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    {staff.profilePhoto ? (
                      <img
                        src={staff.profilePhoto}
                        alt={staff.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-600">
                        {staff.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {staff.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {staff.department}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(staff.role)}`}>
                        {staff.role}
                      </span>
                      {!staff.isActive && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Performance Indicators */}
                <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center">
                    <span className="text-yellow-500">★</span>
                    <span className={`ml-1 ${getPerformanceColor(staff.performanceRating)}`}>
                      {staff.performanceRating}/5
                    </span>
                  </div>
                  <div>
                    Workload: {staff.workloadScore}%
                  </div>
                  <div>
                    Projects: {staff.assignedProjects.length}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Staff Details Panel */}
      <div className="flex-1 bg-white">
        {selectedStaff ? (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                    {selectedStaff.profilePhoto ? (
                      <img
                        src={selectedStaff.profilePhoto}
                        alt={selectedStaff.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-medium text-gray-600">
                        {selectedStaff.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    )}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{selectedStaff.name}</h1>
                    <p className="text-gray-600">{selectedStaff.department}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(selectedStaff.role)}`}>
                        {selectedStaff.role}
                      </span>
                      <span className="text-sm text-gray-500">
                        Joined {formatDate(selectedStaff.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={startEditingStaff}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit Profile
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex space-x-6 mt-6 border-b border-gray-200">
                {['overview', 'performance', 'activity', 'edit'].map((tab) => (
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
                      <h3 className="text-lg font-medium mb-3">Contact Information</h3>
                      <div className="space-y-2">
                        <p><strong>Email:</strong> {selectedStaff.email}</p>
                        <p><strong>Phone:</strong> {selectedStaff.phone || 'Not provided'}</p>
                        <p><strong>Department:</strong> {selectedStaff.department}</p>
                        <p><strong>Status:</strong>
                          <span className={`ml-2 px-2 py-1 rounded text-sm ${
                            selectedStaff.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {selectedStaff.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-3">Quick Stats</h3>
                      <div className="space-y-2">
                        <p><strong>Performance Rating:</strong>
                          <span className={`ml-2 ${getPerformanceColor(selectedStaff.performanceRating)}`}>
                            {selectedStaff.performanceRating}/5 ★
                          </span>
                        </p>
                        <p><strong>Workload:</strong> {selectedStaff.workloadScore}%</p>
                        <p><strong>Assigned Projects:</strong> {selectedStaff.assignedProjects.length}</p>
                        <p><strong>Last Activity:</strong> {selectedStaff.lastActivity ? formatDate(selectedStaff.lastActivity) : 'Never'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'performance' && staffWorkload && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-3">Current Workload</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Active Projects:</span>
                          <span className="font-medium">{staffWorkload.currentProjects}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Active Campaigns:</span>
                          <span className="font-medium">{staffWorkload.currentCampaigns}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Utilization Rate:</span>
                          <span className="font-medium">{staffWorkload.utilizationRate}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-3">Performance Metrics</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Completed This Month:</span>
                          <span className="font-medium">{staffWorkload.completedThisMonth}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Performance Score:</span>
                          <span className="font-medium">{staffWorkload.performanceScore}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg. Completion Time:</span>
                          <span className="font-medium">{staffWorkload.averageCompletionTime.toFixed(1)}h</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-3">Upcoming Deadlines</h3>
                      <p className="text-3xl font-bold text-yellow-600">{staffWorkload.upcomingDeadlines}</p>
                      <p className="text-sm text-gray-600">Next 7 days</p>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-3">Overdue Items</h3>
                      <p className="text-3xl font-bold text-red-600">{staffWorkload.overdueItems}</p>
                      <p className="text-sm text-gray-600">Requires attention</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Recent Activity</h3>
                  <div className="space-y-3">
                    {staffActivity.length > 0 ? (
                      staffActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{activity.action}</p>
                            <p className="text-sm text-gray-600">{activity.details}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatDate(activity.timestamp)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600">No recent activity found.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'edit' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Edit Staff Member</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="Creator">Creator</option>
                          <option value="Manager">Manager</option>
                          <option value="Admin">Admin</option>
                          <option value="Viewer">Viewer</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <input
                          type="text"
                          value={formData.department}
                          onChange={(e) => setFormData({...formData, department: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm font-medium text-gray-700">Active Staff Member</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={handleUpdateStaff}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={cancelEditing}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium">No Staff Member Selected</h3>
              <p className="mt-2">Choose a team member from the list to view their details and performance metrics.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffManager;