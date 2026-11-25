import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, MapPin, Phone, X } from 'lucide-react';
import {
  BlogPost,
  GENERATED_IMAGES,
  POST_CATEGORIES,
  PostCategory,
  StoreSettings,
} from '../types';
import { SafeImage } from './SafeImage';

interface BlogGuidesSectionProps {
  posts: BlogPost[];
  settings: StoreSettings;
  onJumpApply: () => void;
}

export function BlogGuidesSection({ posts, settings, onJumpApply }: BlogGuidesSectionProps) {
  const [activeCategory, setActiveCategory] = useState<PostCategory | 'all'>('all');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const filteredPosts = useMemo(() => {
    if (activeCategory === 'all') return posts;
    return posts.filter((p) => p.category === activeCategory);
  }, [posts, activeCategory]);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = { all: posts.length };
    for (const cat of POST_CATEGORIES) {
      map[cat] = posts.filter((p) => p.category === cat).length;
    }
    return map;
  }, [posts]);

  return (
    <section id="blog-guides" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14 sm:py-16">
      <div className="mb-8">
        <p className="text-xs font-medium text-[#028A3F] mb-1.5">
          04. 청상품권 공식 블로그 포스팅
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          상세 매입 가이드 및 주간 시세 리포트
        </h2>
      </div>

      {/* Classic Naver Homepage-Style Blog 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Naver Blog Profile & Category Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          {/* Blog Profile Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="w-full aspect-square rounded-lg overflow-hidden border border-slate-100 mb-4">
              <SafeImage
                src={GENERATED_IMAGES.profile}
                alt="청상품권 상담 데스크 프로필"
                className="w-full h-full object-cover"
                fallbackLabel="청상품권 공식 블로그"
              />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">{settings.blogTitle}</h3>
            <p className="text-xs text-slate-500 mb-2">
              대표 이명군 · 사업자 484-37-01431
            </p>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              롯데·신세계·현대 백화점 상품권, 모바일 기프티콘, 문화상품권 정식 매입 전문 블로그입니다. 매일 변동되는 실시간 시세와 안전 거래 가이드를 기록합니다.
            </p>
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono-num">{settings.phoneNumber}</span>
              </div>
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>경기도 부천시 원미구 부일로685번길 40-8, E동502호(역곡동)</span>
              </div>
            </div>
          </div>

          {/* Naver Blog Category Menu */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 pb-3 mb-2 border-b border-slate-100">
              <BookOpen className="w-3.5 h-3.5 text-[#03C75A]" />
              카테고리 전체보기
            </div>
            <ul className="space-y-1 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                    activeCategory === 'all'
                      ? 'bg-[#F2F7F4] text-[#028A3F] font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>전체글 보기</span>
                  <span className="text-xs font-mono-num text-slate-400">
                    ({categoryCounts.all})
                  </span>
                </button>
              </li>
              {POST_CATEGORIES.map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                      activeCategory === cat
                        ? 'bg-[#F2F7F4] text-[#028A3F] font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="text-xs font-mono-num text-slate-400">
                      ({categoryCounts[cat] ?? 0})
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Right Blog Feed */}
        <div className="lg:col-span-9">
          {filteredPosts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <p className="text-sm text-slate-600 mb-3">
                선택하신 카테고리에 등록된 가이드 글이 없습니다.
              </p>
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                전체 글 보기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPosts.map((post) => (
                <article
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="group bg-white border border-slate-200 hover:border-[#03C75A]/60 rounded-xl overflow-hidden transition-colors cursor-pointer flex flex-col"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                    <SafeImage
                      src={GENERATED_IMAGES[post.imageKey] ?? GENERATED_IMAGES.department}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      fallbackLabel={post.category}
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                        <span className="font-semibold text-[#028A3F]">{post.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-num">{post.publishedDate}</span>
                        <span aria-hidden="true">·</span>
                        <span>{post.readMinutes}분 읽기</span>
                      </div>
                      <h3 className="text-base sm:text-[17px] font-bold text-slate-900 leading-snug mb-2 group-hover:text-[#028A3F] transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                        {post.summary}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-slate-700 group-hover:text-[#028A3F]">
                      전문 읽어보기
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Article Reader Modal */}
      {selectedPost && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="blog-reader-title"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-[#028A3F]">{selectedPost.category}</span>
                <span className="mx-1.5">·</span>
                <span className="font-mono-num">{selectedPost.publishedDate}</span>
                <span className="mx-1.5">·</span>
                <span>{selectedPost.readMinutes}분 읽기</span>
              </div>
              <button
                type="button"
                aria-label="글 닫기"
                onClick={() => setSelectedPost(null)}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8">
              <h3
                id="blog-reader-title"
                className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug mb-5"
              >
                {selectedPost.title}
              </h3>

              <div className="aspect-[16/9] rounded-lg overflow-hidden mb-6 border border-slate-100">
                <SafeImage
                  src={GENERATED_IMAGES[selectedPost.imageKey] ?? GENERATED_IMAGES.department}
                  alt={selectedPost.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-4 text-[15px] text-slate-700 leading-[1.8] whitespace-pre-line">
                {selectedPost.content}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                  실시간 확정 시세가 궁금하시다면 지금 바로 신청해 보세요.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPost(null);
                    onJumpApply();
                  }}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[#03C75A] hover:bg-[#02A94C] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  이 상품권 간편 신청하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
