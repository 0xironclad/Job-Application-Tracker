import { Request, Response, NextFunction } from "express"

export interface AuthenticatedRequest extends Request {
  userId?: number
  userEmail?: string
  sessionId?: string
}

interface JWTPayload {
  userId: number
  email: string
  iat?: number
  exp?: number
}

interface SessionData {
  userId: number
  email: string
  createdAt: Date
  expiresAt: Date
}

class AuthenticationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401,
    public code: string = "AUTHENTICATION_ERROR"
  ) {
    super(message)
    this.name = "AuthenticationError"
  }
}

async function verifyJWT(token: string): Promise<JWTPayload> {
  // TODO: Implement actual JWT verification using jsonwebtoken library
  // For now, this is a placeholder that accepts any token for testing
  
  // In production, this would:
  // 1. Verify the JWT signature using a secret or public key
  // 2. Check token expiration
  // 3. Validate issuer and audience claims
  // 4. Return the decoded payload
  
  // Placeholder implementation for testing
  if (!token || token === "invalid") {
    throw new AuthenticationError("Invalid token")
  }
  
  // Mock decoded JWT payload for testing
  return {
    userId: 1,
    email: "test@example.com",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  }
}

async function verifySession(sessionId: string): Promise<SessionData> {
  // TODO: Implement actual session verification
  // This would typically:
  // 1. Look up the session in a session store (Redis, database, etc.)
  // 2. Check if the session is still valid (not expired)
  // 3. Return the session data
  
  // Placeholder implementation for testing
  if (!sessionId || sessionId === "invalid") {
    throw new AuthenticationError("Invalid session")
  }
  
  // Mock session data for testing
  return {
    userId: 1,
    email: "test@example.com",
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
  }
}

function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null
  }
  
  const parts = authHeader.split(" ")
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null
  }
  
  return parts[1]
}

function extractSessionId(req: Request): string | null {
  // Check for session ID in cookies first
  if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=")
      acc[key] = value
      return acc
    }, {} as Record<string, string>)
    
    if (cookies["session-id"]) {
      return cookies["session-id"]
    }
  }
  
  // Check for session ID in headers (for testing)
  const sessionHeader = req.headers["x-session-id"]
  if (sessionHeader && typeof sessionHeader === "string") {
    return sessionHeader
  }
  
  return null
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // TEMPORARY: Check for user-id header (for testing)
    // This should be removed in production
    const userIdHeader = req.headers["user-id"]
    if (userIdHeader && typeof userIdHeader === "string") {
      const userId = parseInt(userIdHeader, 10)
      if (!isNaN(userId)) {
        req.userId = userId
        req.userEmail = `user${userId}@test.com`
        return next()
      }
    }
    
    // Check for JWT Bearer token
    const authHeader = req.headers.authorization
    const bearerToken = extractBearerToken(authHeader)
    
    if (bearerToken) {
      try {
        const payload = await verifyJWT(bearerToken)
        req.userId = payload.userId
        req.userEmail = payload.email
        return next()
      } catch (jwtError) {
        // JWT verification failed, try session auth
        console.debug("JWT verification failed:", jwtError)
      }
    }
    
    // Check for session-based authentication
    const sessionId = extractSessionId(req)
    
    if (sessionId) {
      try {
        const sessionData = await verifySession(sessionId)
        req.userId = sessionData.userId
        req.userEmail = sessionData.email
        req.sessionId = sessionId
        return next()
      } catch (sessionError) {
        // Session verification failed
        console.debug("Session verification failed:", sessionError)
      }
    }
    
    // No valid authentication found
    res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required. Please provide a valid JWT token or session.",
      code: "AUTH_REQUIRED"
    })
    return
    
  } catch (error) {
    console.error("Authentication middleware error:", error)
    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred during authentication",
      code: "AUTH_ERROR"
    })
    return
  }
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.userId) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required",
      code: "AUTH_REQUIRED"
    }) as any
  }
  next()
}

export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Try to authenticate but don't fail if no credentials provided
  return authenticate(req, res, (err?: any) => {
    // Clear any authentication errors and continue
    if (err) {
      req.userId = undefined
      req.userEmail = undefined
      req.sessionId = undefined
    }
    next()
  })
}

export default authenticate

