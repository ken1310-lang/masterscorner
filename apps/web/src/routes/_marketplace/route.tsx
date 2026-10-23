import { createFileRoute, Outlet } from "@tanstack/react-router";

import { Footer } from "@/components/shell/footer";
import { Header, SkipLink } from "@/components/shell/header";
import { MobileNav, MobileNavSpacer } from "@/components/shell/mobile-nav";
import { NotFoundContent } from "@/routes/not-found";

export const Route = createFileRoute("/_marketplace")({
  component: MarketplaceLayout,
  notFoundComponent: () => (
    <div className="grid min-h-dvh place-content-center gap-2.5 text-center">
      <NotFoundContent />
    </div>
  ),
});

function MarketplaceLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <Header />
      <main className="flex-1" id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <MobileNavSpacer />
      <MobileNav />
    </div>
  );
}
