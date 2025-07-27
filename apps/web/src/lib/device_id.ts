export function generateDeviceId(): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx!.textBaseline = "top";
  ctx!.font = "14px Arial";
  ctx!.fillText("Device fingerprint", 2, 2);

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
    navigator.hardwareConcurrency || "unknown",
    navigator.deviceMemory || "unknown",
  ].join("|");

  // Create a hash of the fingerprint
  return btoa(fingerprint)
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 16);
}

// Store device ID in localStorage for consistency
export function getDeviceId(): string {
  let deviceId = localStorage.getItem("device-id");
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem("device-id", deviceId);
  }
  return deviceId;
}

export function getBrowserName(): string {
  const userAgent = navigator.userAgent;
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  return "Unknown";
}

export function getOSName(): string {
  const userAgent = navigator.userAgent;
  if (userAgent.includes("Windows")) return "Windows";
  if (userAgent.includes("Mac")) return "macOS";
  if (userAgent.includes("Linux")) return "Linux";
  if (userAgent.includes("Android")) return "Android";
  if (userAgent.includes("iOS")) return "iOS";
  return "Unknown";
}
