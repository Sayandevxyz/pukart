// ============================================================
// Pondicherry University — Main Campus Data
// Excludes Karaikal & Port Blair campuses
// ============================================================

// ---------- Schools & Departments ----------

export interface SchoolData {
  school: string
  departments: string[]
}

export const SCHOOLS_AND_DEPARTMENTS: SchoolData[] = [
  {
    school: 'Subramania Bharathi School of Tamil Language & Literature',
    departments: ['Tamil'],
  },
  {
    school: 'School of Management',
    departments: [
      'Banking Technology',
      'Commerce',
      'Economics',
      'International Business',
      'Management Studies',
      'Tourism Studies',
    ],
  },
  {
    school: 'Ramanujan School of Mathematical Sciences',
    departments: ['Mathematics', 'Statistics'],
  },
  {
    school: 'School of Physical, Chemical and Applied Sciences',
    departments: [
      'Applied Psychology',
      'Chemistry',
      'Coastal Disaster Management',
      'Earth Sciences',
      'Physics',
    ],
  },
  {
    school: 'School of Life Sciences',
    departments: [
      'Biochemistry & Molecular Biology',
      'Bioinformatics',
      'Biotechnology',
      'Ecology & Environmental Sciences',
      'Food Science & Technology',
      'Microbiology',
      'Ocean Studies & Marine Biology',
    ],
  },
  {
    school: 'School of Humanities',
    departments: [
      'English',
      'French',
      'Hindi',
      'Philosophy',
      'Physical Education & Sports',
      'Sanskrit',
    ],
  },
  {
    school: 'School of Social Sciences & International Studies',
    departments: [
      'Anthropology',
      'History',
      'Politics & International Studies',
      'Social Work',
      'Sociology',
    ],
  },
  {
    school: 'School of Engineering & Technology',
    departments: [
      'Computer Science & Engineering',
      'Electronics Engineering (ECE)',
      'Centre for Pollution Control & Environmental Engineering',
      'Coastal Disaster Management',
      'Nanoscience & Technology',
      'Artificial Intelligence & Data Science',
    ],
  },
  {
    school: 'School of Education',
    departments: ['Education'],
  },
  {
    school: 'School of Performing Arts',
    departments: ['Performing Arts'],
  },
  {
    school: 'School of Law',
    departments: ['Law'],
  },
  {
    school: 'School of Media & Communication',
    departments: [
      'Electronic Media & Mass Communication',
      'Library & Information Science',
    ],
  },
  {
    school: 'Madanjeet School of Green Energy Technologies',
    departments: ['Green Energy Technology', 'Centre for Nanoscience & Technology'],
  },
  {
    school: 'School of Medical Sciences',
    departments: ['Medical Sciences'],
  },
]

/** Flat list of all departments (sorted alphabetically) */
export const ALL_DEPARTMENTS: string[] = SCHOOLS_AND_DEPARTMENTS.flatMap(
  (s) => s.departments
).sort((a, b) => a.localeCompare(b))

// ---------- Degrees & Programs ----------

export interface DegreeGroup {
  category: string
  programs: string[]
}

