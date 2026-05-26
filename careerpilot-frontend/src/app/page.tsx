"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "sonner";
import { UploadCloud, Loader2 } from "lucide-react";
// 1. Import your new Chat component
import AIChat from "@/components/AIChat"; 

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      toast.success(`Selected file: ${selectedFile.name}`);
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

      toast.success("CV successfully sent and processed by the backend!");
    } catch (error) {
      toast.error("Could not connect to the backend FastAPI server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col justify-center items-center p-6">
      <Toaster position="top-center" richColors />

      {/* Existing Uploader Card */}
      <Card className="w-full max-w-md bg-neutral-900 border-neutral-800 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-neutral-100">CareerPilot Dashboard</CardTitle>
          <CardDescription className="text-neutral-400">Pillar 2: Resume Intelligence Engine</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onClick={() => document.getElementById("cv-file-input")?.click()}
            className="border-2 border-dashed border-neutral-800 hover:border-neutral-700 rounded-xl p-8 text-center cursor-pointer bg-neutral-900/50 transition-all group"
          >
            <input
              id="cv-file-input"
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex flex-col items-center gap-3">
              <UploadCloud className="h-8 w-8 text-neutral-500 group-hover:text-neutral-400 transition-colors" />
              <p className="text-sm font-medium text-neutral-300">
                {file ? file.name : "Click to select a CV (PDF/DOCX)"}
              </p>
            </div>
          </div>

          {file && (
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setFile(null)} disabled={loading} className="border-neutral-800 text-neutral-400">
                Clear
              </Button>
              <Button onClick={uploadCV} disabled={loading} className="bg-neutral-100 text-neutral-950 hover:bg-neutral-200">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Process CV"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Added the Chat Component right here */}
      <AIChat />

    </div>
  );
}