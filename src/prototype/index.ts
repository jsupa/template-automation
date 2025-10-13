if ('first' in Array.prototype) {
  delete (Array.prototype as any).first
}

Object.defineProperty(Array.prototype, 'first', {
  get: function () {
    return this[0]
  },
  configurable: true,
})
