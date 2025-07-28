import { Eye } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function FloatingVisibilityButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate({ to: "/visibility" })}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/30 shadow-2xl hover:bg-white/20 transition-all duration-300 hover:scale-110 hover:shadow-3xl z-50 group"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0px rgba(255,255,255,0.2)",
      }}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <Eye className="w-6 h-6 text-white/80 group-hover:text-white transition-colors duration-300" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </button>
  );
} 