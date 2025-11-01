declare module "simple-icons/icons/*" {
  const icon: {
    title: string;
    slug: string;
    hex: string;
    path: string;
    source?: string;
  };
  export default icon;
}

declare module "simple-icons/icons/*.js" {
  const icon: {
    title: string;
    slug: string;
    hex: string;
    path: string;
    source?: string;
  };
  export default icon;
}