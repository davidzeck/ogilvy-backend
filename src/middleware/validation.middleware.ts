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
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendValidationError(
        res,
        'Validation failed',
        errors.array()
      );
      return;
    }

    next();
  };
};

/**
 * Dashboard query parameter validators
 */
import { query } from 'express-validator';

export const validateDashboardQuery = [
  query('dateRange')
    .optional({ values: 'falsy' })
    .isIn(['last7days', 'last30days', 'last90days', 'lastYear', 'all'])
    .withMessage('dateRange must be one of: last7days, last30days, last90days, lastYear, all'),

  query('branch')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('branch must not exceed 100 characters'),

  query('agent')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('agent must not exceed 100 characters'),

  query('product')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('product must not exceed 100 characters'),

  query('segment')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('segment must not exceed 100 characters'),

  query('campaign')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('campaign must not exceed 100 characters'),
];

