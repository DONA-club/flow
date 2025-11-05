"use client";

import React from "react";
import { ExternalLink, Video } from "lucide-react";

type Props = {
  title: string;
  organizer?: string;
  date?: string;
  timeRemaining?: string;
  url?: string;
  videoLink?: string;
  onClose?: () => void;
  diameter?: number;
};

function detectPlatform(url: string): string {
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

const ENTRY_BUFFER = 14;   // px de tolérance pour l'entrée dans la zone
const EXIT_BUFFER = 42;    // px supplémentaires avant fermeture

const EventInfoBubble: React.FC<Props> = ({
  title,
  organizer,
  date,
  timeRemaining,
  url,
  videoLink,
  onClose,
  diameter = 200,
}) => {
  const [visible, setVisible] = React.useState(true);
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  const timeoutRef = React.useRef<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const hasEnteredZoneRef = React.useRef(false);

  const closeBubble = React.useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setVisible(false);
    window.setTimeout(() => {
      hasEnteredZoneRef.current = false;
      onClose?.();
    }, 320);
  }, [onClose]);

  const resetTimeout = React.useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(closeBubble, 10000);
  }, [closeBubble]);

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setIsDarkMode(media.matches);
    update();
    if (media.addEventListener) {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
    return undefined;
  }, []);

  React.useEffect(() => {
    hasEnteredZoneRef.current = false;
    setVisible(true);
    resetTimeout();

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [title, date, timeRemaining, resetTimeout]);

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const distance = Math.hypot(dx, dy);

      const radius = diameter / 2;
      const entryRadius = radius + ENTRY_BUFFER;
      const exitRadius = radius + EXIT_BUFFER;

      if (!hasEnteredZoneRef.current && distance <= entryRadius) {
        hasEnteredZoneRef.current = true;
        resetTimeout();
        return;
      }

      if (hasEnteredZoneRef.current && distance <= exitRadius) {
        resetTimeout();
        return;
      }

      if (hasEnteredZoneRef.current && distance > exitRadius) {
        hasEnteredZoneRef.current = false;
        closeBubble();
      }
    },
    [closeBubble, diameter, resetTimeout],
  );

  React.useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove]);

  const handleCalendarClick = (e: React.MouseEvent) => {
    if (url) {
      e.stopPropagation();
      window.open(url, "_blank", "noopener,noreferrer");
      resetTimeout();
    }
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    if (videoLink) {
      e.stopPropagation();
      window.open(videoLink, "_blank", "noopener,noreferrer");
      resetTimeout();
    }
  };

  const platform = videoLink ? detectPlatform(videoLink) : "";

  const outerGlowGradient = isDarkMode
    ? "from-blue-600/25 via-indigo-500/20 to-sky-500/20"
    : "from-emerald-400/18 via-sky-300/16 to-sky-400/18";

  const glassGradient = isDarkMode
    ? "from-white/12 to-white/6"
    : "from-white/90 to-white/74";

  const borderColor = isDarkMode ? "border-white/24" : "border-sky-400/35";

  const titleClass = isDarkMode ? "text-white" : "text-slate-900";
  const organizerClass = isDarkMode ? "text-white/70" : "text-slate-600";
  const dateClass = isDarkMode ? "text-white/82" : "text-sky-800";
  const timeClass = isDarkMode ? "text-white/75" : "text-emerald-700";

  const videoButtonClass = isDarkMode
    ? "group/video flex items-center gap-2 px-4 py-2 rounded-full bg-white/12 hover:bg-white/20 transition-all duration-300 cursor-pointer"
    : "group/video flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-400/15 hover:bg-sky-300/25 transition-all duration-300 cursor-pointer";

  const videoIconWrapperClass = isDarkMode
    ? "relative bg-white/90 p-1.5 rounded-full group-hover/video:scale-110 transition-transform duration-300 pointer-events-none"
    : "relative bg-gradient-to-br from-emerald-500 to-sky-500 text-white p-1.5 rounded-full group-hover/video:scale-110 transition-transform duration-300 pointer-events-none";

  const videoIconColor = isDarkMode ? "text-blue-600" : "text-white";
  const videoTitleClass = isDarkMode ? "text-white text-xs font-semibold" : "text-emerald-900 text-xs font-semibold";
  const videoSubtitleClass = isDarkMode ? "text-white/65 text-[10px]" : "text-sky-700 text-[10px]";

  const calendarButtonClass = isDarkMode
    ? "p-2 rounded-full bg-white/12 hover:bg-white/22 transition-colors cursor-pointer"
    : "p-2 rounded-full bg-emerald-400/12 hover:bg-sky-300/22 transition-colors cursor-pointer";

  const calendarIconColor = isDarkMode ? "text-white/82" : "text-sky-700";

  return (
    <div
      ref={containerRef}
      className={[
        "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
        "rounded-full z-30",
        "flex items-center justify-center text-center",
        "transition-opacity duration-320 select-none",
        visible ? "opacity-100" : "opacity-0",
      ].join(" ")}
      style={{ width: diameter, height: diameter, pointerEvents: "auto" }}
      role="dialog"
      aria-live="polite"
      onMouseEnter={() => {
        hasEnteredZoneRef.current = true;
        resetTimeout();
      }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${outerGlowGradient} rounded-full blur-xl opacity-70 pointer-events-none`} />
      <div className={`absolute inset-0 bg-gradient-to-br ${glassGradient} rounded-full backdrop-blur-xl pointer-events-none`} />
      <div className={`absolute inset-0 rounded-full border ${borderColor} shadow-[0_18px_48px_-20px_rgba(14,165,233,0.35)] pointer-events-none`} />

      <div className="relative flex flex-col items-center justify-center px-6 w-full h-full gap-2">
        {organizer && (
          <div className={`text-xs truncate w-full font-medium ${organizerClass}`}>
            {organizer}
          </div>
        )}

        <div className={`${titleClass} font-bold text-base leading-tight px-2`}>
          {title}
        </div>

        {date && (
          <div className={`${dateClass} text-sm font-semibold`}>
            {date}
          </div>
        )}

        {timeRemaining && (
          <div className={`${timeClass} text-xs font-semibold tracking-wide`}>
            {timeRemaining}
          </div>
        )}

        <div className="flex items-center gap-3 mt-3">
          {videoLink && (
            <button
              onClick={handleVideoClick}
              className={videoButtonClass}
              aria-label={`Rejoindre ${platform}`}
            >
              <div className="relative pointer-events-none">
                <div className="absolute inset-0 bg-white/24 rounded-full blur-md group-hover/video:blur-lg transition-all duration-300 pointer-events-none" />
                <div className={videoIconWrapperClass}>
                  <Video className={`w-4 h-4 ${videoIconColor} pointer-events-none`} strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex flex-col items-start pointer-events-none">
                <span className={videoTitleClass}>Rejoindre</span>
                <span className={videoSubtitleClass}>{platform}</span>
              </div>
            </button>
          )}

          {url && (
            <button
              onClick={handleCalendarClick}
              className={calendarButtonClass}
              aria-label="Ouvrir dans le calendrier"
            >
              <ExternalLink className={`w-4 h-4 ${calendarIconColor} pointer-events-none`} />
            </button>
          )}
        </div>
      </div>

      <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1100 ease-in-out pointer-events-none" />
      </div>
    </div>
  );
};

export default EventInfoBubble;