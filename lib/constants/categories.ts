// ============================================================
// PUKart Category Schema & Dynamic Options Config
// Defines tailored Types & Conditions / Attributes per Category
// ============================================================

export interface FilterOption {
  value: string
  label: string
}

export interface CategoryConfig {
  name: string
  label: string
  typeLabel: string // e.g. "Listing Type", "Meal Type", "Service Category"
  conditionLabel: string // e.g. "Condition", "Freshness", "Billing Mode"
  types: FilterOption[]
  conditions: FilterOption[]
  defaultType?: string
  defaultCondition?: string
}

export const DEFAULT_TYPES: FilterOption[] = [
  { value: 'All', label: 'All Types' },
  { value: 'sell', label: 'For Sale' },
  { value: 'rent', label: 'Rentals' },
  { value: 'service', label: 'Services' },
  { value: 'free', label: 'Free / Giveaway' },
]

export const DEFAULT_CONDITIONS: FilterOption[] = [
  { value: 'All', label: 'All Conditions' },
  { value: 'brand_new', label: 'Brand New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
]

export const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  Food: {
    name: 'Food',
    label: 'Campus Food & Tiffins',
    typeLabel: 'Food Type',
    conditionLabel: 'Freshness & Shelf',
    defaultType: 'tiffin',
    defaultCondition: 'fresh_today',
    types: [
      { value: 'All', label: 'All Food Types' },
      { value: 'tiffin', label: 'Daily Meal / Home Tiffin' },
      { value: 'snacks', label: 'Homemade Snacks & Pickles' },
      { value: 'mess_coupon', label: 'Hostel Mess Coupon / Share' },
      { value: 'groceries', label: 'Hostel Groceries & Essentials' },
      { value: 'beverages', label: 'Tea, Coffee & Beverages' },
      { value: 'bakery', label: 'Cakes & Baked Treats' },
      { value: 'sell', label: 'General Food Item' },
    ],
    conditions: [
      { value: 'All', label: 'All Freshness Levels' },
      { value: 'fresh_today', label: 'Freshly Cooked (Made Today)' },
      { value: 'sealed_pack', label: 'Packed & Sealed (Unopened)' },
      { value: 'subscription', label: 'Pre-ordered / Daily Service' },
      { value: 'long_shelf', label: 'Long Shelf Life (Dry Foods / Pickles)' },
      { value: 'good', label: 'Fresh & Hygienic' },
    ],
  },

  Services: {
    name: 'Services',
    label: 'Student Services & Skills',
    typeLabel: 'Service Field',
    conditionLabel: 'Pricing Structure',
    defaultType: 'tutoring',
    defaultCondition: 'fixed',
    types: [
      { value: 'All', label: 'All Services' },
      { value: 'tutoring', label: 'Tutoring / Exam Prep / Assignment Help' },
      { value: 'printing', label: 'Printing / Xerox / Thesis Binding' },
      { value: 'laptop_repair', label: 'Laptop & Mobile Software / Hardware' },
      { value: 'cycle_repair', label: 'Cycle & Bike Servicing' },
      { value: 'shifting', label: 'Hostel Shifting & Heavy Luggage' },
      { value: 'creative', label: 'Photography / Video Editing / Design' },
      { value: 'ride_share', label: 'Campus Cab / Airport / Station Ride Share' },
      { value: 'service', label: 'General Student Service' },
    ],
    conditions: [
      { value: 'All', label: 'All Billing Structures' },
      { value: 'hourly', label: 'Hourly Rate' },
      { value: 'fixed', label: 'Fixed Task / Project Rate' },
      { value: 'monthly', label: 'Monthly Subscription' },
      { value: 'free', label: 'Free / Peer Volunteer Help' },
      { value: 'negotiable', label: 'Negotiable on Discussion' },
    ],
  },

  Books: {
    name: 'Books',
    label: 'Academic Books & Notes',
    typeLabel: 'Availability',
    conditionLabel: 'Book Condition',
    defaultType: 'sell',
    defaultCondition: 'good',
    types: [
      { value: 'All', label: 'All Book Types' },
      { value: 'sell', label: 'For Sale (Ownership)' },
      { value: 'rent', label: 'Semester Rental' },
      { value: 'notes', label: 'Handwritten Notes / Photocopy' },
      { value: 'free', label: 'Free Senior Giveaway' },
    ],
    conditions: [
      { value: 'All', label: 'All Conditions' },
      { value: 'brand_new', label: 'Brand New (Unmarked)' },
      { value: 'like_new', label: 'Like New (Clean pages, no ink)' },
      { value: 'good', label: 'Good (Minimal highlighting)' },
      { value: 'fair', label: 'Fair (Highlighted / Soft wear)' },
      { value: 'spiral_bound', label: 'Spiral Bound / Photocopy Set' },
    ],
  },

  Electronics: {
    name: 'Electronics',
    label: 'Laptops, Gadgets & Peripherals',
    typeLabel: 'Deal Type',
    conditionLabel: 'Device Condition',
    defaultType: 'sell',
    defaultCondition: 'good',
    types: [
      { value: 'All', label: 'All Deal Types' },
      { value: 'sell', label: 'For Sale' },
      { value: 'rent', label: 'Rental (Short term / Exam)' },
      { value: 'exchange', label: 'Gadget Exchange' },
    ],
    conditions: [
      { value: 'All', label: 'All Conditions' },
      { value: 'brand_new', label: 'Brand New (Sealed in Box)' },
      { value: 'like_new', label: 'Like New (Flawless, with Bill/Box)' },
      { value: 'good', label: 'Good (Fully Working, Minor Scratches)' },
      { value: 'fair', label: 'Fair (Signs of use, battery wear)' },
      { value: 'for_parts', label: 'For Parts / Needs Repair' },
    ],
  },

  Cycles: {
    name: 'Cycles',
    label: 'Campus Bicycles',
    typeLabel: 'Listing Type',
    conditionLabel: 'Cycle Condition',
    defaultType: 'sell',
    defaultCondition: 'good',
    types: [
      { value: 'All', label: 'All Cycle Types' },
      { value: 'sell', label: 'For Sale' },
      { value: 'rent', label: 'Semester / Monthly Rental' },
      { value: 'free', label: 'Free Pass-On' },
    ],
    conditions: [
      { value: 'All', label: 'All Conditions' },
      { value: 'like_new', label: 'Like New (Ready to ride, new tires)' },
      { value: 'good', label: 'Good (Smooth gears & brakes)' },
      { value: 'fair', label: 'Fair (Needs air / basic oiling)' },
      { value: 'fixer_upper', label: 'Fixer-Upper (Needs tube/chain work)' },
    ],
  },

  Bikes: {
    name: 'Bikes',
    label: 'Motorcycles & Two-Wheelers',
    typeLabel: 'Listing Type',
    conditionLabel: 'Vehicle Condition',
    defaultType: 'sell',
    defaultCondition: 'good',
    types: [
      { value: 'All', label: 'All Bike Types' },
      { value: 'sell', label: 'For Sale (Full RC Transfer)' },
      { value: 'rent', label: 'Daily / Weekend Rental' },
      { value: 'monthly_rent', label: 'Monthly Lease' },
    ],
    conditions: [
      { value: 'All', label: 'All Conditions' },
      { value: 'excellent', label: 'Excellent (Serviced, Insurance Active)' },
      { value: 'good', label: 'Good (Smooth Running, Clean)' },
      { value: 'fair', label: 'Fair (Daily Campus Commute)' },
    ],
  },

  Scooty: {
    name: 'Scooty',
    label: 'Scooters & EV Scooters',
    typeLabel: 'Listing Type',
    conditionLabel: 'Scooty Condition',
    defaultType: 'sell',
    defaultCondition: 'good',
    types: [
      { value: 'All', label: 'All Scooty Types' },
      { value: 'sell', label: 'For Sale' },
      { value: 'rent', label: 'Weekend / Weekly Rental' },
      { value: 'monthly_rent', label: 'Monthly Rental' },
    ],
    conditions: [
      { value: 'All', label: 'All Conditions' },
      { value: 'excellent', label: 'Excellent (Self-Start, Great Mileage)' },
      { value: 'good', label: 'Good (Regularly Serviced)' },
      { value: 'fair', label: 'Fair (Campus Runabout)' },
    ],
  },

  Hostel: {
    name: 'Hostel',
    label: 'Hostel Furniture & Appliances',
    typeLabel: 'Listing Type',
    conditionLabel: 'Item Condition',
    defaultType: 'sell',
    defaultCondition: 'good',
    types: [
      { value: 'All', label: 'All Types' },
      { value: 'sell', label: 'For Sale' },
      { value: 'rent', label: 'Semester Rental' },
      { value: 'free', label: 'Senior Room Giveaway (Free)' },
    ],
    conditions: [
      { value: 'All', label: 'All Conditions' },
      { value: 'like_new', label: 'Like New (Spotless & Sturdy)' },
      { value: 'good', label: 'Good (Clean, normal wear)' },
      { value: 'fair', label: 'Fair (Usable for semester)' },
    ],
  },

  Fashion: {
    name: 'Fashion',
    label: 'Clothing, Lab Coats & Accessories',
    typeLabel: 'Listing Type',
    conditionLabel: 'Garment Condition',
    defaultType: 'sell',
    defaultCondition: 'like_new',
    types: [
      { value: 'All', label: 'All Types' },
      { value: 'sell', label: 'For Sale' },
      { value: 'rent', label: 'Fest / Traditional / Suit Rental' },
      { value: 'free', label: 'Free Clothing Donation' },
    ],
    conditions: [
      { value: 'All', label: 'All Conditions' },
      { value: 'brand_new', label: 'Brand New (With Tags / Unworn)' },
      { value: 'like_new', label: 'Like New (Worn Once or Twice)' },
      { value: 'good', label: 'Gently Used (Washed & Clean)' },
      { value: 'fair', label: 'Fair (Normal Wear)' },
    ],
  },

  Sports: {
    name: 'Sports',
    label: 'Sports Gear & Gym Equipment',
    typeLabel: 'Listing Type',
    conditionLabel: 'Equipment Condition',
    defaultType: 'sell',
    defaultCondition: 'good',
    types: [
      { value: 'All', label: 'All Types' },
      { value: 'sell', label: 'For Sale' },
      { value: 'rent', label: 'Match Day / Tournament Rent' },
      { value: 'free', label: 'Free Community Share' },
    ],
    conditions: [
      { value: 'All', label: 'All Conditions' },
      { value: 'brand_new', label: 'Brand New (In Packaging)' },
      { value: 'like_new', label: 'Like New (Barely Used, Intact Grip)' },
      { value: 'good', label: 'Good (Game Ready, Well Maintained)' },
      { value: 'fair', label: 'Fair (Functional with Scuffs)' },
    ],
  },
}

