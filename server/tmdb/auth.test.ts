// @vitest-environment node
import { readBearerToken } from './auth.js'

describe('readBearerToken', () => {
  function withAuthorization(value?: string) {
    return new Request('http://localhost', value ? { headers: { Authorization: value } } : {})
  }

  it('extracts the token', () => {
    expect(readBearerToken(withAuthorization('Bearer abc.def.ghi'))).toBe('abc.def.ghi')
  })

  it.each([undefined, 'Basic abc', 'Bearer', 'Bearer a b'])('rejects %s', (value) => {
    expect(readBearerToken(withAuthorization(value))).toBeNull()
  })
})
