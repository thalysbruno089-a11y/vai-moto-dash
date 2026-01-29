import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileSidebar from "./MobileSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const MainLayout = ({ children, title, subtitle }: MainLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}
      
      <div className={isMobile ? "" : "ml-64"}>
        {/* Mobile Header with Menu */}
        {isMobile && (
          <div className="sticky top-0 z-50 flex items-center gap-2 border-b border-border bg-background px-4 py-3">
            <MobileSidebar />
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-foreground">{title}</h1>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
        )}
        
        {/* Desktop Header */}
        {!isMobile && <Header title={title} subtitle={subtitle} />}
        
        <main className={`animate-fade-in ${isMobile ? "p-4" : "p-6"}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
