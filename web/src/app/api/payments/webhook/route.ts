import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const LAMBDA_PAYMENTS_WEBHOOK_URL =
  process.env.LAMBDA_PAYMENTS_WEBHOOK_URL ||
  'https://your-lambda-endpoint.execute-api.region.amazonaws.com/dev/payments/webhook';
const { RAZORPAY_WEBHOOK_SECRET } = process.env;

// POST /api/payments/webhook - Razorpay webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    // Verify webhook signature if secret is configured
    if (RAZORPAY_WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
      }
    }

    // Parse the webhook payload
    const payload = JSON.parse(body);

    // Forward to Lambda function
    const lambdaResponse = await fetch(LAMBDA_PAYMENTS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': signature || '',
        'X-Webhook-Source': 'nextjs-proxy',
        'User-Agent': request.headers.get('user-agent') || '',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
      },
      body: JSON.stringify(payload),
    });

    // Always return 200 to Razorpay to acknowledge receipt
    // The Lambda function handles the actual processing
    if (lambdaResponse.ok) {
      const lambdaData = await lambdaResponse.json();
    } else {
    }

    // Return success to Razorpay
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    // Still return 200 to prevent Razorpay retries
    return NextResponse.json({ status: 'error_logged' });
  }
}
