export const CONTENT_TYPES = [
  { value: 'tweet', label: 'Tweet' },
  { value: 'thread', label: 'Thread' },
  { value: 'linkedin_post', label: 'LinkedIn Post' },
  { value: 'blog_post', label: 'Blog Post' },
  { value: 'article', label: 'Article' },
  { value: 'email', label: 'Email' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'essay', label: 'Essay' },
  { value: 'other', label: 'Other' },
] as const;

export const CONTENT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  CONTENT_TYPES.map((t) => [t.value, t.label])
);
