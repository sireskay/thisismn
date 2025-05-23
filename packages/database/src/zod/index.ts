import { z } from 'zod';
import { Prisma } from '@prisma/client';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// JSON
//------------------------------------------------------

export type NullableJsonInput = Prisma.JsonValue | null | 'JsonNull' | 'DbNull' | Prisma.NullTypes.DbNull | Prisma.NullTypes.JsonNull;

export const transformJsonNull = (v?: NullableJsonInput) => {
  if (!v || v === 'DbNull') return Prisma.DbNull;
  if (v === 'JsonNull') return Prisma.JsonNull;
  return v;
};

export const JsonValueSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.literal(null),
    z.record(z.lazy(() => JsonValueSchema.optional())),
    z.array(z.lazy(() => JsonValueSchema)),
  ])
);

export type JsonValueType = z.infer<typeof JsonValueSchema>;

export const NullableJsonValue = z
  .union([JsonValueSchema, z.literal('DbNull'), z.literal('JsonNull')])
  .nullable()
  .transform((v) => transformJsonNull(v));

export type NullableJsonValueType = z.infer<typeof NullableJsonValue>;

export const InputJsonValueSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.object({ toJSON: z.function(z.tuple([]), z.any()) }),
    z.record(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
    z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
  ])
);

export type InputJsonValueType = z.infer<typeof InputJsonValueSchema>;


/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const UserScalarFieldEnumSchema = z.enum(['id','name','email','emailVerified','image','createdAt','updatedAt','username','role','banned','banReason','banExpires','onboardingComplete','paymentsCustomerId','locale']);

export const SessionScalarFieldEnumSchema = z.enum(['id','expiresAt','ipAddress','userAgent','userId','impersonatedBy','activeOrganizationId','token','createdAt','updatedAt']);

export const AccountScalarFieldEnumSchema = z.enum(['id','accountId','providerId','userId','accessToken','refreshToken','idToken','expiresAt','password','accessTokenExpiresAt','refreshTokenExpiresAt','scope','createdAt','updatedAt']);

export const VerificationScalarFieldEnumSchema = z.enum(['id','identifier','value','expiresAt','createdAt','updatedAt']);

export const PasskeyScalarFieldEnumSchema = z.enum(['id','name','publicKey','userId','credentialID','counter','deviceType','backedUp','transports','createdAt']);

export const OrganizationScalarFieldEnumSchema = z.enum(['id','name','slug','logo','createdAt','metadata','paymentsCustomerId']);

export const MemberScalarFieldEnumSchema = z.enum(['id','organizationId','userId','role','createdAt']);

export const InvitationScalarFieldEnumSchema = z.enum(['id','organizationId','email','role','status','expiresAt','inviterId']);

export const PurchaseScalarFieldEnumSchema = z.enum(['id','organizationId','userId','type','customerId','subscriptionId','productId','status','createdAt','updatedAt']);

export const AiChatScalarFieldEnumSchema = z.enum(['id','organizationId','userId','title','messages','createdAt','updatedAt']);

export const BusinessScalarFieldEnumSchema = z.enum(['id','slug','name','description','shortDescription','logo','coverImage','website','email','phone','fax','yearEstablished','employeeCount','status','verified','verifiedAt','featured','featuredUntil','organizationId','claimedById','metaTitle','metaDescription','keywords','createdAt','updatedAt']);

export const BusinessLocationScalarFieldEnumSchema = z.enum(['id','businessId','name','isPrimary','streetAddress','streetAddress2','city','state','zipCode','country','latitude','longitude','serviceRadius','serviceAreas','phone','email','createdAt','updatedAt']);

export const BusinessHoursScalarFieldEnumSchema = z.enum(['id','businessId','locationId','dayOfWeek','openTime','closeTime','isClosed','isSpecialHours','specialDate','specialNote']);

export const CategoryScalarFieldEnumSchema = z.enum(['id','slug','name','description','icon','image','parentId','featured','displayOrder','metaTitle','metaDescription','createdAt','updatedAt']);

export const BusinessCategoryScalarFieldEnumSchema = z.enum(['businessId','categoryId','isPrimary']);

export const BusinessAmenityScalarFieldEnumSchema = z.enum(['id','businessId','name','category','icon']);

export const BusinessSocialLinkScalarFieldEnumSchema = z.enum(['id','businessId','platform','url']);

export const EventScalarFieldEnumSchema = z.enum(['id','slug','title','description','shortDescription','image','startDate','endDate','allDay','venue','streetAddress','city','state','zipCode','latitude','longitude','virtualUrl','isVirtual','isHybrid','businessId','organizerId','organizerName','organizerEmail','organizerPhone','isFree','price','priceMax','ticketUrl','registrationUrl','maxAttendees','categories','tags','status','featured','isRecurring','recurrenceRule','recurrenceEnd','parentEventId','metaTitle','metaDescription','createdAt','updatedAt']);

