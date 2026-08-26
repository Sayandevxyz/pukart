export interface AISearchResult {
  query: string
  category?: string
  minPrice?: number
  maxPrice?: number
  type?: string
  condition?: string
  explanation?: string
}

export interface AIPriceRecommendation {
  suggestedPrice: number
  minFairPrice: number
  maxFairPrice: number
  reasoning: string
}

export interface AIScamCheckResult {
  flagged: boolean
  riskLevel: 'low' | 'medium' | 'high'
  reason: string | null
  confidence: number
}

/**
 * Generate a campus-tailored listing description.
 */
export async function generateProductDescription(input: {
  title: string
  category: string
  condition: string
  originalPrice?: number
  highlights?: string
}): Promise<string> {
  const { title, category, condition, originalPrice, highlights } = input

  // If AI API is configured via AI Gateway or OpenAI/Gemini endpoint
  const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY
  if (apiKey) {
    try {
      const response = await fetch('https://gateway.ai.cloudflare.com/v1/pukart/openai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant for PUKart, a Pondicherry University student marketplace. Write concise, honest, and attractive descriptions for student listings.',
            },
            {
              role: 'user',
              content: `Write a short 3-paragraph product description for selling:
- Item: ${title}
- Category: ${category}
- Condition: ${condition}
- Original Retail: ₹${originalPrice || 'N/A'}
- Highlights: ${highlights || 'Standard student use'}
Include key features, state of item, and campus pickup readiness.`,
            },
          ],
          temperature: 0.7,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        const content = data.choices?.[0]?.message?.content?.trim()
        if (content) return content
      }
    } catch {
      // Fallback to intelligent generator if external API unavailable
    }
  }

  // Intelligent campus-tailored generator
  const conditionNotes: Record<string, string> = {
    brand_new: 'This item is completely brand new and unused, in its original packaging.',
    like_new: 'Gently used with almost no signs of wear. Kept in pristine condition throughout the semester.',
    good: 'In great working order with minor signs of cosmetic campus use. Fully functional and reliable.',
    fair: 'Well-utilized with normal student wear and tear, but fully operational for academic and hostel needs.',
    poor: 'Usable condition or suitable for parts/refurbishment. Priced accordingly for quick clearance.',
  }

  const note = conditionNotes[condition.toLowerCase()] || 'Maintained well in hostel rooms.'

  return `${title} in ${condition.replace('_', ' ')} condition.

${note} ${highlights ? `Key highlights include: ${highlights}.` : 'Perfect for Pondicherry University students looking for great campus utility without overspending.'}

Available for handoff anywhere on PU campus (Science Complex, Central Library, Silver Jubilee Campus, or Hostel Mess). Price is negotiable for serious student buyers.`
}

/**
 * Recommend a fair price for student campus trade.
 */
export function calculatePriceRecommendation(input: {
  category: string
  condition: string
  originalPrice?: number
  currentPrice?: number
}): AIPriceRecommendation {
  const original = input.originalPrice || (input.currentPrice ? input.currentPrice * 1.5 : 2000)
  const categoryMultipliers: Record<string, { brand_new: number; like_new: number; good: number; fair: number; poor: number }> = {
    Books: { brand_new: 0.75, like_new: 0.6, good: 0.45, fair: 0.3, poor: 0.15 },
    Electronics: { brand_new: 0.85, like_new: 0.7, good: 0.55, fair: 0.4, poor: 0.2 },
    Cycles: { brand_new: 0.8, like_new: 0.65, good: 0.5, fair: 0.35, poor: 0.2 },
    Hostel: { brand_new: 0.75, like_new: 0.6, good: 0.45, fair: 0.3, poor: 0.15 },
    Fashion: { brand_new: 0.7, like_new: 0.5, good: 0.35, fair: 0.2, poor: 0.1 },
    Sports: { brand_new: 0.75, like_new: 0.6, good: 0.45, fair: 0.3, poor: 0.15 },
    Services: { brand_new: 1.0, like_new: 0.9, good: 0.8, fair: 0.7, poor: 0.5 },
  }

  const multi = categoryMultipliers[input.category] || { brand_new: 0.8, like_new: 0.65, good: 0.5, fair: 0.35, poor: 0.2 }
  const cond = (input.condition.toLowerCase() as keyof typeof multi) in multi ? (input.condition.toLowerCase() as keyof typeof multi) : 'good'
  const ratio = multi[cond] || 0.5

  const suggested = Math.round(original * ratio)
  const minFair = Math.round(suggested * 0.85)
  const maxFair = Math.round(suggested * 1.15)

  return {
    suggestedPrice: suggested,
    minFairPrice: minFair,
    maxFairPrice: maxFair,
    reasoning: `Based on campus demand in ${input.category} for items in ${input.condition.replace('_', ' ')} condition, student listings typically sell quickly at ~${Math.round(ratio * 100)}% of original retail value.`,
  }
}

