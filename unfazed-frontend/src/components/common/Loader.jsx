import React from "react";
import { Loader2 } from "lucide-react";

const Loader = ({ label = "Loading practice workspace..." }) => {
  return (
    <div className="loading-state flex flex-col items-center justify-center p-12 text-slate-500 min-h-[300px]">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
      <span className="text-sm font-medium text-slate-600">{label}</span>
    </div>
  );
};

export default Loader;
