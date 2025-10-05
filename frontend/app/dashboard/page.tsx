"use client";

import { useState, useEffect } from "react";
import { api, AuditTemplate, TemplateStatus } from "@/lib/api";

export default function Dashboard() {
  const [templates, setTemplates] = useState<AuditTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const templatesData = await api.getTemplates();
      setTemplates(templatesData);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalTemplates: templates.length,
    draftTemplates: templates.filter(t => t.status === TemplateStatus.DRAFT).length,
    activeTemplates: templates.filter(t => t.status === TemplateStatus.ACTIVE).length,
    archivedTemplates: templates.filter(t => t.status === TemplateStatus.ARCHIVED).length,
    recentTemplates: templates.slice(0, 5),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Ledgerly</h1>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/audits"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
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
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h2>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="bg-white overflow-hidden rounded-2xl shadow-sm border border-gray-100">
                  <div className="p-6">
                    <h3 className="text-sm font-medium text-gray-500">Total Templates</h3>
                    <p className="mt-2 text-3xl font-semibold text-blue-600">{stats.totalTemplates}</p>
                  </div>
                </div>
                <div className="bg-white overflow-hidden rounded-2xl shadow-sm border border-gray-100">
                  <div className="p-6">
                    <h3 className="text-sm font-medium text-gray-500">Draft</h3>
                    <p className="mt-2 text-3xl font-semibold text-gray-600">{stats.draftTemplates}</p>
                  </div>
                </div>
                <div className="bg-white overflow-hidden rounded-2xl shadow-sm border border-gray-100">
                  <div className="p-6">
                    <h3 className="text-sm font-medium text-gray-500">Active</h3>
                    <p className="mt-2 text-3xl font-semibold text-green-600">{stats.activeTemplates}</p>
                  </div>
                </div>
                <div className="bg-white overflow-hidden rounded-2xl shadow-sm border border-gray-100">
                  <div className="p-6">
                    <h3 className="text-sm font-medium text-gray-500">Archived</h3>
                    <p className="mt-2 text-3xl font-semibold text-red-600">{stats.archivedTemplates}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Templates</h3>
                {stats.recentTemplates.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No templates yet. <a href="/audits" className="text-blue-600 hover:underline">Create your first template</a>
                  </p>
                ) : (
                  <div className="space-y-3">
                    {stats.recentTemplates.map((template) => (
                      <div key={template.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{template.name}</h4>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              template.status === TemplateStatus.DRAFT ? "bg-gray-100 text-gray-800" :
                              template.status === TemplateStatus.ACTIVE ? "bg-green-100 text-green-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {template.status.charAt(0).toUpperCase() + template.status.slice(1)}
                            </span>
                          </div>
                          {template.description && (
                            <p className="mt-1 text-sm text-gray-500">{template.description}</p>
                          )}
                          {template.tags && template.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {template.tags.map((tag, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <a href="/audits" className="ml-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <a href="/audits" className="block">
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 hover:bg-blue-100 transition-colors">
                    <h3 className="text-lg font-semibold text-blue-900">Create Template</h3>
                    <p className="mt-2 text-sm text-blue-700">Start building a new audit template</p>
                  </div>
                </a>
                <a href="/reports" className="block">
                  <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 hover:bg-green-100 transition-colors">
                    <h3 className="text-lg font-semibold text-green-900">Generate Report</h3>
                    <p className="mt-2 text-sm text-green-700">Create a new audit report from a template</p>
                  </div>
                </a>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