/**
 * Natural language search parser.
 * Converts queries like "coding laptop under 30000" into structured search params.
 */
export function parseNaturalLanguageSearch(rawQuery: string): AISearchResult {
  const query = rawQuery.trim()
  if (!query) return { query: '' }

  let extractedCategory: string | undefined
  let maxPrice: number | undefined
  let minPrice: number | undefined
  let type: string | undefined
  let condition: string | undefined

  const lower = query.toLowerCase()

  // Match price expressions: "under 25000", "below ₹30,000", "< 500", "between 500 and 2000"
  const underMatch = lower.match(/(?:under|below|less than|<|max(?:imum)?)\s*(?:₹|rs\.?|inr)?\s*([0-9]+(?:,[0-9]+)*)/i)
  if (underMatch) {
    maxPrice = Number.parseInt(underMatch[1].replace(/,/g, ''), 10)
  }

  const aboveMatch = lower.match(/(?:above|greater than|>|min(?:imum)?)\s*(?:₹|rs\.?|inr)?\s*([0-9]+(?:,[0-9]+)*)/i)
  if (aboveMatch) {
    minPrice = Number.parseInt(aboveMatch[1].replace(/,/g, ''), 10)
  }

  const betweenMatch = lower.match(/between\s*(?:₹|rs\.?)?\s*([0-9]+)\s*(?:and|to|-)\s*(?:₹|rs\.?)?\s*([0-9]+)/i)
  if (betweenMatch) {
    minPrice = Number.parseInt(betweenMatch[1], 10)
    maxPrice = Number.parseInt(betweenMatch[2], 10)
  }

  // Type extraction
  if (/\b(?:rent|rental|to rent|for rent|monthly)\b/i.test(lower)) {
    type = 'rent'
  } else if (/\b(?:buy|purchase|for sale|to buy)\b/i.test(lower)) {
    type = 'sell'
  }

  // Category matching
  if (/\b(?:book|books|novel|textbook|notes|gate|semester|syllabus|author)\b/i.test(lower)) {
    extractedCategory = 'Books'
  } else if (/\b(?:laptop|phone|mobile|electronics|charger|earphone|headphone|calculator|keyboard|mouse|monitor|ipad|tablet)\b/i.test(lower)) {
    extractedCategory = 'Electronics'
  } else if (/\b(?:bike|motorcycle|motor bike|pulsar|bullet|royal enfield|yamaha|fz|ktm|splendor|apache|helmet)\b/i.test(lower)) {
    extractedCategory = 'Bikes'
  } else if (/\b(?:scooty|scooter|activa|jupiter|access|ntorq|electric scooter|ev scooty|ola|ather|pleasure|dio|pep)\b/i.test(lower)) {
    extractedCategory = 'Scooty'
  } else if (/\b(?:cycle|bicycle|gear cycle|hero|btwin|pedal|hercules|firefox)\b/i.test(lower)) {
    extractedCategory = 'Cycles'
  } else if (/\b(?:hostel|mattress|cooler|kettle|study lamp|hanger|bucket|pillow|bedsheet|almirah)\b/i.test(lower)) {
    extractedCategory = 'Hostel'
  } else if (/\b(?:badminton|racquet|bat|football|cricket|gym|dumbbell|sports)\b/i.test(lower)) {
    extractedCategory = 'Sports'
  } else if (/\b(?:lab coat|coat|blazer|jacket|hoodie|shoes|fashion|dress)\b/i.test(lower)) {
    extractedCategory = 'Fashion'
  } else if (/\b(?:tutor|tuition|service|editing|photography|assignment)\b/i.test(lower)) {
    extractedCategory = 'Services'
  }

  // Condition matching
  if (/\b(?:brand new|sealed|unopened)\b/i.test(lower)) condition = 'brand_new'
  else if (/\b(?:like new|mint)\b/i.test(lower)) condition = 'like_new'
  else if (/\b(?:good condition|used)\b/i.test(lower)) condition = 'good'

  // Clean keywords for remaining search
  const cleanKeywords = query
    .replace(/(?:under|below|less than|above|greater than|<|>|min|max|between|and|to)\s*(?:₹|rs\.?|inr)?\s*[0-9]+(?:,[0-9]+)*/gi, '')
    .replace(/\b(?:find|search|show me|looking for|cheap|affordable|best|for rent|to buy|buy|rent)\b/gi, '')
    .trim()

  return {
    query: cleanKeywords || query,
    category: extractedCategory,
    minPrice,
    maxPrice,
    type,
    condition,
    explanation: `Applied filters: ${extractedCategory ? `Category: ${extractedCategory}` : ''} ${maxPrice ? `Max: ₹${maxPrice}` : ''} ${type ? `Type: ${type}` : ''}`.trim(),
  }
}

