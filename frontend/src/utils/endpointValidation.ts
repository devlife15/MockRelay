export function validateEndpointPath(value: string) {
  if (!value) return 'Enter an endpoint path.'
  if (!value.startsWith('/')) return 'Path must start with /.'
  if (/\s/.test(value)) return 'Path cannot contain spaces.'
  if (/[?#]/.test(value)) return 'Do not include a query string or fragment.'

  const withoutParameters = value.replace(/\{[A-Za-z][A-Za-z0-9_]*\}/g, '')
  if (/[{}]/.test(withoutParameters)) return 'Use Spring-style parameters such as {id}.'
  return ''
}
