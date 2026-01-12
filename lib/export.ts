import type { ParsedSOW, Service, Subservice } from '@/types/sow';

type ScopeStackProjectService = {
  data: {
    type: 'project-services';
    attributes: {
      name: string;
      quantity: number;
      'override-hours': number;
      'task-source': 'custom';
      'service-type': 'professional_services';
      'payment-frequency': 'one_time';
      position: number;
      'service-description': string;
      languages: Record<string, string>;
    };
    relationships: {
      project: {
        data: { type: 'projects'; id: string };
      };
    };
  };
};

type ScopeStackProjectSubservice = {
  data: {
    type: 'project-subservices';
    attributes: {
      name: string;
      quantity: number;
      'override-hours': number;
      'service-description': string;
      'task-source': 'custom';
      languages: Record<string, string>;
    };
    relationships: {
      'project-service': {
        data: { type: 'project-services'; id: string };
      };
    };
  };
};

type ExportResult = {
  services: ScopeStackProjectService[];
  subservices: ScopeStackProjectSubservice[];
  manifest: {
    fileName: string;
    exportedAt: string;
    servicesCount: number;
    subservicesCount: number;
    projectIdPlaceholder: string;
  };
};

export function exportToScopeStack(
  data: ParsedSOW,
  projectId: string = '<project-id>'
): ExportResult {
  const services: ScopeStackProjectService[] = [];
  const subservices: ScopeStackProjectSubservice[] = [];

  data.services.forEach((service, index) => {
    // Build service payload
    const servicePayload = buildServicePayload(service, projectId, index);
    services.push(servicePayload);

    // Build subservice payloads
    service.subservices.forEach((sub) => {
      const subPayload = buildSubservicePayload(sub, service.id);
      subservices.push(subPayload);
    });
  });

  return {
    services,
    subservices,
    manifest: {
      fileName: data.fileName,
      exportedAt: new Date().toISOString(),
      servicesCount: services.length,
      subservicesCount: subservices.length,
      projectIdPlaceholder: projectId,
    },
  };
}

function buildServicePayload(
  service: Service,
  projectId: string,
  position: number
): ScopeStackProjectService {
  return {
    data: {
      type: 'project-services',
      attributes: {
        name: service.name,
        quantity: service.quantity || 1,
        'override-hours': service.hours || 0,
        'task-source': 'custom',
        'service-type': 'professional_services',
        'payment-frequency': 'one_time',
        position,
        'service-description': service.description || '',
        languages: buildLanguagesObject(service.languages),
      },
      relationships: {
        project: {
          data: { type: 'projects', id: projectId },
        },
      },
    },
  };
}

function buildSubservicePayload(
  subservice: Subservice,
  serviceId: string
): ScopeStackProjectSubservice {
  return {
    data: {
      type: 'project-subservices',
      attributes: {
        name: subservice.name,
        quantity: subservice.quantity || 1,
        'override-hours': subservice.hours || 0,
        'service-description': subservice.description || '',
        'task-source': 'custom',
        languages: buildLanguagesObject(subservice.languages),
      },
      relationships: {
        'project-service': {
          data: { type: 'project-services', id: serviceId },
        },
      },
    },
  };
}

function buildLanguagesObject(languages: Service['languages']): Record<string, string> {
  const result: Record<string, string> = {};
  
  const mapping: Record<string, string> = {
    assumptions: 'assumptions',
    customer: 'customer',
    out: 'out',
    implementation_language: 'implementation_language',
    deliverables: 'deliverables',
    operate: 'operate',
    design_language: 'design_language',
    planning_language: 'planning_language',
    internal_only: 'internal_only',
    service_level_agreement: 'service_level_agreement',
  };

  for (const [key, apiKey] of Object.entries(mapping)) {
    const value = languages[key as keyof typeof languages];
    if (value && value.trim()) {
      result[apiKey] = value;
    }
  }

  return result;
}

export function generateExportFileName(originalName: string): string {
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${baseName}-scopestack-${timestamp}.json`;
}
