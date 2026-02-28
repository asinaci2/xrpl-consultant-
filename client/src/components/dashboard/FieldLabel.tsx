import { type LucideIcon } from "lucide-react";

export function FieldLabel({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <label className="text-gray-300 text-sm font-medium flex items-center gap-1.5 mb-1">
      <Icon className="w-3.5 h-3.5 text-green-400/50" />
      {children}
    </label>
  );
}
