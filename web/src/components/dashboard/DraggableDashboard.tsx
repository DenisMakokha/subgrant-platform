import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { WidgetConfig } from '../../config/dashboards/types';

/**
 * DraggableDashboard - Drag and drop widget rearrangement
 * 
 * Features:
 * - Drag and drop widgets to reorder
 * - Visual feedback during drag
 * - Save layout preferences
 * - Responsive grid layout
 */

interface DraggableDashboardProps {
  widgets: WidgetConfig[];
  onReorder: (widgets: WidgetConfig[]) => void;
  renderWidget: (widget: WidgetConfig, index: number) => React.ReactNode;
  columns?: number;
  editMode?: boolean;
}

export default function DraggableDashboard({
  widgets,
  onReorder,
  renderWidget,
  columns = 3,
  editMode = false
}: DraggableDashboardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback((result: DropResult) => {
    setIsDragging(false);

    if (!result.destination) {
      return;
    }

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update positions
    const updatedWidgets = items.map((widget, index) => ({
      ...widget,
      position: {
        ...widget.position,
        row: Math.floor(index / columns),
        col: index % columns
      }
    }));

    onReorder(updatedWidgets);
  }, [widgets, columns, onReorder]);

  if (!editMode) {
    // Normal mode - no drag and drop
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6`}>
        {widgets.map((widget, index) => (
          <div key={widget.id}>
            {renderWidget(widget, index)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Droppable droppableId="dashboard-widgets" direction="horizontal">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6 ${
              snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/10' : ''
            } transition-colors duration-200 rounded-2xl p-2`}
          >
            {widgets.map((widget, index) => (
              <Draggable key={widget.id} draggableId={widget.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`${
                      snapshot.isDragging
                        ? 'opacity-50 scale-105 rotate-2 shadow-2xl'
                        : 'opacity-100 scale-100'
                    } transition-all duration-200`}
                    style={{
                      ...provided.draggableProps.style,
                      cursor: isDragging ? 'grabbing' : 'grab'
                    }}
                  >
                    {/* Drag Handle Indicator */}
                    {editMode && (
                      <div className="absolute top-2 right-2 z-10 p-2 bg-blue-500 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                      </div>
                    )}
                    {renderWidget(widget, index)}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
