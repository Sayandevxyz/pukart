import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('PUKart End-to-End Accessibility & Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API data layer so tests are resilient regardless of database availability
    await page.route('**/api/listings*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          listings: [],
          total: 0,
          page: 1,
          limit: 24,
          totalPages: 0,
        }),
      })
    })

    await page.route('**/api/auth/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ session: null, user: null }),
      })
    })
  })

  test('pinch-zoom is not disabled in viewport meta tag', async ({ page }) => {
    await page.goto('/')
    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content')
    expect(viewportMeta).toBeTruthy()
    expect(viewportMeta).not.toContain('user-scalable=no')
    expect(viewportMeta).not.toContain('user-scalable=0')
    expect(viewportMeta).not.toContain('maximum-scale=1')
  })

  test('skip to main content link works via keyboard navigation', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const skipLink = page.getByRole('link', { name: /skip to (main )?content/i })
    await expect(skipLink).toBeFocused()
    await page.keyboard.press('Enter')
    const mainContent = page.locator('#main-content')
    await expect(mainContent).toBeInViewport()
  })

  test('keyboard-only navigation traverses interactive controls', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedTag).toBeTruthy()
  })

  test('sign-in page validation and interactive elements', async ({ page }) => {
    await page.goto('/sign-in')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const googleBtn = page.getByRole('button', { name: /google/i })
    await expect(googleBtn).toBeVisible()
    await expect(googleBtn).toBeEnabled()
  })

  test('modal dialog maintains focus trap and dismisses upon Escape', async ({ page }) => {
    await page.goto('/test-modal')
    const openBtn = page.locator('#open-modal-btn')
    await expect(openBtn).toBeVisible()
    await openBtn.click()

    const dialog = page.locator('div[role="dialog"]')
    await expect(dialog).toBeVisible()

    // Verify focus is contained within dialog
    const isInitiallyInside = await page.evaluate(() => {
      const modal = document.querySelector('div[role="dialog"]')
      return modal?.contains(document.activeElement) ?? false
    })
    expect(isInitiallyInside).toBe(true)

    // Press Tab multiple times to verify focus never leaks outside modal
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
      const isInside = await page.evaluate(() => {
        const modal = document.querySelector('div[role="dialog"]')
        return modal?.contains(document.activeElement) ?? false
      })
      expect(isInside).toBe(true)
    }

    // Press Shift+Tab and verify focus stays inside modal
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Shift+Tab')
      const isInside = await page.evaluate(() => {
        const modal = document.querySelector('div[role="dialog"]')
        return modal?.contains(document.activeElement) ?? false
      })
      expect(isInside).toBe(true)
    }

    // Press Escape to dismiss modal
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()

    // Focus should be restored to the open button
    await expect(openBtn).toBeFocused()
  })

  test('public pages pass automated Axe accessibility scans', async ({ page }) => {
    const publicRoutes = ['/', '/sign-in', '/safety', '/help']
    for (const route of publicRoutes) {
      await page.goto(route)
      await page.waitForLoadState('domcontentloaded')
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()
      expect(accessibilityScanResults.violations).toEqual([])
    }
  })
})
