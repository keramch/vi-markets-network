import React from 'react';
import { Globe } from 'lucide-react';
import { InstagramIcon, FacebookIcon, PinterestIcon, EtsyIcon, TikTokIcon } from './Icons';
import { socialUrl, websiteUrl, SOCIAL_LABEL, type SocialPlatform } from '../utils';

// The round social and website buttons on market and vendor profiles. Links
// are built by socialUrl / websiteUrl, so whatever format a member typed
// (username, @name, full link) opens the right page, and anything that can't
// become a working link is left out.

type Contact = {
  website?: string;
  socials?: Partial<Record<SocialPlatform | 'website', string>>;
};

const ICONS: Record<SocialPlatform, React.FC<{ className?: string }>> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  pinterest: PinterestIcon,
  etsy: EtsyIcon,
  tiktok: TikTokIcon,
};

const ORDER: SocialPlatform[] = ['instagram', 'facebook', 'pinterest', 'etsy', 'tiktok'];

// The links a profile will show, in display order
export function socialLinks(contact: Contact | undefined) {
  type Link = { key: string; label: string; href: string; Icon: React.FC<{ className?: string }> };
  const links: Link[] = [];
  for (const platform of ORDER) {
    const href = socialUrl(platform, contact?.socials?.[platform]);
    if (href) links.push({ key: platform, label: SOCIAL_LABEL[platform], href, Icon: ICONS[platform] });
  }
  // The editor has had two Website boxes; show whichever one was filled in
  const site = websiteUrl(contact?.socials?.website) ?? websiteUrl(contact?.website);
  if (site) links.push({ key: 'website', label: 'Website', href: site, Icon: Globe });
  return links;
}

const SocialLinks: React.FC<{ contact: Contact | undefined }> = ({ contact }) => {
  const links = socialLinks(contact);
  if (links.length === 0) return null;
  return (
    <div className="flex gap-3 mb-5">
      {links.map(({ key, label, href, Icon }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-brand-blue hover:text-white transition-colors"
        >
          <Icon className="w-5 h-5" />
        </a>
      ))}
    </div>
  );
};

export default SocialLinks;
