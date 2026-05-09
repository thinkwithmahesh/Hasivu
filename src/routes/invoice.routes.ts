import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { requireFeature } from '../middleware/feature-flag.middleware';
import { requireIdempotencyKey } from '../middleware/idempotency.middleware';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { errorResponse, successResponse } from '../shared/api-response.types';
import { InvoiceService, InvoiceSourceType } from '../services/invoice.service';

const prisma = new PrismaClient();
const invoiceService = new InvoiceService(prisma);
const invoiceRouter = Router();

function requestId(req: AuthenticatedRequest): string {
  return (req as AuthenticatedRequest & { id?: string }).id ?? 'unknown';
}

function isAdmin(role: string): boolean {
  return ['admin', 'school_admin', 'super_admin'].includes(role);
}

invoiceRouter.use(requireFeature('INVOICE_ENABLED'));
invoiceRouter.use(authMiddleware);

invoiceRouter.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!;
    const invoices = await invoiceService.listForUser(user.schoolId ?? 'global', user.id);
    res.json(successResponse(invoices, requestId(req)));
  } catch (error) {
    next(error);
  }
});

invoiceRouter.post(
  '/generate',
  requireIdempotencyKey(prisma),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = req.user!;
      const requestedUserId =
        typeof req.body.userId === 'string' && isAdmin(user.role) ? req.body.userId : user.id;

      const invoice = await invoiceService.generate({
        schoolId: user.schoolId ?? 'global',
        userId: requestedUserId,
        sourceType: req.body.sourceType as InvoiceSourceType,
        sourceId: req.body.sourceId,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      });

      res.status(201).json(successResponse(invoice, requestId(req)));
    } catch (error) {
      next(error);
    }
  }
);

invoiceRouter.get('/:invoiceId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!;
    const invoice = await invoiceService.findById(
      req.params.invoiceId,
      user.schoolId ?? 'global',
      isAdmin(user.role) ? undefined : user.id
    );

    if (!invoice) {
      res
        .status(404)
        .json(errorResponse('INVOICE_NOT_FOUND', 'Invoice not found.', requestId(req)));
      return;
    }

    res.json(successResponse(invoice, requestId(req)));
  } catch (error) {
    next(error);
  }
});

export default invoiceRouter;
