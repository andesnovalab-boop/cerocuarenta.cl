import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { BlogPost } from "../types";
import { ArrowLeft, Clock, User } from "lucide-react";
import { SEO } from "../components/SEO";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const CAT_COLORS: Record<string, string> = {
  Cultura:  "bg-court-olive/10 text-court-olive",
  Tennis:   "bg-court-ink/10 text-court-ink",
  Moda:     "bg-rose-50 text-rose-600",
  Drops:    "bg-amber-50 text-amber-700",
  Noticias: "bg-blue-50 text-blue-600",
};

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { navigate("/raquetero"); return; }
        setPost(data as BlogPost);
        // Fetch related
        supabase
          .from("blog_posts")
          .select("id,title,slug,cover_image,category,created_at,excerpt")
          .eq("published", true)
          .eq("category", (data as BlogPost).category)
          .neq("id", data.id)
          .limit(3)
          .then(({ data: rel }) => setRelated((rel || []) as BlogPost[]));
        setLoading(false);
      });
  }, [slug, navigate]);

  if (loading) return (
    <div className="flex justify-center py-40">
      <div className="w-8 h-8 border-2 border-court-olive border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!post) return null;

  return (
    <div className="bg-white min-h-screen">
      <SEO title={`${post.title} — El Raquetero`} description={post.excerpt} />

      {/* Back */}
      <div className="max-w-4xl mx-auto px-8 pt-10">
        <Link to="/raquetero" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-court-ink/30 hover:text-court-olive transition-colors">
          <ArrowLeft size={13} /> El Raquetero
        </Link>
      </div>

      {/* Header */}
      <div className="max-w-4xl mx-auto px-8 pt-8 pb-12">
        <span className={`text-[9px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-full inline-block mb-6 ${CAT_COLORS[post.category] ?? "bg-gray-100 text-gray-600"}`}>
          {post.category}
        </span>
        <h1 className="font-bitter italic text-3xl sm:text-5xl md:text-7xl text-court-ink leading-[1.05] tracking-tight mb-6">
          {post.title}
        </h1>
        <p className="text-court-ink/50 text-lg leading-relaxed font-medium mb-8 max-w-2xl">
          {post.excerpt}
        </p>
        <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-court-ink/30 border-t border-gray-100 pt-6">
          <span className="flex items-center gap-2"><User size={12} /> {post.author}</span>
          <span className="flex items-center gap-2">
            <Clock size={12} />
            {format(new Date(post.created_at), "d 'de' MMMM, yyyy", { locale: es })}
          </span>
        </div>
      </div>

      {/* Cover */}
      {post.cover_image && (
        <div className="max-w-6xl mx-auto px-4 mb-16">
          <div className="aspect-[16/7] rounded-[2rem] overflow-hidden">
            <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-2xl mx-auto px-8 pb-24">
        <div className="prose prose-lg prose-headings:font-bitter prose-headings:italic prose-headings:text-court-ink prose-p:text-court-ink/60 prose-p:leading-relaxed prose-p:font-medium prose-a:text-court-olive prose-strong:text-court-ink prose-img:rounded-2xl">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="border-t border-gray-100 py-20">
          <div className="max-w-7xl mx-auto px-8">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-court-olive mb-10">
              También en El Raquetero
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {related.map(r => (
                <Link key={r.id} to={`/raquetero/${r.slug}`} className="group flex flex-col">
                  <div className="aspect-[4/3] rounded-[1.5rem] overflow-hidden mb-4 bg-court-cream">
                    {r.cover_image ? (
                      <img src={r.cover_image} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-court-olive/10 to-court-cream" />
                    )}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full w-fit mb-2 ${CAT_COLORS[r.category] ?? ""}`}>
                    {r.category}
                  </span>
                  <h4 className="font-bitter italic text-xl text-court-ink group-hover:text-court-olive transition-colors line-clamp-2">
                    {r.title}
                  </h4>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
