import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { profile } from "../data/profile";
import {
  getExcerpt,
  getPostDate,
  getPostSlug,
  sortPostsByDate
} from "../lib/posts";

export async function GET(context) {
  const posts = sortPostsByDate(await getCollection("blog"));

  return rss({
    title: profile.name,
    description: profile.summary,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: getExcerpt(post, 260),
      pubDate: getPostDate(post),
      link: `/${getPostSlug(post)}.html`
    }))
  });
}
