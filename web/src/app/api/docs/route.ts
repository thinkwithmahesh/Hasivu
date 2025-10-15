import { NextResponse } from 'next/server';
const specs = require('../../../../swagger');

export async function GET() {
  return NextResponse.json(specs);
}
