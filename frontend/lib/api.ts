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
}

export const api = new ApiClient(API_BASE_URL);
