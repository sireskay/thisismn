import { PrismaClient, BusinessStatus, EventStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Function to generate a slug from text
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Sample businesses for testing
const sampleBusinesses = [
  // Minneapolis businesses
  {
    name: "Matt's Bar",
    description: "Home of the original Jucy Lucy burger. A Minneapolis institution since 1954, serving up the city's most famous burger creation in a no-frills neighborhood bar setting.",
    shortDescription: "Home of the original Jucy Lucy burger",
    categorySlug: 'restaurants',
    address: {
      street: '3500 Cedar Ave S',
      city: 'Minneapolis',
      zipCode: '55407',
      lat: 44.9398,
      lng: -93.2476,
    },
    phone: '(612) 722-7072',
    website: 'https://mattsbar.com',
    yearEstablished: 1954,
    featured: true,
  },
  {
    name: 'Spoon and Stable',
    description: 'Award-winning contemporary American restaurant in the North Loop neighborhood, featuring seasonal menus and craft cocktails in a stylish, converted stable.',
    shortDescription: 'Upscale contemporary American dining',
    categorySlug: 'restaurants',
    address: {
      street: '211 N 1st St',
      city: 'Minneapolis',
      zipCode: '55401',
      lat: 44.9845,
      lng: -93.2712,
    },
    phone: '(612) 224-9850',
    website: 'https://www.spoonandstable.com',
    yearEstablished: 2014,
  },
  {
    name: 'Surly Brewing Co.',
    description: "Minnesota's premier craft brewery offering tours, a beer hall, and restaurant. Known for bold beers and a massive destination brewery experience.",
    shortDescription: 'Craft brewery with beer hall and restaurant',
    categorySlug: 'breweries',
    address: {
      street: '520 Malcolm Ave SE',
      city: 'Minneapolis',
      zipCode: '55414',
      lat: 44.9731,
      lng: -93.2099,
    },
    phone: '(763) 999-4040',
    website: 'https://surlybrewing.com',
    yearEstablished: 2006,
  },
  {
    name: 'Walker Art Center',
    description: 'Contemporary art museum featuring modern and contemporary art exhibitions, film screenings, and performing arts events. Home to the iconic Spoonbridge and Cherry sculpture.',
    shortDescription: 'Contemporary art museum and sculpture garden',
    categorySlug: 'museums',
    address: {
      street: '725 Vineland Pl',
      city: 'Minneapolis',
      zipCode: '55403',
      lat: 44.9684,
      lng: -93.2888,
    },
    phone: '(612) 375-7600',
    website: 'https://walkerart.org',
    yearEstablished: 1879,
    featured: true,
  },
  // St. Paul businesses
  {
    name: "Mickey's Diner",
    description: "Iconic 24-hour diner in downtown St. Paul, serving classic American comfort food since 1939. This art deco dining car is a National Historic Landmark.",
    shortDescription: 'Historic 24-hour diner and landmark',
    categorySlug: 'restaurants',
    address: {
      street: '36 7th St W',
      city: 'St. Paul',
      zipCode: '55102',
      lat: 44.9488,
      lng: -93.0973,
    },
    phone: '(651) 222-5633',
    yearEstablished: 1939,
  },
  {
    name: 'Como Park Zoo & Conservatory',
    description: 'Free admission zoo and conservatory featuring exotic animals, beautiful gardens, and seasonal flower shows. A St. Paul treasure for over 100 years.',
    shortDescription: 'Free zoo and botanical conservatory',
    categorySlug: 'tourist-attractions',
    address: {
      street: '1225 Estabrook Dr',
      city: 'St. Paul',
      zipCode: '55103',
      lat: 44.9818,
      lng: -93.1513,
    },
    phone: '(651) 487-8200',
    website: 'https://comozooconservatory.org',
    yearEstablished: 1897,
    featured: true,
  },
  // Duluth businesses
  {
    name: 'Grandma\'s Restaurant',
    description: 'Duluth landmark restaurant on the shore of Lake Superior, famous for hearty portions and the annual Grandma\'s Marathon. Family-friendly dining with a view.',
    shortDescription: 'Lakefront dining and marathon host',
    categorySlug: 'restaurants',
    address: {
      street: '522 Lake Ave S',
      city: 'Duluth',
      zipCode: '55802',
      lat: 46.7833,
      lng: -92.0954,
    },
    phone: '(218) 727-4192',
    website: 'https://grandmasrestaurants.com',
    yearEstablished: 1976,
  },
  {
    name: 'Glensheen Mansion',
    description: 'Historic 39-room mansion on the shores of Lake Superior. Tour this early 20th century estate and learn about the Congdon family legacy.',
    shortDescription: 'Historic lakefront mansion tours',
    categorySlug: 'tourist-attractions',
    address: {
      street: '3300 London Rd',
      city: 'Duluth',
      zipCode: '55804',
      lat: 46.8152,
      lng: -92.0517,
    },
    phone: '(218) 726-8910',
    website: 'https://glensheen.org',
    yearEstablished: 1908,
  },
  // Rochester businesses
  {
    name: 'Newt\'s',
    description: 'Popular local bar and restaurant known for burgers, craft beers, and live music. A Rochester favorite for casual dining and nightlife.',
    shortDescription: 'Burgers, beers, and live music',
    categorySlug: 'bars-nightlife',
    address: {
      street: '216 1st Ave SW',
      city: 'Rochester',
      zipCode: '55902',
      lat: 44.0217,
      lng: -92.4634,
    },
    phone: '(507) 288-0233',
    website: 'https://www.newtsrochester.com',
    yearEstablished: 2005,
  },
];

// Sample events
const sampleEvents = [
  {
    title: 'Minnesota State Fair',
    description: 'The Great Minnesota Get-Together! 12 days of food, fun, agriculture, art, and entertainment. One of the largest state fairs in the United States.',
    shortDescription: 'Annual 12-day state fair celebration',
    startDate: new Date('2024-08-22'),
    endDate: new Date('2024-09-02'),
    allDay: true,
    venue: 'Minnesota State Fairgrounds',
    streetAddress: '1265 Snelling Ave N',
    city: 'St. Paul',
    zipCode: '55108',
    latitude: 44.9831,
    longitude: -93.1680,
    categories: ['state-fair', 'food-dining', 'arts-entertainment'],
    isFree: false,
    price: 18,
    featured: true,
  },
  {
    title: 'Twin Cities Jazz Festival',
    description: 'Free outdoor jazz festival featuring local and national artists performing on multiple stages throughout downtown St. Paul.',
    shortDescription: 'Free outdoor jazz festival',
    startDate: new Date('2024-06-21'),
    endDate: new Date('2024-06-23'),
    venue: 'Mears Park',
    streetAddress: '221 5th St E',
    city: 'St. Paul',
    zipCode: '55101',
    latitude: 44.9499,
    longitude: -93.0873,
    categories: ['music-venues', 'arts-entertainment'],
    isFree: true,
  },
  {
    title: 'Grandma\'s Marathon',
    description: 'Annual marathon along the scenic North Shore of Lake Superior from Two Harbors to Duluth. One of the most popular marathons in the Midwest.',
    shortDescription: 'Scenic Lake Superior marathon',
    startDate: new Date('2024-06-15'),
    venue: 'Two Harbors to Duluth',
    city: 'Duluth',
    categories: ['sports-recreation'],
    isFree: false,
    price: 120,
    registrationUrl: 'https://grandmasmarathon.com',
  },
  {
    title: 'Art-A-Whirl',
    description: 'The largest open studio tour in the country, featuring hundreds of artists in Northeast Minneapolis opening their studios to the public.',
    shortDescription: 'Open artist studio tour',
    startDate: new Date('2024-05-17'),
    endDate: new Date('2024-05-19'),
    venue: 'Northeast Minneapolis Arts District',
    city: 'Minneapolis',
    categories: ['art-galleries', 'arts-entertainment'],
    isFree: true,
  },
];

async function seedExtended() {
  console.log('🌱 Starting extended seed...');

  try {
    // Get categories for linking
    const categories = await prisma.category.findMany();
    const categoryMap = new Map(categories.map(c => [c.slug, c]));

    // Create sample businesses
    console.log('🏢 Creating sample businesses...');
    for (const businessData of sampleBusinesses) {
      const { address, categorySlug, ...business } = businessData;
      const category = categoryMap.get(categorySlug);
      
      if (!category) {
        console.warn(`Category ${categorySlug} not found, skipping ${business.name}`);
        continue;
      }

      const slug = generateSlug(business.name);
      
      // Create the business
      const createdBusiness = await prisma.business.create({
        data: {
          ...business,
          slug,
          status: BusinessStatus.ACTIVE,
          verified: true,
          verifiedAt: new Date(),
          keywords: [business.name.toLowerCase(), categorySlug, address.city.toLowerCase()],
          categories: {
            create: {
              categoryId: category.id,
              isPrimary: true,
            },
          },
          locations: {
            create: {
              streetAddress: address.street,
              city: address.city,
              zipCode: address.zipCode,
              latitude: address.lat,
              longitude: address.lng,
              isPrimary: true,
            },
          },
          hours: {
            create: [
              // Default hours: 9 AM - 9 PM, closed on Sundays
              { dayOfWeek: 0, openTime: '09:00', closeTime: '21:00', isClosed: true },
              { dayOfWeek: 1, openTime: '09:00', closeTime: '21:00' },
              { dayOfWeek: 2, openTime: '09:00', closeTime: '21:00' },
              { dayOfWeek: 3, openTime: '09:00', closeTime: '21:00' },
              { dayOfWeek: 4, openTime: '09:00', closeTime: '21:00' },
              { dayOfWeek: 5, openTime: '09:00', closeTime: '22:00' },
              { dayOfWeek: 6, openTime: '09:00', closeTime: '22:00' },
            ],
          },
        },
      });

      console.log(`✅ Created business: ${createdBusiness.name}`);
    }

    // Create sample events
    console.log('📅 Creating sample events...');
    for (const eventData of sampleEvents) {
      const slug = generateSlug(eventData.title);
      
      const createdEvent = await prisma.event.create({
        data: {
          ...eventData,
          slug,
          status: EventStatus.PUBLISHED,
          organizerName: 'Event Organizer',
          organizerEmail: 'events@thisismn.com',
        },
      });

      console.log(`✅ Created event: ${createdEvent.title}`);
    }

    const businessCount = await prisma.business.count();
    const eventCount = await prisma.event.count();
    
    console.log(`🎉 Extended seed completed! Created ${businessCount} businesses and ${eventCount} events.`);
  } catch (error) {
    console.error('❌ Extended seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the extended seed
seedExtended()
  .catch((error) => {
    console.error('Extended seed error:', error);
    process.exit(1);
  });