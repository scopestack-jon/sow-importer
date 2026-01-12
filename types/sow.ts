export type PricingType = 
  | 'fixed_fee'
  | 'time_and_materials'
  | 'xaas'
  | 'managed_services'
  | 'subscription'
  | 'unknown';

export type Languages = {
  assumptions?: string;
  customer?: string;
  out?: string;
  implementation_language?: string;
  deliverables?: string;
  operate?: string;
  design_language?: string;
  planning_language?: string;
  internal_only?: string;
  service_level_agreement?: string;
};

export type Phase = {
  id: string;
  name: string;
  position: number;
};

export type Subservice = {
  id: string;
  name: string;
  description: string;
  hours?: number;
  quantity?: number;
  languages: Languages;
  isAmbiguous: boolean;
  ambiguousReason?: string;
  confidence: number;
};

export type Service = {
  id: string;
  name: string;
  description: string;
  phaseId?: string;
  phaseName?: string;
  hours?: number;
  price?: number;
  pricingType?: PricingType;
  quantity?: number;
  languages: Languages;
  subservices: Subservice[];
  isAmbiguous: boolean;
  ambiguousReason?: string;
  confidence: number;
};

export type ParsedSOW = {
  id: string;
  fileName: string;
  phases: Phase[];
  services: Service[];
  pricingType?: PricingType;
  metadata?: {
    extractedAt: string;
    modelUsed: string;
    documentTitle?: string;
  };
  warnings?: string[];
};

export type AnalysisResult = {
  success: boolean;
  data?: ParsedSOW;
  error?: string;
};
