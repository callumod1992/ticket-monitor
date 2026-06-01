export interface TicketListing {
  price: number
  section?: string
  row?: string
}

export interface SiteResult {
  label: string
  url: string
  checkedAt: string
  lowestPrice: number | null
  listings: TicketListing[]
  error?: string
}

async function fetchRenderedHtml(url: string): Promise<string> {
  const apiKey = process.env.SCRAPINGBEE_API_KEY

  if (!apiKey) {
    throw new Error('SCRAPINGBEE_API_KEY not set.')
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    url: url,
    render_js: 'true',
    wait: '3000',
    block_ads: 'true',
  })

  const res = await fetch(`https://app.scrapingbee.com/api/v1/?${params}`)

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`ScrapingBee error ${res.status}: ${text.slice(0, 200)}`)
  }

  return await res.text()
}

function extractPrices(html: string): TicketListing[] {
  const listings: TicketListing[] = []
  const seen = new Set<number>()
  const priceRegex = /\$(\d{1,2},?\d{3}|\d{2,4})/g
  let match

  while ((match = priceRegex.exec(html)) !== null) {
    const val = parseInt(match[1].replace(',', ''))
    if (val >= 350 && val <= 50000 && !seen.has(val)) {
      seen.add(val)
      listings.push({ price: val })
    }
  }

  return listings.sort((a, b) => a.price - b.price)
}

export async function checkSite(site: { label: string; url: string }): Promise<SiteResult> {
  const result: SiteResult = {
    label: site.label,
    url: site.url,
    checkedAt: new Date().toISOString(),
    lowestPrice: null,
    listings: [],
  }

  try {
    const html = await fetchRenderedHtml(site.url)
    const listings = extractPrices(html)
    result.listings = listings.slice(0, 50)
    result.lowestPrice = listings[0]?.price ?? null
  } catch (e: any) {
    result.error = e.message
  }

  return result
}
