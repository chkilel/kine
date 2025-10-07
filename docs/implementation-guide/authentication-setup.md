# Authentication Setup

## 1. Better Auth Configuration
```typescript
// server/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, admin } from "better-auth/plugins";
import { betterAuthDb } from "./database/connection";

export const auth = betterAuth({
  database: drizzleAdapter(betterAuthDb, {
    provider: "pg",
    // Map Better Auth table names to our schema
    schema: {
      user: "user",
      session: "session", 
      account: "account",
      verification: "verification",
      organization: "organization",
      member: "member",
      invitation: "invitation",
      team: "team",
      teamMember: "teamMember"
    }
  }),
  
  plugins: [
    organization({
      allowUserToCreateOrganization: false, // Only admins can create organizations
      organizationLimit: 1, // Users can only belong to one organization
      roles: ["owner", "admin", "practitioner", "receptionist", "viewer"],
      defaultRole: "viewer"
    }),
    admin({
      // Admin plugin for user management
      impersonationSessionDuration: 60 * 60 * 2 // 2 hours
    })
  ],
  
  session: {
    expiresIn: 60 * 60 * 8, // 8 hours
    updateAge: 60 * 60 * 2,  // Update every 2 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5 // 5 minutes
    }
  },
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128
  },
  
  socialProviders: {
    // Can be extended with Google, Microsoft, etc.
  },
  
  rateLimit: {
    window: 60, // 1 minute
    max: 100    // 100 requests per minute
  },
  
  advanced: {
    crossSubDomainCookies: {
      enabled: false // Set to true if using subdomains
    }
  }
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
```

## 2. Authentication Middleware
```typescript
// server/middleware/auth.ts
import { auth } from '../auth';
import { setTenantContext } from '../database/connection';

export default defineEventHandler(async (event) => {
  // Skip auth for public routes
  const publicRoutes = ['/api/auth', '/api/health', '/api/public'];
  const isPublicRoute = publicRoutes.some(route => 
    event.node.req.url?.startsWith(route)
  );
  
  if (isPublicRoute || !event.node.req.url?.startsWith('/api/')) {
    return;
  }

  try {
    const session = await auth.api.getSession({
      headers: event.node.req.headers
    });

    if (!session?.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      });
    }

    // Verify user has access to organization
    const activeOrgId = session.activeOrganizationId;
    if (!activeOrgId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'No active organization'
      });
    }

    // Set tenant context for RLS
    await setTenantContext(activeOrgId);

    // Add context to event
    event.context.user = session.user;
    event.context.session = session;
    event.context.organizationId = activeOrgId;
    
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid session'
    });
  }
});
```

## 3. Better Auth API Routes
```typescript
// server/api/auth/[...all].ts
import { auth } from "~/server/auth";

export default auth.handler;
```

## 4. Organization Context Validation
```typescript
// server/utils/auth.ts
import { auth } from '../auth';

export async function validateOrganizationAccess(
  headers: Record<string, string | string[] | undefined>,
  requiredOrgId: string
) {
  const session = await auth.api.getSession({ headers });
  
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    });
  }
  
  if (session.activeOrganizationId !== requiredOrgId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied to organization'
    });
  }
  
  return session;
}

export function requireRole(allowedRoles: string[]) {
  return async (event: any) => {
    const session = event.context.session;
    
    if (!session?.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      });
    }
    
    // Get user's role in current organization
    const userRole = await getUserRoleInOrganization(
      session.user.id, 
      session.activeOrganizationId
    );
    
    if (!allowedRoles.includes(userRole)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Insufficient permissions'
      });
    }
  };
}

async function getUserRoleInOrganization(userId: string, orgId: string) {
  // Implementation to get user role from member table
  const { db } = await import('../database/connection');
  const { member } = await import('../database/schema');
  
  const memberRecord = await db
    .select({ role: member.role })
    .from(member)
    .where(and(
      eq(member.userId, userId),
      eq(member.organizationId, orgId)
    ))
    .limit(1);
    
  return memberRecord[0]?.role || 'viewer';
}
```
