import { Request, Response, NextFunction } from 'express';

/**
 * Read-only mode middleware.
 * When READ_ONLY_MODE=true, blocks all write operations (POST, PUT, PATCH, DELETE)
 * except for auth endpoints (login, verify) so the dev can still sign in.
 */
export function readOnlyGuard(req: Request, res: Response, next: NextFunction) {
  if (process.env.READ_ONLY_MODE !== 'true') {
    return next();
  }

  const method = req.method.toUpperCase();

  // Allow all GET/HEAD/OPTIONS requests
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return next();
  }

  // Allow auth endpoints so dev can log in
  const authPaths = ['/api/auth/login', '/api/auth/verify'];
  if (authPaths.some(p => req.path === p)) {
    return next();
  }

  // Block all other write operations
  return res.status(403).json({
    success: false,
    error: 'Read-only mode is enabled. Write operations are not permitted.',
    readOnlyMode: true
  });
}
