
export interface ProfileFormData {
  full_name: string;
  username: string;
  website: string;
  bio: string;
  location: string;
  social_links: {
    twitter: string;
    github: string;
    linkedin: string;
  };
}
