import { NextResponse } from 'next/server';
import { searchPersonalizedAttractions } from '@/lib/db/vector';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, preferredThrill, limit } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ success: false, error: 'Query text required for semantic vector search' }, { status: 400 });
    }

    const results = await searchPersonalizedAttractions(
      query,
      preferredThrill,
      limit || 4
    );

    return NextResponse.json({
      success: true,
      query,
      preferredThrill: preferredThrill || 'ALL',
      count: results.length,
      data: results
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
