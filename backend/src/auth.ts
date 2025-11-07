import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { pool } from './db';
import { User, SafeUser, RegisterRequest, LoginRequest, PasswordResetToken } from './types';

// Constants
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
const LOCKOUT_DURATION = parseInt(process.env.LOCKOUT_DURATION || '900000'); // 15 minutes in ms
const PASSWORD_RESET_TOKEN_EXPIRY = 3600000; // 1 hour in ms

// ============================================================================
// Password Hashing Functions
// ============================================================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================================================
// User Utility Functions
// ============================================================================

/**
 * Remove sensitive fields from user object
 */
export function sanitizeUser(user: User): SafeUser {
  const { password_hash, failed_login_attempts, locked_until, ...safeUser } = user;
  return safeUser as SafeUser;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requirements: min 8 chars, at least one letter and one number
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
}

/**
 * Validate username
 * Requirements: 3-50 chars, alphanumeric and underscores only
 */
export function validateUsername(username: string): { valid: boolean; message?: string } {
  if (username.length < 3 || username.length > 50) {
    return { valid: false, message: 'Username must be 3-50 characters long' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
  }
  return { valid: true };
}

// ============================================================================
// User Registration
// ============================================================================

export async function registerUser(data: RegisterRequest): Promise<SafeUser> {
  const { email, username, password } = data;

  // Validate email
  if (!validateEmail(email)) {
    throw new Error('Invalid email format');
  }

  // Validate username
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    throw new Error(usernameValidation.message);
  }

  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.message);
  }

  // Check if email already exists
  const emailCheck = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  if (emailCheck.rows.length > 0) {
    throw new Error('Email already registered');
  }

  // Check if username already exists
  const usernameCheck = await pool.query(
    'SELECT id FROM users WHERE username = $1',
    [username]
  );
  if (usernameCheck.rows.length > 0) {
    throw new Error('Username already taken');
  }

  // Hash password
  const password_hash = await hashPassword(password);

  // Create user
  const result = await pool.query(
    `INSERT INTO users (email, username, password_hash)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [email.toLowerCase(), username, password_hash]
  );

  return sanitizeUser(result.rows[0]);
}

// ============================================================================
// User Login & Authentication
// ============================================================================

export async function authenticateUser(data: LoginRequest): Promise<SafeUser> {
  const { email, password } = data;

  // Find user by email
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user: User = result.rows[0];

  // Check if account is active
  if (!user.is_active) {
    throw new Error('Account is disabled');
  }

  // Check if account is locked
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const minutesLeft = Math.ceil(
      (new Date(user.locked_until).getTime() - Date.now()) / 60000
    );
    throw new Error(`Account is locked. Try again in ${minutesLeft} minutes`);
  }

  // Verify password
  const isValid = await comparePassword(password, user.password_hash);

  if (!isValid) {
    // Increment failed login attempts
    await incrementFailedLoginAttempts(user.id);
    throw new Error('Invalid email or password');
  }

  // Reset failed login attempts and update last login
  await pool.query(
    `UPDATE users
     SET failed_login_attempts = 0,
         locked_until = NULL,
         last_login = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [user.id]
  );

  return sanitizeUser(user);
}

/**
 * Increment failed login attempts and lock account if necessary
 */
async function incrementFailedLoginAttempts(userId: number): Promise<void> {
  const result = await pool.query(
    `UPDATE users
     SET failed_login_attempts = failed_login_attempts + 1
     WHERE id = $1
     RETURNING failed_login_attempts`,
    [userId]
  );

  const attempts = result.rows[0].failed_login_attempts;

  // Lock account if max attempts reached
  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    const lockUntil = new Date(Date.now() + LOCKOUT_DURATION);
    await pool.query(
      'UPDATE users SET locked_until = $1 WHERE id = $2',
      [lockUntil, userId]
    );
  }
}

// ============================================================================
// User Retrieval
// ============================================================================

export async function getUserById(id: number): Promise<SafeUser | null> {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return sanitizeUser(result.rows[0]);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

// ============================================================================
// Password Change
// ============================================================================

export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  // Get user
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const user: User = result.rows[0];

  // Verify current password
  const isValid = await comparePassword(currentPassword, user.password_hash);
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  // Validate new password
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.message);
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update password
  await pool.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2',
    [newPasswordHash, userId]
  );
}

// ============================================================================
// Password Reset
// ============================================================================

export async function createPasswordResetToken(email: string): Promise<string> {
  // Find user
  const user = await getUserByEmail(email);
  if (!user) {
    // Don't reveal if email exists
    throw new Error('If the email exists, a reset link has been sent');
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY);

  // Invalidate any existing tokens for this user
  await pool.query(
    'DELETE FROM password_reset_tokens WHERE user_id = $1',
    [user.id]
  );

  // Create new token
  await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, token, expiresAt]
  );

  return token;
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  // Find valid token
  const result = await pool.query(
    `SELECT * FROM password_reset_tokens
     WHERE token = $1
       AND expires_at > CURRENT_TIMESTAMP
       AND used_at IS NULL`,
    [token]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid or expired reset token');
  }

  const resetToken: PasswordResetToken = result.rows[0];

  // Validate new password
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.message);
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update password and mark token as used
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      'UPDATE users SET password_hash = $1, failed_login_attempts = 0, locked_until = NULL WHERE id = $2',
      [passwordHash, resetToken.user_id]
    );

    await client.query(
      'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1',
      [resetToken.id]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ============================================================================
// User Management
// ============================================================================

export async function updateUserProfile(
  userId: number,
  data: { email?: string; username?: string }
): Promise<SafeUser> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.email) {
    if (!validateEmail(data.email)) {
      throw new Error('Invalid email format');
    }
    // Check if email is already taken by another user
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [data.email.toLowerCase(), userId]
    );
    if (emailCheck.rows.length > 0) {
      throw new Error('Email already taken');
    }
    updates.push(`email = $${paramCount++}`);
    values.push(data.email.toLowerCase());
  }

  if (data.username) {
    const usernameValidation = validateUsername(data.username);
    if (!usernameValidation.valid) {
      throw new Error(usernameValidation.message);
    }
    // Check if username is already taken by another user
    const usernameCheck = await pool.query(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [data.username, userId]
    );
    if (usernameCheck.rows.length > 0) {
      throw new Error('Username already taken');
    }
    updates.push(`username = $${paramCount++}`);
    values.push(data.username);
  }

  if (updates.length === 0) {
    throw new Error('No updates provided');
  }

  values.push(userId);

  const result = await pool.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  return sanitizeUser(result.rows[0]);
}

export async function deleteUser(userId: number): Promise<void> {
  // Delete user (cascade will handle related data)
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
}
