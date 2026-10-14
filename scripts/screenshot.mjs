import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const pages = [
  { name: 'home', path: '/' },
  { name: 'product', path: '/product' },
  { name: 'pricing', path: '/pricing' },
]

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]

async function captureScreenshots() {
  console.log('Launching browser...')
  
  let browser
  const isVercel = !!process.env.VERCEL
  
  if (isVercel) {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    })
  } else {
    browser = await puppeteer.launch({
      executablePath: '/usr/local/bin/google-chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })
  }

  try {
    const screenshotsDir = join(process.cwd(), 'screenshots')
    mkdirSync(screenshotsDir, { recursive: true })

    for (const page of pages) {
      for (const viewport of viewports) {
        const pageName = `${page.name}-${viewport.name}`
        console.log(`Capturing ${pageName}...`)

        const browserPage = await browser.newPage()
        await browserPage.setViewport({
          width: viewport.width,
          height: viewport.height,
        })

        const url = `${BASE_URL}${page.path}`
        console.log(`  Navigating to ${url}`)
        await browserPage.goto(url, { waitUntil: 'load' })

        const screenshotPath = join(screenshotsDir, `${pageName}.png`)
        await browserPage.screenshot({
          path: screenshotPath,
          fullPage: true,
        })

        console.log(`  Saved to ${screenshotPath}`)
        await browserPage.close()
      }
    }

    console.log('\nAll screenshots captured successfully!')
  } finally {
    await browser.close()
  }
}

captureScreenshots().catch((error) => {
  console.error('Error capturing screenshots:', error)
  process.exit(1)
})
