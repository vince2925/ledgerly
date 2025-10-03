"use client";

import { useState } from "react";

export default function Audits() {
  const [templates, setTemplates] = useState([]);

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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Audit Templates</h2>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              Create Template
            </button>
          </div>

          {templates.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <p className="text-gray-500">No templates yet. Create your first audit template.</p>
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
              <ul className="divide-y divide-gray-100">
                {templates.map((template: any) => (
                  <li key={template.id} className="p-4 hover:bg-gray-50">
                    {template.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
