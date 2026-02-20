import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

const JWT_SECRET: string = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Helper function to generate JWT token
const generateToken = (userId: string, email: string, role: string): string => {
  const payload = { userId, email, role };
  const expiresIn = process.env.JWT_EXPIRES_IN?.trim() || '7d';
  // @ts-ignore - Type issue with jsonwebtoken SignOptions
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

// POST /api/auth/technician-login - Technician login with phone + PIN
router.post('/technician-login', async (req: Request, res: Response) => {
  try {
    const { phone, pin } = req.body;

    if (!phone || !pin) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and PIN are required'
      });
    }

    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        error: 'PIN must be 4 digits'
      });
    }

    // Clean phone number (remove spaces, dashes, +91 prefix)
    const cleanPhone = phone.toString().trim().replace(/[\s\-]/g, '').replace(/^\+91/, '');

    // Find user by phone number with a buildline_role
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('phone', cleanPhone)
      .not('buildline_role', 'is', null)
      .single();

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid phone number or PIN'
      });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        error: 'Your account has been deactivated. Please contact supervisor.'
      });
    }

    if (!user.pin) {
      return res.status(401).json({
        success: false,
        error: 'PIN not set. Please contact supervisor.'
      });
    }

    // Verify PIN (supports both hashed and plain-text for initial setup)
    const isPinValid = user.pin.startsWith('$2')
      ? await bcrypt.compare(pin, user.pin)
      : user.pin === pin;

    if (!isPinValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid phone number or PIN'
      });
    }

    // Update last login
    await supabaseAdmin
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Generate JWT token
    const token = generateToken(user.id, user.email || user.phone, user.role);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          department: user.department,
          status: user.status,
          buildline_role: user.buildline_role
        }
      }
    });
  } catch (error: any) {
    console.error('Technician login error:', error.message);
    res.status(500).json({
      success: false,
      error: 'An error occurred during login'
    });
  }
});

// POST /api/auth/login - User login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const cleanEmail = email.toString().trim().toLowerCase();
    const cleanPassword = password.toString().trim();

    // Find user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        error: 'Your account has been deactivated. Please contact administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(cleanPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Update last login
    await supabaseAdmin
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Generate JWT token
    const token = generateToken(user.id, user.email, user.role);

    // Return user data (without password hash)
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          department: user.department,
          status: user.status
        }
      }
    });
  } catch (error: any) {
    console.error('Login error:', error.message);
    res.status(500).json({
      success: false,
      error: 'An error occurred during login'
    });
  }
});

// POST /api/auth/register - Create new user (Admin only)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, phone, department, pin } = req.body;

    // For technician registration: name + phone + pin required (email/password optional)
    // For regular registration: name + email + password required
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }

    const isTechnicianRegistration = pin && phone;

    if (!isTechnicianRegistration && (!email || !password)) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    if (pin && !/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        error: 'PIN must be 4 digits'
      });
    }

    // Check for duplicate email if provided
    if (email) {
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists'
        });
      }
    }

    // Check for duplicate phone if provided
    if (phone) {
      const cleanPhone = phone.toString().trim().replace(/[\s\-]/g, '').replace(/^\+91/, '');
      const { data: existingPhone } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone', cleanPhone)
        .single();

      if (existingPhone) {
        return res.status(409).json({
          success: false,
          error: 'User with this phone number already exists'
        });
      }
    }

    const saltRounds = 10;

    // Build insert object
    const insertData: any = {
      name,
      role: role || 'Staff',
      status: 'Active'
    };

    if (email) insertData.email = email.toLowerCase();
    if (phone) insertData.phone = phone.toString().trim().replace(/[\s\-]/g, '').replace(/^\+91/, '');
    if (department) insertData.department = department;

    // Hash password if provided
    if (password) {
      insertData.password_hash = await bcrypt.hash(password, saltRounds);
    }

    // Hash PIN if provided
    if (pin) {
      insertData.pin = await bcrypt.hash(pin, saltRounds);
    }

    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert(insertData)
      .select()
      .single();

    if (createError) {
      console.error('Database error creating user:', createError.message);
      throw createError;
    }

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          phone: newUser.phone,
          department: newUser.department,
          status: newUser.status
        }
      }
    });
  } catch (error: any) {
    console.error('Register error:', error.message);
    res.status(500).json({
      success: false,
      error: 'An error occurred during registration'
    });
  }
});

// GET /api/auth/verify - Verify JWT token
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, phone, department, status, buildline_role')
      .eq('id', decoded.userId)
      .single();

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // Check if user is still active
    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        error: 'User account is not active'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    console.error('Verify error:', error.message);
    res.status(500).json({
      success: false,
      error: 'An error occurred during verification'
    });
  }
});

// POST /api/auth/change-password - Change password
router.post('/change-password', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    // Get user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password_hash: newPasswordHash })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error: any) {
    console.error('Change password error:', error.message);
    res.status(500).json({
      success: false,
      error: 'An error occurred while changing password'
    });
  }
});

// GET /api/auth/users - Get all users (Admin only)
router.get('/users', async (req: Request, res: Response) => {
  try {
    // Try with buildline_role first; fall back without it if column doesn't exist yet
    let { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, phone, department, status, buildline_role, last_login, created_at')
      .order('created_at', { ascending: false });

    if (error && error.message?.includes('buildline_role')) {
      const result = await supabaseAdmin
        .from('users')
        .select('id, name, email, role, phone, department, status, last_login, created_at')
        .order('created_at', { ascending: false });
      users = result.data as any;
      error = result.error;
    }

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: users
    });
  } catch (error: any) {
    console.error('Get users error:', error.message);
    res.status(500).json({
      success: false,
      error: 'An error occurred while fetching users'
    });
  }
});

// PUT /api/auth/users/:id - Update user (Admin only)
router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, phone, department, status, buildline_role } = req.body;

    const updates: any = {};
    if (name) updates.name = name;
    if (email) updates.email = email.toLowerCase();
    if (role) updates.role = role;
    if (phone !== undefined) updates.phone = phone;
    if (department !== undefined) updates.department = department;
    if (status) updates.status = status;
    if (buildline_role !== undefined) updates.buildline_role = buildline_role || null;

    // Try with buildline_role; if column doesn't exist, retry without it
    let { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, name, email, role, phone, department, status, buildline_role')
      .single();

    if (error && error.message?.includes('buildline_role')) {
      delete updates.buildline_role;
      const result = await supabaseAdmin
        .from('users')
        .update(updates)
        .eq('id', id)
        .select('id, name, email, role, phone, department, status')
        .single();
      updatedUser = result.data as any;
      error = result.error;
    }

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error: any) {
    console.error('Update user error:', error.message);
    res.status(500).json({
      success: false,
      error: 'An error occurred while updating user'
    });
  }
});

// DELETE /api/auth/users/:id - Delete user (Admin only)
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete user error:', error.message);
    res.status(500).json({
      success: false,
      error: 'An error occurred while deleting user'
    });
  }
});

export default router;
