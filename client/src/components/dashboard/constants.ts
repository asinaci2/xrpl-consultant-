import {
  MessageSquare, Heart, Radio, Gamepad2, Briefcase,
  Globe, Star, Zap, Shield, Code, Users, Rocket, Award, Target,
  type LucideIcon,
} from "lucide-react";

export const EXPERTISE_OPTIONS = [
  "XRPL", "TextRP", "Web3", "Blockchain", "NFT Strategy", "Community Growth",
  "DeFi", "Smart Contracts", "Tokenomics", "Marketing", "Social Media",
  "Content Creation", "Trading", "Technical Analysis", "Wallet Integration",
  "DAO Governance", "Crypto Education", "Ambassador", "Event Hosting",
];

export const ICON_MAP: Record<string, LucideIcon> = {
  MessageSquare, Heart, Radio, Gamepad2, Briefcase,
  Globe, Star, Zap, Shield, Code, Users, Rocket, Award, Target,
};

export const ICON_NAMES = ["Briefcase","MessageSquare","Heart","Radio","Gamepad2","Globe","Star","Zap","Shield","Code","Users","Rocket","Award","Target"];

export const COLOR_MAP: Record<string, string> = {
  "bg-green-500": "#22c55e",
  "bg-blue-500": "#3b82f6",
  "bg-purple-500": "#a855f7",
  "bg-yellow-500": "#eab308",
  "bg-red-500": "#ef4444",
  "bg-cyan-500": "#06b6d4",
  "bg-orange-500": "#f97316",
};
