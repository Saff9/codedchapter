import { FaGithub, FaYoutube, FaTelegram, FaDiscord, FaHeart } from "react-icons/fa6";
import { SiSubstack } from "react-icons/si";

export const DISCORD_URL = "https://discord.gg/qHWgfN4bYN";
export const GITHUB_URL = "https://github.com/codedchapter";
export const YOUTUBE_URL = "https://www.youtube.com/@CodedChapter";
export const TELEGRAM_URL = "https://t.me/CodedChapter";
export const SUBSTACK_URL = import.meta.env.VITE_SUBSTACK_URL || "https://codedchapter.substack.com";
export const RAZORPAY_URL = "https://razorpay.me/@CodeChap?amount=KxK8ikz%2BGFZ8lMDydVeeuA%3D%3D";

export interface SocialLinkBasic {
  name: string;
  url: string;
  icon: React.ReactNode;
  color: string;
}

export interface SocialLinkFull {
  name: string;
  url: string;
  icon: React.ReactNode;
  gradient: string;
  borderColor: string;
  shadowColor: string;
  description: string;
}

export function getFooterSocials() {
  return [
    { name: "GitHub", url: GITHUB_URL, icon: FaGithub, label: "GitHub" },
    { name: "YouTube", url: YOUTUBE_URL, icon: FaYoutube, label: "YouTube" },
    { name: "Telegram", url: TELEGRAM_URL, icon: FaTelegram, label: "Telegram" },
    { name: "Discord", url: DISCORD_URL, icon: FaDiscord, label: "Discord" },
    { name: "Substack", url: SUBSTACK_URL, icon: SiSubstack, label: "Substack" },
  ];
}

export function getAboutSocials(): SocialLinkBasic[] {
  return [
    { name: "GitHub", url: GITHUB_URL, icon: <FaGithub className="w-4 h-4" />, color: "hover:text-primary hover:border-primary/40" },
    { name: "YouTube", url: YOUTUBE_URL, icon: <FaYoutube className="w-4 h-4 text-red-500" />, color: "hover:text-red-400 hover:border-red-400/40" },
    { name: "Telegram", url: TELEGRAM_URL, icon: <FaTelegram className="w-4 h-4 text-[#26A5E4]" />, color: "hover:text-[#26A5E4] hover:border-[#26A5E4]/40" },
    { name: "Discord", url: DISCORD_URL, icon: <FaDiscord className="w-4 h-4 text-[#5865F2]" />, color: "hover:text-[#5865F2] hover:border-[#5865F2]/40" },
    { name: "Substack", url: SUBSTACK_URL, icon: <SiSubstack className="w-4 h-4 text-[#FF6719]" />, color: "hover:text-[#FF6719] hover:border-[#FF6719]/40" },
  ];
}

export function getConnectSocials(): SocialLinkFull[] {
  return [
    {
      name: "GitHub",
      url: GITHUB_URL,
      icon: <FaGithub className="w-5 h-5" />,
      gradient: "from-zinc-900 to-zinc-800",
      borderColor: "border-zinc-700/50",
      shadowColor: "shadow-zinc-500/10",
      description: "Browse the source code, open issues, or contribute to my learning projects.",
    },
    {
      name: "YouTube",
      url: YOUTUBE_URL,
      icon: <FaYoutube className="w-5 h-5 text-red-500" />,
      gradient: "from-rose-950/80 to-rose-900/50",
      borderColor: "border-red-500/30",
      shadowColor: "shadow-red-600/10",
      description: "Watch coding tutorials, debugging logs, and learning recaps.",
    },
    {
      name: "Telegram Channel",
      url: TELEGRAM_URL,
      icon: <FaTelegram className="w-5 h-5 text-[#26A5E4]" />,
      gradient: "from-sky-950/80 to-sky-900/50",
      borderColor: "border-sky-500/30",
      shadowColor: "shadow-sky-500/10",
      description: "Join the channel for real-time code updates, links, and discussions.",
    },
    {
      name: "Discord Server",
      url: DISCORD_URL,
      icon: <FaDiscord className="w-5 h-5 text-[#5865F2]" />,
      gradient: "from-indigo-950/80 to-indigo-900/50",
      borderColor: "border-indigo-500/30",
      shadowColor: "shadow-indigo-500/10",
      description: "Join our peer learning group. Chat about bugs, review code, or build together.",
    },
    {
      name: "Substack Newsletter",
      url: SUBSTACK_URL,
      icon: <SiSubstack className="w-5 h-5 text-[#FF6719]" />,
      gradient: "from-amber-950/80 to-amber-900/50",
      borderColor: "border-amber-500/30",
      shadowColor: "shadow-amber-500/10",
      description: "Subscribe to read detailed logs and retrospectives on my coding journey.",
    },
    {
      name: "Support Coded Chapter (₹199)",
      url: RAZORPAY_URL,
      icon: <FaHeart className="w-5 h-5 text-rose-500 fill-rose-500 animate-pulse" />,
      gradient: "from-rose-950/80 to-amber-950/60",
      borderColor: "border-rose-500/35",
      shadowColor: "shadow-rose-600/15",
      description: "Support my self-taught dev journey by contributing ₹199 securely via Razorpay.",
    },
  ];
}