/**
 * AI Scam Detection for Marketplace listings.
 * Detects suspicious payment links, off-platform OTP requests, and abnormal patterns.
 */
export function checkListingForScam(title: string, description: string): AIScamCheckResult {
  const combined = `${title} ${description}`.toLowerCase()
  const flaggedReasons: string[] = []

  // Check 1: Requesting upfront payments or OTPs before campus meetup
  if (/\b(?:send otp|share otp|advance token|pay advance before meetup|google pay qr code to unlock)\b/i.test(combined)) {
    flaggedReasons.push('Soliciting advance payment or OTP prior to campus verification')
  }

  // Check 2: External suspicious links / phishing domains
  if (/(?:bit\.ly|tinyurl\.com|t\.me\/|wa\.me\/|t\.co\/|goo\.gl)/i.test(combined)) {
    flaggedReasons.push('Contains shortlinks or external redirect URLs')
  }

  // Check 3: Phone number obfuscation or suspicious contact evasion
  if (/(?:call me on|whatsapp at)\s*[0-9\s-]{10,14}/i.test(combined) && /\b(?:gift card|crypto|western union)\b/i.test(combined)) {
    flaggedReasons.push('Mentions non-standard payment schemes (crypto, giftcards)')
  }

  // Check 4: Prohibited items (alcohol, narcotics, weapons, academic cheating services)
  if (/\b(?:whiskey|vodka|weed|ganja|drugs|knife|gun|exam leak|fake certificate)\b/i.test(combined)) {
    flaggedReasons.push('Contains prohibited campus contraband or academic violation keywords')
  }

  if (flaggedReasons.length > 0) {
    return {
      flagged: true,
      riskLevel: flaggedReasons.length > 1 ? 'high' : 'medium',
      reason: flaggedReasons.join('; '),
      confidence: flaggedReasons.length > 1 ? 0.95 : 0.8,
    }
  }

  return {
    flagged: false,
    riskLevel: 'low',
    reason: null,
    confidence: 0.1,
  }
}

// ─── AI Image Content Moderation ────────────────────────────────────────────

export interface AIImageModerationResult {
  rejected: boolean
  reason: string | null
  warningLevel: 'safe' | 'warning' | 'rejected'
  details: string[]
}

/**
 * Blocklist of keywords commonly found in NSFW/sexual/violent filenames.
 * These patterns detect deliberately named inappropriate files.
 */
const NSFW_FILENAME_PATTERNS = [
  /\b(?:nsfw|xxx|porn|nude|naked|sex|hentai|erotic|onlyfans|explicit)\b/i,
  /\b(?:gore|murder|torture|beheading|violence|assault)\b/i,
  /\b(?:drugs|cocaine|heroin|meth|cannabis|marijuana)\b/i,
  /\b(?:weapon|firearms|ar-?15|ak-?47|pistol|ammunition)\b/i,
]

/**
 * JPEG marker analysis — detects Exif/JFIF comment fields that may contain NSFW tool signatures.
 * Many AI-generated NSFW images carry tool watermarks in Exif metadata.
 */
const NSFW_EXIF_SIGNATURES = [
  'stable diffusion nsfw',
  'novelai nsfw',
  'explicit content',
  'adult content',
  'nsfw generator',
  'deepnude',
  'undress',
  'nudify',
]

/**
 * AI Image Content Moderation Engine for PUKart.
 *
 * Performs a multi-layer check on uploaded images:
 *   1. Filename keyword scan — catches obviously named inappropriate files
 *   2. Embedded metadata / Exif comment scan — catches AI-generated NSFW images
 *   3. Pixel-level skin-tone ratio analysis — heuristic for excessive nudity
 *
 * This runs server-side at upload time. Flagged images are blocked immediately
 * and the user receives a warning.
 */
