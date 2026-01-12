import type { Languages, PricingType } from './sow';

export type ContentItemType = 'header' | 'paragraph' | 'list' | 'table';

export type ContentItem = {
  id: string;
  type: ContentItemType;
  level?: number; // For headers: 1-6
  text: string;
  rawHtml?: string;
  isSelected: boolean;
  assignedTo?: {
    serviceId: string;
    field: ContentAssignmentField;
    subserviceId?: string;
    subserviceField?: SubserviceAssignmentField;
  };
};

export type ContentAssignmentField = 
  | 'name'
  | 'description'
  | 'assumptions'
  | 'customer'
  | 'out'
  | 'deliverables'
  | 'implementation_language'
  | 'subservice';

export type SubserviceAssignmentField =
  | 'name'
  | 'description'
  | 'assumptions'
  | 'customer'
  | 'implementation_language';

export type DraftService = {
  id: string;
  name: string;
  description: string;
  hours?: number;
  price?: number;
  pricingType?: PricingType;
  languages: Languages;
  subservices: DraftSubservice[];
  assignedContentIds: string[];
};

export type DraftSubservice = {
  id: string;
  name: string;
  description: string;
  hours?: number;
  languages: {
    assumptions?: string;
    customer?: string;
    implementation_language?: string;
  };
  assignedContentIds: string[];
};

export type ContentAssignment = {
  serviceId: string;
  field: ContentAssignmentField;
  subserviceId?: string;
  subserviceField?: SubserviceAssignmentField;
};

export type BuilderState = {
  documentContent: ContentItem[];
  services: DraftService[];
  phases: Array<{ id: string; name: string }>;
  selectedContentIds: string[];
};
