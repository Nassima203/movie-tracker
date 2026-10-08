/** Route params are user input: only accept positive integer ids. */
export function parseTmdbIdParam(value: string | undefined): number | null {
  if (!value || !/^\d{1,10}$/.test(value)) return null
  const id = Number(value)
  return id > 0 && id <= 2_147_483_647 ? id : null
}
