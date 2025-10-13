export class EZError extends Error {
  constructor(
    public message: string,
    public field?: string,
  ) {
    super(message)

    this.field = field || undefined
  }
}
