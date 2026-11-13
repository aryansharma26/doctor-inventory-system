import type { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        email: string;
        fullName: string;
        isPlatformAdmin: boolean;
        assuranceLevel: "aal1" | "aal2";
        clinicId?: string;
        membershipId?: string;
        role?: Role;
        permissions: string[];
        impersonationId?: string;
        availableClinics: Array<{
          id: string;
          name: string;
          code: string;
          role: Role;
        }>;
      };
      requestId: string;
    }
  }
}
