import { BasePage } from './base.page'
import type { Page, Locator } from 'playwright'

/**
 * Product Listing Page
 * Demonstrates e-commerce/product listing automation patterns
 */
export class ProductListPage extends BasePage {
  // Common product listing elements
  private readonly searchBox: Locator
  private readonly searchButton: Locator
  private readonly filterDropdown: Locator
  private readonly sortDropdown: Locator
  private readonly productCards: Locator
  private readonly productTitles: Locator
  private readonly productPrices: Locator
  private readonly addToCartButtons: Locator
  private readonly loadMoreButton: Locator
  private readonly pagination: Locator
  private readonly noResultsMessage: Locator

  constructor(page: Page, url: string = 'https://example.com/products') {
    super(page, url)

    // Initialize locators
    this.searchBox = page.locator('#search, [name="search"], [placeholder*="search" i]')
    this.searchButton = page.locator('button[type="submit"], .search-btn')
    this.filterDropdown = page.locator('.filter-dropdown, #filter, [name="filter"]')
    this.sortDropdown = page.locator('.sort-dropdown, #sort, [name="sort"]')
    this.productCards = page.locator('.product-card, .product-item, [data-testid="product"]')
    this.productTitles = page.locator('.product-title, .product-name, h3, h4')
    this.productPrices = page.locator('.price, .product-price, [data-testid="price"]')
    this.addToCartButtons = page.locator('.add-to-cart, [data-action="add-cart"]')
    this.loadMoreButton = page.locator('.load-more, #load-more')
    this.pagination = page.locator('.pagination, .page-numbers')
    this.noResultsMessage = page.locator('.no-results, .empty-state')
  }

  /**
   * Wait for product listing page to load
   */
  protected async waitForPageLoad(): Promise<void> {
    await super.waitForPageLoad()
    // Wait for at least one product or no results message
    await Promise.race([
      this.productCards.first().waitFor({ state: 'visible' }),
      this.noResultsMessage.waitFor({ state: 'visible' }),
    ]).catch(() => {
      // Continue if neither appears - might be loading
    })
  }

  /**
   * Search for products
   * @param searchTerm - Term to search for
   */
  async searchProducts(searchTerm: string): Promise<void> {
    await this.safeType(this.searchBox, searchTerm)
    await this.safeClick(this.searchButton)
    await this.waitForPageLoad()
  }

  /**
   * Apply filter
   * @param filterValue - Filter option to select
   */
  async applyFilter(filterValue: string): Promise<void> {
    await this.safeClick(this.filterDropdown)
    await this.page.locator(`option[value="${filterValue}"], li:has-text("${filterValue}")`).click()
    await this.waitForPageLoad()
  }

  /**
   * Change sorting option
   * @param sortValue - Sort option to select
   */
  async sortBy(sortValue: string): Promise<void> {
    await this.safeClick(this.sortDropdown)
    await this.page.locator(`option[value="${sortValue}"], li:has-text("${sortValue}")`).click()
    await this.waitForPageLoad()
  }

  /**
   * Get all visible product information
   * @returns Array of product data
   */
  async getProducts(): Promise<
    Array<{
      title: string
      price: string
      index: number
    }>
  > {
    const products = []
    const productCount = await this.productCards.count()

    for (let i = 0; i < productCount; i++) {
      const productCard = this.productCards.nth(i)
      const title = (await productCard.locator('.product-title, .product-name, h3, h4').textContent()) || ''
      const price = (await productCard.locator('.price, .product-price').textContent()) || ''

      products.push({
        title: title.trim(),
        price: price.trim(),
        index: i,
      })
    }

    return products
  }

  /**
   * Click on a specific product by index
   * @param index - Product index to click
   */
  async clickProduct(index: number): Promise<void> {
    const product = this.productCards.nth(index)
    await this.safeClick(product)
    await this.waitForNavigation()
  }

  /**
   * Click on a product by title
   * @param title - Product title to search for
   */
  async clickProductByTitle(title: string): Promise<void> {
    const product = this.productCards.filter({ hasText: title }).first()
    await this.safeClick(product)
    await this.waitForNavigation()
  }

  /**
   * Add product to cart by index
   * @param index - Product index
   */
  async addToCart(index: number): Promise<void> {
    const addToCartBtn = this.addToCartButtons.nth(index)
    await this.safeClick(addToCartBtn)
    await this.page.waitForTimeout(1000) // Wait for cart update
  }

  /**
   * Add multiple products to cart
   * @param indices - Array of product indices to add
   */
  async addMultipleToCart(indices: number[]): Promise<void> {
    for (const index of indices) {
      await this.addToCart(index)
      await this.page.waitForTimeout(500) // Small delay between additions
    }
  }

  /**
   * Load more products (infinite scroll or load more button)
   */
  async loadMoreProducts(): Promise<void> {
    if (await this.isVisible(this.loadMoreButton)) {
      await this.safeClick(this.loadMoreButton)
      await this.waitForPageLoad()
    } else {
      // Try infinite scroll
      await this.page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight)
      })
      await this.page.waitForTimeout(2000)
    }
  }

  /**
   * Navigate to specific page in pagination
   * @param pageNumber - Page number to navigate to
   */
  async goToPage(pageNumber: number): Promise<void> {
    const pageLink = this.pagination.locator(`a:has-text("${pageNumber}"), [data-page="${pageNumber}"]`)
    if (await pageLink.isVisible()) {
      await this.safeClick(pageLink)
      await this.waitForPageLoad()
    }
  }

  /**
   * Go to next page
   */
  async goToNextPage(): Promise<void> {
    const nextButton = this.pagination.locator('a:has-text("Next"), .next, [data-action="next"]')
    if (await nextButton.isVisible()) {
      await this.safeClick(nextButton)
      await this.waitForPageLoad()
    }
  }

  /**
   * Go to previous page
   */
  async goToPreviousPage(): Promise<void> {
    const prevButton = this.pagination.locator('a:has-text("Previous"), .prev, [data-action="prev"]')
    if (await prevButton.isVisible()) {
      await this.safeClick(prevButton)
      await this.waitForPageLoad()
    }
  }

  /**
   * Get total number of products on current page
   * @returns Number of products visible
   */
  async getProductCount(): Promise<number> {
    return await this.productCards.count()
  }

  /**
   * Check if there are no search results
   * @returns True if no results found
   */
  async hasNoResults(): Promise<boolean> {
    return await this.isVisible(this.noResultsMessage)
  }

  /**
   * Get all product prices as numbers for comparison
   * @returns Array of prices as numbers
   */
  async getProductPricesAsNumbers(): Promise<number[]> {
    const prices = []
    const priceElements = await this.productPrices.all()

    for (const priceElement of priceElements) {
      const priceText = (await priceElement.textContent()) || '0'
      // Extract number from price text (remove currency symbols, etc.)
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''))
      prices.push(isNaN(price) ? 0 : price)
    }

    return prices
  }

  /**
   * Verify products are sorted correctly
   * @param order - 'asc' for ascending, 'desc' for descending
   * @returns True if products are sorted correctly
   */
  async verifyPriceSorting(order: 'asc' | 'desc' = 'asc'): Promise<boolean> {
    const prices = await this.getProductPricesAsNumbers()

    for (let i = 1; i < prices.length; i++) {
      const currentPrice = prices[i] ?? 0
      const previousPrice = prices[i - 1] ?? 0

      if (order === 'asc' && previousPrice > currentPrice) {
        return false
      }
      if (order === 'desc' && previousPrice < currentPrice) {
        return false
      }
    }

    return true
  }
}
