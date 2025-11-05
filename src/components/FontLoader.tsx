"use client";

import React from "react";

const FontLoader: React.FC = () => {
  React.useEffect(() => {
    // Preconnect pour de meilleures perfs
    const preconnect1Id = "preconnect-googleapis";
    const preconnect2Id = "preconnect-gstatic";
    const fontInterLinkId = "font-inter-link";
    const fontMontserratLinkId = "font-montserrat-link";

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
    if (!document.getElementById(fontInterLinkId)) {
      const l = document.createElement("link");
      l.id = fontInterLinkId;
      l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap";
      document.head.appendChild(l);
    }
    if (!document.getElementById(fontMontserratLinkId)) {
      const l = document.createElement("link");
      l.id = fontMontserratLinkId;
      l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap";
      document.head.appendChild(l);
    }
  }, []);

  return null;
};

export default FontLoader;