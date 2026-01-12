import type { ParsedSOW } from '@/types/sow';
import type { ValidationResult, ValidationError } from '@/types/validation';
import { randomUUID } from 'crypto';

export function validateSOW(data: ParsedSOW): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  let subservicesCount = 0;

  // Validate each service
  data.services.forEach((service) => {
    // Required: Service name
    if (!service.name || service.name.trim() === '') {
      errors.push({
        id: randomUUID(),
        severity: 'error',
        field: 'name',
        message: 'Service name is required',
        serviceId: service.id,
      });
    }

    // Warning: Ambiguous service
    if (service.isAmbiguous) {
      warnings.push({
        id: randomUUID(),
        severity: 'warning',
        field: 'classification',
        message: service.ambiguousReason || 'This service needs review',
        serviceId: service.id,
      });
    }

    // Warning: Low confidence
    if (service.confidence < 0.6) {
      warnings.push({
        id: randomUUID(),
        severity: 'warning',
        field: 'confidence',
        message: `Low confidence (${Math.round(service.confidence * 100)}%) - please verify`,
        serviceId: service.id,
      });
    }

    // Warning: Hours is not a valid number
    if (service.hours !== undefined && (isNaN(service.hours) || service.hours < 0)) {
      warnings.push({
        id: randomUUID(),
        severity: 'warning',
        field: 'hours',
        message: 'Invalid hours value',
        serviceId: service.id,
      });
    }

    // Validate subservices
    service.subservices.forEach((sub) => {
      subservicesCount++;

      // Required: Subservice name
      if (!sub.name || sub.name.trim() === '') {
        errors.push({
          id: randomUUID(),
          severity: 'error',
          field: 'name',
          message: 'Subservice name is required',
          serviceId: service.id,
          subserviceId: sub.id,
        });
      }

      // Warning: Ambiguous subservice
      if (sub.isAmbiguous) {
        warnings.push({
          id: randomUUID(),
          severity: 'warning',
          field: 'classification',
          message: sub.ambiguousReason || 'This subservice needs review',
          serviceId: service.id,
          subserviceId: sub.id,
        });
      }

      // Warning: Low confidence
      if (sub.confidence < 0.6) {
        warnings.push({
          id: randomUUID(),
          severity: 'warning',
          field: 'confidence',
          message: `Low confidence (${Math.round(sub.confidence * 100)}%) - please verify`,
          serviceId: service.id,
          subserviceId: sub.id,
        });
      }
    });
  });

  // Warning: No services
  if (data.services.length === 0) {
    warnings.push({
      id: randomUUID(),
      severity: 'warning',
      field: 'services',
      message: 'No services were extracted from the document',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      errorCount: errors.length,
      warningCount: warnings.length,
      servicesCount: data.services.length,
      subservicesCount,
    },
  };
}
