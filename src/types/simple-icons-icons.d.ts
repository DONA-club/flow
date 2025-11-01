declare module "simple-icons/icons" {
  export interface SimpleIcon {
    title: string;
    slug: string;
    hex: string;
    path: string;
    source?: string;
  }

  // Add missing named exports so TS stops complaining
  export const siAmazon: SimpleIcon;
  export const siMicrosoft: SimpleIcon;
  export const siMicrosoftOutlook: SimpleIcon;
  // Added:
  export const siGoogle: SimpleIcon;
  export const siApple: SimpleIcon;
  export const siFacebook: SimpleIcon;
}