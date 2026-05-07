import React from 'react';

const EmergencyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const emergencyContacts = [
    {
      department: 'Emergency Department',
      phone: '+1 (555) 911-EMRG',
      extension: 'Ext: 911'
    },
    {
      department: 'ICU / Critical Care',
      phone: '+1 (555) 911-ICU1',
      extension: 'Ext: 100'
    },
    {
      department: 'Trauma Center',
      phone: '+1 (555) 911-TRUM',
      extension: 'Ext: 200'
    },
    {
      department: 'Poison Control',
      phone: '+1 (800) 222-1222',
      extension: '24/7 Hotline'
    },
    {
      department: 'Security',
      phone: '+1 (555) 911-SEC1',
      extension: 'Ext: 911'
    },
    {
      department: 'Administration',
      phone: '+1 (555) 234-5678',
      extension: 'Ext: 101'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-red-500 to-rose-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold flex items-center">
                <span className="animate-pulse mr-3">🚨</span>
                Emergency Contacts
              </h2>
              <p className="text-red-100 mt-1 text-sm md:text-base">MediSync Hospital - 24/7 Emergency Services</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-red-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Emergency Notice */}
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                For Life-Threatening Emergencies
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Call 911 immediately or go to the nearest Emergency Room
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Contacts List */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hospital Emergency Contacts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergencyContacts.map((contact, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">{contact.department}</h4>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-blue-600">
                    <a href={`tel:${contact.phone}`} className="hover:underline">
                      {contact.phone}
                    </a>
                  </p>
                  <p className="text-sm text-gray-600">{contact.extension}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Hospital Address */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">📍 Hospital Address</h4>
            <p className="text-blue-800">
              MediSync General Hospital<br />
              123 Healthcare Drive<br />
              Medical City, MC 12345<br />
              United States
            </p>
          </div>

          {/* Additional Instructions */}
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-900 mb-2">📋 When Calling Emergency Services</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• State your name and location clearly</li>
              <li>• Describe the nature of the emergency</li>
              <li>• Follow all instructions given by the operator</li>
              <li>• Stay on the line until help arrives</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyModal;
