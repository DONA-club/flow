import React from "react";
import { cn } from "@/lib/utils";

type Event = {
  title: string;
  place: string;
  start: number; // hour (0-23)
  end: number;   // hour (0-23)
};

type Props = {
  sunrise: number; // hour (0-23)
  sunset: number;  // hour (0-23)
  events: Event[];
};

const RADIUS = 120; // px
const BLOCK_SIZE = 28; // px

function getBlockPosition(hour: number, total: number, radius: number) {
  const angle = ((hour - 6) / total) * 2 * Math.PI; // -6 to start at top
  const x = radius * Math.cos(angle - Math.PI / 2);
  const y = radius * Math.sin(angle - Math.PI / 2);
  return { x, y };
}

function getCurrentOrNextEvent(events: Event[], now: number): Event | undefined {
  // Find current event
  const current = events.find(e => now >= e.start && now < e.end);
  if (current) return current;
  // Find next event
  return events.find(e => e.start > now);
}

export const CircularCalendar: React.FC<Props> = ({
  sunrise,
  sunset,
  events,
}) => {
  const now = new Date();
  const hour = now.getHours();

  const event = getCurrentOrNextEvent(events, hour);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 2*RADIUS+BLOCK_SIZE, height: 2*RADIUS+BLOCK_SIZE }}>
      {/* Hour blocks */}
      {Array.from({ length: 24 }).map((_, i) => {
        const { x, y } = getBlockPosition(i, 24, RADIUS);
        const isDay = (sunrise < sunset)
          ? (i >= sunrise && i < sunset)
          : (i >= sunrise || i < sunset); // handle midnight wrap
        return (
          <div
            key={i}
            className={cn(
              "absolute flex items-center justify-center rounded-full border shadow transition-colors",
              isDay ? "bg-yellow-300 border-yellow-400" : "bg-gray-300 border-gray-400",
              "text-xs font-semibold",
              hour === i ? "ring-2 ring-blue-500 z-10" : ""
            )}
            style={{
              width: BLOCK_SIZE,
              height: BLOCK_SIZE,
              left: RADIUS + x,
              top: RADIUS + y,
              transform: "translate(-50%, -50%)",
              zIndex: hour === i ? 2 : 1,
            }}
            title={`${i}:00`}
          >
            {i}
          </div>
        );
      })}
      {/* Cursor for current hour */}
      {(() => {
        const { x, y } = getBlockPosition(hour, 24, RADIUS + 32);
        return (
          <div
            className="absolute w-2 h-2 bg-blue-600 rounded-full shadow"
            style={{
              left: RADIUS + x,
              top: RADIUS + y,
              transform: "translate(-50%, -50%)",
              zIndex: 20,
            }}
            title="Current hour"
          />
        );
      })()}
      {/* Center info */}
      <div className="absolute left-1/2 top-1/2 flex flex-col items-center justify-center text-center"
        style={{
          transform: "translate(-50%, -50%)",
          width: RADIUS,
          maxWidth: "80%",
        }}
      >
        <div className="text-lg font-bold mb-1">
          {event ? event.title : "No events"}
        </div>
        <div className="text-sm text-gray-600">
          {event ? event.place : "Enjoy your time!"}
        </div>
      </div>
    </div>
  );
};