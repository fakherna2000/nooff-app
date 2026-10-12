'use client';

import { useEffect, useState, useRef } from 'react';
import { usePosts } from '@/hooks/useData';
import type { Post } from '@/lib/database.types';
import { Newspaper, Tag, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const TYPE_LABELS: Record<string, string> = {
  offer: 'عرض خاص',
  ad: 'إعلان',
  tip: 'نصيحة',
  general: 'منشور',
};

const TYPE_COLORS: Record<string, string> = {
  offer: 'bg-green-100 text-green-700',
  ad: 'bg-blue-100 text-blue-700',
  tip: 'bg-amber-100 text-amber-700',
  general: 'bg-purple-100 text-purple-700',
};

export default function PatientPostsPage() {
  const { getPublishedPosts } = usePosts();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getPublishedPosts();
      setPosts(data);
      setLoading(false);
    }
    load();
  }, [getPublishedPosts]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const card = scrollRef.current.querySelector('.post-card') as HTMLElement;
    if (!card) return;
    const idx = Math.round(scrollRef.current.scrollLeft / (card.offsetWidth + 14));
    setActiveIdx(Math.max(0, Math.min(idx, posts.length - 1)));
  };

  const scrollTo = (idx: number) => {
    if (!scrollRef.current) return;
    const card = scrollRef.current.querySelector('.post-card') as HTMLElement;
    if (!card) return;
    scrollRef.current.scrollTo({ left: idx * (card.offsetWidth + 14), behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="space-y-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-40 bg-gray-100 rounded-2xl mb-3" />
            <div className="h-5 w-2/3 bg-gray-100 rounded mb-2" />
            <div className="h-4 w-full bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <Newspaper className="w-20 h-20 mx-auto mb-5 text-gray-200" />
        <h2 className="text-xl font-bold mb-2">لا توجد منشورات بعد</h2>
        <p className="text-gray-500">سيتم عرض منشورات المركز هنا</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">منشورات المركز</h1>
        <p className="text-gray-600 mt-1 text-sm">آخر الأخبار والعروض والنصائح</p>
      </div>

      {/* Carousel */}
      <div>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory pb-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {posts.map((post) => (
            <article
              key={post.id}
              className="post-card snap-center shrink-0 w-[88%] bg-white rounded-3xl overflow-hidden shadow-md border border-gray-100"
            >
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-full aspect-video object-cover"
                  loading="lazy"
                />
              )}
              <div className="p-4">
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full mb-2.5 ${TYPE_COLORS[post.type] || TYPE_COLORS.general}`}>
                  <Tag className="w-3 h-3" />
                  {TYPE_LABELS[post.type] || 'منشور'}
                </span>
                <h3 className="font-bold text-lg text-gray-900 leading-snug">{post.title}</h3>
                {post.body && (
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{post.body}</p>
                )}
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-3 font-medium">
                  <Clock className="w-3 h-3" />
                  {formatDate(post.created_at)}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 mt-3">
          {posts.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`h-2 rounded-full transition-all ${
                i === activeIdx ? 'w-6 bg-primary-600' : 'w-2 bg-gray-300'
              }`}
              aria-label={`منشور ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* List */}
      <div>
        <h2 className="font-bold text-gray-900 mb-3">كل المنشورات</h2>
        <div className="space-y-3">
          {posts.map((post) => (
            <article
              key={post.id}
              className="card !p-3.5 flex gap-3 hover:shadow-md transition-shadow"
            >
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt=""
                  className="w-20 h-20 rounded-2xl object-cover shrink-0"
                  loading="lazy"
                />
              )}
              <div className="flex-1 min-w-0">
                <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5 ${TYPE_COLORS[post.type] || TYPE_COLORS.general}`}>
                  {TYPE_LABELS[post.type] || 'منشور'}
                </span>
                <h3 className="font-bold text-sm text-gray-900 leading-snug line-clamp-2">
                  {post.title}
                </h3>
                {post.body && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {post.body}
                  </p>
                )}
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                  {formatDate(post.created_at)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
