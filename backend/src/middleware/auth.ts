import { Request, Response, NextFunction } from 'express';
import { SafeUser } from '../types';

// ============================================================================
// Authentication Middleware
// ============================================================================

/**
 * Middleware to require authentication
 * Checks if user is logged in via session
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.session || !req.session.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // User object should be attached by loadUser middleware
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  next();
}

/**
 * Middleware to load user from session
 * Attaches user object to req.user if session exists
 */
export function loadUser(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  next();
}

/**
 * Optional authentication - loads user if available but doesn't require it
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  next();
}

// ============================================================================
// Session Type Extension
// ============================================================================

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    user?: SafeUser;
  }
}
