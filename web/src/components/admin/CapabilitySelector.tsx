import React, { useState, useMemo } from 'react';

interface Capability {
  cap: string;
  area: string;
  label: string;
  dependsOn: string[];
}

interface CapabilitySelectorProps {
  capabilities: Capability[];
  selectedCapabilities: string[];
  onSelectionChange: (capabilities: string[]) => void;
  className?: string;
}

interface CapabilityGroup {
  area: string;
  capabilities: Capability[];
}

const CapabilitySelector: React.FC<CapabilitySelectorProps> = ({
  capabilities,
  selectedCapabilities,
  onSelectionChange,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // Group capabilities by area
  const groupedCapabilities = useMemo(() => {
    const groups: CapabilityGroup[] = [];
    const areas = Array.from(new Set(capabilities.map(cap => cap.area)));

    areas.forEach(area => {
      const areaCapabilities = capabilities.filter(cap => cap.area === area);
      groups.push({
        area,
        capabilities: areaCapabilities.sort((a, b) => a.label.localeCompare(b.label))
      });
    });

    return groups.sort((a, b) => a.area.localeCompare(b.area));
  }, [capabilities]);

  // Filter capabilities based on search term
  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groupedCapabilities;

    return groupedCapabilities.map(group => ({
      ...group,
      capabilities: group.capabilities.filter(cap =>
        cap.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cap.cap.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(group => group.capabilities.length > 0);
  }, [groupedCapabilities, searchTerm]);

  const toggleGroup = (area: string) => {
    setExpandedGroups(prev =>
      prev.includes(area)
        ? [] // Close if already open
        : [area] // Open only this one, close others (accordion behavior)
    );
  };

  const toggleCapability = (capabilityKey: string, requiredCapabilities: string[] = []) => {
    const newSelection = new Set(selectedCapabilities);

    if (newSelection.has(capabilityKey)) {
      // Remove capability and its dependent capabilities
      newSelection.delete(capabilityKey);

      // Remove dependent capabilities
      const removedCapabilities = removeDependentCapabilities(capabilityKey, newSelection);
      removedCapabilities.forEach(cap => newSelection.delete(cap));
    } else {
      // Add capability and its dependencies
      newSelection.add(capabilityKey);

      // Add required dependencies
      requiredCapabilities.forEach(cap => newSelection.add(cap));
    }

    onSelectionChange(Array.from(newSelection));
  };

  const removeDependentCapabilities = (capabilityKey: string, currentSelection: Set<string>): string[] => {
    const removed: string[] = [];
    const toCheck = [capabilityKey];

    while (toCheck.length > 0) {
      const current = toCheck.pop()!;
      const dependents = capabilities
        .filter(cap => cap.dependsOn.includes(current))
        .map(cap => cap.cap);

      dependents.forEach(dep => {
        if (currentSelection.has(dep)) {
          currentSelection.delete(dep);
          removed.push(dep);
          toCheck.push(dep);
        }
      });
    }

    return removed;
  };

  const getRequiredCapabilities = (capabilityKey: string): string[] => {
    const capability = capabilities.find(cap => cap.cap === capabilityKey);
    return capability ? capability.dependsOn : [];
  };

  const getAreaIcon = (area: string) => {
    switch (area.toLowerCase()) {
      case 'budget':
        return '💰';
      case 'contract':
        return '📄';
      case 'admin':
        return '⚙️';
      case 'reports':
        return '📊';
      case 'approvals':
        return '✅';
      case 'fund requests':
        return '💸';
      default:
        return '🔧';
    }
  };

  const getTotalSelectedInGroup = (group: CapabilityGroup) => {
    return group.capabilities.filter(cap => selectedCapabilities.includes(cap.cap)).length;
  };

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border-2 border-blue-200 dark:border-indigo-700 shadow-lg ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 rounded-t-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Capabilities & Permissions
            </h3>
            <p className="text-blue-100 text-sm">
              Select what this role can do
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 bg-white dark:bg-gray-800">
        <div className="relative">
          <input
            type="text"
            placeholder="Search capabilities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-blue-200 dark:border-indigo-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-blue-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Capability Groups */}
      <div className="max-h-96 overflow-y-auto">
        {filteredGroups.map(group => {
          const isExpanded = expandedGroups.includes(group.area);
          const selectedInGroup = getTotalSelectedInGroup(group);
          const totalInGroup = group.capabilities.length;

          return (
            <div key={group.area} className="border-b border-blue-100 dark:border-gray-700 last:border-b-0">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.area)}
                className="w-full px-5 py-4 text-left bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700/50 flex items-center justify-between transition-all group"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {getAreaIcon(group.area)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                      {group.area}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedInGroup} of {totalInGroup} selected
                      </span>
                      {selectedInGroup > 0 && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                          {selectedInGroup}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedInGroup === totalInGroup && totalInGroup > 0 && (
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  <div className="flex items-center space-x-2">
                    {isExpanded && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        Click to close
                      </span>
                    )}
                    <svg
                      className={`h-5 w-5 text-gray-400 transform transition-transform duration-200 ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Group Capabilities */}
              {isExpanded && (
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50">
                  <div className="space-y-1.5 pl-6 border-l-2 border-blue-200 dark:border-blue-800 ml-4">
                    {group.capabilities.map(capability => {
                      const isSelected = selectedCapabilities.includes(capability.cap);
                      const requiredCaps = getRequiredCapabilities(capability.cap);
                      const hasDependencies = requiredCaps.length > 0;

                      return (
                        <div 
                          key={capability.cap} 
                          className={`relative flex items-center space-x-2.5 px-2.5 py-2 rounded-md border transition-all ${
                            isSelected 
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' 
                              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
                          }`}
                        >
                          {/* Hierarchy indicator line */}
                          <div className="absolute -left-6 top-1/2 w-4 h-0.5 bg-blue-200 dark:bg-blue-800"></div>
                          <input
                            type="checkbox"
                            id={capability.cap}
                            checked={isSelected}
                            onChange={() => toggleCapability(capability.cap, requiredCaps)}
                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-1 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor={capability.cap}
                              className="block text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors leading-tight"
                            >
                              {capability.label}
                            </label>
                            {hasDependencies && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                                Requires: {requiredCaps.join(', ')}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-b-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-white font-medium">
              Total Selected:
            </span>
          </div>
          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white font-bold">
            {selectedCapabilities.length} {selectedCapabilities.length === 1 ? 'capability' : 'capabilities'}
          </span>
        </div>
        {selectedCapabilities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCapabilities.slice(0, 5).map(cap => (
              <span
                key={cap}
                className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-white/90 text-blue-700 shadow-sm"
              >
                {cap}
              </span>
            ))}
            {selectedCapabilities.length > 5 && (
              <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-white/20 backdrop-blur-sm text-white">
                +{selectedCapabilities.length - 5} more
              </span>
            )}
          </div>
        )}
        {selectedCapabilities.length === 0 && (
          <p className="text-blue-100 text-sm text-center py-2">
            No capabilities selected yet
          </p>
        )}
      </div>
    </div>
  );
};

export default CapabilitySelector;
