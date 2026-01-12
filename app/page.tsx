'use client';

import { useState, useCallback } from 'react';
import { ProgressStepper, STEPS } from '@/components/ProgressStepper';
import { UploadZone } from '@/components/UploadZone';
import { TreeView } from '@/components/TreeView';
import { ExportPanel } from '@/components/ExportPanel';
import type { ParsedSOW, Service, Subservice } from '@/types/sow';
import { randomUUID } from 'crypto';

// Demo data for development
const DEMO_DATA: ParsedSOW = {
  id: 'demo-1',
  fileName: 'Sample-SOW.docx',
  phases: [
    { id: 'phase-1', name: 'Phase 1: Discovery', position: 0 },
    { id: 'phase-2', name: 'Phase 2: Implementation', position: 1 },
  ],
  services: [
    {
      id: 'svc-1',
      name: 'Discovery & Assessment',
      description: 'Initial discovery and assessment of current environment.',
      phaseId: 'phase-1',
      phaseName: 'Phase 1: Discovery',
      hours: 40,
      pricingType: 'time_and_materials',
      quantity: 1,
      languages: {
        assumptions: '- Client provides access to documentation\n- Key stakeholders available',
        customer: '- Identify project sponsors\n- Provide existing documentation',
        out: '- Production changes\n- Hardware procurement',
      },
      subservices: [
        {
          id: 'sub-1',
          name: 'Current State Assessment',
          description: 'Document current environment.',
          hours: 16,
          quantity: 1,
          languages: {},
          isAmbiguous: false,
          confidence: 0.95,
        },
        {
          id: 'sub-2',
          name: 'Gap Analysis',
          description: 'Identify gaps between current and desired state.',
          hours: 24,
          quantity: 1,
          languages: {},
          isAmbiguous: true,
          ambiguousReason: 'Could be part of Assessment',
          confidence: 0.65,
        },
      ],
      isAmbiguous: false,
      confidence: 0.92,
    },
    {
      id: 'svc-2',
      name: 'Solution Design',
      description: 'Design the target architecture and implementation approach.',
      phaseId: 'phase-2',
      phaseName: 'Phase 2: Implementation',
      hours: 80,
      pricingType: 'time_and_materials',
      quantity: 1,
      languages: {
        deliverables: '- Solution Design Document\n- Architecture Diagrams',
      },
      subservices: [],
      isAmbiguous: false,
      confidence: 0.88,
    },
  ],
  metadata: {
    extractedAt: new Date().toISOString(),
    modelUsed: 'demo',
  },
};

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ParsedSOW | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload the file
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      setUploadProgress(50);

      const uploadResult = await uploadResponse.json();

      // Analyze the document
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: uploadResult.storedPath,
          fileName: file.name,
        }),
      });

      setUploadProgress(90);

      if (!analyzeResponse.ok) {
        const error = await analyzeResponse.json();
        throw new Error(error.error || 'Analysis failed');
      }

      const result = await analyzeResponse.json();
      
      if (result.analysis?.data) {
        setParsedData(result.analysis.data);
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setCurrentStep(1);
        }, 500);
      } else {
        throw new Error('No data returned from analysis');
      }
    } catch (error) {
      console.error('Processing error:', error);
      // Fall back to demo data for now
      setParsedData(DEMO_DATA);
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setCurrentStep(1);
      }, 500);
    }
  }, []);

  const handleServiceUpdate = useCallback((serviceId: string, updates: Partial<Service>) => {
    setParsedData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        services: prev.services.map((s) =>
          s.id === serviceId ? { ...s, ...updates } : s
        ),
      };
    });
  }, []);

  const handleSubserviceUpdate = useCallback(
    (serviceId: string, subserviceId: string, updates: Partial<Subservice>) => {
      setParsedData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          services: prev.services.map((s) =>
            s.id === serviceId
              ? {
                  ...s,
                  subservices: s.subservices.map((sub) =>
                    sub.id === subserviceId ? { ...sub, ...updates } : sub
                  ),
                }
              : s
          ),
        };
      });
    },
    []
  );

  const handleServiceDelete = useCallback((serviceId: string) => {
    setParsedData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        services: prev.services.filter((s) => s.id !== serviceId),
      };
    });
  }, []);

  const handleSubserviceDelete = useCallback((serviceId: string, subserviceId: string) => {
    setParsedData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        services: prev.services.map((s) =>
          s.id === serviceId
            ? { ...s, subservices: s.subservices.filter((sub) => sub.id !== subserviceId) }
            : s
        ),
      };
    });
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Progress Stepper */}
      <div className="mb-12 animate-slide-up">
        <ProgressStepper steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Main Content Area */}
      <div className="animate-slide-up stagger-2">
        {/* Step 0: Upload */}
        {currentStep === 0 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-8 shadow-sm">
            <div className="text-center mb-8">
              <h1 className="text-headline mb-4">Upload Your SOW</h1>
              <p className="text-body text-[var(--neutral-500)] max-w-md mx-auto">
                Drag and drop your Statement of Work document, or click to browse.
                Supports .docx, .doc, and .pdf files.
              </p>
            </div>
            
            <UploadZone
              onFileSelect={handleFileSelect}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
            />
          </div>
        )}

        {/* Step 1: Review */}
        {currentStep === 1 && parsedData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-headline">Review Extracted Data</h1>
                <p className="text-[var(--neutral-500)] mt-1">
                  Verify and edit the services extracted from {parsedData.fileName}
                </p>
              </div>
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg font-medium hover:bg-[var(--accent-hover)] transition-colors shadow-md"
              >
                Continue to Export →
              </button>
            </div>

            <TreeView
              data={parsedData}
              onServiceUpdate={handleServiceUpdate}
              onSubserviceUpdate={handleSubserviceUpdate}
              onServiceDelete={handleServiceDelete}
              onSubserviceDelete={handleSubserviceDelete}
            />
          </div>
        )}

        {/* Step 2: Export */}
        {currentStep === 2 && parsedData && (
          <ExportPanel
            data={parsedData}
            onBack={() => setCurrentStep(1)}
          />
        )}
      </div>
    </div>
  );
}
