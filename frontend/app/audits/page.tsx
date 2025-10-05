"use client";

import { useState, useEffect } from "react";
import { api, AuditTemplate, AuditTemplateCreate, TemplateStatus, TemplateComment, TemplateVersion, Attachment } from "@/lib/api";

export default function Audits() {
  const [templates, setTemplates] = useState<AuditTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<AuditTemplateCreate>({
    name: "",
    description: "",
    content: "",
    tags: [],
    status: TemplateStatus.DRAFT,
  });
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<TemplateStatus | null>(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedTemplateForComments, setSelectedTemplateForComments] = useState<AuditTemplate | null>(null);
  const [comments, setComments] = useState<TemplateComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [selectedTemplateForVersions, setSelectedTemplateForVersions] = useState<AuditTemplate | null>(null);
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [selectedVersionContent, setSelectedVersionContent] = useState<TemplateVersion | null>(null);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [selectedTemplateForAttachments, setSelectedTemplateForAttachments] = useState<AuditTemplate | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTemplates();
      setTemplates(data);
    } catch (err) {
      setError("Failed to load templates. Please try again.");
      console.error("Error fetching templates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.content) {
      setError("Name and content are required");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await api.createTemplate(formData);
      setShowModal(false);
      setFormData({ name: "", description: "", content: "", tags: [], status: TemplateStatus.DRAFT });
      setTagInput("");
      await fetchTemplates();
    } catch (err) {
      setError("Failed to create template. Please try again.");
      console.error("Error creating template:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return;
    }

    try {
      setError(null);
      await api.deleteTemplate(id);
      await fetchTemplates();
    } catch (err) {
      setError("Failed to delete template. Please try again.");
      console.error("Error deleting template:", err);
    }
  };

  const handleViewComments = async (template: AuditTemplate) => {
    setSelectedTemplateForComments(template);
    setShowCommentsModal(true);
    try {
      setLoadingComments(true);
      const commentsData = await api.getComments(template.id);
      setComments(commentsData);
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTemplateForComments) return;

    try {
      await api.createComment(selectedTemplateForComments.id, { content: newComment });
      setNewComment("");
      const commentsData = await api.getComments(selectedTemplateForComments.id);
      setComments(commentsData);
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!selectedTemplateForComments) return;

    try {
      await api.deleteComment(selectedTemplateForComments.id, commentId);
      const commentsData = await api.getComments(selectedTemplateForComments.id);
      setComments(commentsData);
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  const handleViewVersions = async (template: AuditTemplate) => {
    setSelectedTemplateForVersions(template);
    setShowVersionsModal(true);
    setSelectedVersionContent(null);
    try {
      setLoadingVersions(true);
      const versionsData = await api.getVersions(template.id);
      setVersions(versionsData);
    } catch (err) {
      console.error("Error fetching versions:", err);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleViewVersionContent = async (version: TemplateVersion) => {
    setSelectedVersionContent(version);
  };

  const handleRestoreVersion = async (versionNumber: number) => {
    if (!selectedTemplateForVersions) return;
    if (!confirm(`Are you sure you want to restore to version ${versionNumber}?`)) return;

    try {
      await api.restoreVersion(selectedTemplateForVersions.id, versionNumber);
      setShowVersionsModal(false);
      setSelectedVersionContent(null);
      await fetchTemplates();
    } catch (err) {
      console.error("Error restoring version:", err);
    }
  };

  const handleViewAttachments = async (template: AuditTemplate) => {
    setSelectedTemplateForAttachments(template);
    setShowAttachmentsModal(true);
    try {
      setLoadingAttachments(true);
      const attachmentsData = await api.getTemplateAttachments(template.id);
      setAttachments(attachmentsData);
    } catch (err) {
      console.error("Error fetching attachments:", err);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTemplateForAttachments || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    try {
      setUploadingFile(true);
      await api.uploadTemplateAttachment(selectedTemplateForAttachments.id, file);
      const attachmentsData = await api.getTemplateAttachments(selectedTemplateForAttachments.id);
      setAttachments(attachmentsData);
      e.target.value = "";
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("Failed to upload file");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDownloadAttachment = async (attachmentId: number) => {
    if (!selectedTemplateForAttachments) return;

    try {
      await api.downloadTemplateAttachment(selectedTemplateForAttachments.id, attachmentId);
    } catch (err) {
      console.error("Error downloading attachment:", err);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!selectedTemplateForAttachments) return;
    if (!confirm("Are you sure you want to delete this attachment?")) return;

    try {
      await api.deleteTemplateAttachment(selectedTemplateForAttachments.id, attachmentId);
      const attachmentsData = await api.getTemplateAttachments(selectedTemplateForAttachments.id);
      setAttachments(attachmentsData);
    } catch (err) {
      console.error("Error deleting attachment:", err);
    }
  };

  // Get all unique tags from templates
  const allTags = Array.from(
    new Set(templates.flatMap((t) => t.tags || []))
  ).sort();

  // Filter templates by selected tag and status
  const filteredTemplates = templates.filter((t) => {
    const matchesTag = selectedTag ? t.tags?.includes(selectedTag) : true;
    const matchesStatus = selectedStatus ? t.status === selectedStatus : true;
    return matchesTag && matchesStatus;
  });

  // Get status badge color
  const getStatusColor = (status: TemplateStatus) => {
    switch (status) {
      case TemplateStatus.DRAFT:
        return "bg-gray-100 text-gray-800";
      case TemplateStatus.ACTIVE:
        return "bg-green-100 text-green-800";
      case TemplateStatus.ARCHIVED:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <a href="/dashboard" className="text-xl font-semibold text-gray-900">
                Ledgerly
              </a>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/audits"
                className="text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Audits
              </a>
              <a
                href="/reports"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Reports
              </a>
              <button className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-900">Audit Templates</h2>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Create Template
              </button>
            </div>
            <div className="space-y-2">
              {allTags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-700">Filter by tag:</span>
                  <button
                    onClick={() => setSelectedTag(null)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      selectedTag === null
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        selectedTag === tag
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700">Filter by status:</span>
                <button
                  onClick={() => setSelectedStatus(null)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    selectedStatus === null
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All
                </button>
                {Object.values(TemplateStatus).map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      selectedStatus === status
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <p className="text-gray-500">Loading templates...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <p className="text-gray-500">
                {selectedTag
                  ? `No templates found with tag "${selectedTag}".`
                  : "No templates yet. Create your first audit template."}
              </p>
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
              <ul className="divide-y divide-gray-100">
                {filteredTemplates.map((template) => (
                  <li key={template.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(template.status)}`}>
                            {template.status.charAt(0).toUpperCase() + template.status.slice(1)}
                          </span>
                        </div>
                        {template.description && (
                          <p className="mt-1 text-sm text-gray-500">{template.description}</p>
                        )}
                        {template.tags && template.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {template.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="mt-2 text-xs text-gray-400">
                          Created: {new Date(template.created_at).toLocaleDateString()} | Version: {template.version}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleViewVersions(template)}
                          className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                        >
                          History
                        </button>
                        <button
                          onClick={() => handleViewAttachments(template)}
                          className="text-green-600 hover:text-green-700 text-sm font-medium"
                        >
                          Files
                        </button>
                        <button
                          onClick={() => handleViewComments(template)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Comments
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 my-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Template</h3>
            <form onSubmit={handleCreateTemplate}>
              <div className="space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Financial Audit 2024"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of this template"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Content *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter the audit template content here..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && tagInput.trim()) {
                            e.preventDefault();
                            if (!formData.tags?.includes(tagInput.trim())) {
                              setFormData({ ...formData, tags: [...(formData.tags || []), tagInput.trim()] });
                            }
                            setTagInput("");
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Add a tag (press Enter)"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
                            setFormData({ ...formData, tags: [...(formData.tags || []), tagInput.trim()] });
                            setTagInput("");
                          }
                        }}
                        className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                      >
                        Add
                      </button>
                    </div>
                    {formData.tags && formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded text-sm bg-blue-100 text-blue-800"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  tags: formData.tags?.filter((_, i) => i !== index),
                                });
                              }}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as TemplateStatus })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {Object.values(TemplateStatus).map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ name: "", description: "", content: "", tags: [], status: TemplateStatus.DRAFT });
                    setTagInput("");
                    setError(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Creating..." : "Create Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCommentsModal && selectedTemplateForComments && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Comments - {selectedTemplateForComments.name}
              </h3>
              <button
                onClick={() => {
                  setShowCommentsModal(false);
                  setSelectedTemplateForComments(null);
                  setComments([]);
                  setNewComment("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
              {loadingComments ? (
                <p className="text-center text-gray-500 py-4">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{comment.author}</p>
                        <p className="mt-1 text-sm text-gray-700">{comment.content}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {new Date(comment.created_at).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newComment.trim()) {
                    handleAddComment();
                  }
                }}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {showVersionsModal && selectedTemplateForVersions && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full p-6 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Version History - {selectedTemplateForVersions.name}
              </h3>
              <button
                onClick={() => {
                  setShowVersionsModal(false);
                  setSelectedTemplateForVersions(null);
                  setVersions([]);
                  setSelectedVersionContent(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="flex gap-4 flex-1 overflow-hidden">
              <div className="w-1/3 border-r border-gray-200 pr-4 overflow-y-auto">
                {loadingVersions ? (
                  <p className="text-center text-gray-500 py-4">Loading versions...</p>
                ) : versions.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    No version history yet. Edit this template to create versions.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {versions.map((version) => (
                      <div
                        key={version.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          selectedVersionContent?.id === version.id
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                        }`}
                        onClick={() => handleViewVersionContent(version)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              Version {version.version}
                            </p>
                            <p className="text-xs text-gray-500">
                              by {version.changed_by}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(version.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                {selectedVersionContent ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Name</h4>
                      <p className="text-sm text-gray-900">{selectedVersionContent.name}</p>
                    </div>

                    {selectedVersionContent.description && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                        <p className="text-sm text-gray-900">{selectedVersionContent.description}</p>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        selectedVersionContent.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        selectedVersionContent.status === 'active' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedVersionContent.status.charAt(0).toUpperCase() + selectedVersionContent.status.slice(1)}
                      </span>
                    </div>

                    {selectedVersionContent.tags && selectedVersionContent.tags.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedVersionContent.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Content</h4>
                      <pre className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                        {selectedVersionContent.content}
                      </pre>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleRestoreVersion(selectedVersionContent.version)}
                        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                      >
                        Restore This Version
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Select a version to view details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAttachmentsModal && selectedTemplateForAttachments && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Attachments - {selectedTemplateForAttachments.name}
              </h3>
              <button
                onClick={() => {
                  setShowAttachmentsModal(false);
                  setSelectedTemplateForAttachments(null);
                  setAttachments([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <label
                htmlFor="file-upload"
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white ${
                  uploadingFile
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 cursor-pointer"
                }`}
              >
                {uploadingFile ? "Uploading..." : "Upload File"}
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                />
              </label>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loadingAttachments ? (
                <p className="text-center text-gray-500 py-4">Loading attachments...</p>
              ) : attachments.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  No attachments yet. Upload your first file!
                </p>
              ) : (
                attachments.map((attachment) => (
                  <div key={attachment.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{attachment.original_filename}</p>
                        <p className="text-xs text-gray-500">
                          {(attachment.file_size / 1024).toFixed(2)} KB | {attachment.mime_type}
                        </p>
                        <p className="text-xs text-gray-400">
                          Uploaded by {attachment.uploaded_by} on {new Date(attachment.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleDownloadAttachment(attachment.id)}
                          className="text-green-600 hover:text-green-700 text-sm"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => handleDeleteAttachment(attachment.id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
