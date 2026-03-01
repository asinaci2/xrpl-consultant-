import { type LucideIcon } from "lucide-react";

export function FieldLabel({
  icon: Icon,
  children,
  required,
}: {
  icon?: LucideIcon;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="text-gray-300 text-sm font-medium flex items-center gap-1.5 mb-1">
      {Icon && <Icon className="w-3.5 h-3.5 text-green-400/50" />}
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}
