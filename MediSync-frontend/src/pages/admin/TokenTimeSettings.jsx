import React, { useState, useEffect } from 'react';
import { Clock, Settings, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { tokenService } from '../../services/tokenService';

const TokenTimeSettings = () => {
  const [settings, setSettings] = useState({
    startTime: '07:00',
    endTime: '20:00',
    enabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [currentStatus, setCurrentStatus] = useState(null);

  useEffect(() => {
    fetchTimeSettings();
  }, []);

  const fetchTimeSettings = async () => {
    try {
      setLoading(true);
      const response = await tokenService.getTokenTimeInfo();
      
      setSettings({
        startTime: response.timeWindow.startTime,
        endTime: response.timeWindow.endTime,
        enabled: response.timeWindow.enabled
      });
      
      setCurrentStatus(response.currentStatus);
    } catch (error) {
      console.error('Error fetching time settings:', error);
      setMessage({ type: 'error', text: 'Failed to load time settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateTimeFormat = (time) => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const handleSave = async () => {
    // Validate time formats
    if (!validateTimeFormat(settings.startTime)) {
      setMessage({ type: 'error', text: 'Invalid start time format. Use HH:MM (24-hour format)' });
      return;
    }
    
    if (!validateTimeFormat(settings.endTime)) {
      setMessage({ type: 'error', text: 'Invalid end time format. Use HH:MM (24-hour format)' });
      return;
    }

    // Validate that start time is before end time
    const startMinutes = timeToMinutes(settings.startTime);
    const endMinutes = timeToMinutes(settings.endTime);
    
    if (startMinutes >= endMinutes) {
      setMessage({ type: 'error', text: 'Start time must be before end time' });
      return;
    }

    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      await tokenService.updateTokenTimeSettings({
        startTime: settings.startTime,
        endTime: settings.endTime,
        enabled: settings.enabled
      });

      setMessage({ type: 'success', text: 'Token time settings updated successfully!' });
      
      // Refresh current status
      setTimeout(() => {
        fetchTimeSettings();
      }, 1000);

    } catch (error) {
      console.error('Error updating time settings:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to update time settings' 
      });
    } finally {
      setSaving(false);
    }
  };

  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatTime12Hour = (time24) => {
    const [hours, minutes] = time24.split(':');
    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Token Time Settings</h1>
          </div>
          <p className="text-gray-600">Configure when patients can generate tokens and automatic cleanup settings.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Settings Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Token Generation Hours
            </h2>

            {/* Current Status Alert */}
            {currentStatus && (
              <div className={`mb-6 p-4 rounded-lg border ${
                currentStatus.allowed 
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-2">
                  {currentStatus.allowed ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                  <span className="font-medium">
                    {currentStatus.allowed ? 'Token Generation Active' : 'Token Generation Blocked'}
                  </span>
                </div>
                <p className="mt-1 text-sm">{currentStatus.message}</p>
              </div>
            )}

            {/* Enable/Disable Toggle */}
            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => handleInputChange('enabled', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700 font-medium">Enable Time Restrictions</span>
              </label>
              <p className="text-sm text-gray-500 mt-1">
                When enabled, tokens can only be generated during the specified hours
              </p>
            </div>

            {/* Time Settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time (24-hour format)
                </label>
                <input
                  type="time"
                  value={settings.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  disabled={!settings.enabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <p className="text-sm text-gray-500 mt-1">
                  12-hour format: {formatTime12Hour(settings.startTime)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time (24-hour format)
                </label>
                <input
                  type="time"
                  value={settings.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  disabled={!settings.enabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <p className="text-sm text-gray-500 mt-1">
                  12-hour format: {formatTime12Hour(settings.endTime)}
                </p>
              </div>
            </div>

            {/* Message Display */}
            {message.text && (
              <div className={`mt-4 p-3 rounded-md ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {message.type === 'success' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span className="text-sm">{message.text}</span>
                </div>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>

          {/* Information Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Settings Information</h2>
            
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Current Configuration</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Status:</span>
                    <span className={`font-medium ${settings.enabled ? 'text-green-600' : 'text-red-600'}`}>
                      {settings.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Start Time:</span>
                    <span className="text-blue-900 font-medium">{formatTime12Hour(settings.startTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">End Time:</span>
                    <span className="text-blue-900 font-medium">{formatTime12Hour(settings.endTime)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-lg p-4">
                <h3 className="font-medium text-amber-900 mb-2">Important Notes</h3>
                <ul className="space-y-1 text-sm text-amber-800">
                  <li>• Changes take effect immediately</li>
                  <li>• Time format is 24-hour (HH:MM)</li>
                  <li>• Tokens auto-delete daily at midnight</li>
                  <li>• Disabled restrictions allow 24/7 access</li>
                </ul>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">Recommended Settings</h3>
                <ul className="space-y-1 text-sm text-green-800">
                  <li>• Hospital hours: 07:00 - 20:00</li>
                  <li>• Extended hours: 06:00 - 22:00</li>
                  <li>• Emergency mode: Disable restrictions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenTimeSettings;
