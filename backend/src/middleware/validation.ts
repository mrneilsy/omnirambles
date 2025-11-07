import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// ============================================================================
// Validation Error Handler
// ============================================================================

export function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: 'field' in err ? err.field : 'unknown',
        message: err.msg,
      })),
    });
    return;
  }
  next();
}

// ============================================================================
// Authentication Validators
// ============================================================================

export const validateRegistration: ValidationChain[] = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email is too long'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be 3-50 characters long')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[a-zA-Z]/)
    .withMessage('Password must contain at least one letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
];

export const validateLogin: ValidationChain[] = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const validateChangePassword: ValidationChain[] = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/[a-zA-Z]/)
    .withMessage('New password must contain at least one letter')
    .matches(/[0-9]/)
    .withMessage('New password must contain at least one number'),
];

export const validateForgotPassword: ValidationChain[] = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
];

export const validateResetPassword: ValidationChain[] = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 32, max: 128 })
    .withMessage('Invalid reset token format'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/[a-zA-Z]/)
    .withMessage('New password must contain at least one letter')
    .matches(/[0-9]/)
    .withMessage('New password must contain at least one number'),
];

// ============================================================================
// Note Validators
// ============================================================================

export const validateNoteCreation: ValidationChain[] = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Note content is required')
    .isLength({ min: 1, max: 50000 })
    .withMessage('Note content must be 1-50000 characters'),
];

export const validateNoteUpdate: ValidationChain[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid note ID'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50000 })
    .withMessage('Note content must be 1-50000 characters'),
];

export const validateNoteId: ValidationChain[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid note ID'),
];

// ============================================================================
// Tag Validators
// ============================================================================

export const validateTagCreation: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Tag name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Tag name must be 1-100 characters'),
  body('source')
    .equals('Self')
    .withMessage('Tag source must be "Self"'),
];

export const validateTagUpdate: ValidationChain[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid tag ID'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Tag name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Tag name must be 1-100 characters'),
];

export const validateTagId: ValidationChain[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid tag ID'),
];

export const validateAddTagToNote: ValidationChain[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid note ID'),
  body('tagName')
    .trim()
    .notEmpty()
    .withMessage('Tag name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Tag name must be 1-100 characters'),
  body('source')
    .equals('Self')
    .withMessage('Tag source must be "Self"'),
];

// ============================================================================
// Query Parameter Validators
// ============================================================================

export const validateNoteFilters: ValidationChain[] = [
  query('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a comma-separated string'),
  query('sortBy')
    .optional()
    .isIn(['created_at', 'updated_at'])
    .withMessage('sortBy must be "created_at" or "updated_at"'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be "asc" or "desc"'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
];
