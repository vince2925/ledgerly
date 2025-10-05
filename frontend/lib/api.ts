import { keycloak } from "./keycloak";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export enum TemplateStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  ARCHIVED = "archived",
}

export interface AuditTemplate {
  id: number;
  name: string;
  description?: string;
  content: string;
  tags: string[];
  status: TemplateStatus;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface AuditTemplateCreate {
  name: string;
  description?: string;
  content: string;
  tags?: string[];
  status?: TemplateStatus;
}

export interface AuditReportCreate {
  template_id: number;
  title: string;
  due_date?: string;
}

export interface TemplateComment {
  id: number;
  template_id: number;
  author: string;
  content: string;
  created_at: string;
}

export interface TemplateCommentCreate {
  content: string;
}

export interface TemplateVersion {
  id: number;
  template_id: number;
  version: number;
  name: string;
  description?: string;
  content: string;
  tags: string[];
  status: string;
  changed_by: string;
  created_at: string;
}

export interface Attachment {
  id: number;
  template_id?: number;
  report_id?: number;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
}

export interface DashboardStats {
  overview: {
    total_templates: number;
    total_reports: number;
    total_comments: number;
    total_attachments: number;
    recent_templates_30d: number;
    recent_reports_30d: number;
    total_storage_bytes: number;
    total_storage_mb: number;
  };
  templates_by_status: {
    draft: number;
    active: number;
    archived: number;
  };
  trends: {
    templates_per_month: Array<{
      year: number;
      month: number;
      count: number;
      label: string;
    }>;
    reports_per_month: Array<{
      year: number;
      month: number;
      count: number;
      label: string;
    }>;
  };
  top_templates: {
    most_commented: Array<{
      id: number;
      name: string;
      comments: number;
    }>;
    most_attachments: Array<{
      id: number;
      name: string;
      attachments: number;
    }>;
  };
}

export interface Activity {
  type: string;
  timestamp: string;
  data: any;
}

export interface ChecklistItem {
  id: number;
  checklist_id: number;
  title: string;
  description?: string;
  is_completed: boolean;
  is_mandatory: boolean;
  order: number;
  depends_on_id?: number;
  completed_by?: string;
  completed_at?: string;
  due_date?: string;
  created_at: string;
}

export interface Checklist {
  id: number;
  template_id?: number;
  report_id?: number;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  items: ChecklistItem[];
}

export interface ChecklistCreate {
  name: string;
  description?: string;
  template_id?: number;
  report_id?: number;
}

export interface ChecklistItemCreate {
  title: string;
  description?: string;
  is_mandatory?: boolean;
  order?: number;
  depends_on_id?: number;
  due_date?: string;
}

export interface ChecklistItemUpdate {
  title?: string;
  description?: string;
  is_completed?: boolean;
  is_mandatory?: boolean;
  order?: number;
  depends_on_id?: number;
  due_date?: string;
}

export interface ChecklistProgress {
  checklist_id: number;
  total_items: number;
  completed_items: number;
  mandatory_items: number;
  completed_mandatory: number;
  completion_percentage: number;
  mandatory_completion_percentage: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      ...keycloak.getAuthHeader(),
    };
  }

  async getTemplates(): Promise<AuditTemplate[]> {
    const response = await fetch(`${this.baseUrl}/audit/templates`);
    if (!response.ok) throw new Error("Failed to fetch templates");
    return response.json();
  }

  async getTemplate(id: number): Promise<AuditTemplate> {
    const response = await fetch(`${this.baseUrl}/audit/templates/${id}`);
    if (!response.ok) throw new Error("Failed to fetch template");
    return response.json();
  }

  async createTemplate(data: AuditTemplateCreate): Promise<AuditTemplate> {
    const response = await fetch(`${this.baseUrl}/audit/templates`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create template");
    return response.json();
  }

  async updateTemplate(id: number, data: Partial<AuditTemplateCreate>): Promise<AuditTemplate> {
    const response = await fetch(`${this.baseUrl}/audit/templates/${id}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update template");
    return response.json();
  }

  async deleteTemplate(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/audit/templates/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete template");
  }

  async generateReport(data: AuditReportCreate): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/audit/reports/generate`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to generate report");
    return response.blob();
  }

  async healthCheck(): Promise<{ status: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) throw new Error("Health check failed");
    return response.json();
  }

  async getComments(templateId: number): Promise<TemplateComment[]> {
    const response = await fetch(`${this.baseUrl}/audit/templates/${templateId}/comments/`);
    if (!response.ok) throw new Error("Failed to fetch comments");
    return response.json();
  }

  async createComment(templateId: number, data: TemplateCommentCreate): Promise<TemplateComment> {
    const response = await fetch(`${this.baseUrl}/audit/templates/${templateId}/comments/`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create comment");
    return response.json();
  }

  async deleteComment(templateId: number, commentId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/audit/templates/${templateId}/comments/${commentId}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete comment");
  }

  async getVersions(templateId: number): Promise<TemplateVersion[]> {
    const response = await fetch(`${this.baseUrl}/audit/templates/${templateId}/versions/`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch versions");
    return response.json();
  }

  async getVersion(templateId: number, versionNumber: number): Promise<TemplateVersion> {
    const response = await fetch(`${this.baseUrl}/audit/templates/${templateId}/versions/${versionNumber}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch version");
    return response.json();
  }

  async restoreVersion(templateId: number, versionNumber: number): Promise<{ message: string; current_version: number }> {
    const response = await fetch(`${this.baseUrl}/audit/templates/${templateId}/versions/${versionNumber}/restore`, {
      method: "POST",
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to restore version");
    return response.json();
  }

  async getTemplateAttachments(templateId: number): Promise<Attachment[]> {
    const response = await fetch(`${this.baseUrl}/audit/templates/${templateId}/attachments`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch attachments");
    return response.json();
  }

  async uploadTemplateAttachment(templateId: number, file: File): Promise<Attachment> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${this.baseUrl}/audit/templates/${templateId}/attachments`, {
      method: "POST",
      headers: keycloak.getAuthHeader(),
      body: formData,
    });
    if (!response.ok) throw new Error("Failed to upload attachment");
    return response.json();
  }

  async downloadTemplateAttachment(templateId: number, attachmentId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/audit/templates/${templateId}/attachments/${attachmentId}/download`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to download attachment");

    const blob = await response.blob();
    const contentDisposition = response.headers.get("content-disposition");
    const filename = contentDisposition
      ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
      : "download";

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async deleteTemplateAttachment(templateId: number, attachmentId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/audit/templates/${templateId}/attachments/${attachmentId}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete attachment");
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(`${this.baseUrl}/analytics/dashboard`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch dashboard stats");
    return response.json();
  }

  async getRecentActivity(limit: number = 20): Promise<Activity[]> {
    const response = await fetch(`${this.baseUrl}/analytics/activity?limit=${limit}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch activity");
    return response.json();
  }

  async createChecklist(data: ChecklistCreate): Promise<Checklist> {
    const response = await fetch(`${this.baseUrl}/checklists/`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create checklist");
    return response.json();
  }

  async getChecklist(checklistId: number): Promise<Checklist> {
    const response = await fetch(`${this.baseUrl}/checklists/${checklistId}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch checklist");
    return response.json();
  }

  async getTemplateChecklists(templateId: number): Promise<Checklist[]> {
    const response = await fetch(`${this.baseUrl}/checklists/template/${templateId}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch checklists");
    return response.json();
  }

  async deleteChecklist(checklistId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/checklists/${checklistId}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete checklist");
  }

  async createChecklistItem(checklistId: number, data: ChecklistItemCreate): Promise<ChecklistItem> {
    const response = await fetch(`${this.baseUrl}/checklists/${checklistId}/items`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create checklist item");
    return response.json();
  }

  async updateChecklistItem(checklistId: number, itemId: number, data: ChecklistItemUpdate): Promise<ChecklistItem> {
    const response = await fetch(`${this.baseUrl}/checklists/${checklistId}/items/${itemId}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to update checklist item");
    }
    return response.json();
  }

  async deleteChecklistItem(checklistId: number, itemId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/checklists/${checklistId}/items/${itemId}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete checklist item");
  }

  async getChecklistProgress(checklistId: number): Promise<ChecklistProgress> {
    const response = await fetch(`${this.baseUrl}/checklists/${checklistId}/progress`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch checklist progress");
    return response.json();
  }
}

export const api = new ApiClient(API_BASE_URL);
