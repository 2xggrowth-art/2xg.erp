import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase';

const JWT_SECRET: string = process.env.JWT_SECRET!;

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
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
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, status')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token. User not found.'
      });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        error: 'Account deactivated. Contact administrator.'
      });
    }

    // Attach user info to request
    req.user = decoded;
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

    console.error('Auth middleware error:', error);
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
