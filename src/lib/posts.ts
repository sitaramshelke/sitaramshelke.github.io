import type { CollectionEntry } from "astro:content";

export type BlogPost = CollectionEntry<"blog">;

const datePrefix = /^(\d{4})-(\d{2})-(\d{1,2})-/;

export function getPostDate(post: BlogPost) {
  const match = post.id.match(datePrefix);
  if (!match) return new Date(0);

  const [, year, month, day] = match;
  return new Date(`${year}-${month}-${day.padStart(2, "0")}T00:00:00.000Z`);
}

export function getPostSlug(post: BlogPost) {
  return post.id.replace(datePrefix, "");
}

export function getPostTags(post: BlogPost) {
  const tags = post.data.tags;
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  return tags.split(/\s+/).filter(Boolean);
}

export function sortPostsByDate(posts: BlogPost[]) {
  return [...posts].sort(
    (a, b) => getPostDate(b).getTime() - getPostDate(a).getTime()
  );
}

export function formatDate(date: Date) {
  return date.toLocaleDateString("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  });
}

export function getExcerpt(post: BlogPost, maxLength = 180) {
  const source = post.body.split("<!--more-->")[0] ?? post.body;
  const text = source
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*_>`-]/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}
