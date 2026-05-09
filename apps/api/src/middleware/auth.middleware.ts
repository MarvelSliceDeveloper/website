import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@lms/types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_min_32_chars_long!';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    role: UserRole;
    email: string;
  };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token = req.headers.authorization?.split(' ')[1];
    
    // Fallback to cookie if present (requires cookie-parser, assume setup later)
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireTenant = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const requestedTenantId = req.params.tenantId || req.body.tenantId;
  
  // Super Admins bypass tenant checks
  if (req.user.role === UserRole.SUPER_ADMIN) {
    return next();
  }

  if (requestedTenantId && requestedTenantId !== req.user.tenantId) {
    return res.status(403).json({ error: 'You do not have access to this tenant' });
  }

  next();
};
