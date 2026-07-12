import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { posts } from '../data';

function Post({ post, onUserClick }: { post: any, onUserClick?: (username: string) => void, key?: number | string }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [comments, setComments] = useState<{username: string, text: string, isHandwritten?: boolean}[]>(post.comments || []);
  const [commentText, setCommentText] = useState('');
  const [isHandwritingMode, setIsHandwritingMode] = useState(false);
  const [isReposted, setIsReposted] = useState(false);

  const [showShareModal, setShowShareModal] = useState(false);

  const handleLike = () => setIsLiked(!isLiked);
  const handleSave = () => setIsSaved(!isSaved);
  
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setComments([...comments, { username: 'shrushtiganacharya', text: commentText, isHandwritten: isHandwritingMode }]);
    setCommentText('');
  };

  const handleRepost = () => {
    if (!isReposted) {
      alert("Successfully reposted to your vintage feed!");
      setIsReposted(true);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  return (
    <div className="vintage-panel mb-8 relative">
      {/* Share Modal */}
      {showShareModal && (
        <div className="absolute inset-0 z-10 flex justify-center items-center backdrop-blur-[1px] bg-white/30">
           <div className="vintage-panel w-[280px] shadow-[4px_4px_8px_rgba(0,0,0,0.3)] flex flex-col">
              <div className="px-3 py-2 border-b border-[#ccc] bg-[#e0e0e0] font-bold text-[12px] text-[#333] flex justify-between items-center">
                 <span>Share Post</span>
                 <button onClick={() => setShowShareModal(false)} className="text-[#333] hover:text-red-600 font-normal">✖</button>
              </div>
              <div className="p-3 bg-[#fdfdfd] flex flex-col gap-3">
                 <div className="font-bold text-[11px] text-[#555]">Send to friends:</div>
                 <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto border border-[#999] p-1 bg-white shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)]">
                    {['kevin', 'doglover', 'vintage_cars', 'sarah', 'photofan'].map(f => (
                       <div key={f} className="flex items-center justify-between p-1 hover:bg-[#e8e8e8] cursor-pointer border border-transparent hover:border-[#ccc]">
                          <div className="flex items-center gap-2">
                             <img src={`https://i.pravatar.cc/150?u=${f}`} className="w-6 h-6 border border-[#ccc]" alt={f} />
                             <span className="text-[11px]">{f}</span>
                          </div>
                          <button className="retro-button px-2 py-0.5 text-[9px]" onClick={() => { alert(`Sent to ${f}!`); setShowShareModal(false); }}>Send</button>
                       </div>
                    ))}
                 </div>
                 <div className="border-t border-[#ccc] pt-3 flex justify-between">
                    <button className="retro-button px-3 py-1 text-[11px]" onClick={() => { alert('Link copied to clipboard!'); setShowShareModal(false); }}>🔗 Copy Link</button>
                    <button className="retro-button px-3 py-1 text-[11px]" onClick={() => { alert('Added to your story!'); setShowShareModal(false); }}>📸 Add to Story</button>
                 </div>
              </div>
           </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center p-3 bg-[#e0e0e0] border-b border-[#ccc]">
        <img src={post.user.avatar} className="w-10 h-10 rounded-[0px] mr-3 border border-[#999] shadow-[1px_1px_2px_rgba(0,0,0,0.2)]" alt="avatar" />
        <div className="flex flex-col">
          <button 
            onClick={(e) => { e.preventDefault(); onUserClick?.(post.user.username); }}
            className="vintage-link font-bold text-[14px] bg-transparent border-none p-0 text-left cursor-pointer"
          >
            {post.user.username}
          </button>
          <span className="text-[#666] text-[10px]">San Francisco, CA</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[#666] text-[11px]">{post.time}</span>
          <button className="text-[#666] hover:text-[#333] font-bold">•••</button>
        </div>
      </div>

      {/* Image or Video */}
      <div className="border-b border-[#ccc] p-3 bg-[#f5f5f5] relative">
        {post.contentFileType === 'video' || post.contentImg?.match(/\.(mp4|webm|ogg)$/i) ? (
          <video 
            src={post.contentImg} 
            className="w-full aspect-square object-cover border border-[#999] shadow-[2px_2px_4px_rgba(0,0,0,0.15)]"
            controls 
            autoPlay 
            loop 
            muted 
            style={{ filter: 'contrast(1.1) saturate(1.1) sepia(0.15)' }}
          />
        ) : (
          <div 
            className="w-full aspect-square bg-cover bg-center border border-[#999] shadow-[2px_2px_4px_rgba(0,0,0,0.15)] relative"
            style={{ backgroundImage: `url(${post.contentImg})`, filter: 'contrast(1.1) saturate(1.1) sepia(0.15)' }}
          >
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded flex gap-1 items-center">
              <span>👤</span>
            </div>
          </div>
        )}
        {/* Mock Carousel Dots */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#0000EE] shadow-[0_0_2px_rgba(255,255,255,0.8)]"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/70 shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/70 shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
        </div>
      </div>

      {/* Actions & Likes */}
      <div className="p-3 bg-[#ffffff]">
         <div className="flex justify-between items-center mb-3">
           <div className="flex gap-2">
              <button onClick={handleLike} className={`retro-button px-3 py-1 font-bold text-[11px] flex items-center gap-1 ${isLiked ? 'text-[#0000EE]' : ''}`}>
                <span className={isLiked ? "text-[#0000EE]" : "text-[#999]"}>♥</span> {isLiked ? 'Liked' : 'Like'}
              </button>
              <button onClick={() => document.getElementById(`comment-${post.id}`)?.focus()} className="retro-button px-3 py-1 font-bold text-[11px]">Comment</button>
              <button onClick={handleShare} className="retro-button px-3 py-1 font-bold text-[11px] flex items-center gap-1">
                <span className="text-[#0000EE] opacity-80">↗</span> Share
              </button>
           </div>
           <button onClick={handleSave} className={`retro-button px-3 py-1 font-bold text-[11px] flex items-center gap-1 ${isSaved ? 'text-[#0000EE]' : ''}`}>
             <span className={isSaved ? "text-[#0000EE]" : "text-[#999]"}>🔖</span> {isSaved ? 'Saved' : 'Save'}
           </button>
         </div>
         <div className="font-bold text-[#333] text-[12px] mb-2 flex items-center gap-1 border-b border-[#eee] pb-2">
           <span className="text-[#0000EE]">♥</span> {post.likes} people {isLiked ? 'and you ' : ''}like this.
         </div>
         <div className="text-[12px] leading-[18px]">
           <button 
             onClick={(e) => { e.preventDefault(); onUserClick?.(post.user.username); }}
             className="vintage-link font-bold mr-2 bg-transparent border-none p-0 text-left cursor-pointer"
           >
             {post.user.username}
           </button>
           <span className="text-[#333]">{post.caption}</span>
         </div>
         {comments.length > 0 && (
           <div className="mt-2 flex flex-col gap-1">
             {comments.map((c, i) => (
               <div key={i} className="text-[12px] leading-[18px]">
                 <button 
                   onClick={(e) => { e.preventDefault(); onUserClick?.(c.username); }}
                   className="vintage-link font-bold mr-2 bg-transparent border-none p-0 text-left cursor-pointer"
                 >
                   {c.username}
                 </button>
                 <span className={c.isHandwritten ? "handwritten-text leading-none inline-block mt-0.5" : "text-[#333]"}>{c.text}</span>
               </div>
             ))}
           </div>
         )}
         <form className="mt-3 flex gap-2" onSubmit={handleCommentSubmit}>
            <input 
              id={`comment-${post.id}`} 
              value={commentText} 
              onChange={(e) => setCommentText(e.target.value)} 
              type="text" 
              placeholder="Add a comment..." 
              className={`w-full vintage-input outline-none text-[12px] text-[#333] px-2 py-1 placeholder-[#999] ${isHandwritingMode ? 'handwritten-text' : ''}`} 
            />
            <button 
              type="button" 
              onClick={() => setIsHandwritingMode(!isHandwritingMode)}
              className={`retro-button px-2 py-1 text-[16px] flex items-center justify-center ${isHandwritingMode ? 'bg-[#e0e0e0] border-[#333] shadow-inner' : ''}`}
              title="Toggle Handwritten Mode"
            >
              ✍️
            </button>
            <button type="submit" className="hidden">Submit</button>
         </form>
      </div>
    </div>
  );
}

export function Feed({ posts: propPosts, onUserClick }: { posts?: any[], onUserClick?: (username: string) => void }) {
  const [visibleCount, setVisibleCount] = useState(2);

  const loadMore = () => {
    setVisibleCount(prev => prev + 2);
  };

  const currentPosts = propPosts || posts;
  const visiblePosts = currentPosts.slice(0, visibleCount);
  const hasMore = visibleCount < currentPosts.length;

  return (
    <div className="flex flex-col">
      {visiblePosts.map((post) => (
        <Post key={post.id} post={post} onUserClick={onUserClick} />
      ))}
      {hasMore && (
        <div className="text-center py-6">
          <button onClick={loadMore} className="retro-button px-8 py-2.5 rounded-[3px] text-[#444] font-bold text-[13px] shadow-sm">Load More</button>
        </div>
      )}
    </div>
  );
}
