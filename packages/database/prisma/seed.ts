import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Minnesota major cities with coordinates
const minnesotaCities = [
  // Twin Cities Metro
  { name: 'Minneapolis', lat: 44.9778, lng: -93.2650, population: 429954 },
  { name: 'St. Paul', lat: 44.9537, lng: -93.0900, population: 311527 },
  { name: 'Bloomington', lat: 44.8408, lng: -93.2983, population: 89987 },
  { name: 'Plymouth', lat: 45.0105, lng: -93.4555, population: 81026 },
  { name: 'Woodbury', lat: 44.9239, lng: -92.9594, population: 75102 },
  { name: 'Maple Grove', lat: 45.0725, lng: -93.4557, population: 70253 },
  { name: 'Blaine', lat: 45.1608, lng: -93.2349, population: 70222 },
  { name: 'Lakeville', lat: 44.6497, lng: -93.2428, population: 69490 },
  { name: 'Burnsville', lat: 44.7677, lng: -93.2777, population: 64317 },
  { name: 'Minnetonka', lat: 44.9211, lng: -93.4687, population: 53781 },
  { name: 'Eden Prairie', lat: 44.8547, lng: -93.4708, population: 64198 },
  { name: 'Edina', lat: 44.8897, lng: -93.3499, population: 53494 },
  // Greater Minnesota
  { name: 'Rochester', lat: 44.0121, lng: -92.4802, population: 121395 },
  { name: 'Duluth', lat: 46.7867, lng: -92.1005, population: 86697 },
  { name: 'St. Cloud', lat: 45.5579, lng: -94.1636, population: 68881 },
  { name: 'Mankato', lat: 44.1636, lng: -94.0003, population: 44488 },
  { name: 'Moorhead', lat: 46.8738, lng: -96.7678, population: 44505 },
  { name: 'Winona', lat: 44.0499, lng: -91.6393, population: 25948 },
  { name: 'Bemidji', lat: 47.4736, lng: -94.8803, population: 15946 },
  { name: 'Brainerd', lat: 46.3580, lng: -94.2008, population: 14395 },
];

