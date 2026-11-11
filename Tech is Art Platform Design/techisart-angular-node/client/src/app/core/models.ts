export type Pillar = 'Beauty' | 'Fashion' | 'Art' | 'Music' | 'Gaming' | 'Architecture & Interior Design' | 'Film & Animation';
export const PILLARS: Pillar[] = ['Beauty', 'Fashion', 'Art', 'Music', 'Gaming', 'Architecture & Interior Design', 'Film & Animation'];
export const FORMATS = ['Article', 'News', 'Interview', 'Review'] as const;
export const RESEARCH_TYPES = ['Paper', 'Study', 'Analysis', 'Review', 'Case study'] as const;
export const SOURCES = ['Peer-reviewed', 'Industry', 'Independent / Community'] as const;
export const DISCLOSURES = [
  { value: 'None', desc: 'No AI or generative tools were used in research, writing or images.' },
  { value: 'AI-assisted', desc: 'You wrote it. Tools helped with research, editing, transcription or translation.' },
  { value: 'AI-generated with human direction', desc: 'Substantial parts were generated, then selected, edited and verified by you.' }
];
export const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

export interface User { id: string; name: string; email: string; role: string | null; level: number; points: number; isCreator: boolean; available?: boolean; bio?: string; location?: string; site?: string; }
export interface Block { type: 'p' | 'h2' | 'quote'; text: string; by?: string; }
export interface Article {
  slug: string; pillar: string; format: string; title: string; deck: string; author: string; role: string; image?: string;
  published?: string; readMinutes?: number; disclosure?: string; hero?: string; caption?: string; authorBio?: string; blocks?: Block[];
  commentsEnabled?: boolean; rating?: { average: number | null; count: number }; myRating?: number | null; comments?: Comment[];
  // research variant
  source?: string; abstract?: string; findings?: string[]; citation?: string; references?: string[]; original?: string;
}
export interface Comment { id: number; name: string; role: string; verified: boolean; isAuthor?: boolean; time: string; text: string; replies: Comment[]; }
export interface Research {
  slug: string; title: string; abstract: string; field: string; type: string; source: string; publishedDaysAgo: number;
  author: string; role: string; cls: string; verified: boolean; reads: number; cites: number; pick: boolean; tags: string[]; cite: string; original?: string;
}
export interface Opportunity {
  id: number; type: 'Competition' | 'Program' | 'Grant' | 'Launch'; title: string; org: string; orgVerified: boolean; days: number; posted: number;
  fee: 'Free' | 'Paid'; feeAmt?: string; who: string[]; format: 'Online' | 'In person'; location?: string; prizes: string[]; prizeText: string; prizeValue: number;
  fields: string[]; link: string; sponsored: boolean; desc: string; body?: string[]; elig?: string[]; steps?: string[]; orgAbout?: string; status: 'Open' | 'Closing soon' | 'Closed';
}
export interface Paged<T> { total: number; items: T[]; }
