import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

type LogType = "info" | "success" | "error";

type Log = {
  id: number;
  message: string;
  type: LogType;
  fading?: boolean;
};

type Props = {
  logs: { message: string; type?: LogType }[];
  fadeOutDuration?: number;
};

// CE COMPOSANT N'EST PLUS UTILISÉ - TOUS LES LOGS SONT MAINTENANT DANS ChatInterface
// Les logs sont émis via window.dispatchEvent("app-log") et capturés par ChatInterface

export const StackedEphemeralLogs: React.FC<Props> = ({
  logs,
  fadeOutDuration,
}) => {
  return null; // Plus utilisé
};