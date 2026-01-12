'use client';

import { useState, useCallback } from 'react';
import { ProgressStepper, STEPS } from '@/components/ProgressStepper';
import { UploadZone } from '@/components/UploadZone';

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress for now
    // Will be replaced with actual API call in Task 24
    const simulateProgress = () => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setIsUploading(false);
          setCurrentStep(1); // Move to review step
        }
        setUploadProgress(Math.min(Math.round(progress), 100));
      }, 200);
    };

    simulateProgress();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Progress Stepper */}
      <div className="mb-12 animate-slide-up">
        <ProgressStepper steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Main Content Area */}
      <div className="animate-slide-up stagger-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-8 shadow-sm">
          {currentStep === 0 && (
            <>
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
            </>
          )}

          {currentStep === 1 && (
            <div className="text-center">
              <h1 className="text-headline mb-4">Review Extracted Data</h1>
              <p className="text-body text-[var(--neutral-500)]">
                Review and edit the extracted services and subservices.
              </p>
              <p className="mt-8 text-[var(--neutral-400)]">
                Review UI coming in Tasks 31-35...
              </p>
            </div>
          )}

          {currentStep === 2 && (
            <div className="text-center">
              <h1 className="text-headline mb-4">Export to ScopeStack</h1>
              <p className="text-body text-[var(--neutral-500)]">
                Download your data as JSON for the ScopeStack API.
              </p>
              <p className="mt-8 text-[var(--neutral-400)]">
                Export UI coming in Tasks 36-38...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
