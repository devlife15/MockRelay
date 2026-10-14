export function statusAllowsBody(statusCode: number) {
  return !(
    (statusCode >= 100 && statusCode < 200)
    || statusCode === 204
    || statusCode === 205
    || statusCode === 304
  )
}

export function isJsonContentType(contentType: string) {
  return contentType.toLowerCase().includes('json')
}
