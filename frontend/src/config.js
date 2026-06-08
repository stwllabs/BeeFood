const defaultSocket = "http://localhost:5000";
const socketBase = (import.meta.env.VITE_SOCKET_URL || defaultSocket).replace(/\/$/, "");
const withProtocol = (url) =>
  url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;

export const SOCKET_URL = import.meta.env.DEV ? socketBase : withProtocol(socketBase);
export const API_URL = import.meta.env.VITE_API_URL || `${SOCKET_URL}/api`;
