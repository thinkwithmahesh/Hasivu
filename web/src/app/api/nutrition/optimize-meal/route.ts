import { NextRequest, NextResponse } from 'next/server';

const LAMBDA_MEAL_OPTIMIZATION_URL =
  process.env.LAMBDA_MEAL_OPTIMIZATION_URL ||
  'https://your-lambda-endpoint.execute-api.region.amazonaws.com/dev/nutrition/optimize-meal';

export async function POST(request: NextRequest) {
  try {
    // Get auth token from httpOnly cookie
    const authToken = request.cookies.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'No authentication token found' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Basic validation
    if (!body.currentMealPlan || !body.optimizationGoals) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: currentMealPlan, optimizationGoals',
        },
        { status: 400 }
      );
    }

    // Forward request to Lambda function
    const lambdaResponse = await fetch(LAMBDA_MEAL_OPTIMIZATION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
        'User-Agent': request.headers.get('user-agent') || '',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
      },
      body: JSON.stringify(body),
    });

    const lambdaData = await lambdaResponse.json();

    // Handle Lambda response and transform to expected frontend format
    if (lambdaResponse.ok) {
      // Transform Lambda response to frontend expected format
      const frontendResponse = {
        success: true,
        data: lambdaData.data || lambdaData,
      };

      return NextResponse.json(frontendResponse);
    } else {
      // Handle Lambda errors
      return NextResponse.json(
        {
          success: false,
          error: lambdaData.error || 'Failed to optimize meal',
        },
        { status: lambdaResponse.status }
      );
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
