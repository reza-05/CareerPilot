import { Suspense } from "react";
import AuthPageClient from "@/components/AuthPageClient";

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <AuthPageClient />
    </Suspense>
  );
}

function AuthFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-blue-100 border-b-[#1E3A8A]" />
        <p className="text-sm font-bold text-slate-600">Preparing secure sign in...</p>
      </div>
    </main>
  );
}
