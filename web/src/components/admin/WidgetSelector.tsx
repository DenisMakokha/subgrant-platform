import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface Widget {
  id: string;
  name: string;
  description: string;
  widget_type: string;
  category: string;
  required_capability: string;
  available_for_roles: string[];
}

interface WidgetSelectorProps {
  availableWidgets: Widget[];
  selectedCapabilities: string[];
  selectedWidgets: string[];
  onWidgetChange: (widgets: string[]) => void;
}

export default function WidgetSelector({
  availableWidgets,
  selectedCapabilities,
  selectedWidgets,
  onWidgetChange
}: WidgetSelectorProps) {
  const [filteredWidgets, setFilteredWidgets] = useState<Widget[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    // Filter widgets by selected capabilities and search/category
    let filtered = availableWidgets.filter(widget => {
      // Check capability match
      if (widget.required_capability && !selectedCapabilities.includes(widget.required_capability)) {
        return false;
      }
      
      // Check search term
      if (searchTerm && !widget.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !widget.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Check category filter
      if (categoryFilter !== 'all' && widget.category !== categoryFilter) {
        return false;
      }
      
      return true;
    });
    
    setFilteredWidgets(filtered);
  }, [availableWidgets, selectedCapabilities, searchTerm, categoryFilter]);

  const toggleWidget = (widgetId: string) => {
    if (selectedWidgets.includes(widgetId)) {
      onWidgetChange(selectedWidgets.filter(id => id !== widgetId));
    } else {
      onWidgetChange([...selectedWidgets, widgetId]);
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(selectedWidgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    onWidgetChange(items);
  };

  const categories = ['all', ...Array.from(new Set(availableWidgets.map(w => w.category)))];

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search widgets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Available Widgets */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Available Widgets ({filteredWidgets.length})
          </h4>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Click to add/remove
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
          {filteredWidgets.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-sm">No widgets match your criteria</p>
              <p className="text-xs mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredWidgets.map(widget => (
              <div
                key={widget.id}
                onClick={() => toggleWidget(widget.id)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                  selectedWidgets.includes(widget.id)
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {widget.name}
                    </h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {widget.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                        {widget.widget_type}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-xs rounded text-blue-700 dark:text-blue-300">
                        {widget.category}
                      </span>
                    </div>
                  </div>
                  {selectedWidgets.includes(widget.id) && (
                    <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Selected Widgets (Draggable) */}
      {selectedWidgets.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Selected Widgets ({selectedWidgets.length})
            </h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Drag to reorder
            </span>
          </div>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="selected-widgets">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2 max-h-64 overflow-y-auto"
                >
                  {selectedWidgets.map((widgetId, index) => {
                    const widget = availableWidgets.find(w => w.id === widgetId);
                    if (!widget) return null;
                    
                    return (
                      <Draggable key={widgetId} draggableId={widgetId} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-3 rounded-lg border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 transition-shadow ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                              </svg>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                    #{index + 1}
                                  </span>
                                  <h5 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {widget.name}
                                  </h5>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                  {widget.widget_type} • {widget.category}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleWidget(widgetId);
                                }}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 flex-shrink-0"
                                title="Remove widget"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}

      {/* Empty State */}
      {selectedWidgets.length === 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            No widgets selected yet
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Click on widgets above to add them to your dashboard
          </p>
        </div>
      )}
    </div>
  );
}
