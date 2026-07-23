import { APP_VERSION, TEAM_NAME } from '@/constants/navigation';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 px-6 py-3">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>© {year} {TEAM_NAME}. All rights reserved.</span>
        <div className="flex items-center gap-3">
          <span>{APP_VERSION}</span>
          <span className="text-border">•</span>
          <span>PlasticSense AI</span>
        </div>
      </div>
    </footer>
  );
}
