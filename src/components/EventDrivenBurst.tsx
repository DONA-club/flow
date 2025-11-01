"use client";

import React from "react";
import ParticleBurst from "@/components/ParticleBurst";

type Props = {
  size?: number;
};

const EventDrivenBurst: React.FC<Props> = ({ size = 88 }) => {
  const [fireKey, setFireKey] = React.useState(0);

  React.useEffect(() => {
    const handler: EventListener = () => setFireKey((k) => k + 1);
    window.addEventListener("brand-scroll", handler);
    return () => window.removeEventListener("brand-scroll", handler);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0">
      <ParticleBurst fireKey={fireKey} size={size} />
    </div>
  );
};

export default EventDrivenBurst;