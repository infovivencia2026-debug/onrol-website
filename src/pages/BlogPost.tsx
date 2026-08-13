import { Navigate, useLocation } from "react-router-dom";
import BlogPostLayout from "@/components/seo/BlogPostLayout";
import { blogPosts } from "@/lib/blogContent";

export default function BlogPost() {
  const location = useLocation();
  // /blog/foo-bar/  →  "foo-bar"
  const slug = location.pathname.replace(/^\/blog\//, "").replace(/\/+$/, "");
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return <Navigate to="/404" replace />;
  return <BlogPostLayout post={post} />;
}
