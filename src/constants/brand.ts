/**
 * Global Brand Constants
 * Single source of truth for brand identity
 */

export const BRAND_NAME = "Order Sync Agent";
export const BRAND_NAME_SHORT = "Order Sync";
export const DOMAIN = "ordersyncagent.com";
export const WEBSITE_URL = `https://www.${DOMAIN}`;

export const CONTACT_EMAILS = {
  INFO: `info@${DOMAIN}`,
  SUPPORT: `support@${DOMAIN}`,
  REPORT: `report@${DOMAIN}`,
  SALES: `sales@${DOMAIN}`
} as const;

export const LOGO_PATH = "/assets/logo.png";
export const FAVICON_PATH = "/favicon.ico";

export const BRAND_COLORS = {
  PRIMARY: "#1877F2",
  PRIMARY_HOVER: "#166fe5",
  SUCCESS: "#10B981",
  WARNING: "#f59e0b",
  ERROR: "#ef4444",
  BACKGROUND: "#F3F4F6"
} as const;

export const SOCIAL_LINKS = {
  WEBSITE: WEBSITE_URL,
  INSTAGRAM: `https://instagram.com/${BRAND_NAME_SHORT}`,
  TWITTER: `https://twitter.com/${BRAND_NAME_SHORT}`
} as const;
