import { Button } from "@my-better-t-app/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@my-better-t-app/ui/components/dropdown-menu";
import { Skeleton } from "@my-better-t-app/ui/components/skeleton";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

export default function UserMenu() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const { sessionQueries } = useRouter().options.context;

  if (isPending) {
    return <Skeleton className="h-9 w-24" />;
  }

  if (!session) {
    return (
      <Link search={{ form: "signin" }} to="/login">
        <Button variant="outline">Sign In</Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            className="min-w-0 max-w-[min(12rem,50vw)] shrink"
            variant="outline"
          />
        }
        title={session.user.name}
      >
        <span className="min-w-0 truncate">{session.user.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-w-[calc(100vw-2rem)] bg-card">
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="whitespace-normal [overflow-wrap:anywhere]">
            {session.user.email}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              authClient.signOut({
                fetchOptions: {
                  onSuccess: async () => {
                    await sessionQueries.setIdentity(null);
                    await navigate({
                      to: "/",
                    });
                  },
                },
              });
            }}
            variant="destructive"
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
