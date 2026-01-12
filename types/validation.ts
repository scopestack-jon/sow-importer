export type ValidationSeverity = 'error' | 'warning';

export type ValidationError = {
  id: string;
  severity: ValidationSeverity;
  field: string;
  message: string;
  serviceId?: string;
  subserviceId?: string;
};

export type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: {
    errorCount: number;
    warningCount: number;
    servicesCount: number;
    subservicesCount: number;
  };
};
