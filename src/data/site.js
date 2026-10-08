// Verified business facts (source: precisionpaintexperts.com, crawled 2026-10-08).
// Do not add claims here that the business has not published.
module.exports = {
  name: 'Precision Paint Experts',
  legalName: 'Precision Paint Experts, LLC',
  url: process.env.SITE_URL || 'https://precisionpaintexperts.com',
  phone: '(386) 854-7139',
  phoneHref: 'tel:+13868547139',
  email: 'info@precisionpaintexperts.com',
  city: 'Newberry',
  region: 'FL',
  zip: '32669',
  hours: [
    { days: 'Monday – Friday', time: '9:00 AM – 6:30 PM', schema: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '18:30' },
    { days: 'Saturday', time: 'Closed' },
    { days: 'Sunday', time: 'Closed' }
  ],
  tagline: 'Painting done the precise way — finishes built for Florida sun and rain.',
  blurb: 'A locally owned, licensed and insured painting contractor serving Gainesville, Ocala, and all of North Central Florida — residential, commercial, cabinets, exteriors, decks, and pressure washing.',
  trust: [
    { title: '15+ Years', text: 'Painting experience', icon: 'award' },
    { title: 'Licensed & Insured', text: 'Bonded, with workers’ comp', icon: 'shield' },
    { title: 'Written Warranty', text: 'Up to 10 years on exteriors', icon: 'badge' },
    { title: 'Low-VOC Options', text: 'Safer, low-odor materials', icon: 'leaf' }
  ],

  // Primary services shown in nav + home grid (slug = URL path without leading slash)
  coreServices: [
    'residential-painting', 'interior-painting', 'exterior-painting', 'commercial-painting',
    'cabinet-painting-refinishing', 'pressure-washing', 'deck-fence-staining', 'color-consultation',
    'drywall-repair-patching'
  ],
  commercialServices: [
    'commercial-interior-painting', 'commercial-exterior-painting', 'office-painting',
    'retail-restaurant-painting', 'warehouse-industrial-painting', 'church-educational-facility-painting',
    'multi-family-apartment-painting', 'hoa-property-management-painting'
  ],
  specialtyServices: [
    'deck-fence-staining-florida', 'interior-painters-color-consult', 'ceiling-painting-popcorn-removal',
    'dustless-popcorn-removal', 'wallpaper-removal', 'stucco-repair-painting',
    'concrete-masonry-painting', 'garage-floor-epoxy-coating', 'epoxy-garage-floor-installers',
    'waterproofing-protective-coatings', 'anti-graffiti-coating', 'warehouse-anti-graffiti-coatings',
    'decorative-faux-finishes', 'door-shutter-painting', 'trim-molding-painting', 'wood-staining-finishing'
  ],

  // City-level service pages: /{city}-fl-{suffix}
  cityServices: [
    { suffix: 'painting-services', name: 'Painting Services', service: 'services' },
    { suffix: 'residential-painting', name: 'Residential Painting', service: 'residential-painting' },
    { suffix: 'interior-painting', name: 'Interior Painting', service: 'interior-painting' },
    { suffix: 'exterior-painting', name: 'Exterior Painting', service: 'exterior-painting' },
    { suffix: 'commercial-painting', name: 'Commercial Painting', service: 'commercial-painting' },
    { suffix: 'cabinet-refinishing', name: 'Cabinet Refinishing', service: 'cabinet-painting-refinishing' },
    { suffix: 'deck-staining', name: 'Deck Staining', service: 'deck-fence-staining' },
    { suffix: 'fence-painting', name: 'Fence Painting & Staining', service: 'deck-fence-staining' },
    { suffix: 'pressure-washing', name: 'Pressure Washing', service: 'pressure-washing' },
    { suffix: 'color-consultation', name: 'Color Consultation', service: 'color-consultation' }
  ],

  counties: [
    { slug: 'alachua-county', name: 'Alachua County', blurb: 'Home to Gainesville, the University of Florida, and a mix of historic neighborhoods, ranches, and suburban communities.' },
    { slug: 'marion-county', name: 'Marion County', blurb: 'Ocala, Belleview, and Dunnellon anchor Florida’s Horse Country — pastures, equestrian estates, springs, and growing subdivisions.' },
    { slug: 'levy-county', name: 'Levy County', blurb: 'Williston, Chiefland, and the Gulf-side communities — rural towns with weather that is hard on coatings.' },
    { slug: 'columbia-county', name: 'Columbia County', blurb: 'Lake City and Fort White — I-75 communities with residential repaints, storefronts, and ranch properties.' },
    { slug: 'gilchrist-county', name: 'Gilchrist County', blurb: 'Trenton and the rural Suwannee River corridor — small-town homes and businesses.' }
  ],

  cities: [
    { slug: 'gainesville', name: 'Gainesville', county: 'alachua-county', zip: '32601', lat: 29.6516, lng: -82.3248 },
    { slug: 'ocala', name: 'Ocala', county: 'marion-county', zip: '34470', lat: 29.1872, lng: -82.1401 },
    { slug: 'newberry', name: 'Newberry', county: 'alachua-county', zip: '32669', lat: 29.6469, lng: -82.6068 },
    { slug: 'alachua', name: 'Alachua', county: 'alachua-county', zip: '32615', lat: 29.7919, lng: -82.4979 },
    { slug: 'high-springs', name: 'High Springs', county: 'alachua-county', zip: '32643', lat: 29.8269, lng: -82.5968 },
    { slug: 'archer', name: 'Archer', county: 'alachua-county', zip: '32618', lat: 29.5294, lng: -82.5193 },
    { slug: 'hawthorne', name: 'Hawthorne', county: 'alachua-county', zip: '32640', lat: 29.5905, lng: -82.0876 },
    { slug: 'micanopy', name: 'Micanopy', county: 'alachua-county', zip: '32667', lat: 29.5061, lng: -82.2806 },
    { slug: 'williston', name: 'Williston', county: 'levy-county', zip: '32696', lat: 29.3877, lng: -82.4471 },
    { slug: 'chiefland', name: 'Chiefland', county: 'levy-county', zip: '32626', lat: 29.4793, lng: -82.8593 },
    { slug: 'dunnellon', name: 'Dunnellon', county: 'marion-county', zip: '34431', lat: 29.0497, lng: -82.4598 },
    { slug: 'belleview', name: 'Belleview', county: 'marion-county', zip: '34420', lat: 29.0552, lng: -82.0573 },
    { slug: 'lake-city', name: 'Lake City', county: 'columbia-county', zip: '32024', lat: 30.1897, lng: -82.6393 },
    { slug: 'fort-white', name: 'Fort White', county: 'columbia-county', zip: '32038', lat: 29.9258, lng: -82.7146 },
    { slug: 'trenton', name: 'Trenton', county: 'gilchrist-county', zip: '32693', lat: 29.6122, lng: -82.8173 }
  ]
};
