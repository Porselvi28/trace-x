import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-18 h-18 rounded-2xl bg-[#F8EBEA] border border-[#A64B43] flex items-center justify-center text-[#A64B43] shadow-xs">
        <ShieldAlert className="w-10 h-10" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-[#342A23] font-mono">404 — ROUTE NOT FOUND</h1>
      <p className="text-sm text-[#796C60] max-w-md">
        The requested forensic route or evidence artifact does not exist within the TRACE X jurisdiction.
      </p>
      <Link
        to="/dashboard"
        className="btn-primary mt-2"
      >
        <ArrowLeft className="w-4 h-4" /> <span>Return to Command Dashboard</span>
      </Link>
    </div>
  );
};