export const DEGREES_AND_PROGRAMS: DegreeGroup[] = [
  {
    category: 'Undergraduate / Dual',
    programs: [
      'B.Tech (CSE)',
      'B.Tech (CSBS)',
      'B.Tech (ECE)',
      'B.Tech (Environmental)',
      'Integrated B.Tech + MBA',
      'B.Sc. (Hons) Physics',
      'B.Sc. (Hons) Chemistry',
      'B.Sc. (Hons) Mathematics',
      'B.Sc. (Hons) Statistics',
      'B.Sc. (Hons) Life Sciences',
      'B.Sc. (Hons) Bioinformatics',
      'B.Sc. (Hons) Applied Geology',
      'B.B.A. (Hons)',
      'B.Com. (Hons)',
      'B.A. (Hons)',
      'B.P.A. (Performing Arts)',
      'B.V.A. (Visual Arts)',
    ],
  },
  {
    category: 'Postgraduate',
    programs: [
      'M.Tech (CSE)',
      'M.Tech (ECE)',
      'M.Tech (Green Energy)',
      'M.Tech (Computational Biology)',
      'M.Tech (Nanoscience)',
      'M.B.A. (General)',
      'M.B.A. (Banking Technology)',
      'M.B.A. (Tourism)',
      'M.B.A. (International Business)',
      'M.B.A. (Data Analytics)',
      'M.Sc. (Physics)',
      'M.Sc. (Chemistry)',
      'M.Sc. (Mathematics)',
      'M.Sc. (Statistics)',
      'M.Sc. (Biotechnology)',
      'M.Sc. (Bioinformatics)',
      'M.Sc. (Food Science)',
      'M.Sc. (Ecology & Environmental Sciences)',
      'M.Sc. (Marine Biology)',
      'M.Sc. (Applied Geology)',
      'M.Sc. (Electronic Media)',
      'M.Com.',
      'M.A. (Economics)',
      'M.A. (English)',
      'M.A. (French)',
      'M.A. (Hindi)',
      'M.A. (Mass Communication)',
      'M.A. (Social Work)',
      'M.A. (Sociology)',
      'M.A. (History)',
      'M.A. (Politics & International Studies)',
      'M.Ed.',
      'M.P.A. (Performing Arts)',
      'M.V.A. (Visual Arts)',
      'LL.M.',
      'MCA',
    ],
  },
  {
    category: 'Research',
    programs: ['Ph.D.', 'Integrated Ph.D.', 'Post-Doctoral'],
  },
]

/** Flat list of all programs */
export const ALL_PROGRAMS: string[] = DEGREES_AND_PROGRAMS.flatMap(
  (g) => g.programs
)

// ---------- Campus Hostels (Main Campus) ----------

export interface HostelGroup {
  category: string
  hostels: string[]
}

export const CAMPUS_HOSTELS: HostelGroup[] = [
  {
    category: 'Boys Hostels',
    hostels: [
      'Sri Aurobindo Hostel',
      'Birsa Munda Hostel',
      'C.V. Raman Hostel',
      'Valmiki Hostel',
      'Bharathi Hostel',
      'Tagore Hostel',
      'Kabirdas Hostel',
      'Kalidas Hostel',
      'Kannadasan Hostel',
      'Ilango Adigal Hostel',
      'Subramania Bharathi Hostel',
      'Sarvepalli Radhakrishnan Hostel',
      'Kamban Hostel',
      'Dhaanya Hostel',
      'Madame Curie Hostel (Boys Wing / Foreign)',
      'Research Scholars Hostel (Boys)',
    ],
  },
  {
    category: 'Girls Hostels',
    hostels: [
      'Madame Curie Hostel',
      'Kaveri Hostel',
      'Saraswathi Hostel',
      'Ganga Hostel',
      'Yamuna Hostel',
      'Godavari Hostel',
      'Amudham Hostel',
      'Thamarai Hostel',
      'Research Scholars Hostel (Girls)',
    ],
  },
  {
    category: 'Other',
    hostels: ['Day Scholar / Off-Campus'],
  },
]

/** Flat list of all hostels */
export const ALL_HOSTELS: string[] = CAMPUS_HOSTELS.flatMap((g) => g.hostels)

// ---------- Meetup Locations ----------

export const MEETUP_LOCATIONS: string[] = [
  'Central Library Entrance',
  'Silver Jubilee Campus',
  'Shopping Complex',
  'Hostel Mess Area',
  'Gate 1 / Main Gate',
  'Gate 2',
  'Science Block',
  'Management Block',
  'Engineering Block',
  'Cafeteria / Canteen',
  'Sports Complex',
  'Botanical Garden Area',
  'Guest House',
  'Mahatma Gandhi Statue',
]

// ---------- Profile Completion Helper ----------

export interface ProfileCompletionResult {
  isComplete: boolean
  missingFields: string[]
}

export function checkProfileCompletion(profile: {
  department?: string | null
  course?: string | null
  year?: number | null
  hostel?: string | null
}): ProfileCompletionResult {
  const missingFields: string[] = []

  if (!profile.department?.trim()) missingFields.push('Department / School')
  if (!profile.course?.trim()) missingFields.push('Degree / Program')
  if (!profile.year || profile.year < 1) missingFields.push('Year of Study')
  if (!profile.hostel?.trim()) missingFields.push('Campus Hostel')

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  }
}
