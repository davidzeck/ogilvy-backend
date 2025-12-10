/**
 * Validation Middleware
 * Request validation using express-validator
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { sendValidationError } from '../utils/apiResponse';

/**
 * Validates request using express-validator
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(
        res,
        'Validation failed',
        errors.array()
      );
    }

    next();
  };
};

/**
 * Dashboard query parameter validators
 */
import { query, oneOf } from 'express-validator';

export const validateDashboardQuery = [
  query('dateRange')
    .optional()
    .isIn(['last7days', 'last30days', 'last90days', 'lastYear', 'all'])
    .withMessage('dateRange must be one of: last7days, last30days, last90days, lastYear, all'),
  
  query('branch')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('branch must be between 1 and 100 characters'),
  
  query('agent')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('agent must be between 1 and 100 characters'),
  
  query('product')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('product must be between 1 and 100 characters'),
  
  query('segment')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('segment must be between 1 and 100 characters'),
  
  query('campaign')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('campaign must be between 1 and 100 characters'),
];

