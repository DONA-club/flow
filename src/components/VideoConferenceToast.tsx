"use client";

import React from "react";
import { Video } from "lucide-react";

type Platform = "Teams" | "Zoom" | "Google Meet" | "Hangouts" | "Webex" | "GoToMeeting" | "Whereby" | "Jitsi" | "Vidéoconférence";

type Props = {
  link: string;
  platform?: Platform;
  onClose?: () => void;
};

function detectPlatform(url: string): Platform {
  const lower = url.toLowerCase();
  if (lower.includes("teams.microsoft.com")) return "Teams";
  if (lower.includes("zoom.us")) return "Zoom";
  if (lower.includes("meet.google.com")) return "Google Meet";
  if (lower.includes("hangouts.google.com")) return "Hangouts";
  if (lower.includes("webex.com")) return "Webex";
  if (lower.includes("gotomeeting.com")) return "GoToMeeting";
  if (lower.includes("whereby.com")) return "Whereby";
  if (lower.includes("jitsi")) return "Jitsi";
  return "Vidéoconférence";
}

const PLATFORM_COLORS: Record<Platform, string> = {
  "Teams": "from-blue-500/20 to-purple-500/20",
  "Zoom": "from-blue-400/20 to-cyan-400/20",
  "Google Meet": "from-green-500/20 to-emerald-500/20",
  "Hangouts": "from-green-400/20 to-teal-400/20",
  "Webex": "from-blue-600/20 to-indigo-600/20",
  "GoToMeeting": "from-orange-500/20 to-amber-500/20",
  "Whereby": "from-purple-500/20 to-pink-500/20",
  "Jitsi": "from-cyan-500/20 to-blue-500/20",
  "Vidéoconférence": "from-slate-500/20 to-gray-500/20",
};

export const VideoConferenceToast: React.FC<Props> = ({ link, platform, onClose }) => {
  const detectedPlatform = platform || detectPlatform(link);
  const gradientClass = PLATFORM_COLORS[detectedPlatform];

  return (
    <div className="relative group w-full max-w-md mx-auto">
      {/* Liquid glass background avec animation */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500`} />
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl backdrop-blur-xl" />
      
      {/* Contenu */}
      <div className="relative px-6 py-4 rounded-2xl border border-white/20 shadow-2xl">
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="flex items-center gap-4 group/link"
        >
          {/* Icône caméra avec animation */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-md group-hover/link:blur-lg transition-all duration-300" />
            <div className="relative bg-white/90 p-2.5 rounded-full group-hover/link:scale-110 transition-transform duration-300">
              <Video className="w-6 h-6 text-blue-600 group-hover/link:text-blue-700" strokeWidth={2.5} />
            </div>
          </div>

          {/* Texte */}
          <div className="flex-1 min-w-0">
            <div className="text-white font-semibold text-base tracking-tight group-hover/link:text-blue-100 transition-colors">
              Connectez-vous
            </div>
            <div className="text-white/60 text-sm mt-0.5 font-light tracking-wide">
              {detectedPlatform}
            </div>
          </div>

          {/* Flèche indicatrice */}
          <div className="text-white/60 group-hover/link:text-white/90 group-hover/link:translate-x-1 transition-all duration-300 flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </a>
      </div>

      {/* Effet de brillance animé */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
      </div>
    </div>
  );
};