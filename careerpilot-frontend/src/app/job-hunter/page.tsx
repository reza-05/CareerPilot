"use client";
import { useState } from 'react';
import JobCard from '@/components/JobCard';

export default function JobHunterPage() {
  const [jobs, setJobs] = useState([]);
 const hunt = async () => {
  try {
    const res = await fetch('http://127.0.0.1:8000/api/search-jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: "Software Engineer" })
    });
    
    const data = await res.json();
    console.log("Data from backend:", data); // Check your Browser Console (F12)
    
    // Ensure we are setting the state correctly
    if (data.jobs) {
      setJobs(data.jobs);
    } else {
      console.error("No jobs found in response:", data);
    }
  } catch (error) {
    console.error("Fetch failed:", error);
  }
};
  return (
    <div className="p-10 text-white">
      <button onClick={hunt} className="bg-white text-black px-6 py-2 rounded-lg font-bold">Hunt Jobs</button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        {jobs.map((j, i) => <JobCard key={i} job={j} />)}
      </div>
    </div>
  );
}