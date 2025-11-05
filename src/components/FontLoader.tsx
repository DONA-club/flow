"use client";

import React from "react";

const FontLoader: React.FC = () => {
  React.useEffect(() => {
    // Preconnect pour de meilleures perfs
    const preconnect1Id = "preconnect-googleapis";
    const preconnect2Id = "preconnect-gstatic";
    const fontLinkId = "font-montserrat-link";

    if (!document.getElementById(preconnect1Id)) {
      const l = document.createElement("link");
      l.id = preconnect1Id;
      l.rel = "preconnect";
      l.href = "https://fonts.googleapis.com";
      document.head.appendChild(l);
    }
    if (!document.getElementById(preconnect2Id)) {
      const l = document.createElement("link");
      l.id = preconnect2Id;
      l.rel = "preconnect";
      l.href = "https://fonts.gstatic.com";
      l.crossOrigin = "anonymous";
      document.head.appendChild(l);
    }
    if (!document.getElementById(fontLinkId)) {
      const l = document.createElement("link");
      l.id = fontLinkId;
      l.rel = "stylesheet";
      // Tous les poids de Montserrat
      l.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap";
      document.head.appendChild(l);
    }
  }, []);

  return null;
};

export default FontLoader;