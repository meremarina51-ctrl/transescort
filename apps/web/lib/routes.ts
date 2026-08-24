export const ROUTES = {
  HOME: '/',
  HOME_ABOUT: '/#about',
  HOME_PRICING: '/#pricing',

  CATALOG: '/catalog',

  CONTACTS: '/contacts',
  SUPPORT: '/support',

  LOGIN: '/login',
  REGISTER: '/register',
  RECOVER: '/recover',
  PREVIEW: '/preview',

  CABINET: '/cabinet',
  CABINET_PROFILE: '/cabinet/profile',
  CABINET_LISTING: '/cabinet/listing',
  CABINET_PHOTOS: '/cabinet/photos',
  CABINET_REVIEWS: '/cabinet/reviews',
  CABINET_FAVORITES: '/cabinet/favorites',
  CABINET_STATS: '/cabinet/stats',
  CABINET_CHATS: '/cabinet/chats',
  CABINET_MESSAGES: '/cabinet/messages',
  CABINET_SETTINGS: '/cabinet/settings',
  CABINET_TARIFF: '/cabinet/tariff',

  ADMIN: '/admin',
  ADMIN_MODERATION: '/admin/moderation',
  ADMIN_PERFORMERS: '/admin/performers',
  ADMIN_USERS: '/admin/users',
} as const;

export const catalogListing = (slug: string) => `/catalog/${slug}`;
export const adminPerformer = (id: string) => `/admin/performers/${id}`;
export const loginWithRedirect = (path: string) => `/login?redirect=${encodeURIComponent(path)}`;
