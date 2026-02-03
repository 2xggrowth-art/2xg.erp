import { supabaseAdmin } from '../config/supabase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export class MobileAuthService {
  /**
   * Verify phone number and PIN, return JWT token if valid
   */
  async login(phoneNumber: string, pin: string) {
    // Clean phone number (remove spaces, dashes, +91 prefix)
    const cleanPhone = phoneNumber.replace(/[\s\-]/g, '').replace(/^\+91/, '');

    // Find user by phone number
    const { data: user, error } = await supabaseAdmin
      .from('mobile_users')
      .select('*')
      .eq('phone_number', cleanPhone)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      throw new Error('Invalid phone number or PIN');
    }

    // Verify PIN
    if (user.pin !== pin) {
      throw new Error('Invalid phone number or PIN');
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        phone_number: user.phone_number,
        employee_name: user.employee_name,
        employee_id: user.employee_id,
        branch: user.branch,
        type: 'mobile'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        phone_number: user.phone_number,
        employee_name: user.employee_name,
        employee_id: user.employee_id,
        branch: user.branch
      }
    };
  }

  /**
   * Verify JWT token and return user info
   */
  async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      // Check if user still exists and is active
      const { data: user, error } = await supabaseAdmin
        .from('mobile_users')
        .select('id, phone_number, employee_name, employee_id, branch, is_active')
        .eq('id', decoded.id)
        .single();

      if (error || !user || !user.is_active) {
        throw new Error('User not found or inactive');
      }

      return user;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Get all mobile users (admin only)
   */
  async getAllUsers() {
    const { data, error } = await supabaseAdmin
      .from('mobile_users')
      .select('id, phone_number, employee_name, employee_id, branch, is_active, created_at')
      .order('employee_name');

    if (error) throw error;
    return data;
  }

  /**
   * Create a new mobile user
   */
  async createUser(userData: {
    phone_number: string;
    pin: string;
    employee_name: string;
    employee_id?: string;
    branch?: string;
  }) {
    const cleanPhone = userData.phone_number.replace(/[\s\-]/g, '').replace(/^\+91/, '');

    const { data, error } = await supabaseAdmin
      .from('mobile_users')
      .insert({
        phone_number: cleanPhone,
        pin: userData.pin,
        employee_name: userData.employee_name,
        employee_id: userData.employee_id || null,
        branch: userData.branch || 'Head Office',
        is_active: true
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Phone number already registered');
      }
      throw error;
    }

    return data;
  }

  /**
   * Update mobile user PIN
   */
  async updatePin(userId: string, newPin: string) {
    if (!/^\d{4}$/.test(newPin)) {
      throw new Error('PIN must be 4 digits');
    }

    const { data, error } = await supabaseAdmin
      .from('mobile_users')
      .update({ pin: newPin, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
