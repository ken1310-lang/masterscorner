import { createFileRoute } from "@tanstack/react-router";

import { ClassesScreen } from "@/components/classes/classes-screen";

export const Route = createFileRoute("/_auth/dashboard/classes")({
  component: Classes,
});

function Classes() {
  return <ClassesScreen />;
}
