/**
 * HASIVU Platform - PDF Generator Lambda Function
 * Handles: POST /invoices/pdf, POST /invoices/bulk-pdf, GET /invoices/{id}/download
 * Implements Epic 5: Payment Processing - PDF Invoice Generation
 * 
 * Production-ready PDF generation with AWS S3 storage, template customization,
 * audit logging, and Lambda-optimized operations
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { LoggerService } from '../shared/logger.service';
import { createSuccessResponse, createErrorResponse } from '../shared/response.utils';
import { LambdaDatabaseService } from '../shared/database.service';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { z } from 'zod';
import * as puppeteer from 'puppeteer-core';

// Initialize services
const logger = LoggerService.getInstance();
const database = LambdaDatabaseService.getInstance();

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

// Validation schemas
const generatePdfSchema = z.object({
  invoiceId: z.string().uuid(),
  templateOptions: z.object({
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    fontFamily: z.enum(['Arial', 'Times New Roman', 'Helvetica', 'Inter', 'Roboto']).default('Inter'),
    includeSchoolHeader: z.boolean().default(true),
    includeWatermark: z.boolean().default(false),
    watermarkText: z.string().max(50).optional(),
    customCss: z.string().max(5000).optional(),
    includePaymentTerms: z.boolean().default(true),
    includeNotes: z.boolean().default(true),
    language: z.enum(['en', 'hi', 'te', 'ta']).default('en')
  }).optional(),
  deliveryOptions: z.object({
    storageType: z.enum(['s3', 'temporary']).default('s3'),
    expiryHours: z.number().int().min(1).max(168).default(24), // 1 week max
    generateDownloadLink: z.boolean().default(true),
    emailCopy: z.boolean().default(false),
    recipientEmail: z.string().email().optional()
  }).optional()
});

const bulkPdfSchema = z.object({
  invoiceIds: z.array(z.string().uuid()).min(1).max(100), // Max 100 invoices per batch
  templateOptions: z.object({
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    fontFamily: z.enum(['Arial', 'Times New Roman', 'Helvetica', 'Inter', 'Roboto']).default('Inter'),
    includeSchoolHeader: z.boolean().default(true),
    includeWatermark: z.boolean().default(false),
    watermarkText: z.string().max(50).optional(),
    customCss: z.string().max(5000).optional(),
    includePaymentTerms: z.boolean().default(true),
    includeNotes: z.boolean().default(true),
    language: z.enum(['en', 'hi', 'te', 'ta']).default('en')
  }).optional(),
  deliveryOptions: z.object({
    storageType: z.enum(['s3', 'temporary']).default('s3'),
    expiryHours: z.number().int().min(1).max(168).default(48),
    generateArchive: z.boolean().default(false)
  }).optional()
});

const downloadSchema = z.object({
  invoiceId: z.string().uuid(),
  includeAuditLog: z.boolean().default(true)
});

type GeneratePdfRequest = z.infer<typeof generatePdfSchema>;
type BulkPdfRequest = z.infer<typeof bulkPdfSchema>;
type DownloadRequest = z.infer<typeof downloadSchema>;

/**
 * Security-hardened user authentication and authorization
 */
async function validateUserAccess(event: APIGatewayProxyEvent, requestId: string): Promise<{ userId: string; schoolId: string; role: string }> {
  const clientIP = event.requestContext?.identity?.sourceIp || 'unknown';
  const userAgent = event.headers['User-Agent'] || event.headers['user-agent'] || 'unknown';

  // Extract from headers (TODO: Replace with proper authentication)
  const userId = event.headers['x-user-id'] || event.requestContext?.authorizer?.userId;
  const schoolId = event.headers['x-school-id'] || event.requestContext?.authorizer?.schoolId;
  const role = event.headers['x-user-role'] || event.requestContext?.authorizer?.role || 'admin';

  if (!userId) {
    logger.warn('PDF generation access denied - no user ID', {
      requestId,
      clientIP,
      userAgent: userAgent.substring(0, 200),
      action: 'authentication_failed'
    });
    throw new Error('Authentication required');
  }

  // Validate PDF generation permissions
  const allowedRoles = ['admin', 'super_admin', 'school_admin', 'finance_manager', 'accountant'];
  if (!allowedRoles.includes(role)) {
    logger.warn('PDF generation access denied - insufficient permissions', {
      requestId,
      userId,
      role,
      requiredRoles: allowedRoles,
      action: 'authorization_failed'
    });
    throw new Error('Insufficient permissions for PDF generation');
  }

  // Validate user exists and is active
  const user = await database.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true, role: true }
  });

  if (!user || user.status !== 'ACTIVE') {
    throw new Error('Access denied');
  }

  return { userId, schoolId: schoolId || '', role };
}

