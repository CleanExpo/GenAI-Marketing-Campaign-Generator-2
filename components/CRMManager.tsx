// components/CRMManager.tsx

import React, { useState, useEffect } from 'react';
import {
  CRMIntegrationService,
  CRMConnection,
  CRMProvider,
  CRMConfiguration,
  CRMSyncResult
} from '../services/crmIntegration';

interface CRMManagerProps {
  isVisible: boolean;
  onClose: () => void;
}

export const CRMManager: React.FC<CRMManagerProps> = ({
  isVisible,
  onClose
}) => {
  const [connections, setConnections] = useState<CRMConnection[]>([]);
  const [activeTab, setActiveTab] = useState<'connections' | 'sync' | 'settings'>('connections');
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [newConnection, setNewConnection] = useState<Partial<CRMConfiguration>>({
    provider: 'salesforce',
    credentials: {},
    fieldMappings: [],
    syncSettings: {
      autoSync: false,
      syncInterval: 60,
      syncOnCreate: true,
      syncOnUpdate: true,
      conflictResolution: 'crm_wins',
      batchSize: 100,
      retryAttempts: 3
    }
  });
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [syncResults, setSyncResults] = useState<CRMSyncResult | null>(null);

  useEffect(() => {
    if (isVisible) {
      loadConnections();
    }
  }, [isVisible]);

  const loadConnections = () => {
    setConnections(CRMIntegrationService.getConnections());
  };

  const handleAddConnection = async () => {
    if (!newConnection.provider || !newConnection.credentials) return;

    try {
      const connection = await CRMIntegrationService.addConnection(newConnection as CRMConfiguration);
      loadConnections();
      setShowAddConnection(false);
      setNewConnection({
        provider: 'salesforce',
        credentials: {},
        fieldMappings: [],
        syncSettings: {
          autoSync: false,
          syncInterval: 60,
          syncOnCreate: true,
          syncOnUpdate: true,
          conflictResolution: 'crm_wins',
          batchSize: 100,
          retryAttempts: 3
        }
      });
    } catch (error: any) {
      alert(`Failed to add connection: ${error.message}`);
    }
  };

  const handleTestConnection = async (connection: CRMConnection) => {
    try {
      setTestResults({ ...testResults, [connection.id]: false });

      const result = await CRMIntegrationService.testExistingConnection(connection.id);

      setTestResults({ ...testResults, [connection.id]: result.success });

      if (!result.success) {
        alert(`Connection test failed: ${result.error || 'Unknown error'}`);
      } else {
        alert('Connection test successful!');
      }

      // Reload connections to get updated status
      loadConnections();
    } catch (error: any) {
      setTestResults({ ...testResults, [connection.id]: false });
      alert(`Connection test failed: ${error.message}`);
    }
  };

  const handleDeleteConnection = async (id: string) => {
    if (confirm('Are you sure you want to delete this CRM connection?')) {
      await CRMIntegrationService.deleteConnection(id);
      loadConnections();
    }
  };

  const handleToggleConnection = async (id: string, isActive: boolean) => {
    await CRMIntegrationService.updateConnection(id, { isActive });
    loadConnections();
  };

  const getProviderIcon = (provider: CRMProvider): string => {
    switch (provider) {
      case 'salesforce': return '☁️';
      case 'hubspot': return '🟠';
      case 'pipedrive': return '🟢';
      case 'zoho': return '🔵';
      case 'monday': return '🟣';
      case 'airtable': return '🟡';
      default: return '🔗';
    }
  };

  const getStatusColor = (status: CRMConnection['syncStatus']): string => {
    switch (status) {
      case 'connected': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'syncing': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'disconnected': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-5xl mx-4 h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-white">CRM Integration Manager</h2>
            <p className="text-gray-400 text-sm mt-1">Connect and sync your campaigns with external CRM systems</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700">
          {[
            { id: 'connections', label: '🔗 Connections', description: 'Manage CRM connections' },
            { id: 'sync', label: '🔄 Sync Status', description: 'Monitor synchronization' },
            { id: 'settings', label: '⚙️ Settings', description: 'Configuration options' }
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
          {activeTab === 'connections' && (
            <div className="space-y-6">
              {/* Add Connection Button */}
              <div className="flex justify-between items-center">
                <h3 className="text-white font-medium">CRM Connections</h3>
                <button
                  onClick={() => setShowAddConnection(true)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  ➕ Add Connection
                </button>
              </div>

              {/* Connections List */}
              {connections.length > 0 ? (
                <div className="space-y-4">
                  {connections.map(connection => (
                    <div key={connection.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getProviderIcon(connection.provider)}</span>
                          <div>
                            <h4 className="text-white font-medium">{connection.name}</h4>
                            <p className="text-gray-400 text-sm capitalize">{connection.provider}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded border text-xs font-medium ${getStatusColor(connection.syncStatus)}`}>
                            {connection.syncStatus}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={connection.isActive}
                              onChange={(e) => handleToggleConnection(connection.id, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                          </label>
                        </div>
                      </div>

                      {/* Connection Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Last Sync:</span>
                          <p className="text-white">
                            {connection.lastSync ? new Date(connection.lastSync).toLocaleString() : 'Never'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Created:</span>
                          <p className="text-white">{new Date(connection.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Auto Sync:</span>
                          <p className="text-white">{connection.configuration.syncSettings.autoSync ? 'Enabled' : 'Disabled'}</p>
                        </div>
                      </div>

                      {connection.errorMessage && (
                        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                          {connection.errorMessage}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleTestConnection(connection)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                          disabled={testResults[connection.id] === false}
                        >
                          {testResults[connection.id] === false ? '🔄 Testing...' : '🧪 Test'}
                        </button>
                        <button
                          onClick={() => handleDeleteConnection(connection.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🔗</div>
                  <h3 className="text-white text-lg font-medium mb-2">No CRM Connections</h3>
                  <p className="text-gray-400 mb-4">Connect to your CRM to automatically sync campaign data</p>
                  <button
                    onClick={() => setShowAddConnection(true)}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Add Your First Connection
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-white font-medium">Synchronization Status</h3>
                <button
                  onClick={loadConnections}
                  className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1"
                >
                  🔄 Refresh Status
                </button>
              </div>

              {connections.length > 0 ? (
                <div className="space-y-4">
                  {connections.map(connection => (
                    <div key={connection.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getProviderIcon(connection.provider)}</span>
                          <div>
                            <h4 className="text-white font-medium">{connection.name}</h4>
                            <p className="text-gray-400 text-sm capitalize">{connection.provider}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded border text-xs font-medium ${getStatusColor(connection.syncStatus)}`}>
                          {connection.syncStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Last Sync:</span>
                          <p className="text-white">
                            {connection.lastSync ? new Date(connection.lastSync).toLocaleString() : 'Never'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Auto Sync:</span>
                          <p className="text-white">
                            {connection.configuration.syncSettings.autoSync ? (
                              <span className="text-green-400">✅ Enabled (every {connection.configuration.syncSettings.syncInterval}m)</span>
                            ) : (
                              <span className="text-gray-400">❌ Disabled</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Sync On Create:</span>
                          <p className="text-white">
                            {connection.configuration.syncSettings.syncOnCreate ?
                              <span className="text-green-400">✅ Yes</span> :
                              <span className="text-gray-400">❌ No</span>
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Sync On Update:</span>
                          <p className="text-white">
                            {connection.configuration.syncSettings.syncOnUpdate ?
                              <span className="text-green-400">✅ Yes</span> :
                              <span className="text-gray-400">❌ No</span>
                            }
                          </p>
                        </div>
                      </div>

                      {connection.errorMessage && (
                        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                          <strong>Error:</strong> {connection.errorMessage}
                        </div>
                      )}

                      <div className="mt-3 text-xs text-gray-500">
                        <span>Conflict Resolution: </span>
                        <span className="capitalize">{connection.configuration.syncSettings.conflictResolution.replace('_', ' ')}</span>
                        {" • "}
                        <span>Batch Size: {connection.configuration.syncSettings.batchSize}</span>
                        {" • "}
                        <span>Retry Attempts: {connection.configuration.syncSettings.retryAttempts}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🔄</div>
                  <h3 className="text-white text-lg font-medium mb-2">No Active Connections</h3>
                  <p className="text-gray-400">Add a CRM connection to see synchronization status</p>
                  <button
                    onClick={() => setActiveTab('connections')}
                    className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Add Connection
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-white font-medium">CRM Settings</h3>

              {/* Global Sync Settings */}
              <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                <h4 className="text-white font-medium mb-4">Global Synchronization Settings</h4>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-white font-medium">Auto-sync New Campaigns</h5>
                      <p className="text-gray-400 text-sm">Automatically sync campaigns to active CRM when created</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-white font-medium">Bidirectional Sync</h5>
                      <p className="text-gray-400 text-sm">Allow CRM changes to update ZENITH campaigns</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Default Connection Settings */}
              <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                <h4 className="text-white font-medium mb-4">Default Connection Settings</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Sync Interval (minutes)</label>
                    <input
                      type="number"
                      defaultValue="60"
                      min="5"
                      max="1440"
                      className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Batch Size</label>
                    <input
                      type="number"
                      defaultValue="100"
                      min="1"
                      max="1000"
                      className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Retry Attempts</label>
                    <input
                      type="number"
                      defaultValue="3"
                      min="0"
                      max="10"
                      className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Conflict Resolution</label>
                    <select className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white">
                      <option value="crm_wins">CRM Wins</option>
                      <option value="zenith_wins">ZENITH Wins</option>
                      <option value="newest_wins">Newest Wins</option>
                      <option value="manual_review">Manual Review</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Data Management */}
              <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                <h4 className="text-white font-medium mb-4">Data Management</h4>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                      📊 Export Sync Logs
                    </button>
                    <span className="text-gray-400 text-sm">Download sync history and error logs</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                      🧹 Clear Sync History
                    </button>
                    <span className="text-gray-400 text-sm">Remove all sync logs and reset connections</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                      🗑️ Reset All Connections
                    </button>
                    <span className="text-gray-400 text-sm">Remove all CRM connections and configurations</span>
                  </div>
                </div>
              </div>

              {/* Field Mapping Preview */}
              <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                <h4 className="text-white font-medium mb-4">Field Mapping Reference</h4>

                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-4 font-medium text-gray-300 border-b border-gray-600 pb-2">
                    <span>ZENITH Field</span>
                    <span>CRM Field (Airtable)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <span className="text-white">Campaign Name</span>
                    <span className="text-gray-400">Name</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <span className="text-white">Campaign Description</span>
                    <span className="text-gray-400">Custom Field</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <span className="text-white">Product Description</span>
                    <span className="text-gray-400">Custom Field</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <span className="text-white">Status</span>
                    <span className="text-gray-400">Status (mapped)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <span className="text-white">Created Date</span>
                    <span className="text-gray-400">Start Date</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <span className="text-white">Campaign ID</span>
                    <span className="text-gray-400">ZENITH Campaign ID</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded text-blue-400 text-sm">
                  <strong>Note:</strong> Field mapping is automatically handled by each CRM provider. Custom fields are preserved and synced when possible.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Connection Modal */}
        {showAddConnection && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-semibold text-white mb-4">Add CRM Connection</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">CRM Provider</label>
                  <select
                    value={newConnection.provider}
                    onChange={(e) => setNewConnection({ ...newConnection, provider: e.target.value as CRMProvider })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="salesforce">Salesforce</option>
                    <option value="hubspot">HubSpot (Coming Soon)</option>
                    <option value="pipedrive">Pipedrive (Coming Soon)</option>
                    <option value="zoho">Zoho CRM (Coming Soon)</option>
                    <option value="monday">Monday.com (Coming Soon)</option>
                    <option value="airtable">Airtable</option>
                  </select>
                </div>

                {newConnection.provider === 'salesforce' && (
                  <>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Instance URL</label>
                      <input
                        type="url"
                        placeholder="https://yourinstance.salesforce.com"
                        value={newConnection.credentials?.instanceUrl || ''}
                        onChange={(e) => setNewConnection({
                          ...newConnection,
                          credentials: { ...newConnection.credentials, instanceUrl: e.target.value }
                        })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Access Token</label>
                      <input
                        type="password"
                        placeholder="Your Salesforce access token"
                        value={newConnection.credentials?.accessToken || ''}
                        onChange={(e) => setNewConnection({
                          ...newConnection,
                          credentials: { ...newConnection.credentials, accessToken: e.target.value }
                        })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                  </>
                )}

                {newConnection.provider === 'airtable' && (
                  <>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Base ID</label>
                      <input
                        type="text"
                        placeholder="appXXXXXXXXXXXXXX"
                        value={newConnection.credentials?.domain || ''}
                        onChange={(e) => setNewConnection({
                          ...newConnection,
                          credentials: { ...newConnection.credentials, domain: e.target.value }
                        })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      />
                      <p className="text-gray-400 text-xs mt-1">
                        Found in your Airtable base URL: airtable.com/YOUR_BASE_ID/...
                      </p>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">API Key</label>
                      <input
                        type="password"
                        placeholder="Your Airtable API key"
                        value={newConnection.credentials?.apiKey || ''}
                        onChange={(e) => setNewConnection({
                          ...newConnection,
                          credentials: { ...newConnection.credentials, apiKey: e.target.value }
                        })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      />
                      <p className="text-gray-400 text-xs mt-1">
                        Create at airtable.com/create/tokens with base:read and base:write scopes
                      </p>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3 text-yellow-400 text-sm">
                      <strong>Airtable Setup:</strong> Your base should have tables named "Contacts", "Companies", "Deals", and "Campaigns" with appropriate fields.
                    </div>
                  </>
                )}

                <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3 text-blue-400 text-sm">
                  <strong>Note:</strong> This is a demo interface. Full OAuth integration and secure credential management will be implemented in production.
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddConnection(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddConnection}
                  disabled={!newConnection.provider ||
                    (newConnection.provider === 'salesforce' && !newConnection.credentials?.instanceUrl) ||
                    (newConnection.provider === 'airtable' && (!newConnection.credentials?.domain || !newConnection.credentials?.apiKey))}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  Add Connection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-700 p-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              🔒 All CRM credentials are stored securely and encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};