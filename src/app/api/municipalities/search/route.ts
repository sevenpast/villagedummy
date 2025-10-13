import { NextRequest, NextResponse } from 'next/server'
import { searchMunicipalities, MunicipalityData } from '@/data/swissMunicipalitiesComplete'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query || query.length < 1) {
      return NextResponse.json({ municipalities: [] })
    }

    // Use local data for fast response
    const municipalities: MunicipalityData[] = searchMunicipalities(query, limit)

    return NextResponse.json({ 
      municipalities: municipalities,
      total: municipalities.length,
      query: query,
      source: 'local'
    })

  } catch (error) {
    console.error('Municipality search error:', error)
    return NextResponse.json(
      { error: 'Failed to search municipalities' },
      { status: 500 }
    )
  }
}