/**
 * Get the types list for a selected category.
 * If "All" or unknown category, returns standard default types.
 */
export function getTypesForCategory(category?: string | null): FilterOption[] {
  if (!category || category === 'All' || !CATEGORY_CONFIGS[category]) {
    return DEFAULT_TYPES
  }
  return CATEGORY_CONFIGS[category].types
}

/**
 * Get the conditions list for a selected category.
 * If "All" or unknown category, returns standard default conditions.
 */
export function getConditionsForCategory(category?: string | null): FilterOption[] {
  if (!category || category === 'All' || !CATEGORY_CONFIGS[category]) {
    return DEFAULT_CONDITIONS
  }
  return CATEGORY_CONFIGS[category].conditions
}

/**
 * Get form-friendly options for listing creation/editing (excluding 'All')
 */
export function getFormOptionsForCategory(category?: string | null) {
  const config = category && CATEGORY_CONFIGS[category] ? CATEGORY_CONFIGS[category] : null
  const types = (config?.types || DEFAULT_TYPES).filter((t) => t.value !== 'All')
  const conditions = (config?.conditions || DEFAULT_CONDITIONS).filter((c) => c.value !== 'All')

  return {
    types,
    conditions,
    typeLabel: config?.typeLabel || 'Listing Type',
    conditionLabel: config?.conditionLabel || 'Condition',
    defaultType: config?.defaultType || types[0]?.value || 'sell',
    defaultCondition: config?.defaultCondition || conditions[0]?.value || 'good',
  }
}
