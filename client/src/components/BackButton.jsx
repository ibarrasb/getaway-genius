import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ label = "Back" }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
