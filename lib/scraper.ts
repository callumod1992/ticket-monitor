import { chromium } from 'playwright'

export interface TicketListing {
  price: number
  section?: string
  row?: string
  quantity?: string
}

export interface SiteResult {
  label: string
  url: string
  checkedAt: string
  lowestPrice: number | null
  listings: TicketListing[]
  error?: string
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

async function scrapeVividSeats(page: any, url: string): Promise<TicketListing[]> {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })

  // Wait for listings
  try {
    await page.waitForSelector(
      '[data-testid="listing-row"], [class*="listingRow"], [class*="listing-row"], [class*="ListingRow"]',
      { timeout: 15000 }
    )
  } catch {
    await page.waitForSelector('[class*="price"], [class*="Price"]', { timeout: 8000 })
  }

  // Extra wait for JS rendering
  await page.waitForTimeout(2000)

  const listings: TicketListing[] = await page.evaluate(() => {
    const results: any[] = []

    // Try structured listing rows first
    const rows = document.querySelectorAll(
      '[data-testid="listing-row"], [class*="listingRow"], [class*="listing-row"]'
    )

    rows.forEach((row: any) => {
      const priceEl = row.querySelector('[class*="price"], [class*="Price"]')
      const sectionEl = row.querySelector('[class*="section"], [class*="Section"]')
      const rowEl = row.querySelector('[class*="row"], [class*="Row"]')
      const qtyEl = row.querySelector('[class*="qty"], [class*="quantity"], [class*="ticket"]')

      if (priceEl) {
        const text = priceEl.innerText || priceEl.textContent || ''
        const match = text.match(/\$(\d[\d,]+)/)
        if (match) {
          results.push({
            price: parseInt(match[1].replace(',', '')),
            section: sectionEl?.innerText?.trim() ?? null,
            row: rowEl?.innerText?.trim() ?? null,
            quantity: qtyEl?.innerText?.trim() ?? null,
          })
        }
      }
    })

    // Fallback: scrape all prices from page
    if (results.length === 0) {
      document.querySelectorAll('[class*="price"], [class*="Price"], [class*="amount"]').forEach((el: any) => {
        const text = el.innerText || el.textContent || ''
        const match = text.match(/\$(\d[\d,]+)/)
        if (match) {
          const val = parseInt(match[1].replace(',', ''))
          if (val > 50 && val < 50000) {
            results.push({ price: val, section: null, row: null, quantity: null })
          }
        }
      })
    }

    return results
  })

  return listings
}

async function scrapeStubHub(page: any, url: string): Promise<TicketListing[]> {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(3000)

  return await page.evaluate(() => {
    const results: any[] = []
    document.querySelectorAll('[class*="ticket"], [class*="Ticket"], [data-testid*="ticket"]').forEach((el: any) => {
      const text = el.innerText || el.textContent || ''
      const match = text.match(/\$(\d[\d,]+)/)
      if (match) {
        const val = parseInt(match[1].replace(',', ''))
        if (val > 50 && val < 50000) results.push({ price: val })
      }
    })
    return results
  })
}

async function scrapeGeneric(page: any, url: string): Promise<TicketListing[]> {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(2000)

  const prices: number[] = await page.evaluate(() => {
    const found: number[] = []
    const text = document.body.innerText
    const matches = text.matchAll(/\$(\d[\d,]+)/g)
    for (const m of matches) {
      const val = parseInt(m[1].replace(',', ''))
      if (val > 50 && val < 50000) found.push(val)
    }
    return [...new Set(found)].sort((a, b) => a - b)
  })

  return prices.map(p => ({ price: p }))
}

export async function checkSite(site: { label: string; url: string }): Promise<SiteResult> {
  const result: SiteResult = {
    label: site.label,
    url: site.url,
    checkedAt: new Date().toISOString(),
    lowestPrice: null,
    listings: [],
  }

  let browser
  try {
    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1280, height: 800 },
    })
    const page = await context.newPage()

    let listings: TicketListing[] = []

    if (site.url.includes('vividseats')) {
      listings = await scrapeVividSeats(page, site.url)
    } else if (site.url.includes('stubhub')) {
      listings = await scrapeStubHub(page, site.url)
    } else {
      listings = await scrapeGeneric(page, site.url)
    }

    await context.close()

    const prices = listings.map(l => l.price).filter(Boolean).sort((a, b) => a - b)
    result.listings = listings.slice(0, 50) // cap at 50
    result.lowestPrice = prices[0] ?? null
  } catch (e: any) {
    result.error = e.message
  } finally {
    if (browser) await browser.close()
  }

  return result
}
