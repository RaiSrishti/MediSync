import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Card from './Card';

const ResponsiveTabs = ({ tabs, activeTab, onTabChange, className = '', forceDropdownOn = 'sm' }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  // Determine responsive classes based on forceDropdownOn prop
  const getResponsiveClasses = () => {
    switch (forceDropdownOn) {
      case 'md': // Force dropdown on medium screens and below (useful for pages with many tabs)
        return {
          desktop: 'hidden lg:flex',
          mobile: 'lg:hidden'
        };
      case 'sm': // Default - Force dropdown only on small screens
        return {
          desktop: 'hidden md:flex', 
          mobile: 'md:hidden'
        };
      default:
        return {
          desktop: 'hidden md:flex',
          mobile: 'md:hidden'
        };
    }
  };

  const responsiveClasses = getResponsiveClasses();

  return (
    <Card className={`${className} bg-white/80 backdrop-blur-sm border-0 shadow-lg`}>
      <div className="border-b border-gradient-to-r from-teal-200/50 via-cyan-200/50 to-blue-200/50">
        {/* Desktop Navigation - Hidden on mobile/tablet based on forceDropdownOn */}
        <nav className={`${responsiveClasses.desktop} -mb-px space-x-1`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`group relative whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-all duration-300 rounded-t-lg ${
                activeTab === tab.id
                  ? 'border-teal-500 text-teal-700 bg-gradient-to-b from-teal-50 to-cyan-50/50 shadow-sm'
                  : 'border-transparent text-gray-600 hover:text-teal-600 hover:border-teal-300 hover:bg-gradient-to-b hover:from-teal-50/50 hover:to-transparent'
              }`}
            >
              {tab.icon && (
                <span className={`mr-2 text-base transition-transform duration-300 ${
                  activeTab === tab.id ? 'scale-110' : 'group-hover:scale-105'
                }`}>
                  {tab.icon}
                </span>
              )}
              <span className="relative">
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"></div>
                )}
              </span>
            </button>
          ))}
        </nav>

        {/* Mobile/Tablet Dropdown - Shown based on forceDropdownOn */}
        <div className={responsiveClasses.mobile}>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between py-3 px-4 text-left bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
            >
              <span className="flex items-center">
                {activeTabData?.icon && (
                  <span className="mr-3 text-lg">{activeTabData.icon}</span>
                )}
                <span className="font-medium text-gray-900">
                  {activeTabData?.label || 'Select Tab'}
                </span>
              </span>
              <svg
                className={`w-5 h-5 text-teal-500 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown Menu - Rendered in portal to avoid stacking context issues */}
            {isDropdownOpen && createPortal(
              <div 
                className="fixed inset-0"
                style={{ zIndex: 999998 }}
              >
                {/* Overlay to close dropdown when clicking outside */}
                <div
                  className="absolute inset-0"
                  onClick={() => setIsDropdownOpen(false)}
                />
                
                {/* Dropdown content */}
                <div 
                  className="absolute left-4 right-4 bg-white shadow-lg border border-gray-200 rounded-xl overflow-hidden max-w-md mx-auto"
                  style={{ 
                    top: '140px',
                    zIndex: 999999
                  }}
                >
                  <div className="py-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          onTabChange(tab.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 flex items-center transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-700 font-medium border-r-4 border-teal-500'
                            : 'text-gray-700 hover:text-teal-600'
                        }`}
                      >
                        {tab.icon && (
                          <span className={`mr-3 text-lg transition-transform duration-200 ${
                            activeTab === tab.id ? 'scale-110' : ''
                          }`}>{tab.icon}</span>
                        )}
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ResponsiveTabs;
