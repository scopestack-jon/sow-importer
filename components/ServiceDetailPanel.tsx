'use client';

import { useState } from 'react';
import type { Service, Subservice, Languages, PricingType } from '@/types/sow';
import { XIcon } from './icons/XIcon';

type ServiceDetailPanelProps = {
  service: Service;
  onUpdate: (updates: Partial<Service>) => void;
  onSubserviceUpdate: (subserviceId: string, updates: Partial<Subservice>) => void;
  onAddSubservice: () => void;
  onClose: () => void;
};

const PRICING_TYPES: { value: PricingType; label: string }[] = [
  { value: 'fixed_fee', label: 'Fixed Fee' },
  { value: 'time_and_materials', label: 'Time & Materials' },
  { value: 'xaas', label: 'XaaS' },
  { value: 'managed_services', label: 'Managed Services' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'unknown', label: 'Unknown' },
];

const LANGUAGE_FIELDS: { key: keyof Languages; label: string }[] = [
  { key: 'assumptions', label: 'Key Assumptions' },
  { key: 'customer', label: 'Client Responsibilities' },
  { key: 'out', label: 'Out of Scope' },
  { key: 'implementation_language', label: 'Implementation Details' },
  { key: 'deliverables', label: 'Deliverables' },
  { key: 'operate', label: 'Ongoing Operations' },
  { key: 'design_language', label: 'Design Notes' },
  { key: 'planning_language', label: 'Planning Notes' },
];

export function ServiceDetailPanel({
  service,
  onUpdate,
  onSubserviceUpdate,
  onAddSubservice,
  onClose,
}: ServiceDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'languages' | 'subservices'>('details');

  const handleLanguageChange = (key: keyof Languages, value: string) => {
    onUpdate({
      languages: {
        ...service.languages,
        [key]: value,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-[var(--background)] rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <span className="badge-service mr-2">Service</span>
            <h2 className="text-title inline">{service.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--background-muted)] rounded-lg transition-colors"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)]">
          {(['details', 'languages', 'subservices'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-6 py-3 text-sm font-medium transition-colors
                ${activeTab === tab
                  ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                  : 'text-[var(--neutral-500)] hover:text-[var(--foreground)]'
                }
              `}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'subservices' && ` (${service.subservices.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Service Name</label>
                <input
                  type="text"
                  value={service.name}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={service.description}
                  onChange={(e) => onUpdate({ description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent font-mono text-sm"
                  placeholder="Supports Markdown formatting..."
                />
              </div>

              {/* Hours, Price, Pricing Type */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Hours</label>
                  <input
                    type="number"
                    value={service.hours || ''}
                    onChange={(e) => onUpdate({ hours: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Price ($)</label>
                  <input
                    type="number"
                    value={service.price || ''}
                    onChange={(e) => onUpdate({ price: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Pricing Type</label>
                  <select
                    value={service.pricingType || 'unknown'}
                    onChange={(e) => onUpdate({ pricingType: e.target.value as PricingType })}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  >
                    {PRICING_TYPES.map((pt) => (
                      <option key={pt.value} value={pt.value}>{pt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Phase */}
              {service.phaseName && (
                <div>
                  <label className="block text-sm font-medium mb-2">Phase</label>
                  <input
                    type="text"
                    value={service.phaseName}
                    readOnly
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background-subtle)] text-[var(--neutral-500)]"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'languages' && (
            <div className="space-y-6">
              {LANGUAGE_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium mb-2">{field.label}</label>
                  <textarea
                    value={service.languages[field.key] || ''}
                    onChange={(e) => handleLanguageChange(field.key, e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent font-mono text-sm"
                    placeholder={`Enter ${field.label.toLowerCase()}... (Markdown supported)`}
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'subservices' && (
            <div className="space-y-4">
              {service.subservices.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 border border-[var(--border)] rounded-lg space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={sub.name}
                        onChange={(e) => onSubserviceUpdate(sub.id, { name: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      />
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        value={sub.hours || ''}
                        onChange={(e) => onSubserviceUpdate(sub.id, { hours: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        placeholder="Hours"
                      />
                    </div>
                  </div>
                  <textarea
                    value={sub.description}
                    onChange={(e) => onSubserviceUpdate(sub.id, { description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] font-mono text-sm"
                    placeholder="Description..."
                  />
                </div>
              ))}

              <button
                onClick={onAddSubservice}
                className="w-full py-3 border-2 border-dashed border-[var(--border)] rounded-lg text-[var(--neutral-500)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                + Add Subservice
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--background-subtle)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--background-muted)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
