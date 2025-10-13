import { BasePage } from './base.page'
import type { Page, Locator } from 'playwright'

/**
 * Form Page
 * Demonstrates form automation patterns including validation handling
 */
export class FormPage extends BasePage {
  // Form elements
  private readonly form: Locator
  private readonly firstNameInput: Locator
  private readonly lastNameInput: Locator
  private readonly emailInput: Locator
  private readonly phoneInput: Locator
  private readonly messageTextarea: Locator
  private readonly countrySelect: Locator
  private readonly genderRadios: Locator
  private readonly newsletterCheckbox: Locator
  private readonly termsCheckbox: Locator
  private readonly submitButton: Locator
  private readonly resetButton: Locator
  private readonly fileInput: Locator
  private readonly dateInput: Locator

  // Validation and feedback elements
  private readonly validationErrors: Locator
  private readonly successMessage: Locator
  private readonly loadingSpinner: Locator

  constructor(page: Page, url: string = 'https://example.com/contact') {
    super(page, url)

    // Initialize form locators
    this.form = page.locator('form, .form-container')
    this.firstNameInput = page.locator('#firstName, [name="firstName"], [name="first_name"]')
    this.lastNameInput = page.locator('#lastName, [name="lastName"], [name="last_name"]')
    this.emailInput = page.locator('#email, [name="email"], [type="email"]')
    this.phoneInput = page.locator('#phone, [name="phone"], [type="tel"]')
    this.messageTextarea = page.locator('#message, [name="message"], textarea')
    this.countrySelect = page.locator('#country, [name="country"], select')
    this.genderRadios = page.locator('[name="gender"], .gender-radio')
    this.newsletterCheckbox = page.locator('#newsletter, [name="newsletter"]')
    this.termsCheckbox = page.locator('#terms, [name="terms"], [name="agree"]')
    this.submitButton = page.locator('button[type="submit"], .submit-btn')
    this.resetButton = page.locator('button[type="reset"], .reset-btn')
    this.fileInput = page.locator('[type="file"]')
    this.dateInput = page.locator('[type="date"], .date-picker')

    // Validation and feedback
    this.validationErrors = page.locator('.error, .invalid-feedback, [data-testid="error"]')
    this.successMessage = page.locator('.success, .alert-success, [data-testid="success"]')
    this.loadingSpinner = page.locator('.loading, .spinner, [data-testid="loading"]')
  }

  /**
   * Wait for form to be ready
   */
  protected async waitForPageLoad(): Promise<void> {
    await super.waitForPageLoad()
    await this.waitForElement(this.form)
    await this.waitForElement(this.submitButton)
  }

