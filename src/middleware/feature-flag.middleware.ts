import { NextFunction, Request, Response } from 'express';
import { featureFlags, FeatureFlagName } from '../config/feature-flags';
import { errorResponse } from '../shared/api-response.types';

type RequestWithId = Request & { id?: string };

export function requireFeature(flag: FeatureFlagName) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!featureFlags.isEnabled(flag)) {
      const requestId = (req as RequestWithId).id ?? 'unknown';
      res
        .status(404)
        .json(
          errorResponse(
            'FEATURE_DISABLED',
            'This feature is not enabled in this environment.',
            requestId,
            { flag }
          )
        );
      return;
    }

    next();
  };
}