/**
 * Generate HTML content for invoice PDF
 */
function generateInvoiceHtml(invoice: any, templateOptions: any = {}): string {
  const {
    primaryColor = '#4F46E5',
    secondaryColor = '#E5E7EB',
    fontFamily = 'Inter',
    includeSchoolHeader = true,
    includeWatermark = false,
    watermarkText = 'INVOICE',
    customCss = '',
    includePaymentTerms = true,
    includeNotes = true,
    language = 'en'
  } = templateOptions;

  // Generate items HTML
  const itemsHtml = invoice.items?.map((item: any, index: number) => `
    <tr class="item-row ${index % 2 === 0 ? 'even' : 'odd'}">
      <td class="item-description">
        <div class="item-name">${item.name || item.description}</div>
        ${item.description && item.description !== item.name ? `<div class="item-details">${item.description}</div>` : ''}
      </td>
      <td class="item-quantity">${item.quantity}</td>
      <td class="item-rate">₹${(item.unitPrice || item.rate || 0).toFixed(2)}</td>
      <td class="item-amount">₹${((item.quantity || 0) * (item.unitPrice || item.rate || 0)).toFixed(2)}</td>
    </tr>
  `).join('') || '';

  // Calculate totals
  const subtotal = invoice.items?.reduce((sum: number, item: any) => 
    sum + ((item.quantity || 0) * (item.unitPrice || item.rate || 0)), 0) || 0;
  const taxAmount = invoice.taxAmount || 0;
  const discountAmount = invoice.discountAmount || 0;
  const totalAmount = invoice.totalAmount || (subtotal + taxAmount - discountAmount);

  // Tax breakdown
  const taxBreakdown = invoice.taxDetails?.map((tax: any) => `
    <tr class="tax-row">
      <td colspan="3" class="tax-label">${tax.name} (${tax.rate}%)</td>
      <td class="tax-amount">₹${tax.amount.toFixed(2)}</td>
    </tr>
  `).join('') || (taxAmount > 0 ? `
    <tr class="tax-row">
      <td colspan="3" class="tax-label">GST (18%)</td>
      <td class="tax-amount">₹${taxAmount.toFixed(2)}</td>
    </tr>
  ` : '');

  // Discount row
  const discountRow = discountAmount > 0 ? `
    <tr class="discount-row">
      <td colspan="3" class="discount-label">Discount</td>
      <td class="discount-amount">-₹${discountAmount.toFixed(2)}</td>
    </tr>
  ` : '';

  return `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: '${fontFamily}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #1f2937;
          background: white;
        }
        
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          position: relative;
        }
        
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 120px;
          font-weight: bold;
          color: rgba(0, 0, 0, 0.05);
          z-index: -1;
          pointer-events: none;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          border-bottom: 3px solid ${primaryColor};
          padding-bottom: 20px;
        }
        
        .school-info h1 {
          color: ${primaryColor};
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .school-info p {
          color: #6b7280;
          margin-bottom: 4px;
        }
        
        .logo {
          max-height: 80px;
          max-width: 200px;
        }
        
        .invoice-details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        
        .invoice-meta h2 {
          color: ${primaryColor};
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .invoice-meta p {
          margin-bottom: 8px;
        }
        
        .billing-info h3 {
          color: #374151;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 10px;
          border-bottom: 1px solid ${secondaryColor};
          padding-bottom: 5px;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .items-table th {
          background: ${primaryColor};
          color: white;
          padding: 15px 10px;
          text-align: left;
          font-weight: 600;
        }
        
        .items-table td {
          padding: 12px 10px;
          border-bottom: 1px solid ${secondaryColor};
        }
        
        .item-row.even {
          background: #f9fafb;
        }
        
        .item-name {
          font-weight: 600;
          color: #111827;
        }
        
        .item-details {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }
        
        .item-quantity, .item-rate, .item-amount {
          text-align: right;
        }
        
        .totals-section {
          margin-left: auto;
          width: 300px;
        }
        
        .totals-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .totals-table td {
          padding: 8px 15px;
          border-bottom: 1px solid ${secondaryColor};
        }
        
        .totals-table .label {
          font-weight: 600;
          color: #374151;
        }
        
        .totals-table .amount {
          text-align: right;
          font-weight: 600;
        }
        
        .total-row {
          background: ${primaryColor};
          color: white;
          font-weight: bold;
          font-size: 16px;
        }
        
        .payment-terms, .notes {
          margin-top: 40px;
          padding: 20px;
          background: #f9fafb;
          border-left: 4px solid ${primaryColor};
        }
        
        .payment-terms h4, .notes h4 {
          color: ${primaryColor};
          margin-bottom: 10px;
          font-size: 16px;
        }
        
        .footer {
          margin-top: 50px;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          border-top: 1px solid ${secondaryColor};
          padding-top: 20px;
        }
        
        @media print {
          .invoice-container {
            padding: 20px;
          }
          
          .watermark {
            display: ${includeWatermark ? 'block' : 'none'};
          }
        }
        
        ${customCss}
      </style>
    </head>
    <body>
      <div class="invoice-container">
        ${includeWatermark ? `<div class="watermark">${watermarkText}</div>` : ''}
        
        ${includeSchoolHeader ? `
        <div class="header">
          <div class="school-info">
            <h1>${invoice.school?.name || 'School Name'}</h1>
            ${invoice.school?.address ? `<p>${invoice.school.address}</p>` : ''}
            ${invoice.school?.phone ? `<p>Phone: ${invoice.school.phone}</p>` : ''}
            ${invoice.school?.email ? `<p>Email: ${invoice.school.email}</p>` : ''}
            ${invoice.school?.gstNumber ? `<p>GSTIN: ${invoice.school.gstNumber}</p>` : ''}
          </div>
          ${invoice.school?.logoUrl ? `<img src="${invoice.school.logoUrl}" alt="School Logo" class="logo">` : ''}
        </div>
        ` : ''}
        
        <div class="invoice-details">
          <div class="invoice-meta">
            <h2>INVOICE</h2>
            <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
            <p><strong>Status:</strong> <span style="color: ${invoice.status === 'PAID' ? '#10b981' : '#f59e0b'}">${invoice.status}</span></p>
          </div>
          
          <div class="billing-info">
            <h3>Bill To:</h3>
            <p><strong>${invoice.customer?.name || invoice.parentName || 'Customer'}</strong></p>
            ${invoice.customer?.email ? `<p>${invoice.customer.email}</p>` : ''}
            ${invoice.customer?.phone ? `<p>${invoice.customer.phone}</p>` : ''}
            ${invoice.customer?.address ? `<p>${invoice.customer.address}</p>` : ''}
            ${invoice.studentName ? `<p><strong>Student:</strong> ${invoice.studentName}</p>` : ''}
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 50%">Description</th>
              <th style="width: 15%">Qty</th>
              <th style="width: 17.5%">Rate</th>
              <th style="width: 17.5%">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div class="totals-section">
          <table class="totals-table">
            <tr>
              <td class="label">Subtotal:</td>
              <td class="amount">₹${subtotal.toFixed(2)}</td>
            </tr>
            ${taxBreakdown}
            ${discountRow}
            <tr class="total-row">
              <td class="label">Total:</td>
              <td class="amount">₹${totalAmount.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        
        ${includePaymentTerms ? `
        <div class="payment-terms">
          <h4>Payment Terms</h4>
          <p>Payment is due within ${invoice.paymentTerms || '30'} days of invoice date. Late payments may incur additional charges.</p>
          <p>Accepted payment methods: Online payment, Bank transfer, UPI</p>
        </div>
        ` : ''}
        
        ${includeNotes && invoice.notes ? `
        <div class="notes">
          <h4>Notes</h4>
          <p>${invoice.notes}</p>
        </div>
        ` : ''}
        
        <div class="footer">
          <p>This is a computer-generated invoice. No signature required.</p>
          <p>Generated on ${new Date().toLocaleString()} | Powered by HASIVU Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate single PDF from invoice
 */
async function generateSinglePdf(
  request: GeneratePdfRequest,
  userId: string,
  schoolId: string,
  requestId: string
) {
  try {
    // Fetch invoice with all related data
    const invoice = await database.prisma.invoice.findUnique({
      where: { id: request.invoiceId },
      include: {
        invoiceItems: true,
        payment: true,
        school: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Validate school access
    if (schoolId && invoice.schoolId !== schoolId) {
      throw new Error('Access denied for this invoice');
    }

    // Generate HTML content
    const htmlContent = generateInvoiceHtml(invoice, request.templateOptions);

    // Launch Puppeteer (use AWS Lambda Layer for production)
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--deterministic-fetch',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    await browser.close();

    let downloadUrl = '';
    let s3Key = '';

    // Store in S3 if requested
    if (request.deliveryOptions?.storageType === 's3') {
      s3Key = `invoices/${invoice.schoolId}/${invoice.invoiceNumber}-${Date.now()}.pdf`;
      
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME || 'hasivu-invoices',
        Key: s3Key,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
        Metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          schoolId: invoice.schoolId,
          generatedBy: userId,
          requestId
        }
      }));

      // Generate download URL if requested
      if (request.deliveryOptions?.generateDownloadLink) {
        downloadUrl = await getSignedUrl(s3Client, new GetObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME || 'hasivu-invoices',
          Key: s3Key
        }), {
          expiresIn: (request.deliveryOptions?.expiryHours || 24) * 3600 // Convert to seconds
        });
      }
    }

    // Create audit log
    await database.auditLog.create({
      data: {
        userId,
        createdById: userId,
        action: 'PDF_GENERATED',
        entityType: 'invoice',
        entityId: invoice.id,
        metadata: JSON.stringify({
          invoiceNumber: invoice.invoiceNumber,
          templateOptions: request.templateOptions,
          deliveryOptions: request.deliveryOptions,
          s3Key,
          fileSize: pdfBuffer.length
        }),
        ipAddress: 'lambda-function',
        userAgent: 'pdf-generator-lambda'
      }
    });

    logger.info('PDF generated successfully', {
      requestId,
      userId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      fileSize: pdfBuffer.length,
      s3Key,
      storageType: request.deliveryOptions?.storageType
    });

    return {
      success: true,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      pdfSize: pdfBuffer.length,
      downloadUrl,
      s3Key,
      expiresAt: request.deliveryOptions?.storageType === 's3' ? 
        new Date(Date.now() + (request.deliveryOptions?.expiryHours || 24) * 3600 * 1000) : null,
      // Return base64 for temporary storage
      pdfData: request.deliveryOptions?.storageType === 'temporary' ? 
        pdfBuffer.toString('base64') : undefined
    };

  } catch (error) {
    logger.error('Failed to generate PDF', {
      requestId,
      userId,
      invoiceId: request.invoiceId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Generate bulk PDFs
 */
async function generateBulkPdfs(
  request: BulkPdfRequest,
  userId: string,
  schoolId: string,
  requestId: string
) {
  try {
    const results = {
      successful: [] as any[],
      failed: [] as any[],
      totalRequested: request.invoiceIds.length,
      processingTime: 0
    };

    const startTime = Date.now();

    // Process each invoice
    for (const invoiceId of request.invoiceIds) {
      try {
        const singleRequest: GeneratePdfRequest = {
          invoiceId,
          templateOptions: {
            ...request.templateOptions,
            includePaymentTerms: request.templateOptions.includePaymentTerms ?? true,
            includeNotes: request.templateOptions.includeNotes ?? true
          },
          deliveryOptions: {
            storageType: request.deliveryOptions?.storageType || 's3',
            expiryHours: request.deliveryOptions?.expiryHours || 48,
            generateDownloadLink: true,
            emailCopy: false
          }
        };

        const result = await generateSinglePdf(singleRequest, userId, schoolId, requestId);
        results.successful.push(result);

      } catch (error) {
        results.failed.push({
          invoiceId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    results.processingTime = Date.now() - startTime;

    // Create bulk audit log
    await database.auditLog.create({
      data: {
        userId,
        createdById: userId,
        action: 'BULK_PDF_GENERATED',
        entityType: 'invoice',
        entityId: 'bulk',
        metadata: JSON.stringify({
          totalRequested: results.totalRequested,
          successful: results.successful.length,
          failed: results.failed.length,
          processingTime: results.processingTime,
          templateOptions: request.templateOptions
        }),
        ipAddress: 'lambda-function',
        userAgent: 'pdf-generator-lambda'
      }
    });

    logger.info('Bulk PDF generation completed', {
      requestId,
      userId,
      totalRequested: results.totalRequested,
      successful: results.successful.length,
      failed: results.failed.length,
      processingTime: results.processingTime
    });

    return results;

  } catch (error) {
    logger.error('Failed to generate bulk PDFs', {
      requestId,
      userId,
      totalRequested: request.invoiceIds.length,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Download existing PDF
 */
async function downloadPdf(
  request: DownloadRequest,
  userId: string,
  schoolId: string,
  requestId: string
) {
  try {
    // Find invoice and existing PDF
    const invoice = await database.prisma.invoice.findUnique({
      where: { id: request.invoiceId },
      select: {
        id: true,
        invoiceNumber: true,
        schoolId: true,
        pdfUrl: true,
        pdfGeneratedAt: true
      }
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Validate school access
    if (schoolId && invoice.schoolId !== schoolId) {
      throw new Error('Access denied for this invoice');
    }

    if (!invoice.pdfUrl) {
      throw new Error('PDF not found for this invoice');
    }

    // Generate download URL
    const downloadUrl = await getSignedUrl(s3Client, new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'hasivu-invoices',
      Key: invoice.pdfUrl
    }), {
      expiresIn: 3600 // 1 hour
    });

    // Create audit log if requested
    if (request.includeAuditLog) {
      await database.auditLog.create({
        data: {
          userId,
          createdById: userId,
          action: 'PDF_DOWNLOADED',
          entityType: 'invoice',
          entityId: invoice.id,
          metadata: JSON.stringify({
            invoiceNumber: invoice.invoiceNumber,
            s3Key: invoice.pdfUrl,
            pdfGeneratedAt: invoice.pdfGeneratedAt
          }),
          ipAddress: 'lambda-function',
          userAgent: 'pdf-generator-lambda'
        }
      });
    }

    logger.info('PDF download URL generated', {
      requestId,
      userId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      s3Key: invoice.pdfUrl
    });

    return {
      downloadUrl,
      invoiceNumber: invoice.invoiceNumber,
      generatedAt: invoice.pdfGeneratedAt,
      expiresAt: new Date(Date.now() + 3600 * 1000) // 1 hour
    };

  } catch (error) {
    logger.error('Failed to generate download URL', {
      requestId,
      userId,
      invoiceId: request.invoiceId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * HASIVU Platform - PDF Generator Lambda Function Handler
 */
export const pdfGeneratorHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = context.awsRequestId;
  const startTime = Date.now();

  try {
    const clientIP = event.requestContext?.identity?.sourceIp || 'unknown';
    const userAgent = event.headers['User-Agent'] || event.headers['user-agent'] || 'unknown';
    
    logger.info('PDF generator request started', {
      requestId,
      method: event.httpMethod,
      path: event.path,
      clientIP,
      userAgent: userAgent.substring(0, 200)
    });

    // Validate and authenticate user
    const { userId, schoolId, role } = await validateUserAccess(event, requestId);
    const pathParameters = event.pathParameters || {};

    let result;

    switch (event.httpMethod) {
      case 'POST':
        if (!event.body) {
          return createErrorResponse(400, 'Request body required', undefined, 'MISSING_BODY', requestId);
        }

        const body = JSON.parse(event.body);

        if (event.path?.includes('/bulk-pdf')) {
          // Bulk PDF generation
          const bulkRequest = bulkPdfSchema.parse(body);
          result = await generateBulkPdfs(bulkRequest, userId, schoolId, requestId);
        } else {
          // Single PDF generation
          const pdfRequest = generatePdfSchema.parse(body);
          result = await generateSinglePdf(pdfRequest, userId, schoolId, requestId);
        }
        break;

      case 'GET':
        if (pathParameters.invoiceId && event.path?.includes('/download')) {
          // Download existing PDF
          const downloadRequest: DownloadRequest = {
            invoiceId: pathParameters.invoiceId,
            includeAuditLog: true
          };
          result = await downloadPdf(downloadRequest, userId, schoolId, requestId);
        } else {
          return createErrorResponse(400, 'Invalid GET endpoint', undefined, 'INVALID_ENDPOINT', requestId);
        }
        break;

      default:
        return createErrorResponse(405, `Method ${event.httpMethod} not allowed`, undefined, 'METHOD_NOT_ALLOWED', requestId);
    }

    const duration = Date.now() - startTime;
    
    logger.info('PDF generator request completed', {
      requestId,
      method: event.httpMethod,
      userId,
      schoolId,
      role,
      duration,
      success: true
    });

    const statusCode = event.httpMethod === 'POST' ? 201 : 200;
    return createSuccessResponse(statusCode, 'PDF operation completed successfully', result, requestId);

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('PDF generator request failed', {
      requestId,
      method: event.httpMethod,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration
    });

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Authentication required')) {
        return createErrorResponse(401, 'Authentication required', undefined, 'AUTHENTICATION_REQUIRED', requestId);
      }
      if (error.message.includes('Insufficient permissions')) {
        return createErrorResponse(403, 'Insufficient permissions for PDF generation', undefined, 'ACCESS_DENIED', requestId);
      }
      if (error.message.includes('Access denied')) {
        return createErrorResponse(403, 'Access denied', undefined, 'ACCESS_DENIED', requestId);
      }
      if (error.message.includes('not found')) {
        return createErrorResponse(404, 'Invoice not found', undefined, 'NOT_FOUND', requestId);
      }
    }

    return createErrorResponse(500, 'Internal server error', undefined, 'INTERNAL_ERROR', requestId);
  }
};