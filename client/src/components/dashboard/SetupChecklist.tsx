import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConsultantProfile } from "./types";
import { useAdminSlug, useSlugParam } from "./context";
import type { ConsultantService } from "@shared/schema";
import type { ProjectEntry } from "./types";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  tab: string;
  done: boolean;
}

interface Props {
  profile: ConsultantProfile | undefined;
  onNavigate: (tab: string) => void;
}

export function SetupChecklist({ profile, onNavigate }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const sp = useSlugParam();
  const override = useAdminSlug();

  const { data: services = [] } = useQuery<ConsultantService[]>({
    queryKey: ["/api/dashboard/services", override],
    queryFn: () =>
      fetch(`/api/dashboard/services${sp}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!profile,
  });

  const { data: projects = [] } = useQuery<ProjectEntry[]>({
    queryKey: ["/api/dashboard/projects", override],
    queryFn: () =>
      fetch(`/api/dashboard/projects${sp}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!profile,
  });

  if (!profile) return null;

  const items: ChecklistItem[] = [
    {
      id: "bio",
      label: "Add your bio & tagline",
      description: "Tell visitors who you are and what you do.",
      tab: "profile",
      done: !!(profile.bio?.trim() && profile.tagline?.trim()),
    },
    {
      id: "service-description",
      label: "Write your service description",
      description: "The intro text visitors see at the top of your Services section.",
      tab: "services",
      done: !!(profile.expertiseStatement?.trim()),
    },
    {
      id: "ecosystem",
      label: "Select ecosystem focus areas",
      description: "Which XRPL ecosystem categories do you work in?",
      tab: "services",
      done: (profile.ecosystemAlignments?.length ?? 0) > 0,
    },
    {
      id: "expertise",
      label: "Choose your core expertise skills",
      description: "Skill badges shown on your profile and used for directory filtering.",
      tab: "services",
      done: (profile.specialties?.length ?? 0) > 0,
    },
    {
      id: "service-entry",
      label: "Add a named service offering",
      description: "Specific services you offer — these appear as cards on your profile.",
      tab: "services",
      done: services.length > 0,
    },
    {
      id: "project",
      label: "Add a project",
      description: "Showcase a project or case study to build credibility.",
      tab: "projects",
      done: projects.length > 0,
    },
    {
      id: "chat",
      label: "Link your chat widget",
      description: "Connect your TextRP room so visitors can reach you directly.",
      tab: "chat-profile",
      done: !!(profile.profileRoomId?.trim()),
    },
  ];

  const doneCount = items.filter(i => i.done).length;
  const total = items.length;
  const allDone = doneCount === total;
  const pct = Math.round((doneCount / total) * 100);

  if (allDone) {
    return (
      <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3 flex items-center gap-3" data-testid="checklist-complete">
        <PartyPopper className="w-4 h-4 text-green-400 shrink-0" />
        <p className="text-green-400 text-sm font-mono">Profile complete — your page is fully set up!</p>
        <a href={`/c/${profile.slug}`} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-green-400/70 hover:text-green-400 underline underline-offset-2 font-mono shrink-0">
          View profile →
        </a>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-purple-500/20 bg-purple-500/5" data-testid="section-setup-checklist">
      <button
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm group"
        data-testid="button-toggle-checklist"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-purple-300 font-semibold">Profile Setup</span>
          <span className="text-gray-500 text-xs font-mono">{doneCount} of {total} complete</span>
          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-purple-400/60 font-mono">{pct}%</span>
          </div>
        </div>
        {collapsed
          ? <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
          : <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
        }
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-2" data-testid="checklist-items">
          {items.map(item => (
            <div
              key={item.id}
              className={`flex items-start gap-3 rounded-lg px-3 py-2.5 border transition-colors ${
                item.done
                  ? "border-green-500/10 bg-green-500/5 opacity-60"
                  : "border-purple-500/10 bg-black/30 hover:border-purple-500/20"
              }`}
              data-testid={`checklist-item-${item.id}`}
            >
              {item.done
                ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                : <Circle className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
              }
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.done ? "text-gray-500 line-through" : "text-white"}`}>
                  {item.label}
                </p>
                {!item.done && (
                  <p className="text-xs text-gray-600 mt-0.5">{item.description}</p>
                )}
              </div>
              {!item.done && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onNavigate(item.tab)}
                  className="shrink-0 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 h-7 px-2 font-mono"
                  data-testid={`button-goto-${item.id}`}
                >
                  Go →
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
