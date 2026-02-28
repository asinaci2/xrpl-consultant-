import { Eye, type LucideIcon } from "lucide-react";

export function SectionBanner({
  icon: Icon,
  iconBg,
  iconColor,
  borderColor,
  section,
  description,
  slug,
  anchor,
}: {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  section: string;
  description: string;
  slug: string;
  anchor?: string;
}) {
  const href = `/c/${slug}${anchor ? `#${anchor}` : ""}`;
  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border-l-4 ${borderColor} bg-black/50`}
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderRight: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className={`${iconBg} rounded-lg p-2.5 shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold">{section}</p>
        <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{description}</p>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors whitespace-nowrap"
      >
        <Eye className="w-3.5 h-3.5" />
        View on page
      </a>
    </div>
  );
}
