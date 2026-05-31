"use client";

import React, { useState } from "react";
import { Toaster, toast } from "sonner";
import CVUploader from "@/components/CVUploader";
import AIChat from "@/components/AIChat";

export default function Dashboard() {
  const [isProcessed, setIsProcessed] = useState(false);

  const handleUploadSuccess = (summary: string) => {
    setIsProcessed(true);
    toast.success("Profile processed and indexed successfully!");
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 p-6">
      <Toaster position="top-center" />
      
      <CVUploader onUploadSuccess={handleUploadSuccess} />

      {/* Persistent interactive chat workspace displayed instantly upon ingestion sync */}
      {isProcessed && (
        <div className="max-w-6xl mx-auto mt-8">
          <AIChat />
        </div>
      )}
    </div>
  );
}