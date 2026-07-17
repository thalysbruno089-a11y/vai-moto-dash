import ultraLogo from "@/assets/ultra-logo.png.asset.json";
import motoLoading from "@/assets/moto-loading.png.asset.json";

interface LoadingScreenProps {
  variant?: "ultra" | "staff" | "auto";
}

/**
 * Branded loading splash. Uses sessionStorage("pendingUser") when variant="auto"
 * to decide which image to show before the profile is fetched, preventing the
 * Carlos dashboard from flashing while an ULTRA user is signing in.
 */
const LoadingScreen = ({ variant = "auto" }: LoadingScreenProps) => {
  let resolved: "ultra" | "staff" = variant === "auto" ? "staff" : variant;
  if (variant === "auto" && typeof window !== "undefined") {
    const pending = window.sessionStorage.getItem("pendingUser")?.toLowerCase().trim();
    if (pending === "ultra") resolved = "ultra";
  }

  const src = resolved === "ultra" ? ultraLogo.url : motoLoading.url;
  const alt = resolved === "ultra" ? "ULTRA" : "Vai Moto";

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <img
          src={src}
          alt={alt}
          className={
            resolved === "ultra"
              ? "h-32 w-32 rounded-2xl shadow-lg object-cover animate-pulse"
              : "h-40 w-40 object-contain animate-pulse"
          }
        />
      </div>
    </div>
  );
};

export default LoadingScreen;