// components/ExportManager.tsx

import React, { useState } from 'react';
import { SavedCampaign, CampaignResult } from '../types';
import { ExportService, ExportOptions } from '../services/exportService';

interface ExportManagerProps {
  campaign?: SavedCampaign;
  results?: CampaignResult;
  isVisible: boolean;
  onClose: () => void;
}

export const ExportManager: React.FC<ExportManagerProps> = ({
  campaign,
  results,
  isVisible,
  onClose
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{ [key: string]: boolean }>({});
  const [customFileName, setCustomFileName] = useState('');
  const [selectedFormats, setSelectedFormats] = useState<ExportOptions['format'][]>(['pdf']);

  const exportData = campaign || results;

  const handleFormatToggle = (format: ExportOptions['format']) => {
    setSelectedFormats(prev =>
      prev.includes(format)
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  };

  const handleExport = async () => {
    if (!exportData || selectedFormats.length === 0) return;

    setIsExporting(true);
    setExportStatus({});

    try {
      const results = await ExportService.exportMultipleFormats(
        exportData,
        selectedFormats,
        { customFileName: customFileName || undefined }
      );

      setExportStatus(results);

      // Show success notification
      setTimeout(() => {
        setExportStatus({});
      }, 3000);

    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleQuickCopy = async () => {
    if (!exportData) return;

    setIsExporting(true);
    const success = await ExportService.copyToClipboard(exportData);

    if (success) {
      setExportStatus({ clipboard: true });
      setTimeout(() => setExportStatus({}), 2000);
    }

    setIsExporting(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">Export Campaign</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h4 className="text-white font-medium mb-3">Quick Actions</h4>
          <button
            onClick={handleQuickCopy}
            disabled={isExporting || !exportData}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {exportStatus.clipboard ? '✅ Copied!' : '📋 Copy to Clipboard'}
          </button>
        </div>

        {/* Export Formats */}
        <div className="mb-6">
          <h4 className="text-white font-medium mb-3">Export Formats</h4>
          <div className="space-y-2">
            {[
              { format: 'pdf' as const, label: 'PDF Document', icon: '📄', description: 'Professional formatted report' },
              { format: 'csv' as const, label: 'CSV Data', icon: '📊', description: 'Spreadsheet compatible data' },
              { format: 'json' as const, label: 'JSON Data', icon: '🔧', description: 'Developer-friendly format' }
            ].map(({ format, label, icon, description }) => (
              <label key={format} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedFormats.includes(format)}
                  onChange={() => handleFormatToggle(format)}
                  className="form-checkbox h-4 w-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-white">
                    <span>{icon}</span>
                    <span className="font-medium">{label}</span>
                    {exportStatus[format] && <span className="text-green-400">✅</span>}
                  </div>
                  <p className="text-gray-400 text-sm">{description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Custom File Name */}
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Custom File Name (optional)
          </label>
          <input
            type="text"
            value={customFileName}
            onChange={(e) => setCustomFileName(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none"
            placeholder="My_Campaign_Export"
          />
          <p className="text-gray-400 text-xs mt-1">
            File extension will be added automatically
          </p>
        </div>

        {/* Export Status */}
        {Object.keys(exportStatus).length > 0 && (
          <div className="mb-4">
            <div className="bg-gray-700 rounded-lg p-3">
              <h5 className="text-white font-medium mb-2">Export Results:</h5>
              {Object.entries(exportStatus).map(([format, success]) => (
                <div key={format} className="flex items-center gap-2 text-sm">
                  {success ? (
                    <>
                      <span className="text-green-400">✅</span>
                      <span className="text-white">{format.toUpperCase()} exported successfully</span>
                    </>
                  ) : (
                    <>
                      <span className="text-red-400">❌</span>
                      <span className="text-white">{format.toUpperCase()} export failed</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            Close
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !exportData || selectedFormats.length === 0}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {isExporting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Exporting...
              </div>
            ) : (
              `Export ${selectedFormats.length} Format${selectedFormats.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>

        {/* Footer Info */}
        <div className="mt-4 text-center">
          <p className="text-gray-400 text-xs">
            Exports will be saved to your Downloads folder
          </p>
        </div>
      </div>
    </div>
  );
};