  /**
   * Fill out the complete form
   * @param formData - Object containing form field values
   */
  async fillForm(formData: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    message?: string
    country?: string
    gender?: string
    newsletter?: boolean
    terms?: boolean
    file?: string
    date?: string
  }): Promise<void> {
    if (formData.firstName) {
      await this.fillFirstName(formData.firstName)
    }

    if (formData.lastName) {
      await this.fillLastName(formData.lastName)
    }

    if (formData.email) {
      await this.fillEmail(formData.email)
    }

    if (formData.phone) {
      await this.fillPhone(formData.phone)
    }

    if (formData.message) {
      await this.fillMessage(formData.message)
    }

    if (formData.country) {
      await this.selectCountry(formData.country)
    }

    if (formData.gender) {
      await this.selectGender(formData.gender)
    }

    if (formData.newsletter !== undefined) {
      await this.setNewsletter(formData.newsletter)
    }

    if (formData.terms !== undefined) {
      await this.setTermsAgreement(formData.terms)
    }

    if (formData.file) {
      await this.uploadFile(formData.file)
    }

    if (formData.date) {
      await this.setDate(formData.date)
    }
  }

  /**
   * Fill first name field
   */
  async fillFirstName(firstName: string): Promise<void> {
    await this.safeType(this.firstNameInput, firstName)
  }

  /**
   * Fill last name field
   */
  async fillLastName(lastName: string): Promise<void> {
    await this.safeType(this.lastNameInput, lastName)
  }

  /**
   * Fill email field
   */
  async fillEmail(email: string): Promise<void> {
    await this.safeType(this.emailInput, email)
  }

  /**
   * Fill phone field
   */
  async fillPhone(phone: string): Promise<void> {
    await this.safeType(this.phoneInput, phone)
  }

  /**
   * Fill message textarea
   */
  async fillMessage(message: string): Promise<void> {
    await this.safeType(this.messageTextarea, message)
  }

  /**
   * Select country from dropdown
   */
  async selectCountry(country: string): Promise<void> {
    await this.safeClick(this.countrySelect)
    await this.page.locator(`option[value="${country}"], option:has-text("${country}")`).click()
  }

  /**
   * Select gender radio button
   */
  async selectGender(gender: string): Promise<void> {
    const genderRadio = this.genderRadios
      .filter({ hasText: gender })
      .or(this.page.locator(`[value="${gender.toLowerCase()}"]`))
    await this.safeClick(genderRadio)
  }

  /**
   * Set newsletter subscription checkbox
   */
  async setNewsletter(subscribe: boolean): Promise<void> {
    const isChecked = await this.newsletterCheckbox.isChecked()
    if (isChecked !== subscribe) {
      await this.safeClick(this.newsletterCheckbox)
    }
  }

  /**
   * Set terms agreement checkbox
   */
  async setTermsAgreement(agree: boolean): Promise<void> {
    const isChecked = await this.termsCheckbox.isChecked()
    if (isChecked !== agree) {
      await this.safeClick(this.termsCheckbox)
    }
  }

  /**
   * Upload a file
   */
  async uploadFile(filePath: string): Promise<void> {
    if (await this.isVisible(this.fileInput)) {
      await this.fileInput.setInputFiles(filePath)
    }
  }

  /**
   * Set date field
   */
  async setDate(date: string): Promise<void> {
    await this.safeType(this.dateInput, date)
  }

  /**
   * Submit the form
   */
  async submitForm(): Promise<void> {
    await this.safeClick(this.submitButton)

    // Wait for either success message or validation errors
    await Promise.race([
      this.successMessage.waitFor({ state: 'visible', timeout: 10000 }),
      this.validationErrors.first().waitFor({ state: 'visible', timeout: 10000 }),
      this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 }),
    ]).catch(() => {
      // Continue if no immediate feedback
    })
  }

  /**
   * Reset the form
   */
  async resetForm(): Promise<void> {
    if (await this.isVisible(this.resetButton)) {
      await this.safeClick(this.resetButton)
    }
  }

  /**
   * Check if form submission was successful
   */
  async isSubmissionSuccessful(): Promise<boolean> {
    return await this.isVisible(this.successMessage, 5000)
  }

  /**
   * Get all validation error messages
   */
  async getValidationErrors(): Promise<string[]> {
    const errors = []
    const errorElements = await this.validationErrors.all()

    for (const errorElement of errorElements) {
      const errorText = await errorElement.textContent()
      if (errorText?.trim()) {
        errors.push(errorText.trim())
      }
    }

    return errors
  }

  /**
   * Check if form has validation errors
   */
  async hasValidationErrors(): Promise<boolean> {
    return await this.validationErrors.first().isVisible()
  }

  /**
   * Get validation error for specific field
   */
  async getFieldError(fieldName: string): Promise<string> {
    const fieldError = this.page.locator(`[data-field="${fieldName}"] .error, #${fieldName}-error`)
    if (await fieldError.isVisible()) {
      return (await fieldError.textContent()) || ''
    }
    return ''
  }

  /**
   * Check if specific field has error
   */
  async hasFieldError(fieldName: string): Promise<boolean> {
    const fieldError = this.page.locator(`[data-field="${fieldName}"] .error, #${fieldName}-error`)
    return await fieldError.isVisible()
  }

  /**
   * Clear all form fields
   */
  async clearAllFields(): Promise<void> {
    // Clear text inputs
    const textInputs = [
      this.firstNameInput,
      this.lastNameInput,
      this.emailInput,
      this.phoneInput,
      this.messageTextarea,
      this.dateInput,
    ]

    for (const input of textInputs) {
      if (await input.isVisible()) {
        await input.clear()
      }
    }

    // Reset checkboxes
    const checkboxes = [this.newsletterCheckbox, this.termsCheckbox]
    for (const checkbox of checkboxes) {
      if ((await checkbox.isVisible()) && (await checkbox.isChecked())) {
        await checkbox.click()
      }
    }
  }

  /**
   * Check if form is in loading state
   */
  async isLoading(): Promise<boolean> {
    return await this.isVisible(this.loadingSpinner)
  }

  /**
   * Wait for form submission to complete
   */
  async waitForSubmission(): Promise<void> {
    // Wait for loading to appear and then disappear
    if (await this.isVisible(this.loadingSpinner, 1000)) {
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 30000 })
    }
  }

  /**
   * Validate form before submission
   */
  async validateForm(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []

    // Check required fields
    if (!(await this.firstNameInput.inputValue())) {
      errors.push('First name is required')
    }

    if (!(await this.emailInput.inputValue())) {
      errors.push('Email is required')
    }

    // Check email format
    const email = await this.emailInput.inputValue()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (email && !emailRegex.test(email)) {
      errors.push('Invalid email format')
    }

    // Check terms agreement
    if ((await this.termsCheckbox.isVisible()) && !(await this.termsCheckbox.isChecked())) {
      errors.push('You must agree to the terms')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}
