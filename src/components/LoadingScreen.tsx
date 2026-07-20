import { useEffect, useState } from "react";
import ultraLogo from "@/assets/ultra-logo.png.asset.json";
import motoLoading from "@/assets/moto-loading.png.asset.json";

interface LoadingScreenProps {
  variant?: "ultra" | "staff" | "auto";
  /** Minimum time the splash stays visible, in milliseconds. */
  minimumTime?: number;
}

/**
 * Branded loading splash. Uses sessionStorage("pendingUser") when variant="auto"
 * to decide which image to show before the profile is fetched, preventing the
 * Carlos dashboard from flashing while an ULTRA user is signing in.
 *
 * The splash is forced to stay visible for at least `minimumTime` so the
 * branded images are actually seen instead of flashing by.
 */
const LoadingScreen = ({ variant = "auto", minimumTime = 1500 }: LoadingScreenProps) => {
  const [ready, setReady] = useState(false);

  let resolved: "ultra" | "staff" = variant === "auto" ? "staff" : variant;
  if (variant === "auto" && typeof window !== "undefined") {
    const pending = window.sessionStorage.getItem("pendingUser")?.toLowerCase().trim();
    if (pending === "ultra") resolved = "ultra";
  }

  const src = resolved === "ultra" ? ultraLogo.url : motoLoading.url;
  const alt = resolved === "ultra" ? "ULTRA" : "Vai Moto";

  useEffect(() => {
    // Preload the image so it is already decoded when rendered.
    const img = new Image();
    img.src = src;

    const timer = setTimeout(() => {
      setReady(true);
    }, minimumTime);

    return () => clearTimeout(timer);
  }, [src, minimumTime]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <img
          src={src}
          alt={alt}
          className={
            resolved === "ultra"
              ? "h-32 w-32 rounded-2xl shadow-lg object-cover"
              : "h-40 w-40 object-contain"
          }
          style={{
            opacity: ready ? 1 : 1,
            transition: "opacity 300ms ease-out",
          }}
        />
      </div>
    </div>
  );
};

export default LoadingScreen;
