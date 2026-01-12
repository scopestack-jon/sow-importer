'use client';

import { useState, useMemo } from 'react';
import type { ParsedSOW } from '@/types/sow';
import type { ValidationResult } from '@/types/validation';
import { validateSOW } from '@/lib/validation';
import { exportToScopeStack, generateExportFileName } from '@/lib/export';
import { CheckIcon } from './icons/CheckIcon';
import { WarningIcon } from './icons/WarningIcon';
import { XIcon } from './icons/XIcon';

type ExportPanelProps = {
  data: ParsedSOW;
  onBack: () => void;
};

export function ExportPanel({ data, onBack }: ExportPanelProps) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const validation = useMemo(() => validateSOW(data), [data]);
  const exportData = useMemo(() => exportToScopeStack(data), [data]);
  const jsonString = useMemo(() => JSON.stringify(exportData, null, 2), [exportData]);

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generateExportFileName(data.fileName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Validation Summary */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6">
        <h2 className="text-title mb-4">Export Validation</h2>
        
        <ValidationSummary validation={validation} />

        {validation.errors.length > 0 && (
          <div className="mt-4 p-4 rounded-lg bg-[var(--error-bg)] border border-[var(--error)]/20">
            <h3 className="font-medium text-[var(--error)] mb-2">Errors (must fix before export)</h3>
            <ul className="space-y-1">
              {validation.errors.map((err) => (
                <li key={err.id} className="text-sm text-[var(--error)]">
                  • {err.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {validation.warnings.length > 0 && (
          <div className="mt-4 p-4 rounded-lg bg-[var(--warning-bg)] border border-[var(--warning)]/20">
            <h3 className="font-medium text-[var(--warning)] mb-2">Warnings (can proceed)</h3>
            <ul className="space-y-1 max-h-32 overflow-y-auto">
              {validation.warnings.slice(0, 10).map((warn) => (
                <li key={warn.id} className="text-sm text-[var(--warning)]">
                  • {warn.message}
                </li>
              ))}
              {validation.warnings.length > 10 && (
                <li className="text-sm text-[var(--warning)] italic">
                  ...and {validation.warnings.length - 10} more
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Export Actions */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6">
        <h2 className="text-title mb-4">Export to ScopeStack</h2>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleDownload}
            disabled={!validation.isValid}
            className={`
              flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium
              transition-all duration-200
              ${validation.isValid
                ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-md hover:shadow-lg'
                : 'bg-[var(--neutral-200)] text-[var(--neutral-400)] cursor-not-allowed'
              }
            `}
          >
            <DownloadIcon className="h-5 w-5" />
            Download JSON
          </button>

          <button
            onClick={handleCopy}
            disabled={!validation.isValid}
            className={`
              flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium
              border transition-all duration-200
              ${validation.isValid
                ? copied
                  ? 'bg-[var(--success-bg)] border-[var(--success)] text-[var(--success)]'
                  : 'bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                : 'bg-[var(--neutral-100)] border-[var(--neutral-200)] text-[var(--neutral-400)] cursor-not-allowed'
              }
            `}
          >
            {copied ? (
              <>
                <CheckIcon className="h-5 w-5" />
                Copied!
              </>
            ) : (
              <>
                <CopyIcon className="h-5 w-5" />
                Copy to Clipboard
              </>
            )}
          </button>
        </div>

        <p className="mt-4 text-sm text-[var(--neutral-500)]">
          Export includes {validation.summary.servicesCount} service{validation.summary.servicesCount !== 1 ? 's' : ''} and {validation.summary.subservicesCount} subservice{validation.summary.subservicesCount !== 1 ? 's' : ''}.
        </p>
      </div>

      {/* JSON Preview */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] overflow-hidden">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-[var(--background-subtle)] transition-colors"
        >
          <h2 className="text-title">JSON Preview</h2>
          <span className="text-sm text-[var(--accent)]">
            {showPreview ? 'Hide' : 'Show'}
          </span>
        </button>
        
        {showPreview && (
          <div className="border-t border-[var(--border)]">
            <pre className="p-4 text-xs font-mono overflow-x-auto max-h-96 bg-[var(--background-subtle)]">
              {jsonString}
            </pre>
          </div>
        )}
      </div>

      {/* Back button */}
      <div className="flex justify-start">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm text-[var(--neutral-500)] hover:text-[var(--foreground)] transition-colors"
        >
          ← Back to Review
        </button>
      </div>
    </div>
  );
}

function ValidationSummary({ validation }: { validation: ValidationResult }) {
  return (
    <div className="flex items-center gap-6">
      <div className={`
        flex items-center gap-2 px-4 py-2 rounded-lg
        ${validation.isValid 
          ? 'bg-[var(--success-bg)] text-[var(--success)]' 
          : 'bg-[var(--error-bg)] text-[var(--error)]'
        }
      `}>
        {validation.isValid ? (
          <>
            <CheckIcon className="h-5 w-5" />
            <span className="font-medium">Ready to Export</span>
          </>
        ) : (
          <>
            <XIcon className="h-5 w-5" />
            <span className="font-medium">Has Errors</span>
          </>
        )}
      </div>

      {validation.summary.errorCount > 0 && (
        <div className="flex items-center gap-1 text-[var(--error)]">
          <span className="font-medium">{validation.summary.errorCount}</span>
          <span className="text-sm">error{validation.summary.errorCount !== 1 ? 's' : ''}</span>
        </div>
      )}

      {validation.summary.warningCount > 0 && (
        <div className="flex items-center gap-1 text-[var(--warning)]">
          <WarningIcon className="h-4 w-4" />
          <span className="font-medium">{validation.summary.warningCount}</span>
          <span className="text-sm">warning{validation.summary.warningCount !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}
