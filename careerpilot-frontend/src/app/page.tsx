"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "sonner";
import { UploadCloud, Loader2 } from "lucide-react";
import AIChat from "@/components/AIChat";

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadCV = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/api/upload-cv", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      setIsProcessed(true);
      toast.success("CV processed successfully!");
    } catch (error) {
      toast.error("Backend error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col items-center justify-center p-6 gap-8">
      <Toaster position="top-center" />
      
      {/* This Card will now show up */}
      <Card className="w-full max-w-md bg-neutral-900 border-neutral-800 text-neutral-50 shadow-xl">
  <CardHeader>
    <CardTitle className="text-white">CareerPilot</CardTitle>
    <CardDescription className="text-neutral-300">
      Upload your CV to start
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Style the input text specifically */}
    <input 
      type="file" 
      onChange={handleFileChange} 
      className="text-white file:text-white file:bg-neutral-800 file:border-0 file:rounded-md file:px-4 file:py-2" 
    />
    <Button onClick={uploadCV} className="mt-4 w-full bg-white text-black hover:bg-neutral-200">
      {loading ? "Processing..." : "Process CV"}
    </Button>
  </CardContent>
</Card>

      {isProcessed && <AIChat />}
    </div>
  );
}