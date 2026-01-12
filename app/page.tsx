'use client';

import { useState, useCallback, useMemo } from 'react';
import { ProgressStepper, STEPS } from '@/components/ProgressStepper';
import { UploadZone } from '@/components/UploadZone';
import { DocumentViewer } from '@/components/DocumentViewer';
import { ServiceBuilder } from '@/components/ServiceBuilder';
import { ExportPanel } from '@/components/ExportPanel';
import type { ParsedDocument } from '@/types/document';
import type { ContentItem, DraftService, DraftSubservice, ContentAssignmentField, BuilderState } from '@/types/builder';
import type { ParsedSOW, Service, Subservice } from '@/types/sow';

function generateId() {
  return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function parseDocumentToItems(doc: ParsedDocument): ContentItem[] {
  const items: ContentItem[] = [];

  for (const section of doc.sections) {
    items.push({
      id: generateId(),
      type: 'header',
      level: section.level,
      text: section.title,
      isSelected: false,
    });

    if (section.content) {
      const lines = section.content.split('\n');
      let currentParagraph: string[] = [];
      let currentList: string[] = [];

      const flushParagraph = () => {
        if (currentParagraph.length > 0) {
          const text = currentParagraph.join(' ').trim();
          if (text) {
            items.push({ id: generateId(), type: 'paragraph', text, isSelected: false });
          }
          currentParagraph = [];
        }
      };

      const flushList = () => {
        if (currentList.length > 0) {
          items.push({ id: generateId(), type: 'list', text: currentList.join('\n'), isSelected: false });
          currentList = [];
        }
      };

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) { flushParagraph(); continue; }
        
        if (/^[-•*]\s/.test(trimmed) || /^\d+[.)]\s/.test(trimmed)) {
          flushParagraph();
          currentList.push(trimmed);
        } else {
          if (currentList.length > 0) { flushList(); }
          currentParagraph.push(trimmed);
        }
      }
      flushParagraph();
      flushList();
    }
  }

  for (const table of doc.tables) {
    const tableText = table.rows.map((row) => row.map((cell) => cell.content).join(' | ')).join('\n');
    items.push({ id: generateId(), type: 'table', text: tableText, isSelected: false });
  }

  return items;
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Builder state
  const [parsedDocument, setParsedDocument] = useState<ParsedDocument | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [services, setServices] = useState<DraftService[]>([]);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      setUploadProgress(50);

      // Parse the document (without LLM analysis)
      const parseResponse = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: uploadResult.storedPath,
          fileName: file.name,
        }),
      });

      setUploadProgress(90);

      const parseResult = await parseResponse.json();

      if (!parseResponse.ok) {
        throw new Error(parseResult.error || 'Parse failed');
      }

      if (parseResult.document) {
        setParsedDocument(parseResult.document);
        const items = parseDocumentToItems(parseResult.document);
        setContentItems(items);
        setServices([]);
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setCurrentStep(1);
        }, 300);
      } else {
        throw new Error('No document returned');
      }
    } catch (error) {
      console.error('Processing error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, []);

  // Service management
  const handleAddService = useCallback(() => {
    const newService: DraftService = {
      id: generateId(),
      name: `New Service ${services.length + 1}`,
      description: '',
      languages: {},
      subservices: [],
      assignedContentIds: [],
    };
    setServices((prev) => [...prev, newService]);
  }, [services.length]);

  const handleCreateServiceFromContent = useCallback((contentId: string) => {
    const item = contentItems.find((i) => i.id === contentId);
    if (!item) return;

    const newService: DraftService = {
      id: generateId(),
      name: item.text,
      description: '',
      languages: {},
      subservices: [],
      assignedContentIds: [],
    };
    
    setServices((prev) => [...prev, newService]);
    setContentItems((prev) =>
      prev.map((i) =>
        i.id === contentId
          ? { ...i, assignedTo: { serviceId: newService.id, field: 'name' as ContentAssignmentField } }
          : i
      )
    );
  }, [contentItems]);

  const handleUpdateService = useCallback((serviceId: string, updates: Partial<DraftService>) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, ...updates } : s))
    );
  }, []);

  const handleDeleteService = useCallback((serviceId: string) => {
    setServices((prev) => prev.filter((s) => s.id !== serviceId));
    setContentItems((prev) =>
      prev.map((i) =>
        i.assignedTo?.serviceId === serviceId ? { ...i, assignedTo: undefined } : i
      )
    );
  }, []);

  const handleAddSubservice = useCallback((serviceId: string) => {
    const newSub: DraftSubservice = {
      id: generateId(),
      name: 'New Subservice',
      description: '',
      languages: {},
      assignedContentIds: [],
    };
    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId ? { ...s, subservices: [...s.subservices, newSub] } : s
      )
    );
  }, []);

  const handleUpdateSubservice = useCallback(
    (serviceId: string, subId: string, updates: Partial<DraftSubservice>) => {
      setServices((prev) =>
        prev.map((s) =>
          s.id === serviceId
            ? {
                ...s,
                subservices: s.subservices.map((sub) =>
                  sub.id === subId ? { ...sub, ...updates } : sub
                ),
              }
            : s
        )
      );
    },
    []
  );

  const handleDeleteSubservice = useCallback((serviceId: string, subId: string) => {
    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId
          ? { ...s, subservices: s.subservices.filter((sub) => sub.id !== subId) }
          : s
      )
    );
  }, []);

  const handleAssignContent = useCallback(
    (contentId: string, serviceId: string, field: ContentAssignmentField) => {
      setContentItems((prev) =>
        prev.map((i) =>
          i.id === contentId ? { ...i, assignedTo: { serviceId, field } } : i
        )
      );
    },
    []
  );

  const handleRemoveContentAssignment = useCallback((contentId: string) => {
    setContentItems((prev) =>
      prev.map((i) => (i.id === contentId ? { ...i, assignedTo: undefined } : i))
    );
  }, []);

  // Convert builder state to ParsedSOW for export
  const exportData: ParsedSOW | null = useMemo(() => {
    if (services.length === 0 || !parsedDocument) return null;

    const buildLanguages = (serviceId: string) => {
      const assigned = contentItems.filter((i) => i.assignedTo?.serviceId === serviceId);
      const languages: Record<string, string> = {};
      
      for (const item of assigned) {
        const field = item.assignedTo?.field;
        if (field && field !== 'name' && field !== 'subservice' && field !== 'description') {
          languages[field] = (languages[field] || '') + (languages[field] ? '\n\n' : '') + item.text;
        }
      }
      
      return languages;
    };

    const buildDescription = (serviceId: string, manualDesc: string) => {
      const assigned = contentItems.filter(
        (i) => i.assignedTo?.serviceId === serviceId && i.assignedTo?.field === 'description'
      );
      if (assigned.length > 0) {
        return assigned.map((i) => i.text).join('\n\n');
      }
      return manualDesc;
    };

    const buildSubservices = (service: DraftService): Subservice[] => {
      return service.subservices.map((sub): Subservice => ({
        id: sub.id,
        name: sub.name,
        description: sub.description,
        hours: sub.hours,
        quantity: 1,
        languages: {
          assumptions: sub.languages?.assumptions,
          customer: sub.languages?.customer,
          implementation_language: sub.languages?.implementation_language,
        },
        isAmbiguous: false,
        confidence: 1,
      }));
    };

    return {
      id: parsedDocument.id,
      fileName: parsedDocument.fileName,
      phases: [],
      services: services.map((s): Service => ({
        id: s.id,
        name: s.name,
        description: buildDescription(s.id, s.description),
        hours: s.hours,
        price: s.price,
        pricingType: s.pricingType,
        quantity: 1,
        languages: { ...s.languages, ...buildLanguages(s.id) },
        subservices: buildSubservices(s),
        isAmbiguous: false,
        confidence: 1,
      })),
      metadata: {
        extractedAt: new Date().toISOString(),
        modelUsed: 'manual',
      },
    };
  }, [services, contentItems, parsedDocument]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Progress Stepper */}
      <div className="mb-8 animate-slide-up">
        <ProgressStepper steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Step 0: Upload */}
      {currentStep === 0 && (
        <div className="max-w-2xl mx-auto animate-slide-up">
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
        </div>
      )}

      {/* Step 1: Build Services */}
      {currentStep === 1 && (
        <div className="animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-headline">Build Your Services</h1>
              <p className="text-[var(--neutral-500)] mt-1">
                Click on content in the document to assign it to services
              </p>
            </div>
            <button
              onClick={() => setCurrentStep(2)}
              disabled={services.length === 0}
              className={`px-6 py-2 rounded-lg font-medium transition-colors shadow-md ${
                services.length === 0
                  ? 'bg-[var(--neutral-200)] text-[var(--neutral-400)] cursor-not-allowed'
                  : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]'
              }`}
            >
              Continue to Export →
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Document Content */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] overflow-hidden">
              <div className="px-4 py-3 bg-[var(--background-subtle)] border-b border-[var(--border)]">
                <h2 className="font-semibold">Document Content</h2>
                <p className="text-sm text-[var(--neutral-500)]">
                  Click items to assign to services
                </p>
              </div>
              <div className="p-4 max-h-[70vh] overflow-y-auto">
                <DocumentViewer
                  items={contentItems}
                  services={services}
                  onAssignContent={handleAssignContent}
                  onCreateServiceFromContent={handleCreateServiceFromContent}
                />
              </div>
            </div>

            {/* Service Builder */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] overflow-hidden">
              <div className="px-4 py-3 bg-[var(--background-subtle)] border-b border-[var(--border)]">
                <h2 className="font-semibold">Your Services</h2>
                <p className="text-sm text-[var(--neutral-500)]">
                  Build services from document content
                </p>
              </div>
              <div className="p-4 max-h-[70vh] overflow-y-auto">
                <ServiceBuilder
                  services={services}
                  contentItems={contentItems}
                  onAddService={handleAddService}
                  onUpdateService={handleUpdateService}
                  onDeleteService={handleDeleteService}
                  onAddSubservice={handleAddSubservice}
                  onUpdateSubservice={handleUpdateSubservice}
                  onDeleteSubservice={handleDeleteSubservice}
                  onRemoveContentAssignment={handleRemoveContentAssignment}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Export */}
      {currentStep === 2 && exportData && (
        <div className="max-w-3xl mx-auto">
          <ExportPanel
            data={exportData}
            onBack={() => setCurrentStep(1)}
          />
        </div>
      )}
    </div>
  );
}
