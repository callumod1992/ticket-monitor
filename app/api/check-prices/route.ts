import { NextRequest, NextResponse } from 'next/server'
import { checkSite } from '@/lib/scraper'
import { sendPriceAlert } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { sites, alertEmail, targetPrice } = await req.json()

    if (!sites || !Array.isArray(sites) || sites.length === 0) {
      return NextResponse.json({ error: 'No sites provided' }, { status: 400 })
    }

    // Scrape all sites in parallel
    const results = await Promise.all(
      sites.map((site: { label: string; url: string }) => checkSite(site))
    )

    // Find overall lowest
    const validResults = results.filter(r => r.lowestPrice !== null)
    const overallLowest = validResults.length
      ? Math.min(...validResults.map(r => r.lowestPrice!))
      : null

    // Send alert if price is below target
    if (alertEmail && targetPrice && overallLowest && overallLowest <= targetPrice) {
      const bestSite = results.find(r => r.lowestPrice === overallLowest)
      if (bestSite) {
        try {
          await sendPriceAlert({
            to: alertEmail,
            targetPrice,
            lowestPrice: overallLowest,
            siteName: bestSite.label,
            siteUrl: bestSite.url,
          })
        } catch (emailErr) {
          console.error('Email send failed:', emailErr)
          // Don't fail the whole request if email fails
        }
      }
    }

    return NextResponse.json({
      checkedAt: new Date().toISOString(),
      overallLowest,
      results,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
