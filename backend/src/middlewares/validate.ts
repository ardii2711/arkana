import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

export const validate =
  (schemas: ValidationSchemas): RequestHandler =>
  (req, res, next) => {
    try {
      res.locals.input = {
        ...(schemas.body && { body: schemas.body.parse(req.body) }),
        ...(schemas.query && { query: schemas.query.parse(req.query) }),
        ...(schemas.params && { params: schemas.params.parse(req.params) }),
      };
      next();
    } catch (error) {
      next(error);
    }
  };
