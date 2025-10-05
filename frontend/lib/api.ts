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
}

export const api = new ApiClient(API_BASE_URL);