// Business categories with hierarchical structure
const businessCategories = [
  {
    name: 'Food & Dining',
    slug: 'food-dining',
    icon: 'utensils',
    description: 'Restaurants, cafes, bars, and food services',
    subcategories: [
      { name: 'Restaurants', slug: 'restaurants', description: 'Full-service dining establishments' },
      { name: 'Cafes & Coffee Shops', slug: 'cafes-coffee', description: 'Coffee shops and casual cafes' },
      { name: 'Bars & Nightlife', slug: 'bars-nightlife', description: 'Bars, pubs, and nightclubs' },
      { name: 'Fast Food', slug: 'fast-food', description: 'Quick service restaurants' },
      { name: 'Bakeries', slug: 'bakeries', description: 'Bakeries and pastry shops' },
      { name: 'Food Trucks', slug: 'food-trucks', description: 'Mobile food vendors' },
      { name: 'Catering', slug: 'catering', description: 'Catering services for events' },
      { name: 'Breweries', slug: 'breweries', description: 'Local breweries and taprooms' },
    ],
  },
  {
    name: 'Shopping & Retail',
    slug: 'shopping-retail',
    icon: 'shopping-bag',
    description: 'Retail stores and shopping destinations',
    subcategories: [
      { name: 'Clothing & Apparel', slug: 'clothing-apparel', description: 'Clothing and fashion stores' },
      { name: 'Grocery Stores', slug: 'grocery-stores', description: 'Supermarkets and grocery stores' },
      { name: 'Electronics', slug: 'electronics', description: 'Electronics and technology stores' },
      { name: 'Home & Garden', slug: 'home-garden', description: 'Home improvement and garden centers' },
      { name: 'Books & Media', slug: 'books-media', description: 'Bookstores and media shops' },
      { name: 'Gifts & Souvenirs', slug: 'gifts-souvenirs', description: 'Gift shops and souvenir stores' },
      { name: 'Farmers Markets', slug: 'farmers-markets', description: 'Local farmers markets' },
      { name: 'Antiques', slug: 'antiques', description: 'Antique shops and vintage stores' },
    ],
  },
  {
    name: 'Services',
    slug: 'services',
    icon: 'briefcase',
    description: 'Professional and personal services',
    subcategories: [
      { name: 'Healthcare', slug: 'healthcare', description: 'Medical and healthcare services' },
      { name: 'Beauty & Wellness', slug: 'beauty-wellness', description: 'Salons, spas, and wellness centers' },
      { name: 'Automotive', slug: 'automotive', description: 'Auto repair and services' },
      { name: 'Home Services', slug: 'home-services', description: 'Plumbing, electrical, and home repair' },
      { name: 'Financial Services', slug: 'financial-services', description: 'Banks and financial institutions' },
      { name: 'Legal Services', slug: 'legal-services', description: 'Law firms and legal services' },
      { name: 'Pet Services', slug: 'pet-services', description: 'Veterinary and pet care services' },
      { name: 'Education', slug: 'education', description: 'Schools and educational services' },
    ],
  },
  {
    name: 'Arts & Entertainment',
    slug: 'arts-entertainment',
    icon: 'palette',
    description: 'Arts, culture, and entertainment venues',
    subcategories: [
      { name: 'Museums', slug: 'museums', description: 'Museums and galleries' },
      { name: 'Theaters', slug: 'theaters', description: 'Movie theaters and performing arts' },
      { name: 'Music Venues', slug: 'music-venues', description: 'Concert halls and music venues' },
      { name: 'Art Galleries', slug: 'art-galleries', description: 'Art galleries and exhibitions' },
      { name: 'Sports & Recreation', slug: 'sports-recreation', description: 'Sports facilities and recreation' },
      { name: 'Parks', slug: 'parks', description: 'Parks and outdoor spaces' },
      { name: 'Casinos', slug: 'casinos', description: 'Gaming and casino establishments' },
      { name: 'Comedy Clubs', slug: 'comedy-clubs', description: 'Comedy clubs and entertainment' },
    ],
  },
  {
    name: 'Tourism & Hospitality',
    slug: 'tourism-hospitality',
    icon: 'bed',
    description: 'Hotels, lodging, and tourist attractions',
    subcategories: [
      { name: 'Hotels', slug: 'hotels', description: 'Hotels and motels' },
      { name: 'Bed & Breakfasts', slug: 'bed-breakfasts', description: 'B&Bs and inns' },
      { name: 'Vacation Rentals', slug: 'vacation-rentals', description: 'Short-term rental properties' },
      { name: 'Tourist Attractions', slug: 'tourist-attractions', description: 'Popular tourist destinations' },
      { name: 'Tour Operators', slug: 'tour-operators', description: 'Tour guides and operators' },
      { name: 'Travel Agencies', slug: 'travel-agencies', description: 'Travel planning services' },
      { name: 'Campgrounds', slug: 'campgrounds', description: 'Camping and RV parks' },
      { name: 'Resorts', slug: 'resorts', description: 'Resort destinations' },
    ],
  },
  {
    name: 'Local Specialties',
    slug: 'local-specialties',
    icon: 'star',
    description: 'Minnesota-specific businesses and attractions',
    subcategories: [
      { name: 'Lakes & Outdoor', slug: 'lakes-outdoor', description: 'Lake activities and outdoor adventures' },
      { name: 'Winter Activities', slug: 'winter-activities', description: 'Winter sports and activities' },
      { name: 'Local Crafts', slug: 'local-crafts', description: 'Local artisans and craftspeople' },
      { name: 'Farm Experiences', slug: 'farm-experiences', description: 'Agritourism and farm visits' },
      { name: 'Nordic Heritage', slug: 'nordic-heritage', description: 'Scandinavian cultural sites' },
      { name: 'Native American', slug: 'native-american', description: 'Indigenous cultural experiences' },
      { name: 'State Fair', slug: 'state-fair', description: 'Minnesota State Fair related' },
      { name: 'Ice Fishing', slug: 'ice-fishing', description: 'Ice fishing guides and rentals' },
    ],
  },
];

async function seed() {
  console.log('🌱 Starting seed...');

  try {
    // Clear existing data
    console.log('🧹 Cleaning existing data...');
    await prisma.businessCategory.deleteMany();
    await prisma.category.deleteMany();

    // Seed categories
    console.log('📁 Seeding categories...');
    for (const category of businessCategories) {
      const { subcategories, ...parentData } = category;
      
      // Create parent category
      const parent = await prisma.category.create({
        data: {
          ...parentData,
          featured: true,
          displayOrder: businessCategories.indexOf(category),
        },
      });

      // Create subcategories
      if (subcategories) {
        for (const sub of subcategories) {
          await prisma.category.create({
            data: {
              ...sub,
              parentId: parent.id,
              displayOrder: subcategories.indexOf(sub),
            },
          });
        }
      }
    }

    const categoryCount = await prisma.category.count();
    console.log(`✅ Created ${categoryCount} categories`);

    // Note: Cities are not stored in the database but can be used for geocoding
    console.log(`📍 ${minnesotaCities.length} Minnesota cities available for geocoding`);

    console.log('🎉 Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seed()
  .catch((error) => {
    console.error('Seed error:', error);
    process.exit(1);
  });