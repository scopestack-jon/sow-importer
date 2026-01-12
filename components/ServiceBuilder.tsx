'use client';

import { useState } from 'react';
import type { DraftService, DraftSubservice, ContentItem } from '@/types/builder';
import { PlusIcon } from './icons/PlusIcon';
import { XIcon } from './icons/XIcon';
import { ChevronDownIcon, ChevronRightIcon } from './icons/ChevronIcon';

type ServiceBuilderProps = {
  services: DraftService[];
  contentItems: ContentItem[];
  onAddService: () => void;
  onUpdateService: (serviceId: string, updates: Partial<DraftService>) => void;
  onDeleteService: (serviceId: string) => void;
  onAddSubservice: (serviceId: string) => void;
  onUpdateSubservice: (serviceId: string, subId: string, updates: Partial<DraftSubservice>) => void;
  onDeleteSubservice: (serviceId: string, subId: string) => void;
  onRemoveContentAssignment: (contentId: string) => void;
};

export function ServiceBuilder({
  services,
  contentItems,
  onAddService,
  onUpdateService,
  onDeleteService,
  onAddSubservice,
  onUpdateSubservice,
  onDeleteSubservice,
  onRemoveContentAssignment,
}: ServiceBuilderProps) {
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());

  const toggleExpand = (serviceId: string) => {
    setExpandedServices((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  };

  const getAssignedContent = (serviceId: string, field?: string) => {
    return contentItems.filter(
      (item) =>
        item.assignedTo?.serviceId === serviceId &&
        (!field || item.assignedTo?.field === field)
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-title">Services ({services.length})</h2>
        <button
          onClick={onAddService}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-[var(--accent)] rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add Service
        </button>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-[var(--border)] rounded-xl">
          <p className="text-[var(--neutral-500)] mb-2">No services yet</p>
          <p className="text-sm text-[var(--neutral-400)]">
            Click on a header in the document to create a service,<br />
            or click &quot;Add Service&quot; above
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              isExpanded={expandedServices.has(service.id)}
              onToggle={() => toggleExpand(service.id)}
              assignedContent={getAssignedContent(service.id)}
              onUpdate={(updates) => onUpdateService(service.id, updates)}
              onDelete={() => onDeleteService(service.id)}
              onAddSubservice={() => onAddSubservice(service.id)}
              onUpdateSubservice={(subId, updates) => onUpdateSubservice(service.id, subId, updates)}
              onDeleteSubservice={(subId) => onDeleteSubservice(service.id, subId)}
              onRemoveContent={onRemoveContentAssignment}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type ServiceCardProps = {
  service: DraftService;
  isExpanded: boolean;
  onToggle: () => void;
  assignedContent: ContentItem[];
  onUpdate: (updates: Partial<DraftService>) => void;
  onDelete: () => void;
  onAddSubservice: () => void;
  onUpdateSubservice: (subId: string, updates: Partial<DraftSubservice>) => void;
  onDeleteSubservice: (subId: string) => void;
  onRemoveContent: (contentId: string) => void;
};

function ServiceCard({
  service,
  isExpanded,
  onToggle,
  assignedContent,
  onUpdate,
  onDelete,
  onAddSubservice,
  onUpdateSubservice,
  onDeleteSubservice,
  onRemoveContent,
}: ServiceCardProps) {
  const contentByField = {
    description: assignedContent.filter((c) => c.assignedTo?.field === 'description'),
    assumptions: assignedContent.filter((c) => c.assignedTo?.field === 'assumptions'),
    customer: assignedContent.filter((c) => c.assignedTo?.field === 'customer'),
    out: assignedContent.filter((c) => c.assignedTo?.field === 'out'),
    deliverables: assignedContent.filter((c) => c.assignedTo?.field === 'deliverables'),
    implementation_language: assignedContent.filter((c) => c.assignedTo?.field === 'implementation_language'),
    subservice: assignedContent.filter((c) => c.assignedTo?.field === 'subservice'),
  };

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--background)]">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-[var(--service-bg)] cursor-pointer hover:bg-[var(--service-bg)]/80 transition-colors"
        onClick={onToggle}
      >
        <button className="p-0.5">
          {isExpanded ? (
            <ChevronDownIcon className="h-4 w-4 text-[var(--service)]" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 text-[var(--service)]" />
          )}
        </button>
        <span className="badge-service">Service</span>
        <input
          type="text"
          value={service.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent font-medium text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] rounded px-2 py-0.5 -mx-2"
          placeholder="Service name..."
        />
        <span className="text-sm text-[var(--neutral-500)]">
          {assignedContent.length} items
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 hover:bg-[var(--error-bg)] rounded transition-colors"
        >
          <XIcon className="h-4 w-4 text-[var(--error)]" />
        </button>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-4 space-y-4 border-t border-[var(--border)]">
          {/* Description */}
          <FieldSection
            label="Description"
            items={contentByField.description}
            manualValue={service.description}
            onManualChange={(val) => onUpdate({ description: val })}
            onRemoveContent={onRemoveContent}
          />

          {/* Hours & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--neutral-500)] mb-1">Hours</label>
              <input
                type="number"
                value={service.hours || ''}
                onChange={(e) => onUpdate({ hours: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--neutral-500)] mb-1">Price ($)</label>
              <input
                type="number"
                value={service.price || ''}
                onChange={(e) => onUpdate({ price: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="0"
              />
            </div>
          </div>

          {/* Language fields */}
          <FieldSection
            label="Key Assumptions"
            items={contentByField.assumptions}
            manualValue={service.languages.assumptions || ''}
            onManualChange={(val) => onUpdate({ languages: { ...service.languages, assumptions: val } })}
            onRemoveContent={onRemoveContent}
          />

          <FieldSection
            label="Client Responsibilities"
            items={contentByField.customer}
            manualValue={service.languages.customer || ''}
            onManualChange={(val) => onUpdate({ languages: { ...service.languages, customer: val } })}
            onRemoveContent={onRemoveContent}
          />

          <FieldSection
            label="Out of Scope"
            items={contentByField.out}
            manualValue={service.languages.out || ''}
            onManualChange={(val) => onUpdate({ languages: { ...service.languages, out: val } })}
            onRemoveContent={onRemoveContent}
          />

          <FieldSection
            label="Deliverables"
            items={contentByField.deliverables}
            manualValue={service.languages.deliverables || ''}
            onManualChange={(val) => onUpdate({ languages: { ...service.languages, deliverables: val } })}
            onRemoveContent={onRemoveContent}
          />

          {/* Subservices */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[var(--neutral-500)] uppercase tracking-wide">
                Subservices ({service.subservices.length + contentByField.subservice.length})
              </label>
              <button
                onClick={onAddSubservice}
                className="text-xs text-[var(--accent)] hover:underline"
              >
                + Add Subservice
              </button>
            </div>

            <div className="space-y-2">
              {/* Content assigned as subservices */}
              {contentByField.subservice.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-2 p-2 bg-[var(--subservice-bg)] rounded-lg"
                >
                  <span className="badge-subservice shrink-0 mt-0.5">Sub</span>
                  <p className="flex-1 text-sm">{item.text}</p>
                  <button
                    onClick={() => onRemoveContent(item.id)}
                    className="p-0.5 hover:bg-[var(--error-bg)] rounded"
                  >
                    <XIcon className="h-3 w-3 text-[var(--error)]" />
                  </button>
                </div>
              ))}

              {/* Manual subservices */}
              {service.subservices.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-start gap-2 p-2 bg-[var(--subservice-bg)] rounded-lg"
                >
                  <span className="badge-subservice shrink-0 mt-0.5">Sub</span>
                  <input
                    type="text"
                    value={sub.name}
                    onChange={(e) => onUpdateSubservice(sub.id, { name: e.target.value })}
                    className="flex-1 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-[var(--accent)] rounded px-1"
                    placeholder="Subservice name..."
                  />
                  <button
                    onClick={() => onDeleteSubservice(sub.id)}
                    className="p-0.5 hover:bg-[var(--error-bg)] rounded"
                  >
                    <XIcon className="h-3 w-3 text-[var(--error)]" />
                  </button>
                </div>
              ))}

              {service.subservices.length === 0 && contentByField.subservice.length === 0 && (
                <p className="text-sm text-[var(--neutral-400)] italic">
                  No subservices. Click on items in the document and select &quot;As Subservice&quot;.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type FieldSectionProps = {
  label: string;
  items: ContentItem[];
  manualValue: string;
  onManualChange: (value: string) => void;
  onRemoveContent: (contentId: string) => void;
};

function FieldSection({ label, items, manualValue, onManualChange, onRemoveContent }: FieldSectionProps) {
  const hasAssignedContent = items.length > 0;
  const combinedValue = hasAssignedContent
    ? items.map((i) => i.text).join('\n\n')
    : manualValue;

  return (
    <div>
      <label className="block text-xs font-medium text-[var(--neutral-500)] mb-1 uppercase tracking-wide">
        {label}
        {hasAssignedContent && (
          <span className="ml-2 text-[var(--success)]">({items.length} from doc)</span>
        )}
      </label>
      
      {hasAssignedContent ? (
        <div className="space-y-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-2 p-2 bg-[var(--success-bg)] rounded-lg text-sm"
            >
              <p className="flex-1">{item.text}</p>
              <button
                onClick={() => onRemoveContent(item.id)}
                className="p-0.5 hover:bg-[var(--error-bg)] rounded shrink-0"
              >
                <XIcon className="h-3 w-3 text-[var(--error)]" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <textarea
          value={combinedValue}
          onChange={(e) => onManualChange(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] font-mono"
          placeholder={`Enter ${label.toLowerCase()} or assign content from document...`}
        />
      )}
    </div>
  );
}
