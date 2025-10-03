"use client";

import { useRouter } from "next/navigation";
import { keycloak } from "@/lib/keycloak";

export default function Login() {
  const router = useRouter();

  const handleLogin = () => {
    // Since Keycloak is disabled, just do a mock login and redirect
    keycloak.login();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div>
          <h2 className="text-center text-3xl font-semibold text-gray-900">
            Sign in to Ledgerly
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Audit management system
          </p>
        </div>
        <div className="mt-8">
          <button
            onClick={handleLogin}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Sign in
          </button>
          <p className="mt-4 text-center text-xs text-gray-500">
            Demo mode - Keycloak authentication is disabled
          </p>
        </div>
      </div>
    </div>
  );
}
