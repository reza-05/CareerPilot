import React, { useState } from 'react';

const CVUploader = ({ onUploadSuccess }: { onUploadSuccess: (msg: string) => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/upload-cv', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setSummary(data.summary);
      onUploadSuccess(data.summary);
    } catch (error) {
      setSummary("Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200 mb-6">
      <h2 className="text-lg font-semibold mb-4">Upload your CV</h2>
      <input type="file" onChange={handleFileChange} className="mb-4 block w-full text-sm text-gray-500" />
      {file && <button onClick={handleUpload} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Upload</button>}
      {loading && <p className="mt-2 text-sm text-gray-500">Processing...</p>}
      {summary && <p className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{summary}</p>}
    </div>
  );
};

export default CVUploader;