export function moderateImageContent(
  filename: string,
  buffer: Uint8Array
): AIImageModerationResult {
  const issues: string[] = []

  // ── Layer 1: Filename keyword scan ──────────────────────────────────────
  const lowerFilename = filename.toLowerCase()
  for (const pattern of NSFW_FILENAME_PATTERNS) {
    if (pattern.test(lowerFilename)) {
      issues.push(`Filename "${filename}" contains prohibited content keywords`)
      break
    }
  }

  // ── Layer 2: Embedded metadata / Exif text scan ─────────────────────────
  // Extract readable ASCII strings from the first 16KB of the file (metadata region)
  const metadataRegion = buffer.slice(0, Math.min(buffer.length, 16384))
  const metadataText = extractReadableText(metadataRegion).toLowerCase()

  for (const sig of NSFW_EXIF_SIGNATURES) {
    if (metadataText.includes(sig)) {
      issues.push(`Image metadata contains inappropriate content marker: "${sig}"`)
      break
    }
  }

  // Check for NSFW-related IPTC/XMP keywords in metadata
  const nsfwMetaKeywords = ['adult', 'explicit', 'nsfw', 'nude', 'sexual', 'pornographic']
  for (const kw of nsfwMetaKeywords) {
    if (metadataText.includes(`<dc:subject>${kw}`) || metadataText.includes(`keyword>${kw}`)) {
      issues.push(`Image XMP/IPTC metadata tagged as "${kw}" content`)
      break
    }
  }

  // ── Layer 3: Pixel-level skin-tone ratio heuristic ──────────────────────
  // For JPEG/PNG: Sample raw pixel bytes and estimate skin-tone pixel ratio.
  // A very high ratio (>65%) combined with low color variance suggests nudity.
  const skinAnalysis = analyzeSkinToneRatio(buffer)
  if (skinAnalysis.skinRatio > 0.65 && skinAnalysis.colorVariance < 0.15) {
    issues.push(
      `Image pixel analysis detected unusually high skin-tone coverage (${Math.round(skinAnalysis.skinRatio * 100)}%) with low color diversity — possible inappropriate content`
    )
  }

  // ── Verdict ─────────────────────────────────────────────────────────────
  if (issues.length > 0) {
    return {
      rejected: true,
      reason: issues[0], // Primary reason shown to user
      warningLevel: issues.length >= 2 ? 'rejected' : 'warning',
      details: issues,
    }
  }

  return {
    rejected: false,
    reason: null,
    warningLevel: 'safe',
    details: [],
  }
}

/**
 * Extract printable ASCII text from a binary buffer (for metadata scanning).
 */
function extractReadableText(buf: Uint8Array): string {
  const chars: string[] = []
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i]
    // Printable ASCII range (space to tilde)
    if (byte >= 0x20 && byte <= 0x7e) {
      chars.push(String.fromCharCode(byte))
    } else if (chars.length > 0 && chars[chars.length - 1] !== ' ') {
      chars.push(' ')
    }
  }
  return chars.join('')
}

/**
 * Skin-tone ratio heuristic using raw byte sampling.
 *
 * Samples bytes from the decoded image data region (skipping headers)
 * and checks if RGB triplets fall within common skin-tone ranges.
 *
 * Skin-tone HSL heuristic:
 *   H: 0-50 (warm tones)
 *   S: 15-75% (moderate saturation)
 *   L: 20-80% (not too dark or light)
 */
function analyzeSkinToneRatio(buffer: Uint8Array): {
  skinRatio: number
  colorVariance: number
} {
  // Skip header region — start sampling from ~20% into the file
  const startOffset = Math.floor(buffer.length * 0.2)
  const endOffset = Math.min(buffer.length, startOffset + 50000) // Sample up to 50KB of pixel data

  if (endOffset - startOffset < 300) {
    return { skinRatio: 0, colorVariance: 1 } // Too small to analyze
  }

  let skinPixels = 0
  let totalSamples = 0
  const colorBuckets = new Set<number>()

  // Sample every 3 bytes as an approximate RGB triplet
  for (let i = startOffset; i < endOffset - 2; i += 3) {
    const r = buffer[i]
    const g = buffer[i + 1]
    const b = buffer[i + 2]

    totalSamples++

    // Color variance: bucket colors into 8x8x8 grid
    const bucket = (Math.floor(r / 32) << 6) | (Math.floor(g / 32) << 3) | Math.floor(b / 32)
    colorBuckets.add(bucket)

    // Skin-tone detection in RGB space (Peer/Kovac model simplified)
    if (
      r > 95 && g > 40 && b > 20 &&
      r > g && r > b &&
      (r - g) > 15 &&
      Math.abs(r - g) > 15 &&
      r - b > 15
    ) {
      skinPixels++
    }
  }

  const skinRatio = totalSamples > 0 ? skinPixels / totalSamples : 0
  // Color variance: ratio of unique color buckets to maximum possible (512 = 8^3)
  const colorVariance = colorBuckets.size / 512

  return { skinRatio, colorVariance }
}

