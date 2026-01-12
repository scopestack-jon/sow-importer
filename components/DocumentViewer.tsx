'use client';

import { useState } from 'react';
import type { ContentItem, ContentAssignmentField, DraftService } from '@/types/builder';
import { ChevronDownIcon } from './icons/ChevronIcon';

type DocumentViewerProps = {
  items: ContentItem[];
  services: DraftService[];
  onAssignContent: (contentId: string, serviceId: string, field: ContentAssignmentField) => void;
  onCreateServiceFromContent: (contentId: string) => void;
};

const ASSIGNMENT_OPTIONS: { value: ContentAssignmentField; label: string }[] = [
  { value: 'description', label: 'Service Description' },
  { value: 'assumptions', label: 'Key Assumptions' },
  { value: 'customer', label: 'Client Responsibilities' },
  { value: 'out', label: 'Out of Scope' },
  { value: 'deliverables', label: 'Deliverables' },
  { value: 'implementation_language', label: 'Implementation Details' },
  { value: 'subservice', label: 'As Subservice' },
];

export function DocumentViewer({
  items,
  services,
  onAssignContent,
  onCreateServiceFromContent,
}: DocumentViewerProps) {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <ContentItemRow
          key={item.id}
          item={item}
          services={services}
          onAssign={(serviceId, field) => onAssignContent(item.id, serviceId, field)}
          onCreateService={() => onCreateServiceFromContent(item.id)}
        />
      ))}
      {items.length === 0 && (
        <div className="text-center py-12 text-[var(--neutral-500)]">
          No content extracted from document
        </div>
      )}
    </div>
  );
}

type ContentItemRowProps = {
  item: ContentItem;
  services: DraftService[];
  onAssign: (serviceId: string, field: ContentAssignmentField) => void;
  onCreateService: () => void;
};

function ContentItemRow({ item, services, onAssign, onCreateService }: ContentItemRowProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showServiceSelect, setShowServiceSelect] = useState(false);
  const [selectedField, setSelectedField] = useState<ContentAssignmentField | null>(null);

  const isAssigned = !!item.assignedTo;
  const assignedService = services.find((s) => s.id === item.assignedTo?.serviceId);

  const handleFieldSelect = (field: ContentAssignmentField) => {
    if (services.length === 0) {
      alert('Create a service first, then assign content to it.');
      return;
    }
    setSelectedField(field);
    setShowServiceSelect(true);
    setShowMenu(false);
  };

  const handleServiceSelect = (serviceId: string) => {
    if (selectedField) {
      onAssign(serviceId, selectedField);
    }
    setShowServiceSelect(false);
    setSelectedField(null);
  };

  const getTypeIcon = () => {
    switch (item.type) {
      case 'header':
        return <span className="text-xs font-bold text-[var(--phase)]">H{item.level}</span>;
      case 'paragraph':
        return <span className="text-xs text-[var(--neutral-400)]">¶</span>;
      case 'list':
        return <span className="text-xs text-[var(--neutral-400)]">•</span>;
      case 'table':
        return <span className="text-xs text-[var(--neutral-400)]">⊞</span>;
    }
  };

  const getItemStyle = () => {
    if (isAssigned) {
      return 'bg-[var(--success-bg)] border-[var(--success)]/30';
    }
    if (item.type === 'header') {
      return 'bg-[var(--background-subtle)] font-medium';
    }
    return 'bg-[var(--background)]';
  };

  return (
    <div className="relative">
      <div
        className={`
          group flex items-start gap-3 px-4 py-2 rounded-lg border border-[var(--border)]
          hover:border-[var(--accent)]/50 transition-all cursor-pointer
          ${getItemStyle()}
        `}
        onClick={() => !isAssigned && setShowMenu(!showMenu)}
      >
        {/* Type indicator */}
        <div className="w-6 h-6 flex items-center justify-center shrink-0">
          {getTypeIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${item.type === 'header' ? 'font-semibold' : ''} ${isAssigned ? 'text-[var(--success)]' : ''}`}>
            {item.text.length > 200 ? item.text.substring(0, 200) + '...' : item.text}
          </p>
          {isAssigned && assignedService && (
            <p className="text-xs text-[var(--success)] mt-1">
              → {assignedService.name} ({item.assignedTo?.field})
            </p>
          )}
        </div>

        {/* Action button */}
        {!isAssigned && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[var(--background-muted)] rounded transition-all"
          >
            <ChevronDownIcon className="h-4 w-4 text-[var(--neutral-500)]" />
          </button>
        )}
      </div>

      {/* Assignment menu */}
      {showMenu && !isAssigned && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg py-1 min-w-[200px]">
          {/* Create as service */}
          {item.type === 'header' && (
            <>
              <button
                onClick={() => {
                  onCreateService();
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--accent)] hover:text-white transition-colors font-medium"
              >
                ✦ Create as Service
              </button>
              <div className="border-t border-[var(--border)] my-1" />
            </>
          )}
          
          {/* Assign to field */}
          <div className="px-3 py-1 text-xs text-[var(--neutral-500)] uppercase tracking-wide">
            Assign to field
          </div>
          {ASSIGNMENT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleFieldSelect(option.value)}
              className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--background-muted)] transition-colors"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* Service selection submenu */}
      {showServiceSelect && (
        <div className="absolute right-0 top-full mt-1 z-30 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg py-1 min-w-[200px]">
          <div className="px-3 py-1 text-xs text-[var(--neutral-500)] uppercase tracking-wide">
            Select service
          </div>
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => handleServiceSelect(service.id)}
              className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--accent)] hover:text-white transition-colors"
            >
              {service.name}
            </button>
          ))}
          <button
            onClick={() => {
              setShowServiceSelect(false);
              setSelectedField(null);
            }}
            className="w-full text-left px-4 py-2 text-sm text-[var(--neutral-500)] hover:bg-[var(--background-muted)]"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Click outside to close */}
      {(showMenu || showServiceSelect) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowMenu(false);
            setShowServiceSelect(false);
            setSelectedField(null);
          }}
        />
      )}
    </div>
  );
}