export const ReviewScalarFieldEnumSchema = z.enum(['id','businessId','userId','rating','qualityRating','serviceRating','valueRating','title','content','pros','cons','photos','helpful','notHelpful','ownerResponse','ownerRespondedAt','status','verifiedPurchase','createdAt','updatedAt']);

export const BusinessClaimScalarFieldEnumSchema = z.enum(['id','businessId','userId','verificationType','verificationCode','verificationData','status','rejectionReason','notes','documents','submittedAt','reviewedAt','expiresAt']);

export const BusinessAnalyticsScalarFieldEnumSchema = z.enum(['id','businessId','date','views','detailViews','websiteClicks','phoneClicks','directionsClicks','shares','saves','searchImpressions','searchClicks']);

export const UserPreferencesScalarFieldEnumSchema = z.enum(['id','userId','defaultCity','defaultZipCode','searchRadius','favoriteCategories','emailNotifications','smsNotifications','savedSearches','createdAt','updatedAt']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const NullableJsonNullValueInputSchema = z.enum(['DbNull','JsonNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value);

export const QueryModeSchema = z.enum(['default','insensitive']);

export const NullsOrderSchema = z.enum(['first','last']);

export const JsonNullValueFilterSchema = z.enum(['DbNull','JsonNull','AnyNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.JsonNull : value === 'AnyNull' ? Prisma.AnyNull : value);

export const PurchaseTypeSchema = z.enum(['SUBSCRIPTION','ONE_TIME']);

export type PurchaseTypeType = `${z.infer<typeof PurchaseTypeSchema>}`

export const BusinessStatusSchema = z.enum(['DRAFT','PENDING','ACTIVE','INACTIVE','SUSPENDED']);

export type BusinessStatusType = `${z.infer<typeof BusinessStatusSchema>}`

export const EventStatusSchema = z.enum(['DRAFT','PUBLISHED','CANCELLED','POSTPONED','COMPLETED']);

export type EventStatusType = `${z.infer<typeof EventStatusSchema>}`

export const ReviewStatusSchema = z.enum(['PENDING','APPROVED','REJECTED','FLAGGED']);

export type ReviewStatusType = `${z.infer<typeof ReviewStatusSchema>}`

export const ClaimVerificationTypeSchema = z.enum(['EMAIL','PHONE','DOCUMENT','PHYSICAL_MAIL']);

export type ClaimVerificationTypeType = `${z.infer<typeof ClaimVerificationTypeSchema>}`

export const ClaimStatusSchema = z.enum(['PENDING','IN_REVIEW','APPROVED','REJECTED','EXPIRED']);

export type ClaimStatusType = `${z.infer<typeof ClaimStatusSchema>}`

/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  username: z.string().nullable(),
  role: z.string().nullable(),
  banned: z.boolean().nullable(),
  banReason: z.string().nullable(),
  banExpires: z.coerce.date().nullable(),
  onboardingComplete: z.boolean(),
  paymentsCustomerId: z.string().nullable(),
  locale: z.string().nullable(),
})

export type User = z.infer<typeof UserSchema>

/////////////////////////////////////////
// SESSION SCHEMA
/////////////////////////////////////////

export const SessionSchema = z.object({
  id: z.string(),
  expiresAt: z.coerce.date(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  userId: z.string(),
  impersonatedBy: z.string().nullable(),
  activeOrganizationId: z.string().nullable(),
  token: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Session = z.infer<typeof SessionSchema>

/////////////////////////////////////////
// ACCOUNT SCHEMA
/////////////////////////////////////////

export const AccountSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  userId: z.string(),
  accessToken: z.string().nullable(),
  refreshToken: z.string().nullable(),
  idToken: z.string().nullable(),
  expiresAt: z.coerce.date().nullable(),
  password: z.string().nullable(),
  accessTokenExpiresAt: z.coerce.date().nullable(),
  refreshTokenExpiresAt: z.coerce.date().nullable(),
  scope: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Account = z.infer<typeof AccountSchema>

/////////////////////////////////////////
// VERIFICATION SCHEMA
/////////////////////////////////////////

export const VerificationSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date().nullable(),
  updatedAt: z.coerce.date().nullable(),
})

export type Verification = z.infer<typeof VerificationSchema>

/////////////////////////////////////////
// PASSKEY SCHEMA
/////////////////////////////////////////

export const PasskeySchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  publicKey: z.string(),
  userId: z.string(),
  credentialID: z.string(),
  counter: z.number().int(),
  deviceType: z.string(),
  backedUp: z.boolean(),
  transports: z.string().nullable(),
  createdAt: z.coerce.date().nullable(),
})

export type Passkey = z.infer<typeof PasskeySchema>

/////////////////////////////////////////
// ORGANIZATION SCHEMA
/////////////////////////////////////////

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().nullable(),
  logo: z.string().nullable(),
  createdAt: z.coerce.date(),
  metadata: z.string().nullable(),
  paymentsCustomerId: z.string().nullable(),
})

