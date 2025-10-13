import { BasePage } from './base.page'
import type { Page, Locator } from 'playwright'

/**
 * Example Login Page
 * Demonstrates common login page automation patterns
 */
export class LoginPage extends BasePage {
  // Page elements - using locators for better maintainability
  private readonly emailInput: Locator
  private readonly passwordInput: Locator
  private readonly loginButton: Locator
  private readonly rememberMeCheckbox: Locator
  private readonly forgotPasswordLink: Locator
  private readonly errorMessage: Locator
  private readonly successMessage: Locator

  constructor(page: Page, url: string = 'https://example.com/login') {
    super(page, url)

    // Initialize locators
    this.emailInput = page.locator('#email, [name="email"], [type="email"]')
    this.passwordInput = page.locator('#password, [name="password"], [type="password"]')
    this.loginButton = page.locator('button[type="submit"], #login-btn, .login-button')
    this.rememberMeCheckbox = page.locator('#remember, [name="remember"]')
    this.forgotPasswordLink = page.locator('a[href*="forgot"], a[href*="reset"]')
    this.errorMessage = page.locator('.error, .alert-danger, [data-testid="error"]')
    this.successMessage = page.locator('.success, .alert-success, [data-testid="success"]')
  }

  /**
   * Wait for login page to be fully loaded
   */
  protected async waitForPageLoad(): Promise<void> {
    await super.waitForPageLoad()
    await this.waitForElement(this.emailInput)
    await this.waitForElement(this.passwordInput)
    await this.waitForElement(this.loginButton)
  }

  /**
   * Perform login with email and password
   * @param email - User email address
   * @param password - User password
   * @param rememberMe - Whether to check remember me option
   */
  async login(email: string, password: string, rememberMe: boolean = false): Promise<void> {
    await this.fillEmail(email)
    await this.fillPassword(password)

    if (rememberMe) {
      await this.checkRememberMe()
    }

    await this.submitLogin()
  }

  /**
   * Fill email input field
   * @param email - Email address to enter
   */
  async fillEmail(email: string): Promise<void> {
    await this.safeType(this.emailInput, email)
  }

  /**
   * Fill password input field
   * @param password - Password to enter
   */
  async fillPassword(password: string): Promise<void> {
    await this.safeType(this.passwordInput, password)
  }

  /**
   * Check the remember me checkbox
   */
  async checkRememberMe(): Promise<void> {
    if (await this.isVisible(this.rememberMeCheckbox)) {
      await this.safeClick(this.rememberMeCheckbox)
    }
  }

  /**
   * Click the login button and wait for response
   */
  async submitLogin(): Promise<void> {
    await this.safeClick(this.loginButton)
    await this.page.waitForTimeout(2000) // Wait for login processing
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword(): Promise<void> {
    await this.safeClick(this.forgotPasswordLink)
    await this.waitForNavigation()
  }

  /**
   * Check if login was successful
   * @returns True if login successful, false otherwise
   */
  async isLoginSuccessful(): Promise<boolean> {
    // Check for success indicators
    const hasSuccessMessage = await this.isVisible(this.successMessage, 3000)
    const hasRedirected = !this.getCurrentUrl().includes('login')
    const hasErrorMessage = await this.isVisible(this.errorMessage, 3000)

    return (hasSuccessMessage || hasRedirected) && !hasErrorMessage
  }

  /**
   * Get error message text if login failed
   * @returns Error message text or empty string
   */
  async getErrorMessage(): Promise<string> {
    if (await this.isVisible(this.errorMessage)) {
      return await this.getText(this.errorMessage)
    }
    return ''
  }

  /**
   * Check if email input has validation error
   * @returns True if email has error state
   */
  async hasEmailError(): Promise<boolean> {
    const emailParent = this.emailInput.locator('..')
    return await emailParent.locator('.error, .invalid').isVisible()
  }

  /**
   * Check if password input has validation error
   * @returns True if password has error state
   */
  async hasPasswordError(): Promise<boolean> {
    const passwordParent = this.passwordInput.locator('..')
    return await passwordParent.locator('.error, .invalid').isVisible()
  }

  /**
   * Clear all form fields
   */
  async clearForm(): Promise<void> {
    await this.emailInput.clear()
    await this.passwordInput.clear()
  }

  /**
   * Check if login form is ready for interaction
   * @returns True if form is ready
   */
  async isFormReady(): Promise<boolean> {
    return (
      (await this.isVisible(this.emailInput)) &&
      (await this.isVisible(this.passwordInput)) &&
      (await this.isVisible(this.loginButton))
    )
  }
}
