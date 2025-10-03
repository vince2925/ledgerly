"use client";

export default function Dashboard() {
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white overflow-hidden rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Total Audits</h3>
                <p className="mt-2 text-3xl font-semibold text-blue-600">0</p>
              </div>
            </div>
            <div className="bg-white overflow-hidden rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Templates</h3>
                <p className="mt-2 text-3xl font-semibold text-blue-600">0</p>
              </div>
            </div>
            <div className="bg-white overflow-hidden rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Reports</h3>
                <p className="mt-2 text-3xl font-semibold text-blue-600">0</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
