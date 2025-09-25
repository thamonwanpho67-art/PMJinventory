import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

export async function checkRole(allowedRoles: string[]) {
  const user = await getCurrentUser();

  if (!user || !allowedRoles.includes(user.role)) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  return user;
}

// Helper to protect API routes
export function withRoleCheck(
  handler: (req: Request, ...args: unknown[]) => Promise<unknown> | unknown,
  allowedRoles: string[]
) {
  return async function (req: Request, ...args: unknown[]) {
    const user = await checkRole(allowedRoles);

    if (user instanceof NextResponse) {
      return user;
    }

  // append the resolved user as the last argument
  return handler(req, ...[...args, user]);
  };
}
