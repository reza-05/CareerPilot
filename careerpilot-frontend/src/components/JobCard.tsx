"use client";
import { useState } from 'react';

// Define the structure for your job data
interface Job {
  title: string;
  url: string;
  score: number;
  reasoning: string;
}

export default function JobCard({ job }: { job: Job }) {
  const [show, setShow] = useState(false);
  const color = job.score > 80 ? "text-green-400 border-green-400" : "text-yellow-400 border-yellow-400";

  return (
    <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-lg text-white">{job.title}</h3>
        <span className={`px-2 py-1 border rounded text-xs ${color}`}>{job.score}% Match</span>
      </div>
      
      <button 
        onClick={() => setShow(!show)} 
        className="mt-4 text-blue-400 text-xs hover:underline"
      >
        {show ? "Hide AI Analysis" : "View AI Analysis"}
      </button>
      
      {show && (
        <p className="mt-4 text-neutral-300 text-sm italic">
          {job.reasoning}
        </p>
      )}
      
      <a 
        href={job.url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="mt-4 block text-blue-500 font-bold"
      >
        Apply Now
      </a>
    </div>
  );
}