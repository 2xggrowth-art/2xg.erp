import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase';

const JWT_SECRET: string = process.env.JWT_SECRET!;

/**
 * Test #46: Brute-force protection for POS/login endpoints
 * Tracks failed attempts by IP. After 5 failures, blocks for 15 minutes.
 */
const loginAttempts = new Map<string, { count: number; lastAttempt: number; blockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes

export const loginRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record) {
    // Check if still blocked
    if (record.blockedUntil > now) {
      const minutesLeft = Math.ceil((record.blockedUntil - now) / 60000);
      return res.status(429).json({
        success: false,
        error: `Too many failed attempts. Try again in ${minutesLeft} minute(s).`
      });
    }

    // Reset if block period has passed
    if (record.blockedUntil > 0 && record.blockedUntil <= now) {
      loginAttempts.delete(ip);
    }
  }

  next();
};

/**
 * Record a failed login attempt for brute-force tracking
 */
export const recordFailedLogin = (req: Request) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, lastAttempt: 0, blockedUntil: 0 };

  record.count += 1;
  record.lastAttempt = now;

  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION;
    console.warn(`Auth: IP ${ip} blocked for ${BLOCK_DURATION / 60000} minutes after ${record.count} failed login attempts`);
  }

  loginAttempts.set(ip, record);
};

/**
 * Clear failed login tracking after successful login
 */
export const clearFailedLogins = (req: Request) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  loginAttempts.delete(ip);
};

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    buildlineRole?: string;
    isMobile?: boolean;
    employeeName?: string;
    branch?: string;
  };
}

/**
 * Authentication middleware - validates JWT token from Authorization header.
 * Supports both web (users table) and mobile (mobile_users table) tokens.
 * Attaches decoded user to req.user for downstream handlers.
 */
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. No token provided.'
      });
    }

    const token = authHeader.substring(7);

    // Verify JWT token (decode first to check type)
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Check if this is a mobile token
    if (decoded.type === 'mobile') {
      // Mobile user - verify against mobile_users table
      const { data: mobileUser, error } = await supabaseAdmin
        .from('mobile_users')
        .select('id, phone_number, employee_name, branch, is_active')
        .eq('id', decoded.id)
        .single();

      if (error || !mobileUser) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token. User not found.'
        });
      }

      if (!mobileUser.is_active) {
        return res.status(403).json({
          success: false,
          error: 'Account deactivated. Contact administrator.'
        });
      }

      // Attach mobile user info to request (map to compatible format)
      req.user = {
        userId: mobileUser.id,
        email: mobileUser.phone_number, // Use phone as identifier
        role: 'mobile_user',
        isMobile: true,
        employeeName: mobileUser.employee_name,
        branch: mobileUser.branch
      };
      return next();
    }

    // Web user - verify against users table
    let user: any = null;
    let buildlineRole: string | null = null;

    // First try with buildline_role (if migration 029 was applied)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, status, buildline_role')
      .eq('id', decoded.userId)
      .single();

    if (userError && userError.message?.includes('buildline_role')) {
      // buildline_role column doesn't exist yet — fallback without it
      const { data: fallbackUser, error: fallbackError } = await supabaseAdmin
        .from('users')
        .select('id, status')
        .eq('id', decoded.userId)
        .single();
      if (fallbackError || !fallbackUser) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token. User not found.'
        });
      }
      user = fallbackUser;
    } else if (userError || !userData) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token. User not found.'
      });
    } else {
      user = userData;
      buildlineRole = (userData as any).buildline_role || null;
    }

    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        error: 'Account deactivated. Contact administrator.'
      });
    }

    // Attach user info to request
    // Test #98: Override token's role with live DB role to ensure role changes take effect immediately
    const liveRole = decoded.role; // default to token role
    try {
      const { data: roleCheck } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', decoded.userId)
        .single();
      if (roleCheck && roleCheck.role) {
        req.user = { ...decoded, role: roleCheck.role, buildlineRole };
      } else {
        req.user = { ...decoded, buildlineRole };
      }
    } catch {
      req.user = { ...decoded, buildlineRole };
    }
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired. Please login again.'
      });
    }

    console.error('Auth middleware error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Authentication error.'
    });
  }
};

/**
 * Role-based authorization middleware.
 * Must be used after authMiddleware.
 */
export const requireRole = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

/**
 * Buildline role-based authorization middleware.
 * Checks buildlineRole field. Admin ERP role always has access.
 */
export const requireBuildlineRole = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    // Admin always has access to Buildline
    if (req.user.role === 'Admin') return next();

    if (req.user.buildlineRole && roles.includes(req.user.buildlineRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: `Access denied. Required Buildline role: ${roles.join(' or ')}`
    });
  };
};
