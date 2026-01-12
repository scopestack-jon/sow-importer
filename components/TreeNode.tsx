'use client';

import { useState } from 'react';
import type { Service, Subservice } from '@/types/sow';
import { ChevronRightIcon, ChevronDownIcon } from './icons/ChevronIcon';
import { WarningIcon } from './icons/WarningIcon';
import { XIcon } from './icons/XIcon';

type TreeNodeProps = {
  service: Service;
  isExpanded: boolean;
  onToggle: () => void;
  onServiceUpdate: (updates: Partial<Service>) => void;
  onSubserviceUpdate: (subserviceId: string, updates: Partial<Subservice>) => void;
  onServiceDelete: () => void;
  onSubserviceDelete: (subserviceId: string) => void;
  isLast?: boolean;
};

export function TreeNode({
  service,
  isExpanded,
  onToggle,
  onServiceUpdate,
  onSubserviceUpdate,
  onServiceDelete,
  onSubserviceDelete,
  isLast,
}: TreeNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(service.name);

  const handleNameSubmit = () => {
    if (editName.trim() && editName !== service.name) {
      onServiceUpdate({ name: editName.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setEditName(service.name);
      setIsEditing(false);
    }
  };

  return (
    <div className={`${!isLast ? 'border-b border-[var(--border)]' : ''}`}>
      {/* Service Row */}
      <div
        className={`
          flex items-center gap-2 px-4 py-3 hover:bg-[var(--background-subtle)] 
          transition-colors cursor-pointer group
          ${service.isAmbiguous ? 'bg-[var(--warning-bg)]' : ''}
        `}
      >
        {/* Expand/Collapse */}
        <button
          onClick={onToggle}
          className="p-1 hover:bg-[var(--background-muted)] rounded transition-colors"
        >
          {service.subservices.length > 0 ? (
            isExpanded ? (
              <ChevronDownIcon className="h-4 w-4 text-[var(--neutral-500)]" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-[var(--neutral-500)]" />
            )
          ) : (
            <div className="h-4 w-4" />
          )}
        </button>

        {/* Service badge */}
        <span className="badge-service">Service</span>

        {/* Warning indicator */}
        {service.isAmbiguous && (
          <div className="relative group/warning">
            <WarningIcon className="h-4 w-4 text-[var(--warning)]" />
            {service.ambiguousReason && (
              <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover/warning:block">
                <div className="bg-[var(--foreground)] text-[var(--background)] text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                  {service.ambiguousReason}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Name (editable) */}
        <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 text-sm border border-[var(--accent)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              autoFocus
            />
          ) : (
            <span
              className="font-medium text-[var(--foreground)] truncate block cursor-text hover:bg-[var(--background-muted)] px-2 py-1 -mx-2 -my-1 rounded"
              onDoubleClick={() => setIsEditing(true)}
              title="Double-click to edit"
            >
              {service.name}
            </span>
          )}
        </div>

        {/* Hours/Price info */}
        {(service.hours || service.price) && (
          <div className="flex items-center gap-2 text-sm text-[var(--neutral-500)]">
            {service.hours && <span>{service.hours}h</span>}
            {service.price && <span>${service.price.toLocaleString()}</span>}
          </div>
        )}

        {/* Confidence indicator */}
        <div
          className={`
            w-2 h-2 rounded-full
            ${service.confidence >= 0.8 ? 'bg-[var(--success)]' : 
              service.confidence >= 0.6 ? 'bg-[var(--warning)]' : 'bg-[var(--error)]'}
          `}
          title={`Confidence: ${Math.round(service.confidence * 100)}%`}
        />

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onServiceDelete();
          }}
          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-[var(--error-bg)] rounded transition-all"
          title="Remove service"
        >
          <XIcon className="h-4 w-4 text-[var(--error)]" />
        </button>
      </div>

      {/* Description preview */}
      {isExpanded && service.description && (
        <div className="px-4 py-2 pl-12 text-sm text-[var(--neutral-600)] bg-[var(--background-subtle)] border-t border-[var(--border)]">
          {service.description.substring(0, 200)}
          {service.description.length > 200 && '...'}
        </div>
      )}

      {/* Subservices */}
      {isExpanded && service.subservices.length > 0 && (
        <div className="border-t border-[var(--border)]">
          {service.subservices.map((sub, index) => (
            <SubserviceRow
              key={sub.id}
              subservice={sub}
              onUpdate={(updates) => onSubserviceUpdate(sub.id, updates)}
              onDelete={() => onSubserviceDelete(sub.id)}
              isLast={index === service.subservices.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type SubserviceRowProps = {
  subservice: Subservice;
  onUpdate: (updates: Partial<Subservice>) => void;
  onDelete: () => void;
  isLast?: boolean;
};

function SubserviceRow({ subservice, onUpdate, onDelete, isLast }: SubserviceRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(subservice.name);

  const handleNameSubmit = () => {
    if (editName.trim() && editName !== subservice.name) {
      onUpdate({ name: editName.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setEditName(subservice.name);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`
        flex items-center gap-2 px-4 py-2 pl-12 hover:bg-[var(--background-subtle)]
        transition-colors group
        ${!isLast ? 'border-b border-[var(--border)]' : ''}
        ${subservice.isAmbiguous ? 'bg-[var(--warning-bg)]' : ''}
      `}
    >
      {/* Indent spacer */}
      <div className="w-5" />

      {/* Subservice badge */}
      <span className="badge-subservice">Subservice</span>

      {/* Warning indicator */}
      {subservice.isAmbiguous && (
        <div className="relative group/warning">
          <WarningIcon className="h-4 w-4 text-[var(--warning)]" />
          {subservice.ambiguousReason && (
            <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover/warning:block">
              <div className="bg-[var(--foreground)] text-[var(--background)] text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                {subservice.ambiguousReason}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Name (editable) */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 text-sm border border-[var(--accent)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            autoFocus
          />
        ) : (
          <span
            className="text-sm text-[var(--foreground)] truncate block cursor-text hover:bg-[var(--background-muted)] px-2 py-1 -mx-2 -my-1 rounded"
            onDoubleClick={() => setIsEditing(true)}
            title="Double-click to edit"
          >
            {subservice.name}
          </span>
        )}
      </div>

      {/* Hours */}
      {subservice.hours && (
        <span className="text-sm text-[var(--neutral-500)]">{subservice.hours}h</span>
      )}

      {/* Confidence */}
      <div
        className={`
          w-2 h-2 rounded-full
          ${subservice.confidence >= 0.8 ? 'bg-[var(--success)]' : 
            subservice.confidence >= 0.6 ? 'bg-[var(--warning)]' : 'bg-[var(--error)]'}
        `}
        title={`Confidence: ${Math.round(subservice.confidence * 100)}%`}
      />

      {/* Delete */}
      <button
        onClick={onDelete}
        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-[var(--error-bg)] rounded transition-all"
        title="Remove subservice"
      >
        <XIcon className="h-3 w-3 text-[var(--error)]" />
      </button>
    </div>
  );
}
