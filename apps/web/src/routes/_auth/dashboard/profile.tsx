import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback } from "react";

import { ConsoleEmptyState } from "@/components/console/empty-state";
import Loader from "@/components/loader";
import { ProfileForm } from "@/components/profile/profile-form";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/profile")({
  component: Profile,
});

function Profile() {
  const { session } = Route.useRouteContext();
  const trpc = useTRPC();
  const profile = useQuery(trpc.master.getProfile.queryOptions());
  const { refetch } = profile;
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);
  const user = session.data?.user;

  if (!user) {
    return null;
  }
  if (profile.status === "pending") {
    return <Loader />;
  }
  if (profile.isError) {
    return (
      <ConsoleEmptyState title="Profile could not load">
        <p>{profile.error.message}</p>
        <button
          className="mt-3 min-h-11 font-extrabold text-accent-text text-sm underline-offset-4 hover:underline"
          onClick={handleRetry}
          type="button"
        >
          Try again
        </button>
      </ConsoleEmptyState>
    );
  }

  return <ProfileForm accountName={user.name} payload={profile.data} />;
}
