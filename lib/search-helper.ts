import { parseNaturalLanguageSearch } from '@/lib/ai'

export interface ParsedSearchFilters {
  query: string
  category?: string
  type?: string
  condition?: string
  minPrice: number
  maxPrice?: number
  words: string[]
}

export function parseSearchQueryFilters(input: {
  rawQuery?: string
  categoryParam?: string
  typeParam?: string
  conditionParam?: string
  minPriceParam?: string | null
  maxPriceParam?: string | null
  aiSearch?: boolean
}): ParsedSearchFilters {
  let rawQuery = input.rawQuery?.trim() ?? ''
  let category = input.categoryParam
  let type = input.typeParam
  let condition = input.conditionParam
  let minPrice = Math.max(0, Number.parseInt(input.minPriceParam ?? '0', 10) || 0)
  let maxPrice = Number.parseInt(input.maxPriceParam ?? '', 10)

  if (input.aiSearch && rawQuery) {
    const parsed = parseNaturalLanguageSearch(rawQuery)
    rawQuery = parsed.query
    if (!category && parsed.category) category = parsed.category
    if (!type && parsed.type) type = parsed.type
    if (!condition && parsed.condition) condition = parsed.condition
    if (parsed.maxPrice && (!maxPrice || isNaN(maxPrice))) maxPrice = parsed.maxPrice
    if (parsed.minPrice && minPrice === 0) minPrice = parsed.minPrice
  }

  const words = rawQuery
    ? rawQuery
        .split(/\s+/)
        .map((w) => w.trim())
        .filter((w) => w.length >= 2)
    : []

  return {
    query: rawQuery,
    category: category === 'All' ? undefined : category,
    type: type === 'All' ? undefined : type?.toLowerCase(),
    condition: condition === 'All' ? undefined : condition?.toLowerCase(),
    minPrice,
    maxPrice: isNaN(maxPrice) ? undefined : maxPrice,
    words,
  }
}