export type Organization = z.infer<typeof OrganizationSchema>

/////////////////////////////////////////
// MEMBER SCHEMA
/////////////////////////////////////////

export const MemberSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  role: z.string(),
  createdAt: z.coerce.date(),
})

export type Member = z.infer<typeof MemberSchema>

/////////////////////////////////////////
// INVITATION SCHEMA
/////////////////////////////////////////

export const InvitationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  email: z.string(),
  role: z.string().nullable(),
  status: z.string(),
  expiresAt: z.coerce.date(),
  inviterId: z.string(),
})

export type Invitation = z.infer<typeof InvitationSchema>

/////////////////////////////////////////
// PURCHASE SCHEMA
/////////////////////////////////////////

export const PurchaseSchema = z.object({
  type: PurchaseTypeSchema,
  id: z.string().cuid(),
  organizationId: z.string().nullable(),
  userId: z.string().nullable(),
  customerId: z.string(),
  subscriptionId: z.string().nullable(),
  productId: z.string(),
  status: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Purchase = z.infer<typeof PurchaseSchema>

/////////////////////////////////////////
// AI CHAT SCHEMA
/////////////////////////////////////////

export const AiChatSchema = z.object({
  id: z.string().cuid(),
  organizationId: z.string().nullable(),
  userId: z.string().nullable(),
  title: z.string().nullable(),
  /**
   * [AIChatMessages]
   */
  messages: JsonValueSchema.nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type AiChat = z.infer<typeof AiChatSchema>

/////////////////////////////////////////
// BUSINESS SCHEMA
/////////////////////////////////////////

export const BusinessSchema = z.object({
  status: BusinessStatusSchema,
  id: z.string().cuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  shortDescription: z.string().nullable(),
  logo: z.string().nullable(),
  coverImage: z.string().nullable(),
  website: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  fax: z.string().nullable(),
  yearEstablished: z.number().int().nullable(),
  employeeCount: z.string().nullable(),
  verified: z.boolean(),
  verifiedAt: z.coerce.date().nullable(),
  featured: z.boolean(),
  featuredUntil: z.coerce.date().nullable(),
  organizationId: z.string().nullable(),
  claimedById: z.string().nullable(),
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
  keywords: z.string().array(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Business = z.infer<typeof BusinessSchema>

/////////////////////////////////////////
// BUSINESS LOCATION SCHEMA
/////////////////////////////////////////

export const BusinessLocationSchema = z.object({
  id: z.string().cuid(),
  businessId: z.string(),
  name: z.string().nullable(),
  isPrimary: z.boolean(),
  streetAddress: z.string(),
  streetAddress2: z.string().nullable(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  country: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  serviceRadius: z.number().nullable(),
  serviceAreas: z.string().array(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type BusinessLocation = z.infer<typeof BusinessLocationSchema>

/////////////////////////////////////////
// BUSINESS HOURS SCHEMA
/////////////////////////////////////////

export const BusinessHoursSchema = z.object({
  id: z.string().cuid(),
  businessId: z.string(),
  locationId: z.string().nullable(),
  dayOfWeek: z.number().int(),
  openTime: z.string(),
  closeTime: z.string(),
  isClosed: z.boolean(),
  isSpecialHours: z.boolean(),
  specialDate: z.coerce.date().nullable(),
  specialNote: z.string().nullable(),
})

export type BusinessHours = z.infer<typeof BusinessHoursSchema>

/////////////////////////////////////////
// CATEGORY SCHEMA
/////////////////////////////////////////

export const CategorySchema = z.object({
  id: z.string().cuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  image: z.string().nullable(),
  parentId: z.string().nullable(),
  featured: z.boolean(),
  displayOrder: z.number().int(),
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Category = z.infer<typeof CategorySchema>

/////////////////////////////////////////
// BUSINESS CATEGORY SCHEMA
/////////////////////////////////////////

export const BusinessCategorySchema = z.object({
  businessId: z.string(),
  categoryId: z.string(),
  isPrimary: z.boolean(),
})

export type BusinessCategory = z.infer<typeof BusinessCategorySchema>

/////////////////////////////////////////
// BUSINESS AMENITY SCHEMA
/////////////////////////////////////////

export const BusinessAmenitySchema = z.object({
  id: z.string().cuid(),
  businessId: z.string(),
  name: z.string(),
  category: z.string(),
  icon: z.string().nullable(),
})

export type BusinessAmenity = z.infer<typeof BusinessAmenitySchema>

/////////////////////////////////////////
// BUSINESS SOCIAL LINK SCHEMA
/////////////////////////////////////////

export const BusinessSocialLinkSchema = z.object({
  id: z.string().cuid(),
  businessId: z.string(),
  platform: z.string(),
  url: z.string(),
})

export type BusinessSocialLink = z.infer<typeof BusinessSocialLinkSchema>

/////////////////////////////////////////
// EVENT SCHEMA
/////////////////////////////////////////

export const EventSchema = z.object({
  status: EventStatusSchema,
  id: z.string().cuid(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  shortDescription: z.string().nullable(),
  image: z.string().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable(),
  allDay: z.boolean(),
  venue: z.string().nullable(),
  streetAddress: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string(),
  zipCode: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  virtualUrl: z.string().nullable(),
  isVirtual: z.boolean(),
  isHybrid: z.boolean(),
  businessId: z.string().nullable(),
  organizerId: z.string().nullable(),
  organizerName: z.string().nullable(),
  organizerEmail: z.string().nullable(),
  organizerPhone: z.string().nullable(),
  isFree: z.boolean(),
  price: z.number().nullable(),
  priceMax: z.number().nullable(),
  ticketUrl: z.string().nullable(),
  registrationUrl: z.string().nullable(),
  maxAttendees: z.number().int().nullable(),
  categories: z.string().array(),
  tags: z.string().array(),
  featured: z.boolean(),
  isRecurring: z.boolean(),
  recurrenceRule: z.string().nullable(),
  recurrenceEnd: z.coerce.date().nullable(),
  parentEventId: z.string().nullable(),
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Event = z.infer<typeof EventSchema>

/////////////////////////////////////////
// REVIEW SCHEMA
/////////////////////////////////////////

export const ReviewSchema = z.object({
  status: ReviewStatusSchema,
  id: z.string().cuid(),
  businessId: z.string(),
  userId: z.string(),
  rating: z.number().int(),
  qualityRating: z.number().int().nullable(),
  serviceRating: z.number().int().nullable(),
  valueRating: z.number().int().nullable(),
  title: z.string().nullable(),
  content: z.string(),
  pros: z.string().nullable(),
  cons: z.string().nullable(),
  photos: z.string().array(),
  helpful: z.number().int(),
  notHelpful: z.number().int(),
  ownerResponse: z.string().nullable(),
  ownerRespondedAt: z.coerce.date().nullable(),
  verifiedPurchase: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Review = z.infer<typeof ReviewSchema>

/////////////////////////////////////////
// BUSINESS CLAIM SCHEMA
/////////////////////////////////////////

export const BusinessClaimSchema = z.object({
  verificationType: ClaimVerificationTypeSchema,
  status: ClaimStatusSchema,
  id: z.string().cuid(),
  businessId: z.string(),
  userId: z.string(),
  verificationCode: z.string().nullable(),
  verificationData: JsonValueSchema.nullable(),
  rejectionReason: z.string().nullable(),
  notes: z.string().nullable(),
  documents: z.string().array(),
  submittedAt: z.coerce.date(),
  reviewedAt: z.coerce.date().nullable(),
  expiresAt: z.coerce.date().nullable(),
})

export type BusinessClaim = z.infer<typeof BusinessClaimSchema>

/////////////////////////////////////////
// BUSINESS ANALYTICS SCHEMA
/////////////////////////////////////////

export const BusinessAnalyticsSchema = z.object({
  id: z.string().cuid(),
  businessId: z.string(),
  date: z.coerce.date(),
  views: z.number().int(),
  detailViews: z.number().int(),
  websiteClicks: z.number().int(),
  phoneClicks: z.number().int(),
  directionsClicks: z.number().int(),
  shares: z.number().int(),
  saves: z.number().int(),
  searchImpressions: z.number().int(),
  searchClicks: z.number().int(),
})

export type BusinessAnalytics = z.infer<typeof BusinessAnalyticsSchema>

/////////////////////////////////////////
// USER PREFERENCES SCHEMA
/////////////////////////////////////////

export const UserPreferencesSchema = z.object({
  id: z.string().cuid(),
  userId: z.string(),
  defaultCity: z.string().nullable(),
  defaultZipCode: z.string().nullable(),
  searchRadius: z.number().int(),
  favoriteCategories: z.string().array(),
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  savedSearches: JsonValueSchema.nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type UserPreferences = z.infer<typeof UserPreferencesSchema>
