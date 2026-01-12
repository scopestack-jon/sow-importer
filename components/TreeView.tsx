'use client';

import { useState } from 'react';
import type { ParsedSOW, Service, Subservice } from '@/types/sow';
import { TreeNode } from './TreeNode';

type TreeViewProps = {
  data: ParsedSOW;
  onServiceUpdate: (serviceId: string, updates: Partial<Service>) => void;
  onSubserviceUpdate: (serviceId: string, subserviceId: string, updates: Partial<Subservice>) => void;
  onServiceDelete: (serviceId: string) => void;
  onSubserviceDelete: (serviceId: string, subserviceId: string) => void;
};

export function TreeView({
  data,
  onServiceUpdate,
  onSubserviceUpdate,
  onServiceDelete,
  onSubserviceDelete,
}: TreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [expandAll, setExpandAll] = useState(false);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    if (expandAll) {
      setExpandedNodes(new Set());
    } else {
      const allIds = new Set<string>();
      data.services.forEach((s) => {
        allIds.add(s.id);
        s.subservices.forEach((sub) => allIds.add(sub.id));
      });
      setExpandedNodes(allIds);
    }
    setExpandAll(!expandAll);
  };

  const ambiguousCount = data.services.reduce((count, s) => {
    let c = s.isAmbiguous ? 1 : 0;
    c += s.subservices.filter((sub) => sub.isAmbiguous).length;
    return count + c;
  }, 0);

  // Group services by phase
  const servicesByPhase = new Map<string | undefined, Service[]>();
  data.services.forEach((service) => {
    const phaseId = service.phaseId;
    if (!servicesByPhase.has(phaseId)) {
      servicesByPhase.set(phaseId, []);
    }
    servicesByPhase.get(phaseId)!.push(service);
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-title">Extracted Structure</h2>
          {ambiguousCount > 0 && (
            <span className="badge-warning flex items-center gap-1">
              {ambiguousCount} item{ambiguousCount !== 1 ? 's' : ''} need review
            </span>
          )}
        </div>
        <button
          onClick={handleExpandAll}
          className="text-sm text-[var(--accent)] hover:underline"
        >
          {expandAll ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      {/* Tree */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] overflow-hidden">
        {data.phases.length > 0 ? (
          // Render by phase
          data.phases.map((phase) => (
            <div key={phase.id} className="border-b border-[var(--border)] last:border-b-0">
              <div className="px-4 py-3 bg-[var(--phase-bg)]">
                <span className="badge-phase">{phase.name}</span>
              </div>
              <div>
                {(servicesByPhase.get(phase.id) || []).map((service, index) => (
                  <TreeNode
                    key={service.id}
                    service={service}
                    isExpanded={expandedNodes.has(service.id)}
                    onToggle={() => toggleNode(service.id)}
                    onServiceUpdate={(updates) => onServiceUpdate(service.id, updates)}
                    onSubserviceUpdate={(subId, updates) => onSubserviceUpdate(service.id, subId, updates)}
                    onServiceDelete={() => onServiceDelete(service.id)}
                    onSubserviceDelete={(subId) => onSubserviceDelete(service.id, subId)}
                    isLast={index === (servicesByPhase.get(phase.id)?.length || 0) - 1}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          // No phases, render services directly
          data.services.map((service, index) => (
            <TreeNode
              key={service.id}
              service={service}
              isExpanded={expandedNodes.has(service.id)}
              onToggle={() => toggleNode(service.id)}
              onServiceUpdate={(updates) => onServiceUpdate(service.id, updates)}
              onSubserviceUpdate={(subId, updates) => onSubserviceUpdate(service.id, subId, updates)}
              onServiceDelete={() => onServiceDelete(service.id)}
              onSubserviceDelete={(subId) => onSubserviceDelete(service.id, subId)}
              isLast={index === data.services.length - 1}
            />
          ))
        )}

        {/* Unphased services */}
        {data.phases.length > 0 && servicesByPhase.get(undefined)?.length ? (
          <div className="border-t border-[var(--border)]">
            <div className="px-4 py-3 bg-[var(--background-subtle)]">
              <span className="text-sm text-[var(--neutral-500)]">No Phase Assigned</span>
            </div>
            {servicesByPhase.get(undefined)!.map((service, index) => (
              <TreeNode
                key={service.id}
                service={service}
                isExpanded={expandedNodes.has(service.id)}
                onToggle={() => toggleNode(service.id)}
                onServiceUpdate={(updates) => onServiceUpdate(service.id, updates)}
                onSubserviceUpdate={(subId, updates) => onSubserviceUpdate(service.id, subId, updates)}
                onServiceDelete={() => onServiceDelete(service.id)}
                onSubserviceDelete={(subId) => onSubserviceDelete(service.id, subId)}
                isLast={index === (servicesByPhase.get(undefined)?.length || 0) - 1}
              />
            ))}
          </div>
        ) : null}
      </div>

      {data.services.length === 0 && (
        <div className="text-center py-12 text-[var(--neutral-500)]">
          No services extracted from the document.
        </div>
      )}
    </div>
  );
}
