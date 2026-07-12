/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Feed } from './components/Feed';
import { Login } from './components/Login';
import { Home, Star, Camera, Heart, User, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { posts as initialPosts } from './data';

import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL || `${API_BASE}';


export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeView, setActiveView] = useState('Home');
  const [activeSettingsTab, setActiveSettingsTab] = useState('Edit Profile');
  
  // Settings States
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editBio, setEditBio] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const [isProfessionalAccount, setIsProfessionalAccount] = useState(false);
  const [showActivityStatus, setShowActivityStatus] = useState(true);
  const [allowStorySharing, setAllowStorySharing] = useState(true);
  
  const [dailyTimeLimit, setDailyTimeLimit] = useState(0);
  const [breakReminder, setBreakReminder] = useState(0);
  const [mutePushNotifications, setMutePushNotifications] = useState(false);
  const [timeSpentToday, setTimeSpentToday] = useState(0);

  const [loginSessions, setLoginSessions] = useState<any[]>([]);
  const [emailsFromInsta, setEmailsFromInsta] = useState<any[]>([]);

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeStory, setActiveStory] = useState<{name: string, image: string, isOwnStory?: boolean, viewers?: {name: string, timestamp: string}[], stickers?: any[]} | null>(null);
  const [leftWidth, setLeftWidth] = useState(200);
  const [rightWidth, setRightWidth] = useState(260);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!token) {
        setIsAuthLoading(false);
        return;
      }
      try {
        const [meRes, reelsRes, notifRes, notesRes, convosRes, storiesRes, sessionsRes, emailsRes, timeSpentRes, followRequestsRes, unfollowersRes] = await Promise.all([
          axios.get(`${API_BASE}/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE}/api/reels', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE}/api/notifications/recent-activity', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),
          axios.get(`${API_BASE}/api/notes', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),
          axios.get(`${API_BASE}/api/messages/conversations', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),
          axios.get(`${API_BASE}/api/stories', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),
          axios.get(`${API_BASE}/api/users/sessions', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),
          axios.get(`${API_BASE}/api/users/emails', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),
          axios.get(`${API_BASE}/api/users/time-spent', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: { dailyAverage: 0 } } })),
          axios.get(`${API_BASE}/api/users/follow-requests', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),
          axios.get(`${API_BASE}/api/users/unfollowers', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } }))
        ]);
        const user = meRes.data.user;
        setAuthUser(user);
        
        // Populate settings states
        setEditFullName(user.fullName || '');
        setEditUsername(user.username || '');
        setEditWebsite(user.website || '');
        setEditBio(user.bio || '');
        setIsProfessionalAccount(user.accountType === 'professional');
        setIsPrivateAccount(!!user.isPrivate);
        setShowActivityStatus(user.showActivityStatus !== false);
        setAllowStorySharing(user.allowStorySharing !== false);
        
        setDailyTimeLimit(user.dailyTimeLimit || 0);
        setBreakReminder(user.breakReminder || 0);
        setMutePushNotifications(user.mutePushNotifications || false);
        
        setRecentActivity(notifRes.data.data || []);
        setNotesList(notesRes.data.data || []);
        setConversationsList(convosRes.data.data || []);
        setLoginSessions(sessionsRes.data.data || []);
        setEmailsFromInsta(emailsRes.data.data || []);
        setTimeSpentToday(timeSpentRes.data.data?.dailyAverage || 0);
        setFollowRequests(followRequestsRes.data.data || []);
        setUnfollowersList(unfollowersRes.data.data || []);

        // Update retro states if present
        if (user.nowPlaying && user.nowPlaying.title) {
           setNowPlayingTrack(user.nowPlaying);
        }
        if (user.customStatus) {
           setCustomStatus(user.customStatus);
        }
        if (user.topFriends && Array.isArray(user.topFriends)) {
           setTopFriendsList(user.topFriends.map((f: any) => f.username || f));
        }
        
        const backendReels = reelsRes.data.data.map((r: any) => ({
          id: r._id,
          username: r.user.username,
          avatar: r.user.profilePic || `https://i.pravatar.cc/150?u=${r.user.username}`,
          image: r.videoUrl, 
          videoUrl: r.videoUrl,
          caption: r.caption,
          audio: r.audioTrackName || 'Original Audio',
          likes: r.likesCount || 0,
          isLiked: r.likes?.includes(user._id),
          commentsCount: r.commentsCount || 0,
          views: r.viewsCount || 0
        }));

        const backendPosts = reelsRes.data.data.map((r: any) => ({
          id: r._id,
          user: {
             username: r.user.username,
             avatar: r.user.profilePic || `https://i.pravatar.cc/150?u=${r.user.username}`
          },
          time: new Date(r.createdAt).toLocaleDateString(),
          contentImg: r.videoUrl,
          contentFileType: r.videoUrl?.match(/\.(mp4|webm|ogg)$/i) ? 'video' : 'image',
          likes: r.likesCount || r.likes?.length || 0,
          caption: r.caption,
          comments: []
        }));

        const backendStories = storiesRes.data.data.map((s: any) => ({
          name: s.user.username,
          image: s.mediaUrl,
          isOwnStory: s.user.username === user.username,
          viewers: s.viewers || [],
          stickers: []
        }));

        setFeedPosts(backendPosts);
        setReels(backendReels);
        
        const myStory = backendStories.find((s: any) => s.isOwnStory);
        if (myStory) {
          setOwnStory(myStory);
        }

        // Populate followers and following lists for modals
        if (user.followers) {
          setFollowersList(user.followers.map((f: any) => ({
            username: f.username,
            name: f.fullName,
            avatar: f.profilePic || `https://i.pravatar.cc/150?u=${f.username}`,
            isFollowing: user.following?.some((following: any) => following._id === f._id || following === f._id)
          })));
        }
        if (user.following) {
          setFollowingList(user.following.map((f: any) => ({
            username: f.username,
            name: f.fullName,
            avatar: f.profilePic || `https://i.pravatar.cc/150?u=${f.username}`,
            isFollowing: true
          })));
        }
        
        const otherStories = backendStories.filter((s: any) => !s.isOwnStory);
        if (otherStories.length > 0) {
          setStories(otherStories);
        }

      } catch (err) {
        console.error('Data fetch error', err);
        localStorage.removeItem('token');
        setToken(null);
        setAuthUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    };
    fetchInitialData();
  }, [token]);

  // Handle Login / Logout
  const handleLogin = (newToken: string, user: any) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setAuthUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setAuthUser(null);
  };

  const updateRetroProfileBackend = async (data: any) => {
    try {
      await axios.put(`${API_BASE}/api/users/retro-profile', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to update retro profile:', err);
    }
  };

  const showTemporaryToast = useCallback((message: string) => {
    setStoryToast(message);
    setTimeout(() => {
      setStoryToast(null);
    }, 2500);
  }, []);

  const handleAddNote = async () => {
    const text = window.prompt('What is on your mind? (Max 60 chars)');
    if (!text || text.trim() === '') return;
    try {
      const res = await axios.post(`${API_BASE}/api/notes', { text: text.trim() }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // The backend returns a non-populated user, so we manually build it for the UI
      const newNote = {
        ...res.data.data,
        user: { username: authUser?.username, profilePic: authUser?.profilePic }
      };
      setNotesList(prev => [newNote, ...prev.filter(n => n.user.username !== authUser?.username)]);
      showTemporaryToast('Note added!');
    } catch (err) {
      console.error(err);
      showTemporaryToast('Failed to add note');
    }
  };

  // Dynamic Content States
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<Array<{name: string, image: string, isOwnStory?: boolean, viewers?: Array<{name: string, timestamp: string}>, stickers?: any[]}>>([]);
  const [ownStory, setOwnStory] = useState<{ image: string; filter?: string; timestamp?: string; stickers?: any[] } | null>(null);

  const [reels, setReels] = useState<Array<{
    id: string;
    username: string;
    avatar: string;
    image: string;
    videoUrl?: string;
    caption: string;
    audio: string;
    likes: number;
    isLiked: boolean;
    commentsCount: number;
    views?: number;
    remixedFrom?: { videoUrl?: string; image?: string; username?: string } | null;
  }>>([]);
  const [activeReelIndex, setActiveReelIndex] = useState(0);

  // Creation State managers
  const [createTab, setCreateTab] = useState<'POST' | 'STORY' | 'REEL' | 'LIVE'>('POST');
  const [uploadedFile, setUploadedFile] = useState<{ url: string; type: 'image' | 'video', file?: File } | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'normal' | 'vintage' | 'bw' | 'warm' | 'cool'>('normal');
  const [captionText, setCaptionText] = useState('');
  const [locationText, setLocationText] = useState('');
  const [altText, setAltText] = useState('');
  const [hideLikes, setHideLikes] = useState(false);
  const [turnOffComments, setTurnOffComments] = useState(false);
  const [autoShareThreads, setAutoShareThreads] = useState(false);

  // New detailed story, reel & live creation states
  const [storyStickers, setStoryStickers] = useState<Array<{
    id: number;
    type: 'text' | 'location' | 'music' | 'poll' | 'countdown';
    text: string;
    color: string;
    bg: string;
    x: number; // percentage
    y: number; // percentage
    extra?: any; // e.g. poll options, countdown title, etc.
  }>>([]);
  const [addingStickerType, setAddingStickerType] = useState<'text' | 'location' | 'music' | 'poll' | 'countdown' | null>(null);
  const [pollVotes, setPollVotes] = useState<Record<number, 'yes' | 'no'>>({});
  const [tempStickerText, setTempStickerText] = useState('');
  const [tempStickerColor, setTempStickerColor] = useState('#ffffff');
  const [tempStickerBg, setTempStickerBg] = useState('#000000b0');
  const [tempPollOptions, setTempPollOptions] = useState({ yes: 'Yes', no: 'No' });
  const [tempCountdownDate, setTempCountdownDate] = useState('2026-12-31');

  // Reels extra states
  const [reelsSoundtrack, setReelsSoundtrack] = useState('Original Audio - retro_fan');
  const [isRemixAllowed, setIsRemixAllowed] = useState(true);
  const [isShareToFeed, setIsShareToFeed] = useState(true);

  // Live setup states
  const [liveTitle, setLiveTitle] = useState('');
  const [liveAudience, setLiveAudience] = useState<'public' | 'practice' | 'friends'>('public');
  const [liveFilter, setLiveFilter] = useState<'none' | 'vhs' | 'scanline' | 'sepia' | 'grain'>('none');
  const [livePinnedText, setLivePinnedText] = useState('');
  const [liveStats, setLiveStats] = useState<{ duration: number; maxViewers: number; commentsCount: number; followersGained: number } | null>(null);
  const [showLiveEndSummary, setShowLiveEndSummary] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Time Management Tracking
  const [sessionMinutes, setSessionMinutes] = useState(0);

  // Live Broadcast States
  const [isLiveBroadcasting, setIsLiveBroadcasting] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const [liveDuration, setLiveDuration] = useState(0);
  const [liveViewers, setLiveViewers] = useState(0);
  const [liveComments, setLiveComments] = useState<Array<{ id: number; username: string; text: string }>>([]);
  const [liveCommentInputText, setLiveCommentInputText] = useState('');
  const [liveLikesCount, setLiveLikesCount] = useState(0);
  const [liveFlyingHearts, setLiveFlyingHearts] = useState<Array<{id: number, left: number, scale: number, rotation: number, delay: number}>>([]);
  const [isShareReelOpen, setIsShareReelOpen] = useState(false);
  const [sharingReel, setSharingReel] = useState<any | null>(null);
  const [shareSearchQuery, setShareSearchQuery] = useState('');

  // Reel Comments Interactive States
  const [isReelCommentsOpen, setIsReelCommentsOpen] = useState(false);
  const [selectedReelForComments, setSelectedReelForComments] = useState<any | null>(null);
  const [reelCommentsList, setReelCommentsList] = useState<Record<number, Array<{ id: number; username: string; text: string; time: string }>>>({
    1: [
      { id: 1, username: 'kevin', text: 'Stunning analog grain in this! 📼', time: '2h' },
      { id: 2, username: 'doglover', text: 'So retro! Absolute masterpiece! 🎬', time: '1h' },
      { id: 3, username: 'sarah', text: 'Love the setup! 💛', time: '30m' }
    ],
    2: [
      { id: 1, username: 'sarah', text: 'Is this from 1985? Perfect loop 🚗', time: '3h' },
      { id: 2, username: 'mike99', text: 'Incredible mood and style!', time: '2h' }
    ]
  });
  const [newReelCommentText, setNewReelCommentText] = useState('');

  // Stories Interactive States
  const [likedStories, setLikedStories] = useState<Record<string, boolean>>({});
  const [storyComments, setStoryComments] = useState<Record<string, Array<{id: number, username: string, text: string, time: string}>>>({
    'https://images.unsplash.com/photo-1542931287-023b922fa89b?auto=format&fit=crop&q=80&w=800&h=1200': [
      { id: 1, username: 'sarah', text: 'Stunning capture! 🔥', time: '1h' },
      { id: 2, username: 'doglover', text: 'This looks so nostalgic', time: '45m' }
    ],
    'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800&h=1200': [
      { id: 1, username: 'kevin', text: 'Love the color grading on this!', time: '2h' }
    ]
  });
  const [flyingEmojis, setFlyingEmojis] = useState<Array<{id: number, emoji: string, left: number, scale: number, rotation: number, delay: number}>>([]);
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const [highlightProgress, setHighlightProgress] = useState(0);
  const [isHighlightPaused, setIsHighlightPaused] = useState(false);
  const [showStoryCommentsPanel, setShowStoryCommentsPanel] = useState(false);
  const [showStorySharePanel, setShowStorySharePanel] = useState(false);
  const [newStoryCommentText, setNewStoryCommentText] = useState('');
  const [storyReplyText, setStoryReplyText] = useState('');
  const [storyToast, setStoryToast] = useState<string | null>(null);
  const [showGiantHeart, setShowGiantHeart] = useState(false);

  // Reels extra engagement states
  const [savedReelIds, setSavedReelIds] = useState<string[]>([]);
  const [followingUsers, setFollowingUsers] = useState<string[]>([]);
  const [showReelGiantHeart, setShowReelGiantHeart] = useState(false);
  const [activeAudioDetail, setActiveAudioDetail] = useState<{ title: string; creator: string; count: string; reels: any[] } | null>(null);
  const [activeReelOptions, setActiveReelOptions] = useState<any | null>(null);
  const [remixingFromReel, setRemixingFromReel] = useState<any | null>(null);

  // Followers / Following & Top Friends States
  const followersCount = authUser?.followers?.length || 0;
  const followingCount = authUser?.following?.length || 0;
  const [activeFollowModal, setActiveFollowModal] = useState<'followers' | 'following' | null>(null);
  const [activeUserProfile, setActiveUserProfile] = useState<any | null>(null);
  const [followSearchQuery, setFollowSearchQuery] = useState('');

  const [followersList, setFollowersList] = useState<Array<{ username: string; name: string; avatar: string; isFollowing: boolean }>>([]);
  const [followingList, setFollowingList] = useState<Array<{ username: string; name: string; avatar: string; isFollowing: boolean }>>([]);

  // Top Friends States
  const [topFriendsList, setTopFriendsList] = useState<string[]>([]);
  const [showTopFriendsModal, setShowTopFriendsModal] = useState(false);
  const [customStatus, setCustomStatus] = useState('Feeling nostalgic');
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [followRequests, setFollowRequests] = useState<any[]>([]);
  const [unfollowersList, setUnfollowersList] = useState<any[]>([]);

  // Now Playing States
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [nowPlayingTrack, setNowPlayingTrack] = useState({
    title: 'Linkin Park - Numb',
    artist: 'Linkin Park',
    duration: '3:05'
  });
  const [nowPlayingProgress, setNowPlayingProgress] = useState(45); // in seconds
  const [showEditMusicModal, setShowEditMusicModal] = useState(false);
  const [customSongTitle, setCustomSongTitle] = useState('');
  const [customSongArtist, setCustomSongArtist] = useState('');

  // Global Search state
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (!globalSearchQuery || !token) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      axios.get(`http://localhost:5000/api/users/search?q=${globalSearchQuery.trim()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (res.data.success) {
          setSearchResults(res.data.data);
        }
      })
      .catch(console.error);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [globalSearchQuery, token]);

  // Player timer
  useEffect(() => {
    let interval: any = null;
    if (isMusicPlaying) {
      interval = setInterval(() => {
        setNowPlayingProgress((prev) => {
          if (prev >= 185) {
            return 0; // Loop at 3:05
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMusicPlaying]);

  // Screen Time Tracker
  useEffect(() => {
    if (!authUser || !token) return;

    // We increment active time every minute (60000 ms)
    const timer = setInterval(() => {
      setSessionMinutes((prev) => {
        const nextMins = prev + 1;
        
        // Check Break Reminder
        if (authUser.breakReminder && authUser.breakReminder > 0) {
          if (nextMins % authUser.breakReminder === 0) {
            showTemporaryToast(`Time for a break! You've been active for ${nextMins} minutes.`);
          }
        }

        // Check Daily Limit
        if (authUser.dailyTimeLimit && authUser.dailyTimeLimit > 0) {
          if (nextMins === authUser.dailyTimeLimit) {
            showTemporaryToast(`Daily limit reached! You've spent ${nextMins} minutes on Instagram today.`);
          }
        }
        
        return nextMins;
      });
    }, 60000);

    return () => clearInterval(timer);
  }, [authUser, token]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };
  
  // Profile Navigation & Highlights States
  const [profileTab, setProfileTab] = useState<'POSTS' | 'REELS' | 'TAGGED' | 'SAVED'>('POSTS');
  const [profileHighlights, setProfileHighlights] = useState<Array<{
    id: string;
    name: string;
    img: string;
    stories: Array<{
      name: string;
      image: string;
      stickers?: any[];
    }>;
  }>>([
    {
      id: 'highlight-travel',
      name: 'Travel ✈️',
      img: 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?auto=format&fit=crop&q=80&w=150&h=150',
      stories: [
        { name: 'Travel ✈️', image: 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?auto=format&fit=crop&q=80&w=800&h=1200', stickers: [{ id: 101, type: 'location', text: 'Kyoto, Japan ⛩️', x: 50, y: 35 }] },
        { name: 'Travel ✈️', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800&h=1200', stickers: [{ id: 102, type: 'text', text: 'Dreaming of the beach 🏝️', color: '#000', bg: '#fef08a', x: 50, y: 50 }] }
      ]
    },
    {
      id: 'highlight-vintage',
      name: 'Vintage 📷',
      img: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=150&h=150',
      stories: [
        { name: 'Vintage 📷', image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=800&h=1200', stickers: [{ id: 103, type: 'text', text: 'Retro Arcade Night 🕹️', color: '#fff', bg: '#a855f7', x: 50, y: 40 }] }
      ]
    },
    {
      id: 'highlight-coffee',
      name: 'Coffee ☕',
      img: 'https://images.unsplash.com/photo-1497215848529-f19b67160759?auto=format&fit=crop&q=80&w=150&h=150',
      stories: [
        { name: 'Coffee ☕', image: 'https://images.unsplash.com/photo-1497215848529-f19b67160759?auto=format&fit=crop&q=80&w=800&h=1200', stickers: [{ id: 104, type: 'music', text: 'Lo-Fi Chill Beats ☕🎧', x: 50, y: 30 }] }
      ]
    }
  ]);

  const [activeHighlight, setActiveHighlight] = useState<{
    id: string;
    name: string;
    stories: Array<{
      name: string;
      image: string;
      stickers?: any[];
    }>;
    index: number;
  } | null>(null);
  const [isCreateHighlightOpen, setIsCreateHighlightOpen] = useState(false);
  const [newHighlightName, setNewHighlightName] = useState('');
  const [newHighlightCover, setNewHighlightCover] = useState('https://images.unsplash.com/photo-1542931287-023b922fa89b?auto=format&fit=crop&q=80&w=150&h=150');
  const [selectedStoriesForHighlight, setSelectedStoriesForHighlight] = useState<string[]>([]);
  const [selectedProfilePost, setSelectedProfilePost] = useState<any | null>(null);
  
  // Real DM States
  const [activeChatUser, setActiveChatUser] = useState<any>(null);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [activeMessages, setActiveMessages] = useState<any[]>([]);
  const [messagesInputText, setMessagesInputText] = useState('');
  const [notesList, setNotesList] = useState<any[]>([]);
  const [conversationsList, setConversationsList] = useState<any[]>([]);
  const [socket, setSocket] = useState<any>(null);

  // WebRTC Call States
  const [callState, setCallState] = useState<'idle' | 'ringing' | 'calling' | 'in-call'>('idle');
  const [incomingCallData, setIncomingCallData] = useState<any>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const cleanupCall = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setCallState('idle');
    setIncomingCallData(null);
  }, [localStream]);

  // Initiate a call
  const initiateCall = async (isVideo: boolean) => {
    if (!activeChatUser) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      
      setCallState('calling');

      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('iceCandidate', { to: activeChatUser._id, candidate: event.candidate });
        }
      };

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('callUser', {
        userToCall: activeChatUser._id,
        signalData: offer,
        from: authUser?._id,
        name: authUser?.username
      });
    } catch (err) {
      console.error('Failed to get local stream', err);
      showTemporaryToast('Failed to access camera/microphone. Check permissions.');
      cleanupCall();
    }
  };

  // Answer a call
  const answerCall = async () => {
    if (!incomingCallData) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      
      setCallState('in-call');
      setActiveChatUser({ _id: incomingCallData.from, username: incomingCallData.name });

      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('iceCandidate', { to: incomingCallData.from, candidate: event.candidate });
        }
      };

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCallData.signal));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('answerCall', {
        to: incomingCallData.from,
        signal: answer
      });
    } catch (err) {
      console.error('Failed to answer call', err);
      showTemporaryToast('Failed to access camera/microphone.');
      cleanupCall();
    }
  };

  const declineCall = () => {
    if (incomingCallData && socket) {
      socket.emit('endCall', { to: incomingCallData.from });
    }
    cleanupCall();
  };

  const endCall = () => {
    if (activeChatUser && socket) {
      socket.emit('endCall', { to: activeChatUser._id });
    } else if (incomingCallData && socket) {
      socket.emit('endCall', { to: incomingCallData.from });
    }
    cleanupCall();
  };

  useEffect(() => {
    if (authUser && token && !socket) {
      const newSocket = io(`${API_BASE}`);
      
      newSocket.on('connect', () => {
        newSocket.emit('addUser', authUser._id);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [authUser, token, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: any) => {
      // Append if it belongs to active conversation
      if (activeConversation && msg.conversationId === activeConversation._id) {
        setActiveMessages(prev => [...prev, msg]);
      }
      
      // Update conversationsList left panel
      setConversationsList(prev => {
        const idx = prev.findIndex(c => c._id === msg.conversationId);
        if (idx !== -1) {
          const newList = [...prev];
          newList[idx] = { ...newList[idx], latestMessage: msg };
          return newList;
        } else {
          // If we don't have this conversation in our list, refresh the whole list
          axios.get(`${API_BASE}/api/messages/conversations', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => setConversationsList(res.data.data || []))
            .catch(err => console.error(err));
          return prev;
        }
      });
    };

    const handleCallUser = (data: any) => {
      setIncomingCallData(data);
      setCallState('ringing');
    };

    const handleCallAccepted = async (signal: any) => {
      setCallState('in-call');
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
      }
    };

    const handleIceCandidate = async (candidate: any) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
      }
    };

    const handleEndCall = () => {
      cleanupCall();
      showTemporaryToast('Call ended');
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('callUser', handleCallUser);
    socket.on('callAccepted', handleCallAccepted);
    socket.on('iceCandidate', handleIceCandidate);
    socket.on('endCall', handleEndCall);
    
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('callUser', handleCallUser);
      socket.off('callAccepted', handleCallAccepted);
      socket.off('iceCandidate', handleIceCandidate);
      socket.off('endCall', handleEndCall);
    };
  }, [socket, activeConversation, token, cleanupCall, showTemporaryToast]);
  
  const handleSelectConversation = async (conv: any) => {
    const otherUser = conv.participants.find((p: any) => p.username !== authUser?.username) || conv.participants[0];
    setActiveChatUser(otherUser);
    setActiveConversation(conv);
    try {
      const res = await axios.get(`http://localhost:5000/api/messages/${conv._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveMessages(res.data.data || []);
    } catch (err) {
      console.error(err);
      setActiveMessages([]);
    }
  };

  const handleSelectConversationByUser = async (userObj: any) => {
    setActiveChatUser(userObj);
    const existingConv = conversationsList.find(c => c.participants.some((p:any) => p._id === userObj._id));
    if (existingConv) {
      handleSelectConversation(existingConv);
    } else {
      setActiveConversation(null);
      setActiveMessages([]);
    }
  };

  const handleSendDirectMessage = async (text: string) => {
    if (!text.trim() || !activeChatUser) return;
    try {
      const res = await axios.post(`${API_BASE}/api/messages', {
        receiverId: activeChatUser._id,
        text: text.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const newMsg = res.data.data;
      setActiveMessages(prev => [...prev, newMsg]);
      
      if (socket) {
        socket.emit('sendMessage', {
          senderId: authUser?._id,
          receiverId: activeChatUser._id,
          text: text.trim(),
          _id: newMsg._id,
          createdAt: newMsg.createdAt
        });
      }
    } catch (err) {
      console.error(err);
      showTemporaryToast('Failed to send message');
    }
  };



  const [storyProgress, setStoryProgress] = useState(0);

  const handleCloseStory = useCallback(() => {
    setActiveStory(null);
    setIsStoryPaused(false);
    setShowStoryCommentsPanel(false);
    setShowStorySharePanel(false);
    setNewStoryCommentText('');
    setStoryReplyText('');
    setFlyingEmojis([]);
    setShowGiantHeart(false);
    setStoryProgress(0);
  }, []);

  useEffect(() => {
    if (!activeStory) {
      setStoryProgress(0);
      return;
    }
    if (activeStory.isOwnStory) {
      setStoryProgress(100);
      return;
    }
    if (isStoryPaused) return;

    const interval = setInterval(() => {
      setStoryProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          handleCloseStory();
          return 100;
        }
        return prev + 1;
      });
    }, 50); // 50 * 100 = 5000ms

    return () => clearInterval(interval);
  }, [activeStory, isStoryPaused, handleCloseStory]);

  // Auto-advance Highlight Story slides
  useEffect(() => {
    if (!activeHighlight) {
      setHighlightProgress(0);
      return;
    }
    if (isHighlightPaused) return;

    const interval = setInterval(() => {
      setHighlightProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setActiveHighlight(current => {
            if (!current) return null;
            if (current.index + 1 < current.stories.length) {
              return { ...current, index: current.index + 1 };
            } else {
              return null;
            }
          });
          return 0;
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [activeHighlight, isHighlightPaused]);

  // Increment Reel views count dynamically when a reel is shown
  useEffect(() => {
    if (activeView === 'Reels' && reels[activeReelIndex]) {
      const activeId = reels[activeReelIndex].id;
      setReels(prev => prev.map(r => {
        if (r.id === activeId) {
          return {
            ...r,
            views: (r.views || Math.floor(Math.random() * 5000) + 1200) + 1
          };
        }
        return r;
      }));
    }
  }, [activeReelIndex, activeView]);

  const triggerFlyingEmojis = useCallback((emoji: string) => {
    const newEmojis = Array.from({ length: 12 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      emoji,
      left: Math.random() * 80 + 10,
      scale: Math.random() * 0.5 + 0.8,
      rotation: Math.random() * 60 - 30,
      delay: Math.random() * 0.4
    }));
    setFlyingEmojis(prev => [...prev, ...newEmojis]);
    
    setTimeout(() => {
      setFlyingEmojis(prev => prev.filter(fe => !newEmojis.some(ne => ne.id === fe.id)));
    }, 3000);
  }, []);

  const handleSendMessage = useCallback(async (user: string, text: string, options?: { isStoryReply?: boolean, storyImg?: string, emojiReaction?: string }) => {
    try {
      const payload = {
        receiverUsername: user,
        text,
        fileUrl: options?.storyImg || '',
      };
      
      const res = await axios.post(`${API_BASE}/api/messages', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newMsg = res.data.data;
      
      // Update local state if this is the active conversation
      if (activeConversation && newMsg.conversationId === activeConversation._id) {
         setActiveMessages(prev => [...prev, newMsg]);
      }
      
      if (socket) {
        socket.emit('sendMessage', {
          senderId: authUser?._id,
          receiverId: newMsg.sender, // The backend gets finalReceiverId but we don't have it easily. We can skip emitting here since it's a bit tricky to get receiverId without backend response. Actually wait, if we send it to backend, the backend emits it!
        });
      }
    } catch (err) {
      console.error('Failed to send story reaction/reply:', err);
    }
  }, [authUser, token, activeConversation, socket]);

  const handleStoryReaction = useCallback((emoji: string) => {
    if (!activeStory) return;
    triggerFlyingEmojis(emoji);
    setIsStoryPaused(true);
    handleSendMessage(activeStory.name, `Reacted ${emoji} to your story`, { emojiReaction: emoji, storyImg: activeStory.image });
    showTemporaryToast(`Reaction sent to ${activeStory.name}!`);
  }, [activeStory, triggerFlyingEmojis, handleSendMessage, showTemporaryToast]);

  const handleStoryLike = useCallback(() => {
    if (!activeStory) return;
    const isLiked = !likedStories[activeStory.image];
    setLikedStories(prev => ({
      ...prev,
      [activeStory.image]: isLiked
    }));
    
    if (isLiked) {
      triggerFlyingEmojis('❤️');
      handleSendMessage(activeStory.name, "Liked your story", { storyImg: activeStory.image });
      showTemporaryToast("Liked!");
    } else {
      showTemporaryToast("Unliked");
    }
  }, [activeStory, likedStories, triggerFlyingEmojis, handleSendMessage, showTemporaryToast]);

  // Preset list for easy mock selection
  const VINTAGE_PRESETS = [
    { name: 'Vintage Camera', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=800&h=800', type: 'image' as const },
    { name: 'Retro Car', url: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800&h=800', type: 'image' as const },
    { name: 'City Sunset', url: 'https://images.unsplash.com/photo-1542931287-023b922fa89b?auto=format&fit=crop&q=80&w=800&h=800', type: 'image' as const },
    { name: 'Polaroid Style', url: 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?auto=format&fit=crop&q=80&w=800&h=800', type: 'image' as const },
    { name: 'Cozy Café', url: 'https://images.unsplash.com/photo-1497215848529-f19b67160759?auto=format&fit=crop&q=80&w=800&h=800', type: 'image' as const },
    { name: 'Vintage Cassette', url: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&q=80&w=800&h=800', type: 'image' as const },
  ];

  // Map of filters to actual CSS values
  const FILTER_MAP = {
    normal: 'none',
    vintage: 'sepia(0.65) contrast(1.15) saturate(1.15)',
    bw: 'grayscale(1) contrast(1.25) brightness(1.05)',
    warm: 'sepia(0.25) saturate(1.4) contrast(1.1) brightness(1.05)',
    cool: 'contrast(1.1) saturate(1.15) hue-rotate(180deg) brightness(0.95)',
  };

  // Click to trigger input
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle uploaded file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type.startsWith('video/') ? 'video' : 'image';
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedFile({
          url: event.target.result as string,
          type: fileType,
          file: file,
        });
        showTemporaryToast("Media loaded successfully!");
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Live Streaming
  const toggleCamera = async () => {
    if (isCameraActive) {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      setIsCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 480, height: 480, facingMode: 'user' },
          audio: false
        });
        setCameraStream(stream);
        setIsCameraActive(true);
        setTimeout(() => {
          if (liveVideoRef.current) {
            liveVideoRef.current.srcObject = stream;
          }
        }, 100);
      } catch (err) {
        console.warn("Camera permission denied, using vintage animated color-bars stream:", err);
        showTemporaryToast("Camera blocked or unavailable. Falling back to vintage mock stream.");
        setIsCameraActive(false);
      }
    }
  };

  const handleStartLive = () => {
    setIsLiveBroadcasting(true);
    setLiveDuration(0);
    setLiveLikesCount(0);
    setLiveFlyingHearts([]);
    setLiveViewers(1 + Math.floor(Math.random() * 5));
    setLiveComments([
      { id: Date.now(), username: 'kevin', text: 'Started watching' },
    ]);
  };

  // Keep camera stream assigned to active video element
  useEffect(() => {
    if (isCameraActive && cameraStream && liveVideoRef.current) {
      liveVideoRef.current.srcObject = cameraStream;
    }
  }, [isCameraActive, cameraStream, isLiveBroadcasting]);

  const handleEndLive = () => {
    setIsLiveBroadcasting(false);
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
    showTemporaryToast("Live broadcast completed!");
  };

  // Dynamic Live comments simulation
  useEffect(() => {
    if (!isLiveBroadcasting) return;

    const SIMULATED_LIVE_COMMENTS = [
      "kevin: Awesome retro filter! 🎞️",
      "doglover: Wow this is super nostalgic!",
      "sarah: Live from 1995! Love it ❤️",
      "vintage_cars: Incredible car in the background!",
      "mike99: Very cool vintage vibes!",
      "retro_fan: Is that a real camera broadcast? 📹",
      "analog_vibes: Vintage setup looks incredible!",
      "sunset_seeker: Sunset aesthetic is perfect!",
      "pixel_art: 👾 nostalgic grid overlay!",
      "coffee_snob: Watching this with hot coffee!",
      "bookworm: Hey from Sunnyvale!",
      "nature_geek: That overlay is so detailed!"
    ];

    const timer = setInterval(() => {
      setLiveDuration(prev => prev + 1);
      
      // Randomly fluctuation of viewers
      setLiveViewers(prev => {
        const diff = Math.random() > 0.4 ? 1 : -1;
        const next = prev + diff;
        return next < 2 ? 2 : next > 45 ? 45 : next;
      });

      // Randomly push comment
      if (Math.random() > 0.6) {
        const randComment = SIMULATED_LIVE_COMMENTS[Math.floor(Math.random() * SIMULATED_LIVE_COMMENTS.length)];
        const [username, ...msgParts] = randComment.split(': ');
        const text = msgParts.join(': ');
        setLiveComments(prev => [
          ...prev,
          { id: Date.now() + Math.random(), username, text }
        ]);
      }

      // Randomly simulate viewers sending likes and hearts
      if (Math.random() > 0.4) {
        setLiveLikesCount(prev => prev + Math.floor(Math.random() * 3) + 1);
        const burstCount = Math.floor(Math.random() * 2) + 1;
        const newHearts = Array.from({ length: burstCount }).map((_, i) => ({
          id: Date.now() + i + Math.random(),
          left: Math.random() * 40 + 50, // cluster on the right
          scale: Math.random() * 0.4 + 0.7,
          rotation: Math.random() * 40 - 20,
          delay: Math.random() * 0.2
        }));
        setLiveFlyingHearts(prev => [...prev, ...newHearts]);
        setTimeout(() => {
          setLiveFlyingHearts(prev => prev.filter(h => !newHearts.some(nh => nh.id === h.id)));
        }, 2000);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isLiveBroadcasting]);

  // Handle Share/Publish
  const handlePublishContent = async () => {
    if (!uploadedFile) {
      showTemporaryToast("Please upload a photo/video or select a vintage preset!");
      return;
    }

    try {
      let finalUrl = uploadedFile.url;
      
      // If we have a real file object (not a preset link), upload it to the server
      if (uploadedFile.file) {
        const formData = new FormData();
        formData.append('file', uploadedFile.file);
        
        const uploadRes = await axios.post(`${API_BASE}/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
        finalUrl = uploadRes.data.data.url;
      }

      if (createTab === 'STORY') {
        const storyData = { mediaUrl: finalUrl };
        const res = await axios.post(`${API_BASE}/api/stories', storyData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showTemporaryToast(`Story shared successfully!`);
        
        const newStory = {
          name: authUser?.username,
          image: finalUrl,
          isOwnStory: true,
          viewers: [],
          stickers: storyStickers
        };
        
        setOwnStory(newStory);
        setActiveView('Home');
      } else {
        const isRemix = createTab === 'REEL' && !!remixingFromReel;
        const formattedCaption = isRemix 
          ? `Remix with @${remixingFromReel.username} 🎬 ${captionText}`
          : captionText;

        const postData = {
          videoUrl: finalUrl,
          caption: formattedCaption || '',
          audioTrackName: createTab === 'REEL' ? reelsSoundtrack : undefined,
          location: locationText || undefined,
          altText: altText || undefined,
          hideLikeAndViewCounts: hideLikes,
          turnOffCommenting: turnOffComments
        };

        const res = await axios.post(`${API_BASE}/api/reels', postData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        showTemporaryToast(`${createTab} shared successfully!`);
        
        const newBackendPost = res.data.data;
        
        // Map to frontend expected formats
        const mappedPost = {
          id: newBackendPost._id,
          user: {
             username: authUser?.username,
             avatar: authUser?.profilePic || `https://i.pravatar.cc/150?u=${authUser?.username}`
          },
          time: 'Just now',
          contentImg: newBackendPost.videoUrl,
          contentFileType: newBackendPost.videoUrl?.match(/\.(mp4|webm|ogg)$/i) ? 'video' : 'image',
          likes: 0,
          caption: newBackendPost.caption,
          comments: []
        };

        if (createTab === 'POST') {
          setFeedPosts(prev => [mappedPost, ...prev]);
          setActiveView('Home');
        } else if (createTab === 'REEL') {
          setReels(prev => [{
            id: newBackendPost._id,
            username: authUser?.username,
            avatar: authUser?.profilePic || `https://i.pravatar.cc/150?u=${authUser?.username}`,
            image: newBackendPost.videoUrl,
            videoUrl: newBackendPost.videoUrl,
            caption: newBackendPost.caption,
            audio: newBackendPost.audioTrackName || 'Original Audio',
            likes: 0,
            isLiked: false,
            commentsCount: 0,
            views: 1
          }, ...prev]);
          setActiveReelIndex(0);
          setActiveView('Reels');
        }
      }
      
      // Reset inputs
      setUploadedFile(null);
      setCaptionText('');
      setLocationText('');
      setAltText('');
      setRemixingFromReel(null);
      
    } catch (err) {
      console.error('Publish error:', err);
      showTemporaryToast('Failed to publish content.');
    }
  };

  const handleDoubleTap = useCallback(() => {
    if (!activeStory || activeStory.isOwnStory) return;
    if (!likedStories[activeStory.image]) {
      handleStoryLike();
    }
    setShowGiantHeart(true);
    setTimeout(() => {
      setShowGiantHeart(false);
    }, 800);
  }, [activeStory, likedStories, handleStoryLike]);

  const handleStoryReplySubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStory || !storyReplyText.trim()) return;
    handleSendMessage(activeStory.name, storyReplyText, { isStoryReply: true, storyImg: activeStory.image });
    showTemporaryToast(`Reply sent to ${activeStory.name}!`);
    setStoryReplyText('');
    setIsStoryPaused(false);
  }, [activeStory, storyReplyText, handleSendMessage, showTemporaryToast]);

  const handleStoryCommentSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStory || !newStoryCommentText.trim()) return;
    const newComment = {
      id: Date.now() + Math.random(),
      username: authUser?.username || 'user',
      text: newStoryCommentText,
      time: 'Just now'
    };
    setStoryComments(prev => ({
      ...prev,
      [activeStory.image]: [...(prev[activeStory.image] || []), newComment]
    }));
    setNewStoryCommentText('');
    showTemporaryToast("Comment posted!");
  }, [activeStory, newStoryCommentText, showTemporaryToast]);

  const toggleReelLikeAPI = async (reelId: string) => {
    try {
      await axios.put(`http://localhost:5000/api/reels/${reelId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Like failed', err);
    }
  };

  const handleReelDoubleTap = useCallback((reelId: string) => {
    setReels(prev => prev.map(r => {
      if (r.id === reelId) {
        return {
          ...r,
          isLiked: true,
          likes: r.isLiked ? r.likes : r.likes + 1
        };
      }
      return r;
    }));
    toggleReelLikeAPI(reelId);
    setShowReelGiantHeart(true);
    setTimeout(() => {
      setShowReelGiantHeart(false);
    }, 800);
    showTemporaryToast("Liked! ❤️");
  }, [showTemporaryToast, token]);

  const handleOpenAudioDetails = useCallback((audioName: string) => {
    const matchingReels = reels.filter(r => r.audio === audioName);
    const count = matchingReels.length;
    setActiveAudioDetail({
      title: audioName,
      creator: audioName.includes('-') ? audioName.split('-')[1].trim() : 'Unknown Creator',
      count: `${count} ${count === 1 ? 'Reel' : 'Reels'}`,
      reels: matchingReels
    });
  }, [reels]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDraggingLeft) {
       let newWidth = e.clientX;
       if (newWidth < 150) newWidth = 150;
       if (newWidth > 400) newWidth = 400;
       setLeftWidth(newWidth);
    } else if (isDraggingRight) {
       let newWidth = window.innerWidth - e.clientX;
       if (newWidth < 200) newWidth = 200;
       if (newWidth > 500) newWidth = 500;
       setRightWidth(newWidth);
    }
  }, [isDraggingLeft, isDraggingRight]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingLeft(false);
    setIsDraggingRight(false);
  }, []);

  useEffect(() => {
    if (isDraggingLeft || isDraggingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDraggingLeft, isDraggingRight, handleMouseMove, handleMouseUp]);

  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center vintage-bg font-sans">Loading...</div>;
  }

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  const renderCallOverlay = () => {
    if (callState === 'idle') return null;

    return (
      <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center text-white">
        {callState === 'ringing' && incomingCallData && (
          <div className="flex flex-col items-center gap-6 animate-pulse">
            <div className="w-24 h-24 rounded-full bg-[#333] border-4 border-white flex items-center justify-center text-[40px]">
              👤
            </div>
            <div className="text-xl font-bold">{incomingCallData.name} is calling...</div>
            <div className="flex gap-8">
              <button onClick={answerCall} className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-[24px] cursor-pointer">📞</button>
              <button onClick={declineCall} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-[24px] cursor-pointer">☎️</button>
            </div>
          </div>
        )}
        
        {callState === 'calling' && (
          <div className="flex flex-col items-center gap-6">
            <div className="text-xl font-bold animate-pulse">Calling {activeChatUser?.username}...</div>
            <video ref={localVideoRef} autoPlay playsInline muted className="w-64 h-48 bg-[#222] rounded-lg border-2 border-[#555] object-cover" />
            <button onClick={endCall} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-[24px] cursor-pointer mt-4">☎️</button>
          </div>
        )}

        {callState === 'in-call' && (
          <div className="flex flex-col items-center w-full max-w-4xl h-full p-8 relative">
            <div className="text-xl font-bold mb-4 bg-black/50 px-4 py-2 rounded-full absolute top-4 z-10">In call with {activeChatUser?.username}</div>
            <div className="flex-1 w-full flex flex-col md:flex-row gap-4 justify-center items-center relative">
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full max-h-[70vh] bg-[#222] rounded-lg border border-[#444] object-contain shadow-2xl" />
              <video ref={localVideoRef} autoPlay playsInline muted className="absolute bottom-8 right-8 w-48 h-36 bg-black rounded-lg border-2 border-white object-cover shadow-xl" />
            </div>
            <div className="mt-8 flex gap-6">
              <button onClick={endCall} className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-[24px] cursor-pointer">☎️</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`h-screen overflow-hidden vintage-bg font-sans flex flex-col ${isDarkMode ? 'dark-mode' : ''}`}>
      {renderCallOverlay()}
      {/* Header */}
      <header className="retro-header min-h-[44px] shrink-0 w-full z-50 shadow-md">
        <div className="w-full h-full flex flex-wrap items-center justify-between px-4 py-1 gap-2">
          <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => setActiveView('Home')}>
            <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded drop-shadow-md border border-[#1a3750]" />
            <div className="w-[1px] h-[22px] bg-[#1a3750] shadow-[1px_0_0_rgba(255,255,255,0.2)] ml-1 mr-2" />
            <h1 className="retro-title text-white text-[32px] tracking-wide mt-2">Instagram</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div onClick={() => setActiveView('Search')} className="cursor-pointer hidden md:flex items-center bg-[#254f73] px-2 py-0.5 rounded-[3px] border border-[#1a3750] shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] hover:bg-[#2c5c85]">
              <span className="text-[#a0c3d9] text-[12px] font-bold">Search</span>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <button 
                onClick={handleLogout}
                className="retro-blue-button px-2 py-1 text-[11px] font-bold shadow-sm hidden sm:block"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full flex-1 flex overflow-hidden bg-[#fff]">
        {/* Left Sidebar (Navigation) */}
        <div style={{ width: leftWidth }} className="hidden lg:flex flex-col shrink-0 border-r border-[#999] bg-[#f0f0f0] overflow-y-auto">
          <div className="vintage-panel border-0 border-b border-[#999]">
             <div className="px-3 py-2 border-b border-[#ccc] bg-[#e0e0e0] font-bold text-[12px] text-[#333]">
               Main Menu
             </div>
             <div className="p-2 flex flex-col text-[12px]">
               <button onClick={() => setActiveView('Home')} className={`vintage-link flex items-center gap-2 px-2 py-1.5 border border-transparent hover:border-[#ccc] hover:shadow-sm ${activeView === 'Home' ? 'bg-[#ddd] font-bold' : 'hover:bg-[#eeeeee]'}`}><span className="w-4 text-center grayscale opacity-80">🏠</span> Home</button>
               <button onClick={() => setActiveView('Search')} className={`vintage-link flex items-center gap-2 px-2 py-1.5 border border-transparent hover:border-[#ccc] hover:shadow-sm ${activeView === 'Search' ? 'bg-[#ddd] font-bold' : 'hover:bg-[#eeeeee]'}`}><span className="w-4 text-center grayscale opacity-80">🔍</span> Search</button>
               <button onClick={() => setActiveView('Explore')} className={`vintage-link flex items-center gap-2 px-2 py-1.5 border border-transparent hover:border-[#ccc] hover:shadow-sm ${activeView === 'Explore' ? 'bg-[#ddd] font-bold' : 'hover:bg-[#eeeeee]'}`}><span className="w-4 text-center grayscale opacity-80">🧭</span> Explore</button>
               <button onClick={() => setActiveView('Reels')} className={`vintage-link flex items-center gap-2 px-2 py-1.5 border border-transparent hover:border-[#ccc] hover:shadow-sm ${activeView === 'Reels' ? 'bg-[#ddd] font-bold' : 'hover:bg-[#eeeeee]'}`}><span className="w-4 text-center grayscale opacity-80">🎞️</span> Reels</button>
               <button onClick={() => setActiveView('Messages')} className={`vintage-link flex items-center gap-2 px-2 py-1.5 border border-transparent hover:border-[#ccc] hover:shadow-sm ${activeView === 'Messages' ? 'bg-[#ddd] font-bold' : 'hover:bg-[#eeeeee]'}`}><span className="w-4 text-center grayscale opacity-80">✉️</span> Messages</button>
               <button onClick={() => setActiveView('Notifications')} className={`vintage-link flex items-center gap-2 px-2 py-1.5 border border-transparent hover:border-[#ccc] hover:shadow-sm ${activeView === 'Notifications' ? 'bg-[#ddd] font-bold' : 'hover:bg-[#eeeeee]'}`}><span className="w-4 text-center grayscale opacity-80">❤️</span> Notifications</button>
               <button onClick={() => setActiveView('Create')} className={`vintage-link flex items-center gap-2 px-2 py-1.5 border border-transparent hover:border-[#ccc] hover:shadow-sm ${activeView === 'Create' ? 'bg-[#ddd] font-bold' : 'hover:bg-[#eeeeee]'}`}><span className="w-4 text-center grayscale opacity-80">➕</span> Create</button>
               <button onClick={() => setActiveView('Profile')} className={`vintage-link flex items-center gap-2 px-2 py-1.5 border border-transparent hover:border-[#ccc] hover:shadow-sm ${activeView === 'Profile' ? 'bg-[#ddd] font-bold' : 'hover:bg-[#eeeeee]'}`}><span className="w-4 text-center grayscale opacity-80">👤</span> Profile</button>
             </div>
          </div>
          
          <div className="vintage-panel border-0 border-b border-[#999]">
             <div className="px-3 py-2 border-b border-[#ccc] bg-[#e0e0e0] font-bold text-[12px] text-[#333]">
               Options
             </div>
             <div className="p-2 flex flex-col text-[12px]">
               <button onClick={() => setActiveView('Settings')} className={`vintage-link flex items-center gap-2 px-2 py-1.5 border border-transparent hover:border-[#ccc] hover:shadow-sm ${activeView === 'Settings' ? 'bg-[#ddd] font-bold' : 'hover:bg-[#eeeeee]'}`}><span className="w-4 text-center grayscale opacity-80">⚙️</span> Settings</button>
               <button onClick={() => setActiveView('More')} className={`vintage-link flex items-center gap-2 px-2 py-1.5 border border-transparent hover:border-[#ccc] hover:shadow-sm ${activeView === 'More' ? 'bg-[#ddd] font-bold' : 'hover:bg-[#eeeeee]'}`}><span className="w-4 text-center grayscale opacity-80">🍔</span> More</button>
             </div>
          </div>
        </div>
        
        {/* Left Resizer */}
        <div 
          className="w-1 cursor-col-resize bg-[#d4d0c8] hover:bg-[#999] shrink-0 border-r border-[#999] hidden lg:block"
          onMouseDown={() => setIsDraggingLeft(true)}
        />

        {/* Main Content Column */}
        <div className="flex-1 flex flex-col overflow-y-auto vintage-bg p-4 shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]">
          {activeView === 'Home' && (
            <div className="max-w-[600px] mx-auto w-full">
              {/* Status Section */}
              <div className="w-full bg-white border border-[#dbdbdb] rounded-[8px] mb-6 overflow-x-auto overflow-y-hidden flex items-center flex-nowrap gap-5 py-4 px-6 shadow-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-h-[145px]">
                <div 
                  className="flex flex-col items-center gap-2 cursor-pointer shrink-0"
                  onClick={() => {
                    if (ownStory) {
                      setActiveStory({
                        name: 'Your Story', 
                        image: ownStory.image, 
                        isOwnStory: true, 
                        stickers: ownStory.stickers,
                        viewers: [
                          {name: 'kevin', timestamp: 'Just now'}, 
                          {name: 'doglover', timestamp: '1m ago'}
                        ]
                      });
                    } else {
                      setCreateTab('STORY');
                      setActiveView('Create');
                    }
                  }}
                >
                  <div className={`w-[82px] h-[82px] rounded-full p-[2px] relative bg-white shrink-0 ${ownStory ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500' : 'border border-[#dbdbdb]'}`}>
                    <div className="w-full h-full rounded-full bg-white p-[2px]">
                      <img src={authUser?.profilePic || `https://i.pravatar.cc/150?u=${authUser?.username || 'user'}`} className="w-full h-full rounded-full object-cover" alt="You" />
                    </div>
                    {!ownStory && (
                      <div className="absolute bottom-0 right-0 bg-[#0095f6] text-white border-2 border-white rounded-full w-[24px] h-[24px] flex items-center justify-center text-[18px] leading-none pb-[2px]">
                        +
                      </div>
                    )}
                  </div>
                  <span className="text-[12px] text-gray-500 mt-1">Your Story</span>
                </div>
                {stories.map((s, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 cursor-pointer shrink-0" onClick={() => setActiveStory(s)}>
                    <div className="w-[82px] h-[82px] rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[2px] shrink-0">
                      <div className="w-full h-full rounded-full bg-white p-[2px]">
                        <img src={`https://i.pravatar.cc/150?u=${s.name}`} className="w-full h-full rounded-full object-cover" alt={s.name} />
                      </div>
                    </div>
                    <span className="text-[12px] text-gray-800 mt-1 truncate max-w-[80px] text-center">{s.name}</span>
                  </div>
                ))}
              </div>
              
              <Feed 
                posts={feedPosts} 
                onUserClick={(username) => {
                  setActiveUserProfile({
                    username,
                    name: username === 'kevin' ? 'Kevin O.' : username === 'doglover' ? 'Dog Lover' : username === 'sarah' ? 'Sarah Connor' : username === 'vintage_cars' ? 'Vintage Cars' : username === 'mike99' ? 'Michael Scott' : username === 'photofan' ? 'Photo Fan' : username === 'coolkid' ? 'Cool Kid' : username === 'jessica' ? 'Jessica Day' : username,
                    avatar: `https://i.pravatar.cc/150?u=${username}`
                  });
                }}
              />
            </div>
          )}

          {activeView === 'Search' && (() => {
            const trimmedQuery = globalSearchQuery.trim().toLowerCase();
            
            // Filter users from backend search results
            const matchedUsers = searchResults;

            // Filter posts from feedPosts (local fallback since there is no /search posts route)
            const matchedPosts = feedPosts.filter(p => {
              if (!trimmedQuery) return false;
              return (
                p.caption?.toLowerCase().includes(trimmedQuery) ||
                p.user?.username?.toLowerCase().includes(trimmedQuery)
              );
            });

            return (
              <div className="flex flex-col gap-4">
                <div className="vintage-panel p-3 bg-[#fdfdfd] flex gap-2">
                  <input 
                    type="text" 
                    className="vintage-input flex-1 px-2 py-1.5 text-[12px]" 
                    placeholder="Search for users, tags or places..." 
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  />
                  {globalSearchQuery && (
                    <button 
                      onClick={() => setGlobalSearchQuery('')}
                      className="px-2 py-1 text-[11px] text-gray-400 hover:text-black font-bold"
                    >
                      ✕
                    </button>
                  )}
                  <button className="retro-button px-4 py-1 font-bold text-[11px]">Search</button>
                </div>

                {globalSearchQuery ? (
                  <div className="flex flex-col gap-4">
                    {/* User results */}
                    <div className="vintage-panel p-4 bg-[#fdfdfd]">
                      <h3 className="font-bold text-[#333] text-[12px] uppercase tracking-wider mb-2 border-b border-[#ccc] pb-1">Users Found</h3>
                      {matchedUsers.length === 0 ? (
                        <div className="text-center py-4 text-gray-400 text-[11px]">No users match "{globalSearchQuery}"</div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {matchedUsers.map(user => (
                            <div 
                              key={user._id || user.username} 
                              onClick={() => {
                                if (user.username === authUser?.username) {
                                  setActiveView('Profile');
                                } else {
                                  setActiveUserProfile({
                                    username: user.username,
                                    name: user.fullName,
                                    avatar: user.profilePic || `https://i.pravatar.cc/150?u=${user.username}`
                                  });
                                }
                              }}
                              className="flex items-center gap-3 p-1.5 hover:bg-gray-100/65 rounded cursor-pointer transition-colors"
                            >
                              <img src={user.profilePic || `https://i.pravatar.cc/150?u=${user.username}`} className="w-8 h-8 rounded-full border border-gray-300 object-cover" alt={user.username} />
                              <div className="flex flex-col">
                                <span className="font-bold text-[12px] text-blue-600">@{user.username}</span>
                                <span className="text-[10px] text-gray-500">{user.fullName}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Post results */}
                    <div className="vintage-panel p-4 bg-[#fdfdfd]">
                      <h3 className="font-bold text-[#333] text-[12px] uppercase tracking-wider mb-2 border-b border-[#ccc] pb-1">Posts Found</h3>
                      {matchedPosts.length === 0 ? (
                        <div className="text-center py-4 text-gray-400 text-[11px]">No posts match "{globalSearchQuery}"</div>
                      ) : (
                        <div className="grid grid-cols-3 gap-1">
                          {matchedPosts.map((post, idx) => (
                            <div 
                              key={idx} 
                              onClick={() => {
                                setSelectedProfilePost({
                                  image: post.contentImg,
                                  caption: post.caption,
                                  likes: post.likes ? parseInt(post.likes) || 120 : 120,
                                  comments: post.comments || []
                                });
                              }}
                              className="aspect-square bg-cover bg-center border border-[#ccc] cursor-pointer hover:opacity-80 transition-transform hover:scale-102" 
                              style={{ backgroundImage: `url(${post.contentImg})`, filter: 'contrast(1.1) saturate(1.1) sepia(0.15)' }} 
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="vintage-panel p-4 bg-[#fdfdfd]">
                       <h3 className="font-bold text-[#333] text-[14px] mb-3 border-b border-[#ccc] pb-1">Recent Searches</h3>
                       <div className="flex flex-col gap-2 text-[12px]">
                         <button onClick={() => setGlobalSearchQuery('#vintage')} className="vintage-link flex items-center gap-2 bg-transparent border-none text-left cursor-pointer p-0"><span className="text-[#999]">🔍</span> #vintage</button>
                         <button onClick={() => setGlobalSearchQuery('@kevin')} className="vintage-link flex items-center gap-2 bg-transparent border-none text-left cursor-pointer p-0"><span className="text-[#999]">🔍</span> @kevin</button>
                         <button onClick={() => setGlobalSearchQuery('polaroid')} className="vintage-link flex items-center gap-2 bg-transparent border-none text-left cursor-pointer p-0"><span className="text-[#999]">🔍</span> polaroid cameras</button>
                       </div>
                    </div>
                    <div className="vintage-panel p-4 bg-[#fdfdfd]">
                       <h3 className="font-bold text-[#333] text-[14px] mb-3 border-b border-[#ccc] pb-1">Suggested for you</h3>
                       <div className="grid grid-cols-3 gap-1">
                         {[
                           ...feedPosts.filter(p => p.user?.username === authUser?.username).map(p => p.contentImg),
                          'https://images.unsplash.com/photo-1542931287-023b922fa89b?auto=format&fit=crop&q=80&w=300&h=300',
                           ...feedPosts.filter(p => p.user?.username === authUser?.username).map(p => p.contentImg),
                          'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=300&h=300',
                           'https://images.unsplash.com/photo-1505628346881-b72b27e84530?auto=format&fit=crop&q=80&w=300&h=300',
                         ].map((src, i) => (
                           <div 
                             key={i} 
                             onClick={() => {
                               setSelectedProfilePost({
                                 image: src,
                                 caption: i === 0 ? 'Classic shots... #vintage' : 'Warm, golden, nostalgic vibes.',
                                 likes: 124,
                                 comments: []
                               });
                             }}
                             className="aspect-square bg-cover bg-center border border-[#ccc] cursor-pointer hover:opacity-80" 
                             style={{ backgroundImage: `url(${src})`, filter: 'contrast(1.1) saturate(1.1) sepia(0.15)' }} 
                           />
                         ))}
                       </div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {activeView === 'Explore' && (
            <div className="vintage-panel p-4 bg-[#fdfdfd] flex flex-col gap-3">
               <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                 <button className="retro-button px-3 py-1 text-[11px] font-bold shrink-0 bg-[#ddd]">IGTV</button>
                 <button className="retro-button px-3 py-1 text-[11px] font-bold shrink-0">Shop</button>
                 <button className="retro-button px-3 py-1 text-[11px] font-bold shrink-0">Decor</button>
                 <button className="retro-button px-3 py-1 text-[11px] font-bold shrink-0">Travel</button>
                 <button className="retro-button px-3 py-1 text-[11px] font-bold shrink-0">Architecture</button>
                 <button className="retro-button px-3 py-1 text-[11px] font-bold shrink-0">Food</button>
                 <button className="retro-button px-3 py-1 text-[11px] font-bold shrink-0">Art</button>
               </div>
               <div className="grid grid-cols-3 gap-1">
                 {feedPosts.length > 0 ? feedPosts.map((post, i) => (
                   <div 
                     key={i} 
                     onClick={() => {
                       setSelectedProfilePost({
                         image: post.contentImg,
                         caption: post.caption,
                         likes: post.likes,
                         comments: post.comments
                       });
                     }}
                     className="aspect-square border border-[#ccc] cursor-pointer hover:opacity-80 overflow-hidden relative" 
                   >
                     {post.contentFileType === 'video' ? (
                       <video src={post.contentImg} className="w-full h-full object-cover" style={{ filter: 'contrast(1.1) saturate(1.1) sepia(0.15)' }} autoPlay muted loop playsInline />
                     ) : (
                       <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${post.contentImg})`, filter: 'contrast(1.1) saturate(1.1) sepia(0.15)' }} />
                     )}
                     {post.contentFileType === 'video' && (
                       <div className="absolute top-1 right-1 text-white bg-black/50 rounded p-0.5 z-10"><span className="text-[10px]">▶</span></div>
                     )}
                   </div>
                 )) : (
                   <div className="col-span-3 py-8 text-center text-gray-500 text-[12px] font-bold">No posts to explore yet!</div>
                 )}
               </div>
            </div>
          )}

          {activeView === 'Reels' && (() => {
            const currentReel = reels[activeReelIndex] || reels[0];
            const hasPrev = activeReelIndex > 0;
            const hasNext = activeReelIndex < reels.length - 1;
            
            return (
              <div className="flex flex-col items-center justify-center py-4 select-none">
                <div className="relative flex items-center justify-center gap-4">
                  
                  {/* Left/Prev scroll control button */}
                  <button 
                    disabled={!hasPrev} 
                    onClick={() => setActiveReelIndex(prev => prev - 1)}
                    className={`retro-button p-2 text-center text-sm font-bold shadow-md rounded-[4px] h-[44px] w-[44px] flex items-center justify-center ${!hasPrev ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'}`}
                    title="Previous Reel"
                  >
                    ▲
                  </button>

                  <div className="vintage-panel w-full max-w-[400px] h-[600px] bg-black flex flex-col justify-between p-4 relative shadow-[8px_8px_0px_rgba(0,0,0,0.2)] overflow-hidden">
                    <div className="text-white font-bold text-[14px] drop-shadow-md z-10 flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        Reels 
                        <span className="bg-red-600 text-[9px] text-white px-1.5 py-0.5 rounded tracking-wide font-mono">VINTAGE</span>
                        <span className="text-[10px] text-white/70 font-mono">{(currentReel?.views || 1530).toLocaleString()} views</span>
                      </span>
                      <span className="cursor-pointer text-[18px]">📷</span>
                    </div>

                    {/* Reel Media Element with Double Click Interaction */}
                    <div 
                      className="absolute inset-0 cursor-pointer select-none" 
                      onDoubleClick={() => handleReelDoubleTap(currentReel?.id)}
                    >
                      {currentReel?.remixedFrom ? (
                        <div className="absolute inset-0 w-full h-full flex flex-row">
                          {/* Left Side: Original */}
                          <div className="w-1/2 h-full border-r border-neutral-800 relative bg-black">
                            {currentReel.remixedFrom.videoUrl ? (
                              <video 
                                src={currentReel.remixedFrom.videoUrl} 
                                autoPlay 
                                loop 
                                muted 
                                playsInline 
                                className="w-full h-full object-cover" 
                                style={{ filter: 'contrast(1.1) sepia(0.1)' }}
                              />
                            ) : (
                              <img 
                                src={currentReel.remixedFrom.image} 
                                className="w-full h-full object-cover" 
                                style={{ filter: 'contrast(1.1) sepia(0.1)' }}
                              />
                            )}
                            <div className="absolute top-10 left-2 bg-black/60 backdrop-blur-xs text-[7px] text-white px-1 py-0.5 rounded font-mono uppercase tracking-wider z-10">
                              @{currentReel.remixedFrom.username}
                            </div>
                          </div>
                          {/* Right Side: Remix */}
                          <div className="w-1/2 h-full relative bg-neutral-900">
                            {currentReel.videoUrl ? (
                              <video 
                                src={currentReel.videoUrl} 
                                autoPlay 
                                loop 
                                muted 
                                playsInline 
                                className="w-full h-full object-cover" 
                                style={{ filter: 'contrast(1.15) sepia(0.15)' }}
                              />
                            ) : (
                              <img 
                                src={currentReel.image} 
                                className="w-full h-full object-cover" 
                                style={{ filter: 'contrast(1.15) sepia(0.15)' }}
                              />
                            )}
                            <div className="absolute top-10 left-2 bg-amber-500 text-black text-[7px] px-1 py-0.5 rounded font-bold uppercase tracking-wider font-sans z-10">
                              Remix
                            </div>
                          </div>
                        </div>
                      ) : (
                        currentReel?.videoUrl ? (
                          <video 
                            src={currentReel.videoUrl} 
                            autoPlay 
                            loop 
                            muted 
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover opacity-90"
                            style={{ filter: 'contrast(1.15) sepia(0.15)' }}
                          />
                        ) : (
                          <div 
                            className="absolute inset-0 bg-cover bg-center opacity-80" 
                            style={{ 
                              backgroundImage: `url(${currentReel?.image})`, 
                              filter: 'contrast(1.25) saturate(1.2) sepia(0.15)' 
                            }} 
                          />
                        )
                      )}
                    </div>

                    {/* Scanline CRT glass overlay to keep the visual identity pristine */}
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] z-5 opacity-30 pointer-events-none" />

                    {/* Giant Pulsing Heart Overlay for Reels Double Tap */}
                    <AnimatePresence>
                      {showReelGiantHeart && (
                        <motion.div 
                          initial={{ scale: 0.3, opacity: 0 }}
                          animate={{ scale: [0.3, 1.2, 1.0], opacity: [0, 1, 1] }}
                          exit={{ scale: 1.5, opacity: 0 }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                        >
                          <span className="text-7xl drop-shadow-2xl select-none">❤️</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-16 h-16 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center border border-white/40 cursor-pointer hover:bg-white/35 z-10 opacity-0 hover:opacity-100 transition-opacity">
                        <div className="text-white text-3xl ml-2">▶</div>
                      </div>
                    </div>

                    {/* Reel Overlay Info */}
                    <div className="z-10 flex justify-between items-end w-full">
                      <div className="text-white flex flex-col gap-2">
                        <div className="font-bold text-[13px] flex items-center gap-2 drop-shadow-md">
                          <img src={currentReel?.avatar} className="w-8 h-8 rounded-full border-2 border-white object-cover" alt={currentReel?.username} />
                          <span className="drop-shadow-md">{currentReel?.username}</span>
                          <button 
                            onClick={() => {
                              const isFollowing = followingUsers.includes(currentReel?.username);
                              if (isFollowing) {
                                setFollowingUsers(prev => prev.filter(u => u !== currentReel?.username));
                                showTemporaryToast(`Unfollowed @${currentReel?.username}`);
                              } else {
                                setFollowingUsers(prev => [...prev, currentReel?.username]);
                                showTemporaryToast(`Following @${currentReel?.username}!`);
                              }
                            }}
                            className={`border px-2 py-0.5 rounded-[4px] text-[9px] font-bold ml-1 backdrop-blur-sm transition-colors cursor-pointer ${followingUsers.includes(currentReel?.username) ? 'bg-white text-black border-white' : 'bg-white/10 text-white border-white'}`}
                          >
                            {followingUsers.includes(currentReel?.username) ? 'Following' : 'Follow'}
                          </button>
                        </div>
                        <div className="text-[12px] max-w-[220px] line-clamp-2 drop-shadow-md font-sans text-gray-100">{currentReel?.caption}</div>
                        <div 
                          onClick={() => handleOpenAudioDetails(currentReel?.audio)}
                          className="text-[10px] flex items-center gap-1 bg-black/40 w-max px-2 py-1 rounded-full backdrop-blur-sm border border-white/10 cursor-pointer hover:bg-black/60 transition-all select-none"
                        >
                          <span className="animate-[pulse_1.5s_infinite]">🎵</span> {currentReel?.audio}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3.5 items-center z-10 shrink-0">
                        {/* Interactive Like button */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!currentReel) return;
                            toggleReelLikeAPI(currentReel.id);
                            setReels(prev => prev.map((r, idx) => {
                              if (idx === activeReelIndex) {
                                return {
                                  ...r,
                                  isLiked: !r.isLiked,
                                  likes: r.isLiked ? r.likes - 1 : r.likes + 1
                                };
                              }
                              return r;
                            }));
                          }}
                          className="flex flex-col items-center gap-1 cursor-pointer group focus:outline-none"
                        >
                          <span className={`text-[26px] transition-all transform group-active:scale-150 leading-none ${currentReel?.isLiked ? 'text-red-500 scale-110 drop-shadow-md' : 'text-white hover:text-red-300'}`}>
                            ♥
                          </span>
                          <span className="text-white text-[10px] font-mono drop-shadow-md">{currentReel?.likes.toLocaleString()}</span>
                        </button>

                        {/* Comments button */}
                        <button 
                          onClick={() => {
                            setSelectedReelForComments(currentReel);
                            setIsReelCommentsOpen(true);
                          }}
                          className="flex flex-col items-center gap-0.5 cursor-pointer bg-transparent border-none text-white focus:outline-none"
                        >
                          <span className="text-[20px] text-white hover:text-gray-300 leading-none">💬</span>
                          <span className="text-white text-[10px] font-mono drop-shadow-md">
                            {(reelCommentsList[currentReel?.id] ? reelCommentsList[currentReel?.id].length : currentReel?.commentsCount || 0).toLocaleString()}
                          </span>
                        </button>

                        {/* Share button */}
                        <button 
                          onClick={() => {
                            setSharingReel(currentReel);
                            setIsShareReelOpen(true);
                          }}
                          className="flex flex-col items-center gap-0.5 cursor-pointer bg-transparent border-none text-white focus:outline-none"
                        >
                          <span className="text-[22px] hover:text-gray-300 leading-none">↗</span>
                          <span className="text-[10px] drop-shadow-md">Share</span>
                        </button>

                        {/* Save/Bookmark button */}
                        <button 
                          onClick={() => {
                            const isSaved = savedReelIds.includes(currentReel?.id);
                            if (isSaved) {
                              setSavedReelIds(prev => prev.filter(id => id !== currentReel?.id));
                              showTemporaryToast("Removed from Saved Collection! 🔖");
                            } else {
                              setSavedReelIds(prev => [...prev, currentReel?.id]);
                              showTemporaryToast("Saved to collection! 🔖");
                            }
                          }}
                          className="flex flex-col items-center gap-0.5 cursor-pointer bg-transparent border-none text-white focus:outline-none"
                        >
                          <span className={`text-[20px] transition-all transform hover:scale-110 active:scale-95 leading-none ${savedReelIds.includes(currentReel?.id) ? 'text-amber-400 font-bold' : 'text-white hover:text-amber-200'}`}>
                            🔖
                          </span>
                          <span className="text-white text-[10px] drop-shadow-md">
                            {savedReelIds.includes(currentReel?.id) ? 'Saved' : 'Save'}
                          </span>
                        </button>

                        {/* Options button */}
                        <button 
                          onClick={() => setActiveReelOptions(currentReel)}
                          className="flex flex-col items-center gap-0.5 cursor-pointer bg-transparent border-none text-white focus:outline-none mt-1"
                        >
                          <span className="text-[18px] text-white hover:text-gray-300 leading-none">•••</span>
                          <span className="text-white text-[8px] drop-shadow-md">More</span>
                        </button>

                        {/* Spinny Vinyl disk */}
                        <div 
                          onClick={() => handleOpenAudioDetails(currentReel?.audio)}
                          className="w-7 h-7 rounded-full border border-white/50 mt-1 overflow-hidden cursor-pointer flex items-center justify-center bg-black/60 relative animate-spin"
                          style={{ animationDuration: '4s' }}
                        >
                          <img src={currentReel?.avatar} className="w-full h-full opacity-60 object-cover rounded-full" alt="Audio track" />
                          <div className="absolute text-[9px] text-white font-bold">🎵</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right/Next scroll control button */}
                  <button 
                    disabled={!hasNext} 
                    onClick={() => setActiveReelIndex(prev => prev + 1)}
                    className={`retro-button p-2 text-center text-sm font-bold shadow-md rounded-[4px] h-[44px] w-[44px] flex items-center justify-center ${!hasNext ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'}`}
                    title="Next Reel"
                  >
                    ▼
                  </button>

                </div>
              </div>
            );
          })()}

          {activeView === 'Messages' && (
            <div className="vintage-panel flex h-[500px] bg-[#fdfdfd]">
               <div className="w-[200px] border-r border-[#ccc] flex flex-col font-sans">
                 <div className="p-3 border-b border-[#ccc] font-bold text-[12px] bg-[#e0e0e0] flex justify-between items-center">
                   <span>Inbox</span>
                   <span className="cursor-pointer">📝</span>
                 </div>
                 <div className="overflow-y-auto flex-1 text-[12px] flex flex-col">
                   {/* Notes Section */}
                   <div className="p-3 border-b border-[#ccc] bg-[#f9f9f9] overflow-x-auto whitespace-nowrap flex gap-3 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      <div className="flex flex-col items-center gap-1 cursor-pointer shrink-0" onClick={handleAddNote}>
                        <div className="relative mb-2">
                          <img src={authUser?.profilePic || "https://i.pravatar.cc/150?u=default"} className="w-12 h-12 rounded-full border border-[#ccc] shadow-sm object-cover" alt="You" />
                          <div className="absolute -top-2 -right-4 bg-white border border-[#ccc] rounded-xl px-2 py-0.5 text-[10px] shadow-sm z-10 text-gray-400 hover:bg-gray-100">
                             + Note
                          </div>
                        </div>
                        <span className="text-[10px] text-[#666] mt-1">Your Note</span>
                      </div>
                      {notesList.map((n) => (
                        <div key={n._id} className="flex flex-col items-center gap-1 cursor-pointer shrink-0" onClick={() => handleSelectConversationByUser(n.user)}>
                          <div className="relative mb-2">
                            <img src={n.user.profilePic || `https://i.pravatar.cc/150?u=${n.user.username}`} className="w-12 h-12 rounded-full border-2 border-[#0000EE] shadow-sm object-cover" alt={n.user.username} />
                            <div className="absolute -top-2 -right-4 bg-white border border-[#ccc] rounded-xl px-2 py-0.5 text-[9px] shadow-sm max-w-[60px] truncate z-10">
                               {n.text}
                            </div>
                          </div>
                          <span className="text-[10px] text-[#666] mt-1">{n.user.username}</span>
                        </div>
                      ))}
                   </div>
                   {/* Chat List */}
                   {conversationsList.map((conv) => {
                     const otherUser = conv.participants.find((p:any) => p.username !== authUser?.username) || conv.participants[0];
                     const lastMsg = conv.latestMessage;
                     const lastText = lastMsg ? lastMsg.text || 'Sent an attachment' : 'No messages yet';
                     const lastTime = lastMsg ? new Date(lastMsg.createdAt).toLocaleDateString() : '';
                     const isSelected = activeConversation?._id === conv._id;
                     return (
                       <div key={conv._id} onClick={() => handleSelectConversation(conv)} className={`p-2 border-b border-[#eee] cursor-pointer hover:bg-[#e8e8e8] flex items-center gap-2 ${isSelected ? 'bg-[#e8e8e8] font-bold' : ''}`}>
                         <div className="relative">
                           <img src={otherUser.profilePic || `https://i.pravatar.cc/150?u=${otherUser.username}`} className="w-10 h-10 rounded-full border border-[#ccc] object-cover" alt={otherUser.username} />
                           <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                         </div>
                         <div className="flex flex-col overflow-hidden text-[11px] flex-1">
                           <div className="flex justify-between items-center">
                             <span className="font-bold truncate text-[#333]">@{otherUser.username}</span>
                             <span className="text-gray-400 text-[8px] shrink-0">{lastTime}</span>
                           </div>
                           <span className="text-[#666] text-[10px] truncate">{lastText}</span>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>
               <div className="flex-1 flex flex-col font-sans">
                 <div className="p-3 border-b border-[#ccc] font-bold text-[14px] flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className="relative">
                       <img src={activeChatUser?.profilePic || `https://i.pravatar.cc/150?u=${activeChatUser?.username || 'user'}`} className="w-8 h-8 rounded-full border border-[#ccc] object-cover" alt={activeChatUser?.username} />
                       <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                     </div>
                     <div className="flex flex-col">
                       <span>{activeChatUser?.username || 'Select a chat'}</span>
                       <span className="text-[10px] font-normal text-gray-500">Active now</span>
                     </div>
                   </div>
                   <div className="flex items-center gap-4 text-[18px]">
                     <button onClick={() => initiateCall(false)} className="hover:opacity-70 cursor-pointer">📞</button>
                     <button onClick={() => initiateCall(true)} className="hover:opacity-70 cursor-pointer">📹</button>
                     <button className="hover:opacity-70 cursor-pointer">ℹ️</button>
                   </div>
                 </div>
                 <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3 text-[12px] bg-gray-50">
                    {!activeChatUser ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-1 py-8">
                        <span className="text-[32px] opacity-35">💬</span>
                        <p className="font-bold text-[13px]">No messages yet</p>
                        <p className="text-[10px]">Select a conversation to start chatting</p>
                      </div>
                    ) : activeMessages.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-1 py-8">
                        <span className="text-[32px] opacity-35">💬</span>
                        <p className="font-bold text-[13px]">No messages yet</p>
                        <p className="text-[10px]">Start the conversation with @{activeChatUser?.username}</p>
                      </div>
                    ) : (
                      activeMessages.map((msg, idx) => {
                        const isMe = msg.sender === authUser?._id;
                        return (
                          <div 
                            key={msg._id || idx} 
                            className={`self-${isMe ? 'end bg-[#d4e4ff] border border-[#a3c2ff]' : 'start bg-[#e0e0e0] border border-[#ccc]'} p-2 rounded-[4px] max-w-[80%] shadow-sm flex flex-col gap-1`}
                          >
                            <div className="flex flex-col gap-1.5">
                              {msg.fileUrl && (
                                <img src={msg.fileUrl} alt="Attachment" className="max-w-[150px] max-h-[200px] object-cover rounded shadow-sm border border-black/10" />
                              )}
                              {msg.text && <span className="break-words">{msg.text}</span>}
                            </div>
                            <div className="text-[8px] text-gray-400 text-right">{new Date(msg.createdAt).toLocaleTimeString()}</div>
                          </div>
                        );
                      })
                    )}
                 </div>
                 <form 
                   onSubmit={(e) => {
                     e.preventDefault();
                     if (messagesInputText.trim()) {
                       handleSendDirectMessage(messagesInputText);
                       setMessagesInputText('');
                     }
                   }}
                   className="p-3 border-t border-[#ccc] bg-[#f0f0f0] flex gap-2 items-center"
                 >
                   <button type="button" className="text-[18px] bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer pb-0.5">📷</button>
                   <div className="flex-1 relative">
                     <input 
                       type="text" 
                       className="vintage-input w-full px-3 py-2 text-[12px] rounded-full" 
                       placeholder="Message..." 
                       value={messagesInputText}
                       onChange={(e) => setMessagesInputText(e.target.value)}
                       disabled={!activeChatUser}
                     />
                     <button type="button" className="absolute right-2 top-1.5 text-[14px]">🎤</button>
                   </div>
                   <button type="button" onClick={() => handleSendDirectMessage('❤️')} disabled={!activeChatUser} className="text-[16px] cursor-pointer">❤️</button>
                 </form>
               </div>
            </div>
          )}

          {activeView === 'Notifications' && (() => {
            const getTimeAgo = (dateStr: string) => {
              const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
              let interval = seconds / 31536000;
              if (interval > 1) return Math.floor(interval) + " years ago";
              interval = seconds / 2592000;
              if (interval > 1) return Math.floor(interval) + " months ago";
              interval = seconds / 86400;
              if (interval > 1) return Math.floor(interval) + " days ago";
              interval = seconds / 3600;
              if (interval > 1) return Math.floor(interval) + " hours ago";
              interval = seconds / 60;
              if (interval > 1) return Math.floor(interval) + " minutes ago";
              return Math.floor(seconds) + " seconds ago";
            };

            return (
            <div className="vintage-panel p-4 bg-[#fdfdfd]">
               <h3 className="font-bold text-[#333] text-[14px] mb-3 border-b border-[#ccc] pb-1">Activity</h3>
               <div className="flex flex-col gap-3 text-[12px]">
                 {/* Follow Requests */}
                 {followRequests.length > 0 && (
                   <div 
                     onClick={() => {
                       // Custom behavior for opening follow requests here if needed
                       showTemporaryToast("Follow Requests feature is managed here.");
                     }}
                     className="flex items-center gap-3 pb-3 border-b border-[#ccc] mb-2 cursor-pointer hover:bg-[#f0f0f0] p-2 rounded"
                   >
                     <div className="w-10 h-10 rounded-full border border-[#ccc] flex items-center justify-center bg-[#e8e8e8] text-[16px]">
                       👤
                     </div>
                     <div className="flex-1">
                       <span className="font-bold">Follow Requests</span>
                       <div className="text-[#888] text-[10px]">{followRequests.length} pending request{followRequests.length > 1 ? 's' : ''}</div>
                     </div>
                     <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                   </div>
                 )}

                 <div className="font-bold text-[#333] text-[13px] mt-2 mb-1">Recent Activity</div>
                 
                 {recentActivity.length === 0 ? (
                   <div className="text-gray-400 italic py-4 text-center">No recent activity</div>
                 ) : (
                   recentActivity.map((activity, idx) => {
                     const user = activity.user;
                     if (!user) return null;
                     
                     let actionText = '';
                     let showThumbnail = false;
                     let buttonLabel = '';
                     
                     if (activity.event === 'like_reel') {
                       actionText = 'liked your reel.';
                       showThumbnail = !!activity.relatedPost?.videoUrl;
                     } else if (activity.event === 'comment') {
                       actionText = `commented on your post.`;
                       showThumbnail = !!activity.relatedPost?.videoUrl;
                     } else if (activity.event === 'follow') {
                       actionText = 'started following you.';
                       buttonLabel = 'Follow Back'; // Or 'Following' if already following
                     } else if (activity.event === 'unfollow') {
                       actionText = 'unfollowed you.';
                     } else if (activity.event === 'mention') {
                       actionText = 'mentioned you.';
                     } else {
                       actionText = 'interacted with your profile.';
                     }

                     return (
                       <div key={activity._id || idx} className="flex items-center gap-3 pb-3 border-b border-[#eee]">
                         <img 
                           src={user.profilePic || `https://i.pravatar.cc/150?u=${user.username}`} 
                           className="w-10 h-10 rounded-full border border-[#ccc] cursor-pointer object-cover" 
                           alt={user.username} 
                           onClick={() => {
                             setActiveUserProfile({
                               username: user.username,
                               name: user.fullName,
                               avatar: user.profilePic || `https://i.pravatar.cc/150?u=${user.username}`
                             });
                             setActiveView('Profile');
                           }}
                         />
                         <div className="flex-1">
                           <span 
                             className="font-bold vintage-link cursor-pointer mr-1"
                             onClick={() => {
                               setActiveUserProfile({
                                 username: user.username,
                                 name: user.fullName,
                                 avatar: user.profilePic || `https://i.pravatar.cc/150?u=${user.username}`
                               });
                               setActiveView('Profile');
                             }}
                           >
                             {user.username}
                           </span>
                           {actionText}
                           <div className="text-[#888] text-[10px] mt-0.5">{getTimeAgo(activity.createdAt)}</div>
                         </div>
                         
                         {showThumbnail && activity.relatedPost?.videoUrl && (
                           <div className="w-10 h-10 border border-[#ccc] relative overflow-hidden bg-black flex-shrink-0 cursor-pointer">
                             {activity.relatedPost.videoUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                               <video src={activity.relatedPost.videoUrl} className="w-full h-full object-cover" muted />
                             ) : (
                               <img src={activity.relatedPost.videoUrl} className="w-full h-full object-cover" alt="post" />
                             )}
                           </div>
                         )}
                         
                         {buttonLabel && (
                           <button className="retro-button px-3 py-1 font-bold text-[10px] ml-2">
                             {buttonLabel}
                           </button>
                         )}
                       </div>
                     );
                   })
                 )}
               </div>
            </div>
            );
          })()}

          {activeView === 'Create' && (
            <div className="vintage-panel p-4 bg-[#fdfdfd] flex flex-col items-center select-none font-sans max-w-[620px] mx-auto w-full shadow-md">
               <h3 className="font-bold text-[#333] text-[14px] mb-3 border-b border-[#ccc] pb-1 w-full flex justify-between items-center">
                 <span>Create New</span>
                 <span className="text-[10px] font-mono text-gray-500">Retro Studio</span>
               </h3>
               
               {/* Type Tabs */}
               <div className="flex w-full justify-around border-b border-[#ccc] pb-2 mb-4 font-bold text-[12px] text-[#666]">
                 {[
                   { id: 'POST', label: 'POST', emoji: '📸' },
                   { id: 'STORY', label: 'STORY', emoji: '✨' },
                   { id: 'REEL', label: 'REEL', emoji: '🎬' },
                   { id: 'LIVE', label: 'LIVE', emoji: '🔴' }
                 ].map((t) => (
                   <button 
                     key={t.id}
                     onClick={() => {
                       setCreateTab(t.id as any);
                       setUploadedFile(null);
                       setStoryStickers([]);
                     }}
                     className={`flex items-center gap-1 pb-1 border-b-2 transition-all cursor-pointer ${createTab === t.id ? 'text-blue-600 border-blue-600 font-extrabold scale-105' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
                   >
                     <span>{t.emoji}</span>
                     <span>{t.label}</span>
                   </button>
                 ))}
               </div>

               <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" className="hidden" />

               {/* =================== POST TAB =================== */}
               {createTab === 'POST' && (
                 <div className="w-full flex flex-col items-center gap-4">
                   <div className="text-left w-full">
                     <span className="font-bold text-[10px] text-gray-400 uppercase tracking-wider block mb-1">1. Select Preset Photo</span>
                     <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                       {VINTAGE_PRESETS.map((p, idx) => (
                         <div 
                           key={idx}
                           onClick={() => setUploadedFile({ url: p.url, type: 'image' })}
                           className={`flex flex-col items-center p-0.5 rounded cursor-pointer border shrink-0 bg-white transition-all ${uploadedFile?.url === p.url ? 'border-blue-500 bg-blue-50/50 scale-95' : 'border-gray-200 hover:border-gray-400'}`}
                         >
                           <img src={p.url} className="w-10 h-10 object-cover rounded" alt={p.name} />
                           <span className="text-[7px] text-gray-500 w-10 truncate text-center font-bold">{p.name}</span>
                         </div>
                       ))}
                     </div>
                   </div>

                   <div 
                     onClick={triggerFileUpload}
                     className="w-[280px] h-[280px] border-2 border-dashed border-gray-300 hover:border-blue-400 bg-gray-50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all relative overflow-hidden rounded-lg shadow-inner group"
                   >
                     {uploadedFile ? (
                       uploadedFile.type === 'video' ? (
                         <video src={uploadedFile.url} className="w-full h-full object-cover" style={{ filter: FILTER_MAP[selectedFilter] }} controls />
                       ) : (
                         <img src={uploadedFile.url} className="w-full h-full object-cover" style={{ filter: FILTER_MAP[selectedFilter] }} alt="Post preview" />
                       )
                     ) : (
                       <>
                         <span className="text-[36px] text-gray-300 group-hover:scale-110 transition-transform">📸</span>
                         <span className="text-[11px] font-bold text-gray-500">Upload your photo or video</span>
                         <span className="text-[9px] text-gray-400">Drag & drop or Click to browse</span>
                       </>
                     )}
                   </div>

                   {uploadedFile && uploadedFile.type === 'image' && (
                     <div className="w-full max-w-[380px]">
                       <span className="font-bold text-[10px] text-gray-400 uppercase tracking-wider block mb-1">2. Filter style</span>
                       <div className="flex gap-2.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                         {(['normal', 'vintage', 'bw', 'warm', 'cool'] as const).map((f) => (
                           <div key={f} onClick={() => setSelectedFilter(f)} className="flex flex-col items-center gap-0.5 cursor-pointer shrink-0">
                             <div className={`w-12 h-12 rounded border-2 overflow-hidden ${selectedFilter === f ? 'border-blue-500 scale-105' : 'border-transparent hover:border-gray-300'}`}>
                               <img src={uploadedFile.url} className="w-full h-full object-cover" style={{ filter: FILTER_MAP[f] }} alt={f} />
                             </div>
                             <span className={`text-[8px] uppercase font-bold ${selectedFilter === f ? 'text-blue-600' : 'text-gray-400'}`}>{f}</span>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   <div className="w-full max-w-[380px] flex flex-col gap-3">
                     <div>
                       <span className="font-bold text-[10px] text-gray-400 uppercase tracking-wider block mb-1">3. Write Caption</span>
                       <textarea 
                         className="vintage-input w-full p-2 text-[11px] min-h-[50px] resize-none" 
                         placeholder="Write caption... #retro #90s"
                         value={captionText}
                         onChange={(e) => setCaptionText(e.target.value)}
                       />
                     </div>

                     <div className="border border-[#ccc] rounded bg-[#fcfcfc] text-[11px] p-2.5 flex flex-col gap-2.5">
                       <div className="flex flex-col gap-1">
                         <div className="flex justify-between items-center font-bold text-gray-700">
                           <span>Location</span>
                           <span>📍</span>
                         </div>
                         <div className="flex gap-1 flex-wrap">
                           {['Nostalgia Lane', '90s Arcade', 'Retro Coffee Club'].map((loc) => (
                             <button 
                               key={loc}
                               onClick={() => setLocationText(loc)}
                               className={`text-[8px] px-2 py-0.5 border rounded ${locationText === loc ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold' : 'bg-white hover:bg-gray-50'}`}
                             >
                               {loc}
                             </button>
                           ))}
                         </div>
                         <input type="text" className="vintage-input w-full p-1 text-[10px]" placeholder="Custom spot..." value={locationText} onChange={(e) => setLocationText(e.target.value)} />
                       </div>

                       <div className="flex flex-col gap-1 border-t pt-2">
                         <span className="font-bold text-gray-700">Alt Text Accessibility</span>
                         <input type="text" className="vintage-input w-full p-1 text-[10px]" placeholder="Accessibility description..." value={altText} onChange={(e) => setAltText(e.target.value)} />
                       </div>
                     </div>

                     <div className="border border-gray-200 rounded p-2.5 bg-white flex flex-col gap-1.5 text-[10px]">
                       <div className="flex justify-between items-center"><span className="font-bold text-gray-600">Hide Like Count</span><input type="checkbox" checked={hideLikes} onChange={(e) => setHideLikes(e.target.checked)} /></div>
                       <div className="flex justify-between items-center"><span className="font-bold text-gray-600">Turn Off Commenting</span><input type="checkbox" checked={turnOffComments} onChange={(e) => setTurnOffComments(e.target.checked)} /></div>
                       <div className="flex justify-between items-center"><span className="font-bold text-gray-600">Share to Threads</span><input type="checkbox" checked={autoShareThreads} onChange={(e) => setAutoShareThreads(e.target.checked)} /></div>
                     </div>

                     <button onClick={handlePublishContent} className="retro-blue-button w-full py-2 font-bold text-[11px] shadow-sm">Share Post</button>
                   </div>
                 </div>
               )}

               {/* =================== STORY TAB =================== */}
               {createTab === 'STORY' && (
                 <div className="w-full flex flex-col items-center gap-4">
                   <div className="w-full flex flex-col md:flex-row gap-5 items-center justify-center">
                     {/* Smartphone frame */}
                     <div className="relative w-[240px] h-[410px] bg-neutral-900 rounded-[22px] border-[8px] border-neutral-950 overflow-hidden shadow-xl flex flex-col justify-between shrink-0">
                       <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-16 h-3 bg-neutral-950 rounded-full z-30" />
                       
                       <div className="absolute inset-0 w-full h-full bg-cover bg-center"
                         style={{ 
                           backgroundImage: uploadedFile ? `url(${uploadedFile.url})` : 'radial-gradient(circle, #222 0%, #050505 100%)',
                           filter: FILTER_MAP[selectedFilter]
                         }}
                       >
                         {!uploadedFile && (
                           <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-1.5 p-4 text-center">
                             <span className="text-[32px]">✨</span>
                             <p className="text-[10px] font-bold text-neutral-400">Empty Canvas</p>
                             <p className="text-[8px] text-neutral-500">Pick a background preset or upload to add stickers!</p>
                           </div>
                         )}

                         {/* Stickers layer */}
                         {storyStickers.map((sticker) => {
                           let sInner = null;
                           if (sticker.type === 'text') {
                             sInner = (
                               <div className="px-2 py-0.5 rounded font-bold text-[10px] shadow" style={{ color: sticker.color, backgroundColor: sticker.bg }}>
                                 {sticker.text}
                               </div>
                             );
                           } else if (sticker.type === 'location') {
                             sInner = (
                               <div className="px-2 py-0.5 rounded-lg font-bold text-[8px] bg-blue-500 text-white flex items-center gap-1 shadow-md">
                                 📍 {sticker.text}
                               </div>
                             );
                           } else if (sticker.type === 'music') {
                             sInner = (
                               <div className="px-1.5 py-0.5 rounded-lg font-bold text-[8px] bg-black/85 text-white flex items-center gap-1 shadow max-w-[100px] truncate">
                                 🎵 {sticker.text}
                               </div>
                             );
                           } else if (sticker.type === 'poll') {
                             sInner = (
                               <div className="p-1.5 rounded-lg bg-white text-black border shadow flex flex-col gap-0.5 items-center min-w-[80px]">
                                 <span className="font-bold text-[7px] text-center text-neutral-700">{sticker.text}</span>
                                 <div className="flex gap-0.5 w-full text-[6px]">
                                   <div className="flex-1 py-0.25 bg-neutral-100 font-bold rounded text-center text-neutral-400">Yes</div>
                                   <div className="flex-1 py-0.25 bg-neutral-100 font-bold rounded text-center text-neutral-400">No</div>
                                 </div>
                               </div>
                             );
                           } else if (sticker.type === 'countdown') {
                             sInner = (
                               <div className="p-1.5 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow flex flex-col gap-0.5 items-center min-w-[90px]">
                                 <span className="font-bold text-[6px] uppercase tracking-wider text-pink-100">{sticker.text}</span>
                                 <div className="text-[7px] font-mono font-bold">12d : 04h : 59m</div>
                               </div>
                             );
                           }

                           return (
                             <div 
                               key={sticker.id}
                               onClick={() => {
                                 setStoryStickers(prev => prev.filter(s => s.id !== sticker.id));
                                 showTemporaryToast("Sticker removed");
                               }}
                               className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:ring-1 hover:ring-red-400 p-0.5 rounded transition-all"
                               style={{ left: `${sticker.x}%`, top: `${sticker.y}%` }}
                               title="Click to remove sticker"
                             >
                               {sInner}
                             </div>
                           );
                         })}
                       </div>

                       <div className="w-full p-2 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
                         <div className="flex items-center gap-1">
                           <img src={authUser?.profilePic || "https://i.pravatar.cc/150?u=default"} className="w-4 h-4 rounded-full object-cover" />
                           <span className="text-[9px] text-white font-bold">Your Story</span>
                         </div>
                       </div>
                       <div className="w-full p-2 flex justify-between items-center z-10 bg-gradient-to-t from-black/50 to-transparent">
                         <span className="text-[8px] text-white/50">Tap sticker to remove</span>
                       </div>
                     </div>

                     {/* Controls */}
                     <div className="flex-1 w-full max-w-[280px] flex flex-col gap-3 text-[11px]">
                       <div>
                         <span className="font-bold text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Story Presets</span>
                         <div className="flex gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                           {VINTAGE_PRESETS.map((p, i) => (
                             <img 
                               key={i} 
                               src={p.url} 
                               onClick={() => setUploadedFile({ url: p.url, type: 'image' })} 
                               className={`w-9 h-14 object-cover rounded cursor-pointer border-2 ${uploadedFile?.url === p.url ? 'border-blue-500' : 'border-transparent'}`} 
                             />
                           ))}
                         </div>
                       </div>

                       <button onClick={triggerFileUpload} className="retro-button py-1 font-bold text-[10px] flex items-center justify-center gap-1">📁 Custom Image</button>

                       {uploadedFile && (
                         <div className="flex gap-1">
                           {(['normal', 'vintage', 'bw', 'warm', 'cool'] as const).map(f => (
                             <button key={f} onClick={() => setSelectedFilter(f)} className={`px-1.5 py-0.5 rounded text-[8px] capitalize border ${selectedFilter === f ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold' : 'bg-white'}`}>{f}</button>
                           ))}
                         </div>
                       )}

                       {/* Sticker Palette */}
                       <div className="border border-gray-200 rounded p-2 bg-[#fafafa] flex flex-col gap-2">
                         <span className="font-bold text-[10px] text-gray-500 block uppercase">Sticker Palette</span>
                         <div className="grid grid-cols-2 gap-1 text-[9px]">
                           {[
                             { type: 'text', label: '💬 Text' },
                             { type: 'location', label: '📍 Location' },
                             { type: 'music', label: '🎵 Music' },
                             { type: 'poll', label: '📊 Poll' },
                             { type: 'countdown', label: '⏳ Countdown' }
                           ].map(st => (
                             <button
                               key={st.type}
                               onClick={() => {
                                 setAddingStickerType(st.type as any);
                                 setTempStickerText('');
                               }}
                               className={`py-1 rounded border font-bold ${addingStickerType === st.type ? 'bg-blue-500 text-white' : 'bg-white'}`}
                             >
                               {st.label}
                             </button>
                           ))}
                         </div>

                         {addingStickerType && (
                           <div className="mt-1 pt-1.5 border-t border-dashed border-gray-200 flex flex-col gap-1.5">
                             <div className="flex justify-between items-center font-bold text-[9px]">
                               <span className="text-blue-600 capitalize">Setup {addingStickerType}</span>
                               <button onClick={() => setAddingStickerType(null)} className="text-red-500">Cancel</button>
                             </div>

                             {addingStickerType === 'text' && (
                               <div className="flex flex-col gap-1">
                                 <input type="text" placeholder="Sticker text..." className="vintage-input p-1 text-[10px]" value={tempStickerText} onChange={e => setTempStickerText(e.target.value)} />
                                 <div className="flex items-center gap-1.5 text-[9px]">
                                   <span>Color:</span>
                                   <input type="color" value={tempStickerColor} onChange={e => setTempStickerColor(e.target.value)} className="w-4 h-4 cursor-pointer" />
                                   <span className="ml-1">BG:</span>
                                   <input type="color" value={tempStickerBg} onChange={e => setTempStickerBg(e.target.value)} className="w-4 h-4 cursor-pointer" />
                                 </div>
                               </div>
                             )}

                             {addingStickerType === 'location' && (
                               <input type="text" placeholder="Location name..." className="vintage-input p-1 text-[10px]" value={tempStickerText} onChange={e => setTempStickerText(e.target.value)} />
                             )}

                             {addingStickerType === 'music' && (
                               <div className="flex flex-col gap-1 max-h-[80px] overflow-y-auto">
                                 {['Espresso Love', 'Retro Vibe', 'Tokyo Sunset Mix'].map(track => (
                                   <button key={track} onClick={() => setTempStickerText(track)} className={`text-left text-[9px] p-1 border rounded ${tempStickerText === track ? 'bg-blue-50 font-bold' : 'bg-white'}`}>{track}</button>
                                 ))}
                               </div>
                             )}

                             {addingStickerType === 'poll' && (
                               <div className="flex flex-col gap-1">
                                 <input type="text" placeholder="Ask question..." className="vintage-input p-1 text-[10px]" value={tempStickerText} onChange={e => setTempStickerText(e.target.value)} />
                                 <div className="flex gap-1 text-[9px]">
                                   <input type="text" placeholder="Yes" className="vintage-input p-1 flex-1" value={tempPollOptions.yes} onChange={e => setTempPollOptions(p => ({...p, yes: e.target.value}))} />
                                   <input type="text" placeholder="No" className="vintage-input p-1 flex-1" value={tempPollOptions.no} onChange={e => setTempPollOptions(p => ({...p, no: e.target.value}))} />
                                 </div>
                               </div>
                             )}

                             {addingStickerType === 'countdown' && (
                               <input type="text" placeholder="Event name..." className="vintage-input p-1 text-[10px]" value={tempStickerText} onChange={e => setTempStickerText(e.target.value)} />
                             )}

                             <button
                               onClick={() => {
                                 const finalVal = tempStickerText || (addingStickerType === 'music' ? 'Retro Song' : 'Sticker');
                                 const newS = {
                                   id: Date.now(),
                                   type: addingStickerType,
                                   text: finalVal,
                                   color: tempStickerColor,
                                   bg: tempStickerBg,
                                   x: 25 + Math.floor(Math.random() * 50),
                                   y: 30 + Math.floor(Math.random() * 40),
                                   extra: addingStickerType === 'poll' ? tempPollOptions : undefined
                                 };
                                 setStoryStickers(prev => [...prev, newS]);
                                 setAddingStickerType(null);
                                 setTempStickerText('');
                                 showTemporaryToast("Sticker placed!");
                               }}
                               className="retro-blue-button py-0.5 text-[9px] font-bold"
                             >
                               ✓ Add Sticker
                             </button>
                           </div>
                         )}
                       </div>

                       <button 
                         onClick={handlePublishContent}
                         disabled={!uploadedFile}
                         className={`retro-blue-button w-full py-2 font-bold text-[11px] ${!uploadedFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                       >
                         Publish Story
                       </button>
                     </div>
                   </div>
                 </div>
               )}

               {/* =================== REEL TAB =================== */}
               {createTab === 'REEL' && (
                 <div className="w-full flex flex-col items-center gap-4">
                   <div className="w-full flex flex-col md:flex-row gap-5 items-center justify-center">
                     
                     {/* Smartphone frame */}
                     <div className="relative w-[240px] h-[410px] bg-neutral-900 rounded-[22px] border-[8px] border-neutral-950 overflow-hidden shadow-xl flex flex-col justify-between shrink-0">
                       <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-16 h-3 bg-neutral-950 rounded-full z-30" />
                       
                       <div className="absolute inset-0 w-full h-full flex flex-col justify-center items-center overflow-hidden">
                         {remixingFromReel ? (
                           <div className="absolute inset-0 w-full h-full flex flex-row">
                             {/* Left Side: Original Reel being remixed */}
                             <div className="w-1/2 h-full border-r border-neutral-800 relative bg-black">
                               {remixingFromReel.videoUrl ? (
                                 <video src={remixingFromReel.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-80" />
                               ) : (
                                 <img src={remixingFromReel.image} className="w-full h-full object-cover opacity-80" />
                               )}
                               <div className="absolute top-10 left-1 bg-black/60 text-[6px] text-white px-1 py-0.5 rounded font-mono uppercase z-10">Original</div>
                             </div>
                             {/* Right Side: Your Remix Media */}
                             <div className="w-1/2 h-full relative bg-neutral-900 flex items-center justify-center">
                               {uploadedFile ? (
                                 uploadedFile.type === 'video' ? (
                                   <video src={uploadedFile.url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                                 ) : (
                                   <img src={uploadedFile.url} className="w-full h-full object-cover" />
                                 )
                               ) : (
                                 <div className="text-center p-2 flex flex-col items-center gap-1">
                                   <span className="text-[12px] animate-pulse">📹</span>
                                   <span className="text-[6px] text-purple-300 font-mono">Upload or select preset</span>
                                 </div>
                               )}
                               <div className="absolute top-10 right-1 bg-amber-500 text-black text-[6px] px-1 py-0.5 rounded font-bold uppercase z-10">Remix</div>
                             </div>
                           </div>
                         ) : uploadedFile ? (
                           uploadedFile.type === 'video' ? (
                             <video 
                               src={uploadedFile.url} 
                               autoPlay 
                               loop 
                               muted 
                               playsInline 
                               className="absolute inset-0 w-full h-full object-cover" 
                             />
                           ) : (
                             <img 
                               src={uploadedFile.url} 
                               className="absolute inset-0 w-full h-full object-cover" 
                               alt="Reel preview" 
                               referrerPolicy="no-referrer"
                             />
                           )
                         ) : (
                           <div 
                             className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-cover bg-center"
                             style={{ backgroundImage: 'radial-gradient(circle, #2a153c 0%, #0c0214 100%)' }}
                           />
                         )}

                         {!uploadedFile && (
                           <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-4 text-center z-10 bg-black/40">
                             <div className="w-10 h-10 rounded-full border-2 border-dashed border-purple-400 animate-spin flex items-center justify-center">
                               <span className="text-purple-300 text-lg">🎬</span>
                             </div>
                             <span className="text-[11px] text-purple-300 font-bold">Reels Studio</span>
                             <p className="text-[8px] text-purple-400 max-w-[160px]">Select a driving or cassette video loop preset below!</p>
                           </div>
                         )}

                         <div className="absolute bottom-12 left-4 right-4 flex items-end gap-0.5 h-4 z-20 pointer-events-none opacity-50">
                           {Array.from({ length: 24 }).map((_, i) => (
                             <div 
                               key={i} 
                               className="bg-white rounded-full flex-1" 
                               style={{ 
                                 height: `${15 + Math.sin(i * 0.4 + Date.now() * 0.005) * 80}%`,
                                 animation: 'pulse 1s infinite'
                               }} 
                             />
                           ))}
                         </div>
                       </div>

                       <div className="absolute right-2.5 bottom-16 flex flex-col items-center gap-2 z-20 text-white">
                         <span className="text-lg">♡</span>
                         <span className="text-[8px]">0</span>
                         <span className="text-lg">💬</span>
                         <span className="text-[8px]">0</span>
                       </div>

                       <div className="absolute bottom-2.5 left-2.5 right-10 z-20 text-white flex flex-col gap-0.5 bg-black/40 p-1.5 rounded text-[8px]">
                         <span className="font-bold">@{authUser?.username || 'user'}</span>
                         <p className="line-clamp-1 text-neutral-200">{captionText || 'No caption... #reels'}</p>
                         <div className="flex items-center gap-1 text-purple-300 font-mono">
                           <span>🎵</span>
                           <span className="truncate max-w-[100px]">{reelsSoundtrack}</span>
                         </div>
                       </div>
                     </div>

                     {/* Controls */}
                     <div className="flex-1 w-full max-w-[280px] flex flex-col gap-3 text-[11px]">
                       {remixingFromReel && (
                         <div className="bg-amber-500/10 border border-amber-500/30 rounded p-2 flex flex-col gap-1 text-[9px]">
                           <div className="flex justify-between items-center text-amber-800 font-bold">
                             <span>🎬 Remixing @{remixingFromReel.username}'s Reel</span>
                             <button 
                               onClick={() => {
                                 setRemixingFromReel(null);
                                 showTemporaryToast("Remix mode cancelled.");
                               }}
                               className="text-red-500 hover:underline font-bold text-[8px] cursor-pointer bg-transparent border-none"
                             >
                               Cancel
                             </button>
                           </div>
                           <p className="text-gray-500 text-[8px]">This will publish a side-by-side video comparing your upload/preset with the original video.</p>
                         </div>
                       )}
                       <div>
                         <span className="font-bold text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Select Video Preset Loop</span>
                         <div className="grid grid-cols-2 gap-1">
                           {[
                             { name: 'Rainy Driving 🚗', url: 'https://assets.mixkit.co/videos/preview/mixkit-driving-in-the-rain-at-night-42239-large.mp4', thumb: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=150' },
                             { name: 'Cassette Tape 📼', url: 'https://assets.mixkit.co/videos/preview/mixkit-retro-cassette-tape-playing-41855-large.mp4', thumb: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&q=80&w=150' },
                             { name: 'Vintage Arcade 🕹️', url: 'https://assets.mixkit.co/videos/preview/mixkit-neon-light-from-a-retro-arcade-game-41858-large.mp4', thumb: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=150' },
                             { name: 'Retro Polaroid 📷', url: 'https://assets.mixkit.co/videos/preview/mixkit-holding-a-retro-polaroid-camera-41856-large.mp4', thumb: 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?auto=format&fit=crop&q=80&w=150' }
                           ].map((clip, idx) => (
                             <button
                               key={idx}
                               onClick={() => setUploadedFile({ url: clip.url, type: 'video' })}
                               className={`p-1 rounded border text-left flex items-center gap-1 bg-white text-[8px] ${uploadedFile?.url === clip.url ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
                             >
                               <img src={clip.thumb} className="w-5 h-7 object-cover rounded" />
                               <span className="truncate font-bold">{clip.name}</span>
                             </button>
                           ))}
                         </div>
                       </div>

                       <button onClick={triggerFileUpload} className="retro-button py-1 font-bold text-[10px]">📁 Upload Video File</button>

                       <div>
                         <span className="font-bold text-[10px] text-gray-400 uppercase tracking-wider block mb-0.5">Select Audio Soundtrack</span>
                         <select className="vintage-input w-full p-1.5 text-[10px]" value={reelsSoundtrack} onChange={e => setReelsSoundtrack(e.target.value)}>
                           <option value={`Original Audio - ${authUser?.username || 'user'}`}>Original Audio - {authUser?.username || 'user'}</option>
                           <option value="Retro Drive Synthwave (1985)">Retro Drive Synthwave (1985)</option>
                           <option value="Sunset Lofi Vibes (No-Copyright)">Sunset Lofi Vibes (No-Copyright)</option>
                           <option value="Midnight Tape Walk (VHS Edit)">Midnight Tape Walk (VHS Edit)</option>
                         </select>
                       </div>

                       <div>
                         <span className="font-bold text-[10px] text-gray-400 uppercase tracking-wider block mb-0.5">Caption</span>
                         <textarea className="vintage-input w-full p-1 text-[10px] min-h-[40px] resize-none" placeholder="Type caption..." value={captionText} onChange={e => setCaptionText(e.target.value)} />
                         <div className="flex gap-1 mt-1 flex-wrap">
                           {['#retro', '#vintage', '#reel', '#90s'].map(tag => (
                             <button key={tag} onClick={() => setCaptionText(p => p + ' ' + tag)} className="text-[8px] text-blue-500 hover:underline px-1 bg-neutral-100 rounded border border-neutral-200">{tag}</button>
                           ))}
                         </div>
                       </div>

                       <div className="border border-gray-200 rounded p-2 bg-white flex flex-col gap-1 text-[9px]">
                         <div className="flex justify-between items-center"><span>Allow Remixing</span><input type="checkbox" checked={isRemixAllowed} onChange={e => setIsRemixAllowed(e.target.checked)} /></div>
                         <div className="flex justify-between items-center"><span>Share also to Feed</span><input type="checkbox" checked={isShareToFeed} onChange={e => setIsShareToFeed(e.target.checked)} /></div>
                       </div>

                       <button 
                         onClick={handlePublishContent} 
                         disabled={!uploadedFile}
                         className={`retro-blue-button w-full py-2 font-bold text-[11px] ${!uploadedFile ? 'opacity-50' : ''}`}
                       >
                         Share Reel
                       </button>
                     </div>
                   </div>
                 </div>
               )}

               {/* =================== LIVE TAB =================== */}
               {createTab === 'LIVE' && (
                 <div className="w-full flex flex-col items-center gap-4">
                   {!isLiveBroadcasting ? (
                     <div className="w-full flex flex-col md:flex-row gap-5 items-center justify-center">
                       {/* Camera Preview */}
                       <div className="relative w-[240px] h-[380px] bg-neutral-900 rounded-[22px] border-[8px] border-neutral-950 overflow-hidden shadow-xl flex flex-col justify-between shrink-0">
                         <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-16 h-3 bg-neutral-950 rounded-full z-30" />
                         
                         {isCameraActive ? (
                           <video 
                             ref={liveVideoRef} 
                             autoPlay 
                             playsInline 
                             className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
                             style={{ 
                               filter: liveFilter === 'vhs' ? 'contrast(1.2) saturate(1.4) hue-rotate(10deg) brightness(1.1)' :
                                       liveFilter === 'scanline' ? 'contrast(1.15) brightness(1.05)' :
                                       liveFilter === 'sepia' ? 'sepia(0.8) contrast(1.1)' :
                                       liveFilter === 'grain' ? 'grayscale(0.3) contrast(1.3)' : 'none'
                             }}
                           />
                         ) : (
                           <div className="absolute inset-0 w-full h-full flex flex-row">
                             {['#ffffff', '#ffff00', '#00ffff', '#00ff00', '#ff00ff', '#ff0000', '#0000ff', '#111111'].map((c, i) => (
                               <div key={i} className="flex-1 h-full" style={{ backgroundColor: c, opacity: 0.85 }} />
                             ))}
                             <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[size:100%_4px] pointer-events-none" />
                             <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center z-10 bg-black/50">
                               <span className="text-[10px] font-mono font-bold text-red-500 animate-pulse">📼 BROADCAST STANDBY</span>
                             </div>
                           </div>
                         )}

                         <div className="w-full p-2 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent text-white text-[8px] font-bold">
                           <span className="bg-black/60 px-1.5 py-0.5 rounded border border-white/10">PREVIEW</span>
                           <span>{liveAudience.toUpperCase()} MODE</span>
                         </div>
                         <div className="w-full p-3 flex flex-col gap-0.5 z-10 bg-gradient-to-t from-black/80 to-transparent text-white text-[9px] rounded-b">
                           <span className="font-bold">Title: {liveTitle || 'Vintage Q&A Session'}</span>
                           <span className="text-[8px] text-green-400 font-mono">Filter: {liveFilter.toUpperCase()}</span>
                         </div>
                       </div>

                       {/* Setup controls */}
                       <div className="flex-1 w-full max-w-[280px] flex flex-col gap-3 text-[11px]">
                         <div>
                           <span className="font-bold text-[10px] text-gray-400 uppercase tracking-wider block mb-0.5">1. Broadcast Title</span>
                           <input type="text" className="vintage-input w-full p-1.5 text-[11px]" placeholder="e.g. Discussing old Polaroid cameras 📸" value={liveTitle} onChange={e => setLiveTitle(e.target.value)} />
                         </div>

                         <div>
                           <span className="font-bold text-[10px] text-gray-400 uppercase tracking-wider block mb-0.5">2. Audience Mode</span>
                           <div className="grid grid-cols-3 gap-1">
                             {[
                               { id: 'public', label: '🌐 Public' },
                               { id: 'practice', label: '🔒 Solo' },
                               { id: 'friends', label: '👥 Friends' }
                             ].map(aud => (
                               <button
                                 key={aud.id}
                                 onClick={() => setLiveAudience(aud.id as any)}
                                 className={`py-1 rounded border text-[9px] font-bold ${liveAudience === aud.id ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-white border-neutral-300'}`}
                               >
                                 {aud.label}
                               </button>
                             ))}
                           </div>
                         </div>

                         <div>
                           <span className="font-bold text-[10px] text-gray-400 uppercase tracking-wider block mb-0.5">3. Live Video Filter</span>
                           <div className="grid grid-cols-5 gap-0.5 font-mono text-[8px]">
                             {[
                               { id: 'none', label: 'None' },
                               { id: 'vhs', label: 'VHS' },
                               { id: 'scanline', label: 'CRT' },
                               { id: 'sepia', label: 'Sepia' },
                               { id: 'grain', label: 'Grain' }
                             ].map(f => (
                               <button
                                 key={f.id}
                                 onClick={() => setLiveFilter(f.id as any)}
                                 className={`py-1 border rounded font-bold ${liveFilter === f.id ? 'bg-green-100 border-green-400 text-green-700' : 'bg-white'}`}
                               >
                                 {f.label}
                               </button>
                             ))}
                           </div>
                         </div>

                         <button onClick={toggleCamera} className={`w-full py-1.5 font-bold text-[10px] border rounded transition-all ${isCameraActive ? 'bg-red-50 text-red-600 border-red-300' : 'bg-white'}`}>
                           {isCameraActive ? '📷 Turn Camera Off' : '📷 Turn Camera On'}
                         </button>

                         <button
                           onClick={handleStartLive}
                           className="retro-blue-button w-full py-2 font-bold text-[11px] bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 border-red-700 text-white flex items-center justify-center gap-1.5"
                         >
                           🔴 Start Live Broadcast
                         </button>
                       </div>
                     </div>
                   ) : (
                     // MODE B: Active Live Broadcast Simulator (Phones Screen Style)
                     <div className="relative w-[250px] h-[440px] bg-neutral-950 rounded-[22px] border-[8px] border-neutral-950 overflow-hidden shadow-xl flex flex-col justify-between">
                       <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-16 h-3 bg-neutral-950 rounded-full z-40 pointer-events-none" />
                       
                       {/* BACKDROP VIDEO / FALLBACK */}
                       <div className="absolute inset-0 w-full h-full z-0 bg-neutral-950">
                         {isCameraActive ? (
                           <video 
                             ref={liveVideoRef} 
                             autoPlay 
                             muted
                             playsInline 
                             className="absolute inset-0 w-full h-full object-cover transform -scale-x-100" 
                             style={{ 
                               filter: liveFilter === 'vhs' ? 'contrast(1.2) saturate(1.4) hue-rotate(10deg) brightness(1.1)' :
                                       liveFilter === 'scanline' ? 'contrast(1.15) brightness(1.05)' :
                                       liveFilter === 'sepia' ? 'sepia(0.8) contrast(1.1)' :
                                       liveFilter === 'grain' ? 'grayscale(0.3) contrast(1.3)' : 'none'
                             }}
                           />
                         ) : (
                           <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#1c0826] to-[#040108]">
                             <div className="w-12 h-12 rounded-full border border-red-500/30 flex items-center justify-center animate-pulse mb-1">
                               <span className="text-xl">📡</span>
                             </div>
                             <span className="text-[9px] font-mono font-bold text-red-500 uppercase tracking-wider">Broadcasting Live</span>
                             <div className="absolute inset-x-0 bottom-1/4 flex flex-row h-1 opacity-25">
                               {['#ff0000', '#00ff00', '#0000ff', '#ffff00'].map((bc, i) => <div key={i} className="flex-1" style={{ backgroundColor: bc }} />)}
                             </div>
                           </div>
                         )}
                       </div>

                       {/* FX FILTER OVERLAYS */}
                       {liveFilter === 'scanline' && (
                         <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[size:100%_4px] pointer-events-none z-10" />
                       )}
                       {liveFilter === 'vhs' && (
                         <>
                           <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[size:100%_6px] pointer-events-none z-10 opacity-30 animate-pulse" />
                           <div className="absolute top-12 left-3 font-mono text-[8px] text-green-400 z-10">LIVE REC 📼</div>
                         </>
                       )}

                       {/* FLOATING HEARTS LAYER */}
                       <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                         {liveFlyingHearts.map(heart => (
                           <div
                             key={heart.id}
                             className="absolute text-red-500 text-lg animate-fly-heart"
                             style={{
                               bottom: '50px',
                               left: `${heart.left}%`,
                               transform: `scale(${heart.scale}) rotate(${heart.rotation}deg)`,
                             }}
                           >
                             ❤️
                           </div>
                         ))}
                       </div>

                       {/* FOREGROUND INTERACTIVE CONTENT OVERLAYS */}
                       <div className="absolute top-0 left-0 right-0 bottom-[68px] z-20 flex flex-col justify-between p-2 pt-5 pointer-events-none">
                         
                         {/* TOP HEADER STATUS */}
                         <div className="w-full flex justify-between items-center pointer-events-auto bg-gradient-to-b from-black/80 to-transparent p-1.5 rounded-lg">
                           <div className="flex items-center gap-1">
                             <span className="bg-red-600 text-white font-black text-[8px] px-1.5 py-0.5 rounded animate-pulse shadow">LIVE</span>
                             <span className="bg-black/60 text-white text-[8px] font-mono px-1.5 py-0.5 rounded shadow">
                               {Math.floor(liveDuration / 60)}:{(liveDuration % 60).toString().padStart(2, '0')}
                             </span>
                           </div>
                           
                           <div className="flex items-center gap-1">
                             <span className="bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow">👤 {liveViewers}</span>
                             <span className="bg-pink-600/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow">❤️ {liveLikesCount}</span>
                           </div>
                         </div>

                         {/* MIDDLE AREA (PINNED COMMENT & NOTIFICATIONS) */}
                         <div className="flex-1 flex flex-col justify-end gap-1.5 mb-1">
                           {livePinnedText && (
                             <div className="pointer-events-auto bg-black/80 border border-blue-500/30 p-1.5 rounded text-[8px] text-white flex flex-col shadow-lg animate-bounce">
                               <span className="text-[6px] uppercase text-blue-400 font-bold tracking-wider flex items-center gap-0.5">📌 Pinned Comment</span>
                               <span className="line-clamp-2">{livePinnedText}</span>
                             </div>
                           )}

                           {/* BOTTOM COMMENTS LIST */}
                           <div className="pointer-events-auto bg-black/55 backdrop-blur-xs p-1.5 rounded-lg max-h-[135px] overflow-y-auto flex flex-col gap-1 border border-white/5">
                             {liveComments.slice(-5).map((lc) => (
                               <div 
                                 key={lc.id} 
                                 onClick={() => {
                                   setLivePinnedText(`@${lc.username}: ${lc.text}`);
                                   showTemporaryToast("Comment pinned!");
                                 }}
                                 className="hover:bg-white/10 p-1 rounded cursor-pointer transition-colors flex justify-between items-center group"
                                 title="Click to Pin comment"
                                >
                                 <span className="text-[8px] text-white leading-tight">
                                   <span className="font-extrabold text-purple-300 mr-1">@{lc.username}</span> 
                                   {lc.text}
                                 </span>
                                 <span className="text-[6px] text-blue-300 opacity-0 group-hover:opacity-100 uppercase font-mono tracking-wide">Pin</span>
                               </div>
                             ))}
                           </div>
                         </div>
                       </div>

                       {/* BOTTOM INPUT AND CONTROLS PANEL */}
                       <div className="p-2 bg-neutral-950 border-t border-neutral-900 z-30 flex flex-col gap-1">
                         <div className="flex gap-1 items-center">
                           <form
                             onSubmit={(e) => {
                               e.preventDefault();
                               if (liveCommentInputText.trim()) {
                                 setLiveComments(prev => [...prev, { id: Date.now(), username: authUser?.username || 'user', text: liveCommentInputText.trim() }]);
                                 setLiveCommentInputText('');
                               }
                             }}
                             className="flex-1 flex gap-1"
                           >
                             <input 
                               type="text" 
                               value={liveCommentInputText}
                               onChange={(e) => setLiveCommentInputText(e.target.value)}
                               className="flex-1 bg-neutral-900 border border-neutral-800 rounded-full px-2.5 py-1 text-[9px] text-white outline-none placeholder-gray-500 focus:border-purple-500" 
                               placeholder="Type a comment..." 
                             />
                             <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-2.5 py-1 text-[8px] font-bold">Send</button>
                           </form>

                           {/* INTERACTIVE TAP HEART LIKE BUTTON */}
                           <button
                             onClick={() => {
                               setLiveLikesCount(prev => prev + 1);
                               const count = 3;
                               const newHearts = Array.from({ length: count }).map((_, i) => ({
                                 id: Date.now() + i + Math.random(),
                                 left: Math.random() * 30 + 55, // float around the bottom right heart button area
                                 scale: Math.random() * 0.4 + 0.8,
                                 rotation: Math.random() * 40 - 20,
                                 delay: i * 0.1
                               }));
                               setLiveFlyingHearts(prev => [...prev, ...newHearts]);
                               setTimeout(() => {
                                 setLiveFlyingHearts(prev => prev.filter(h => !newHearts.some(nh => nh.id === h.id)));
                               }, 2000);
                             }}
                             className="w-7 h-7 bg-red-600 hover:bg-red-700 active:scale-90 text-white rounded-full flex items-center justify-center text-xs shadow-md transition-transform duration-75 pointer-events-auto"
                             title="Double tap or tap to send hearts!"
                           >
                             ❤️
                           </button>
                         </div>

                         <div className="flex items-center justify-between text-[8px] text-neutral-400 mt-0.5">
                           <button 
                             onClick={() => {
                               const filters: Array<'none' | 'vhs' | 'scanline' | 'sepia' | 'grain'> = ['none', 'vhs', 'scanline', 'sepia', 'grain'];
                               const next = filters[(filters.indexOf(liveFilter) + 1) % filters.length];
                               setLiveFilter(next);
                             }}
                             className="bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-white text-[7px]"
                           >
                             🎭 FX: {liveFilter.toUpperCase()}
                           </button>
                           
                           {livePinnedText && (
                             <button onClick={() => setLivePinnedText('')} className="text-red-400 hover:underline text-[7px]">Clear Pin</button>
                           )}

                           <button 
                             onClick={() => {
                               setLiveStats({
                                 duration: liveDuration,
                                 maxViewers: liveViewers + 5,
                                 commentsCount: liveComments.length,
                                 followersGained: 1 + Math.floor(Math.random() * 3)
                               });
                               setShowLiveEndSummary(true);
                               handleEndLive();
                             }} 
                             className="bg-red-600 hover:bg-red-700 text-white font-bold px-2.5 py-0.5 rounded text-[8px]"
                           >
                             End Live
                           </button>
                         </div>
                       </div>
                     </div>
                   )}
                 </div>
               )}

               {/* Live Finish summary overlay */}
               {showLiveEndSummary && liveStats && (
                 <div className="fixed inset-0 z-[120] bg-black/85 flex items-center justify-center p-4">
                   <div className="vintage-panel p-5 bg-[#fdfdfd] max-w-[280px] w-full text-center flex flex-col gap-3 shadow-2xl border-2 border-red-500">
                     <div className="text-[32px]">🏁</div>
                     <h4 className="font-extrabold text-[13px] text-gray-800 uppercase tracking-wider">Live Broadcast Finished</h4>
                     
                     <div className="grid grid-cols-2 gap-2 border-y border-gray-200 py-2.5 my-1 text-left text-[10px]">
                       <div className="flex flex-col"><span className="text-gray-400 text-[8px] font-bold">Duration</span><span className="font-mono font-bold text-gray-800">{Math.floor(liveStats.duration / 60)}m {liveStats.duration % 60}s</span></div>
                       <div className="flex flex-col"><span className="text-gray-400 text-[8px] font-bold">Peak Viewers</span><span className="font-mono font-bold text-gray-800">👤 {liveStats.maxViewers}</span></div>
                       <div className="flex flex-col"><span className="text-gray-400 text-[8px] font-bold">Comments</span><span className="font-mono font-bold text-gray-800">💬 {liveStats.commentsCount}</span></div>
                       <div className="flex flex-col"><span className="text-gray-400 text-[8px] font-bold">New Followers</span><span className="font-mono font-bold text-green-600">📈 {liveStats.followersGained}</span></div>
                     </div>

                     <button onClick={() => { setShowLiveEndSummary(false); setLiveStats(null); }} className="retro-blue-button py-1.5 text-[10px] font-bold w-full">Done & Exit</button>
                   </div>
                 </div>
               )}
            </div>
          )}{activeView === 'Profile' && (() => {
            const profilePosts = feedPosts.filter(p => p.user?.username === authUser?.username);
            return (
            <div className="vintage-panel bg-[#fdfdfd]">
               <div className="p-6 border-b border-[#ccc] flex gap-6">
                 <img src={authUser?.profilePic || `https://i.pravatar.cc/150?u=${authUser?.username}`} className="w-[120px] h-[120px] border border-[#ccc] shadow-[2px_2px_5px_rgba(0,0,0,0.2)] rounded-full object-cover" alt="Profile" />
                 <div className="flex flex-col justify-center gap-3">
                   <div className="flex items-center gap-4">
                     <h2 className="text-[20px] font-bold text-[#333] flex items-center gap-1">
                       {authUser?.username}
                       {isProfessionalAccount && (
                         <svg aria-label="Verified" className="x1lliihq x1n2onr6" fill="#3897f0" height="18" role="img" viewBox="0 0 40 40" width="18">
                           <title>Verified</title>
                           <path d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z" fillRule="evenodd"></path>
                         </svg>
                       )}
                     </h2>
                     <button className="retro-button px-4 py-1 text-[11px] font-bold">Edit Profile</button>
                     <button onClick={() => setActiveView('Avatar')} className="retro-button px-4 py-1 text-[11px] font-bold">Edit Avatar</button>
                     <button onClick={() => setActiveView('Settings')} className="retro-button px-2 py-1 text-[11px]">⚙️</button>
                   </div>
                   <div className="flex gap-4 text-[13px]">
                     <span><span className="font-bold">{profilePosts.length}</span> posts</span>
                     <span onClick={() => setActiveFollowModal('followers')} className="cursor-pointer hover:underline text-blue-600 font-bold"><span className="font-bold">{followersCount}</span> followers</span>
                     <span onClick={() => setActiveFollowModal('following')} className="cursor-pointer hover:underline text-blue-600 font-bold"><span className="font-bold">{followingCount}</span> following</span>
                   </div>
                   <div className="text-[12px]">
                     <div className="font-bold">{authUser?.fullName}</div>
                     <div className="whitespace-pre-wrap">{authUser?.bio}</div>
                     {authUser?.website && <a href={authUser?.website.startsWith('http') ? authUser.website : `https://${authUser.website}`} target="_blank" rel="noopener noreferrer" className="vintage-link font-bold block mt-0.5">{authUser?.website}</a>}
                   </div>
                 </div>
               </div>
               
               {/* Story Highlights */}
               <div className="p-4 border-b border-[#ccc] flex gap-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                 {profileHighlights.map((h) => (
                   <div 
                     key={h.id} 
                     onClick={() => {
                       setActiveHighlight({
                         id: h.id,
                         name: h.name,
                         stories: h.stories,
                         index: 0
                       });
                     }}
                     className="flex flex-col items-center gap-1 cursor-pointer shrink-0 group"
                   >
                     <div className="w-[60px] h-[60px] rounded-full border-2 border-amber-500/80 p-[2px] bg-white flex items-center justify-center overflow-hidden transition-all group-hover:scale-105 active:scale-95 shadow-sm">
                       <div className="w-full h-full rounded-full bg-cover bg-center" style={{backgroundImage: `url(${h.img})`}} />
                     </div>
                     <span className="text-[10px] font-bold text-[#333] group-hover:text-blue-600 transition-colors">{h.name}</span>
                   </div>
                 ))}
                 
                 {/* "New" button to create highlight */}
                 <div 
                   onClick={() => {
                     setIsCreateHighlightOpen(true);
                     setSelectedStoriesForHighlight([]);
                     setNewHighlightName('');
                   }}
                   className="flex flex-col items-center gap-1 cursor-pointer shrink-0 group"
                 >
                   <div className="w-[60px] h-[60px] rounded-full border border-dashed border-[#999] p-[2px] bg-[#f0f0f0] flex items-center justify-center overflow-hidden transition-all group-hover:scale-105 group-hover:border-blue-500 active:scale-95 group-hover:bg-blue-50/50">
                     <span className="text-[24px] text-[#777] font-light group-hover:text-blue-500 group-hover:font-medium">+</span>
                   </div>
                   <span className="text-[10px] font-bold text-[#666] group-hover:text-blue-500">New</span>
                 </div>
               </div>

               <div className="p-1 flex justify-center border-b border-[#ccc] bg-[#f0f0f0] gap-8">
                 <button 
                   onClick={() => setProfileTab('POSTS')}
                   className={`px-4 py-1.5 font-bold text-[11px] transition-all cursor-pointer focus:outline-none ${profileTab === 'POSTS' ? 'text-[#333] border-b-2 border-[#333]' : 'text-[#999] hover:text-[#333]'}`}
                 >
                   POSTS
                 </button>
                 <button 
                   onClick={() => setProfileTab('REELS')}
                   className={`px-4 py-1.5 font-bold text-[11px] transition-all cursor-pointer focus:outline-none ${profileTab === 'REELS' ? 'text-[#333] border-b-2 border-[#333]' : 'text-[#999] hover:text-[#333]'}`}
                 >
                   REELS
                 </button>
                 <button 
                   onClick={() => setProfileTab('TAGGED')}
                   className={`px-4 py-1.5 font-bold text-[11px] transition-all cursor-pointer focus:outline-none ${profileTab === 'TAGGED' ? 'text-[#333] border-b-2 border-[#333]' : 'text-[#999] hover:text-[#333]'}`}
                 >
                   TAGGED
                 </button>
                 <button 
                   onClick={() => setProfileTab('SAVED')}
                   className={`px-4 py-1.5 font-bold text-[11px] transition-all cursor-pointer focus:outline-none ${profileTab === 'SAVED' ? 'text-[#333] border-b-2 border-[#333]' : 'text-[#999] hover:text-[#333]'}`}
                 >
                   SAVED 🔖
                 </button>
               </div>

               <div className="p-4">
                 {profileTab === 'POSTS' && (
                   <div className="grid grid-cols-3 gap-2">
                     {profilePosts.map((post, i) => (
                       <div 
                         key={i} 
                         onClick={() => {
                           setSelectedProfilePost({
                             image: post.contentImg,
                             caption: post.caption,
                             likes: post.likes,
                             comments: post.comments
                           });
                         }}
                         className="aspect-square border border-[#ccc] shadow-sm cursor-pointer hover:opacity-80 transition-all hover:scale-102 relative overflow-hidden" 
                       >
                         {post.contentFileType === 'video' ? (
                           <video src={post.contentImg} className="w-full h-full object-cover" style={{ filter: 'contrast(1.1) saturate(1.1) sepia(0.15)' }} autoPlay muted loop playsInline />
                         ) : (
                           <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${post.contentImg})`, filter: 'contrast(1.1) saturate(1.1) sepia(0.15)' }} />
                         )}
                         {post.contentFileType === 'video' && (
                           <div className="absolute top-1 right-1 text-white bg-black/50 rounded p-0.5 z-10"><span className="text-[10px]">▶</span></div>
                         )}
                       </div>
                     ))}
                     {profilePosts.length === 0 && (
                       <div className="col-span-3 py-12 text-center text-gray-400 font-bold text-[12px]">No posts yet</div>
                     )}
                   </div>
                 )}

                 {profileTab === 'REELS' && (() => {
                   const myReels = reels.filter(r => r.username === authUser?.username);
                   return (
                     <div>
                       {myReels.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-12 text-center text-[#999]">
                           <span className="text-3xl mb-2">🎬</span>
                           <span className="text-[12px] font-bold">No Reels Yet</span>
                           <p className="text-[10px] text-[#bbb] mt-1">Create and share a Reel to see it here!</p>
                           <button 
                             onClick={() => {
                               setCreateTab('REEL');
                               setActiveView('Create');
                             }}
                             className="retro-blue-button mt-4 px-4 py-1.5 text-[10px] font-bold"
                           >
                             Create a Reel
                           </button>
                         </div>
                       ) : (
                         <div className="grid grid-cols-3 gap-2">
                           {myReels.map((reel) => (
                             <div 
                               key={reel.id}
                               onClick={() => {
                                 const globalIdx = reels.findIndex(r => r.id === reel.id);
                                 if (globalIdx !== -1) {
                                   setActiveReelIndex(globalIdx);
                                   setActiveView('Reels');
                                 }
                               }}
                               className="aspect-[9/16] border border-[#ccc] shadow-sm cursor-pointer relative group overflow-hidden bg-black"
                             >
                               {reel.image?.match(/\.(mp4|webm|ogg)$/i) ? (
                                 <video src={reel.image} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                               ) : (
                                 <img src={reel.image} className="w-full h-full object-cover" alt="reel" />
                               )}
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-bold gap-1.5 z-10">
                                 <span>❤️ {reel.likes}</span>
                                 <span>💬 {reelCommentsList[reel.id] ? reelCommentsList[reel.id].length : reel.commentsCount}</span>
                               </div>
                               <div className="absolute bottom-2 left-2 text-[14px] text-white/90 drop-shadow-md z-10 pointer-events-none">▶</div>
                               <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                             </div>
                           ))}
                         </div>
                       )}
                     </div>
                   );
                 })()}

                 {profileTab === 'SAVED' && (() => {
                   const savedReels = reels.filter(r => savedReelIds.includes(r.id));
                   return (
                     <div>
                       {savedReels.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-12 text-center text-[#999]">
                           <span className="text-3xl mb-2">🔖</span>
                           <span className="text-[12px] font-bold">No Saved Items Yet</span>
                           <p className="text-[10px] text-[#bbb] mt-1">Bookmark Reels or posts to keep them in your private collection.</p>
                           <button 
                             onClick={() => setActiveView('Reels')}
                             className="retro-button mt-4 px-4 py-1.5 text-[10px] font-bold"
                           >
                             Browse Reels
                           </button>
                         </div>
                       ) : (
                         <div className="grid grid-cols-3 gap-2">
                           {savedReels.map((reel) => (
                             <div 
                               key={reel.id}
                               onClick={() => {
                                 const globalIdx = reels.findIndex(r => r.id === reel.id);
                                 if (globalIdx !== -1) {
                                   setActiveReelIndex(globalIdx);
                                   setActiveView('Reels');
                                 }
                               }}
                               className="aspect-[9/16] border border-[#ccc] shadow-sm cursor-pointer relative group overflow-hidden bg-black"
                             >
                               {reel.image?.match(/\.(mp4|webm|ogg)$/i) ? (
                                 <video src={reel.image} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                               ) : (
                                 <img src={reel.image} className="w-full h-full object-cover" alt="reel" />
                               )}
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-bold gap-1.5 z-10">
                                 <span>❤️ {reel.likes}</span>
                                 <span>💬 {reelCommentsList[reel.id] ? reelCommentsList[reel.id].length : reel.commentsCount}</span>
                                </div>
                               <div className="absolute bottom-2 left-2 text-[14px] text-white/90 drop-shadow-md z-10 pointer-events-none">▶</div>
                               <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                             </div>
                           ))}
                         </div>
                       )}
                     </div>
                   );
                 })()}

                 {profileTab === 'TAGGED' && (
                   <div className="grid grid-cols-3 gap-2">
                     {[
                       { 
                         img: 'https://images.unsplash.com/photo-1542931287-023b922fa89b?auto=format&fit=crop&q=80&w=300&h=300',
                         author: 'kevin',
                         caption: `Chilling at the vintage vinyl store with @${authUser?.username || 'user'}! 🎵`
                       },
                       { 
                         img: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=300&h=300',
                         author: 'vintage_cars',
                         caption: `Spotted this gorgeous vintage beast today with @${authUser?.username || 'user'} 🚗💨`
                       },
                       { 
                         img: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=300&h=300',
                         author: 'sarah',
                         caption: `Retro walk down memory lane. Portra 400 shot of @${authUser?.username || 'user'} 📷`
                       }
                     ].map((tagged, idx) => (
                       <div 
                         key={idx}
                         onClick={() => {
                           setSelectedProfilePost({
                             image: tagged.img,
                             caption: tagged.caption,
                             likes: 120 + idx * 35,
                             comments: [
                               { username: tagged.author, text: 'Awesome day! ✨' },
                               { username: authUser?.username || 'user', text: 'We need to do this again soon! ❤️' }
                             ]
                           });
                         }}
                         className="aspect-square bg-cover bg-center border border-[#ccc] shadow-sm cursor-pointer hover:opacity-80 transition-opacity relative group"
                         style={{ backgroundImage: `url(${tagged.img})`, filter: 'contrast(1.1) saturate(1.1) sepia(0.15)' }}
                       >
                         <div className="absolute top-1.5 left-1.5 bg-black/60 rounded px-1.5 py-0.5 text-[7px] text-white font-mono flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           👤 @{tagged.author}
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            </div>
          );
          })()}

          {activeView === 'Avatar' && (
            <div className="vintage-panel p-6 bg-[#fdfdfd] flex flex-col items-center">
               <h3 className="font-bold text-[#333] text-[16px] mb-6 border-b border-[#ccc] pb-2 w-full text-center">Customize Your Avatar</h3>
               
               <div className="flex gap-8 w-full max-w-[600px]">
                 <div className="w-[200px] h-[300px] border border-[#ccc] bg-[#f0f0f0] shadow-[inset_0_0_10px_rgba(0,0,0,0.1)] flex items-center justify-center relative">
                   <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&q=80&w=300&h=500)', filter: 'contrast(1.2) grayscale(0.2) saturate(0.8)' }} />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                   <div className="z-10 font-bold text-white text-[14px] bg-black/50 px-2 py-1 rounded">3D Preview</div>
                 </div>
                 
                 <div className="flex-1 flex flex-col gap-4 text-[12px]">
                   <div className="vintage-panel p-3 bg-[#e8e8e8]">
                      <div className="font-bold text-[#333] mb-2">Skin Tone</div>
                      <div className="flex gap-2">
                        {['#fbd9c4', '#e2b392', '#c28b61', '#885532', '#4b2a14'].map(color => (
                          <div key={color} className="w-8 h-8 rounded-full border border-[#999] cursor-pointer hover:border-[#333] hover:shadow-md" style={{ backgroundColor: color }}></div>
                        ))}
                      </div>
                   </div>
                   
                   <div className="vintage-panel p-3 bg-[#e8e8e8]">
                      <div className="font-bold text-[#333] mb-2">Hairstyle</div>
                      <div className="grid grid-cols-4 gap-2">
                         {['Short', 'Curly', 'Long', 'Bald', 'Spiky', 'Wavy', 'Braids', 'Fade'].map(style => (
                           <button key={style} className="retro-button text-[10px] py-1">{style}</button>
                         ))}
                      </div>
                   </div>
                   
                   <div className="vintage-panel p-3 bg-[#e8e8e8]">
                      <div className="font-bold text-[#333] mb-2">Outfit</div>
                      <div className="grid grid-cols-3 gap-2">
                         {['Casual', 'Vintage', 'Formal', 'Sporty', 'Street', '90s'].map(style => (
                           <button key={style} className="retro-button text-[10px] py-1">{style}</button>
                         ))}
                      </div>
                   </div>
                   
                   <div className="flex justify-end gap-3 mt-4">
                     <button onClick={() => setActiveView('Profile')} className="retro-button px-4 py-1.5 font-bold">Cancel</button>
                     <button onClick={() => setActiveView('Profile')} className="retro-blue-button px-6 py-1.5 font-bold shadow-sm">Save Avatar</button>
                   </div>
                 </div>
               </div>
            </div>
          )}

          {activeView === 'Settings' && (
            <div className="vintage-panel bg-[#fdfdfd] flex h-[500px]">
               <div className="w-[180px] border-r border-[#ccc] bg-[#e0e0e0] flex flex-col text-[12px]">
                 <div onClick={() => setActiveSettingsTab('Edit Profile')} className={`p-3 font-bold cursor-pointer border-b border-[#ccc] ${activeSettingsTab === 'Edit Profile' ? 'bg-[#fff] border-l-4 border-l-[#333]' : 'hover:bg-[#d0d0d0]'}`}>Edit Profile</div>
                 <div onClick={() => setActiveSettingsTab('Change Password')} className={`p-3 font-bold cursor-pointer border-b border-[#ccc] ${activeSettingsTab === 'Change Password' ? 'bg-[#fff] border-l-4 border-l-[#333]' : 'hover:bg-[#d0d0d0]'}`}>Change Password</div>
                 <div onClick={() => setActiveSettingsTab('Privacy and Security')} className={`p-3 font-bold cursor-pointer border-b border-[#ccc] ${activeSettingsTab === 'Privacy and Security' ? 'bg-[#fff] border-l-4 border-l-[#333]' : 'hover:bg-[#d0d0d0]'}`}>Privacy and Security</div>
                 <div onClick={() => setActiveSettingsTab('Login Activity')} className={`p-3 font-bold cursor-pointer border-b border-[#ccc] ${activeSettingsTab === 'Login Activity' ? 'bg-[#fff] border-l-4 border-l-[#333]' : 'hover:bg-[#d0d0d0]'}`}>Login Activity</div>
                 <div onClick={() => setActiveSettingsTab('Emails from Instagram')} className={`p-3 font-bold cursor-pointer border-b border-[#ccc] ${activeSettingsTab === 'Emails from Instagram' ? 'bg-[#fff] border-l-4 border-l-[#333]' : 'hover:bg-[#d0d0d0]'}`}>Emails from Instagram</div>
                 <div onClick={() => setActiveSettingsTab('Time Management')} className={`p-3 font-bold cursor-pointer border-b border-[#ccc] ${activeSettingsTab === 'Time Management' ? 'bg-[#fff] border-l-4 border-l-[#333]' : 'hover:bg-[#d0d0d0]'}`}>Time Management</div>
               </div>
               <div className="flex-1 p-6 flex flex-col gap-4 text-[12px] overflow-y-auto">
                 {activeSettingsTab === 'Edit Profile' && (
                   <>
                     <div className="flex items-center gap-6 mb-4">
                       <img src={authUser?.profilePic || `https://i.pravatar.cc/150?u=${authUser?.username}`} className="w-12 h-12 border border-[#ccc] object-cover" alt="Profile" />
                       <div className="flex flex-col">
                         <span className="font-bold text-[16px] flex items-center gap-1">
                           {authUser?.username}
                           {isProfessionalAccount && (
                             <svg aria-label="Verified" className="x1lliihq x1n2onr6" fill="#3897f0" height="14" role="img" viewBox="0 0 40 40" width="14">
                               <title>Verified</title>
                               <path d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z" fillRule="evenodd"></path>
                             </svg>
                           )}
                         </span>
                         <label className="text-[#0000EE] font-bold self-start mt-1 hover:underline cursor-pointer">
                           Change Profile Photo
                           <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                             if (!e.target.files || !e.target.files[0]) return;
                             const file = e.target.files[0];
                             const formData = new FormData();
                             formData.append('media', file);
                             try {
                               const res = await axios.post(`${API_BASE}/api/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                               const newPic = res.data.url;
                               await axios.put(`${API_BASE}/api/users/profile', { profilePic: newPic }, { headers: { Authorization: `Bearer ${token}` } });
                               setAuthUser((prev: any) => prev ? { ...prev, profilePic: newPic } : null);
                               showTemporaryToast("Profile photo updated!");
                             } catch (err) {
                               console.error(err);
                               showTemporaryToast("Failed to upload photo");
                             }
                           }} />
                         </label>
                       </div>
                     </div>
                     <div className="flex items-center gap-4">
                       <label className="font-bold text-right w-[100px]">Name</label>
                       <input type="text" className="vintage-input flex-1 px-2 py-1" value={editFullName} onChange={(e) => setEditFullName(e.target.value)} />
                     </div>
                     <div className="flex items-center gap-4">
                       <label className="font-bold text-right w-[100px]">Username</label>
                       <input type="text" className="vintage-input flex-1 px-2 py-1" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} />
                     </div>
                     <div className="flex items-center gap-4">
                       <label className="font-bold text-right w-[100px]">Website</label>
                       <input type="text" className="vintage-input flex-1 px-2 py-1" value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} />
                     </div>
                     <div className="flex items-start gap-4">
                       <label className="font-bold text-right w-[100px] mt-1">Bio</label>
                       <textarea className="vintage-input flex-1 px-2 py-1 h-[60px]" value={editBio} onChange={(e) => setEditBio(e.target.value)}></textarea>
                     </div>
                     <div className="flex items-center gap-4">
                       <label className="font-bold text-right w-[100px]">Status</label>
                       <input 
                         type="text" 
                         className="vintage-input flex-1 px-2 py-1" 
                         value={customStatus} 
                         onChange={(e) => setCustomStatus(e.target.value)} 
                         placeholder="What's on your mind?" 
                       />
                     </div>
                     <div className="flex items-center gap-4 mt-2">
                       <div className="w-[100px]"></div>
                       <button 
                         onClick={async () => {
                           try {
                             const payload = { fullName: editFullName, username: editUsername, website: editWebsite, bio: editBio };
                             const res = await axios.put(`${API_BASE}/api/users/profile', payload, { headers: { Authorization: `Bearer ${token}` } });
                             if (customStatus !== authUser?.customStatus) {
                               await updateRetroProfileBackend({ customStatus });
                             }
                             setAuthUser(res.data.data);
                             showTemporaryToast("Profile updated successfully!");
                           } catch (err: any) {
                             console.error(err);
                             showTemporaryToast(err.response?.data?.message || "Failed to update profile");
                           }
                         }}
                         className="retro-blue-button px-4 py-1.5 font-bold shadow-sm w-max"
                       >
                         Submit
                       </button>
                     </div>
                   </>
                 )}

                 {activeSettingsTab === 'Change Password' && (
                   <div className="flex flex-col gap-5 max-w-[400px]">
                     <div className="flex items-center gap-6 mb-2">
                       <img src={authUser?.profilePic || `https://i.pravatar.cc/150?u=${authUser?.username}`} className="w-12 h-12 border border-[#ccc] object-cover" alt="Profile" />
                       <span className="font-bold text-[18px] flex items-center gap-1">
                         {authUser?.username}
                         {isProfessionalAccount && (
                           <svg aria-label="Verified" className="x1lliihq x1n2onr6" fill="#3897f0" height="16" role="img" viewBox="0 0 40 40" width="16">
                             <title>Verified</title>
                             <path d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z" fillRule="evenodd"></path>
                           </svg>
                         )}
                       </span>
                     </div>
                     
                     <div className="flex flex-col gap-1">
                       <label className="font-bold">Old Password</label>
                       <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="vintage-input px-3 py-1.5 bg-[#f9f9f9]" />
                     </div>
                     <div className="flex flex-col gap-1">
                       <label className="font-bold">New Password</label>
                       <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="vintage-input px-3 py-1.5 bg-[#f9f9f9]" />
                     </div>
                     <div className="flex flex-col gap-1">
                       <label className="font-bold">Confirm New Password</label>
                       <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="vintage-input px-3 py-1.5 bg-[#f9f9f9]" />
                     </div>
                     
                     <div className="flex flex-col gap-3 mt-2">
                       <button 
                         onClick={async () => {
                           if (!oldPassword || !newPassword || !confirmNewPassword) return showTemporaryToast("All fields are required");
                           if (newPassword !== confirmNewPassword) return showTemporaryToast("Passwords don't match");
                           try {
                             await axios.put(`${API_BASE}/api/users/password', { oldPassword, newPassword, confirmNewPassword }, { headers: { Authorization: `Bearer ${token}` } });
                             showTemporaryToast("Password updated successfully!");
                             setOldPassword('');
                             setNewPassword('');
                             setConfirmNewPassword('');
                           } catch (err: any) {
                             console.error(err);
                             showTemporaryToast(err.response?.data?.message || "Failed to update password");
                           }
                         }}
                         className="retro-blue-button px-4 py-1.5 font-bold shadow-sm w-max"
                       >
                         Change Password
                       </button>
                       <a href="#" className="vintage-link font-bold text-[#0000EE]">Forgot Password?</a>
                     </div>
                   </div>
                 )}

                 {activeSettingsTab === 'Privacy and Security' && (
                   <div className="flex flex-col gap-6">
                     <div>
                       <h3 className="font-bold text-[16px] mb-2 border-b border-[#ccc] pb-1">Account Privacy</h3>
                       <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-3">
                           <input type="radio" name="accountPrivacy" id="publicAccount" className="cursor-pointer" checked={!isPrivateAccount} onChange={async () => {
                             setIsPrivateAccount(false);
                             try { await axios.put(`${API_BASE}/api/users/privacy', { isPrivate: false }, { headers: { Authorization: `Bearer ${token}` } }); showTemporaryToast("Account set to Public"); } catch (e) { console.error(e); }
                           }} />
                           <label htmlFor="publicAccount" className="font-bold cursor-pointer">Public Account</label>
                         </div>
                         <p className="text-[#666] text-[11px] ml-6 mb-2">Anyone on or off Instagram can see your profile and posts.</p>

                         <div className="flex items-center gap-3">
                           <input type="radio" name="accountPrivacy" id="privateAccount" className="cursor-pointer" checked={isPrivateAccount} onChange={async () => {
                             setIsPrivateAccount(true);
                             try { await axios.put(`${API_BASE}/api/users/privacy', { isPrivate: true }, { headers: { Authorization: `Bearer ${token}` } }); showTemporaryToast("Account set to Private"); } catch (e) { console.error(e); }
                           }} />
                           <label htmlFor="privateAccount" className="font-bold cursor-pointer">Private Account</label>
                         </div>
                         <p className="text-[#666] text-[11px] ml-6">When your account is private, only people you approve can see your photos and videos on Instagram. Your existing followers won't be affected.</p>
                       </div>
                     </div>

                     <div>
                       <h3 className="font-bold text-[16px] mb-2 border-b border-[#ccc] pb-1">Account Type</h3>
                       <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-3">
                           <input type="radio" name="accountType" id="personalAccount" className="cursor-pointer" checked={!isProfessionalAccount} onChange={async () => {
                             setIsProfessionalAccount(false);
                             try { await axios.put(`${API_BASE}/api/users/privacy', { accountType: 'personal' }, { headers: { Authorization: `Bearer ${token}` } }); showTemporaryToast("Switched to Personal Account"); } catch (e) { console.error(e); }
                           }} />
                           <label htmlFor="personalAccount" className="font-bold cursor-pointer">Personal Account</label>
                         </div>
                         
                         <div className="flex items-center gap-3">
                           <input type="radio" name="accountType" id="professionalAccount" className="cursor-pointer" checked={isProfessionalAccount} onChange={async () => {
                             setIsProfessionalAccount(true);
                             try { await axios.put(`${API_BASE}/api/users/privacy', { accountType: 'professional' }, { headers: { Authorization: `Bearer ${token}` } }); showTemporaryToast("Switched to Professional Account"); } catch (e) { console.error(e); }
                           }} />
                           <label htmlFor="professionalAccount" className="font-bold cursor-pointer">Professional Account</label>
                         </div>
                         <p className="text-[#666] text-[11px] ml-6">Get access to tools that can help you grow your audience and manage your business. <a href="#" className="vintage-link">Learn more</a></p>
                       </div>
                     </div>
                     
                     <div>
                       <h3 className="font-bold text-[16px] mb-2 border-b border-[#ccc] pb-1">Activity Status</h3>
                       <div className="flex items-center gap-3">
                         <input type="checkbox" id="activityStatus" checked={showActivityStatus} onChange={async (e) => {
                           const val = e.target.checked;
                           setShowActivityStatus(val);
                           try { await axios.put(`${API_BASE}/api/users/privacy', { showActivityStatus: val }, { headers: { Authorization: `Bearer ${token}` } }); } catch (e) { console.error(e); }
                         }} className="cursor-pointer" />
                         <label htmlFor="activityStatus" className="font-bold cursor-pointer">Show Activity Status</label>
                       </div>
                       <p className="text-[#666] text-[11px] mt-1 ml-6">Allow accounts you follow and anyone you message to see when you were last active on Instagram apps. When this is turned off, you won't be able to see the activity status of other accounts.</p>
                     </div>
                     
                     <div>
                       <h3 className="font-bold text-[16px] mb-2 border-b border-[#ccc] pb-1">Story Sharing</h3>
                       <div className="flex items-center gap-3">
                         <input type="checkbox" id="storySharing" checked={allowStorySharing} onChange={async (e) => {
                           const val = e.target.checked;
                           setAllowStorySharing(val);
                           try { await axios.put(`${API_BASE}/api/users/privacy', { allowStorySharing: val }, { headers: { Authorization: `Bearer ${token}` } }); } catch (e) { console.error(e); }
                         }} className="cursor-pointer" />
                         <label htmlFor="storySharing" className="font-bold cursor-pointer">Allow Sharing</label>
                       </div>
                       <p className="text-[#666] text-[11px] mt-1 ml-6">Let people share your story as messages.</p>
                     </div>
                   </div>
                 )}

                 {activeSettingsTab === 'Login Activity' && (
                   <div className="flex flex-col gap-5">
                     {loginSessions.filter(s => s.wasConfirmed === null && s.isActive).length > 0 && (
                       <>
                         <h3 className="font-bold text-[16px] border-b border-[#ccc] pb-1">Was This You?</h3>
                         {loginSessions.filter(s => s.wasConfirmed === null && s.isActive).map(session => (
                           <div key={session._id} className="border border-[#ccc] bg-[#f9f9f9] p-4 flex gap-4 items-center mb-2">
                             <div className="w-[100px] h-[70px] bg-[#ddd] border border-[#bbb] flex items-center justify-center">
                               <span className="text-[24px]">🗺️</span>
                             </div>
                             <div className="flex-1">
                               <div className="font-bold text-[14px]">{session.location || 'Unknown Location'}</div>
                               <div className="text-[#666]">{new Date(session.lastActive).toLocaleString()} · {session.device || 'Unknown Device'}</div>
                               <div className="flex gap-2 mt-2">
                                 <button onClick={async () => {
                                   try {
                                     await axios.put(`http://localhost:5000/api/users/sessions/${session._id}/confirm`, { wasConfirmed: true }, { headers: { Authorization: `Bearer ${token}` } });
                                     setLoginSessions(prev => prev.map(s => s._id === session._id ? { ...s, wasConfirmed: true } : s));
                                     showTemporaryToast("Session confirmed!");
                                   } catch (e) { console.error(e); }
                                 }} className="retro-button px-3 py-1 font-bold text-[11px]">This Was Me</button>
                                 <button onClick={async () => {
                                   try {
                                     await axios.put(`http://localhost:5000/api/users/sessions/${session._id}/confirm`, { wasConfirmed: false }, { headers: { Authorization: `Bearer ${token}` } });
                                     setLoginSessions(prev => prev.filter(s => s._id !== session._id));
                                     showTemporaryToast("Session removed & user logged out from that device");
                                   } catch (e) { console.error(e); }
                                 }} className="retro-button px-3 py-1 font-bold text-[11px] border-[#900] text-[#900]">This Wasn't Me</button>
                               </div>
                             </div>
                           </div>
                         ))}
                       </>
                     )}
                     
                     <h3 className="font-bold text-[16px] border-b border-[#ccc] pb-1 mt-4">Where You're Logged In</h3>
                     
                     <div className="flex flex-col">
                       {loginSessions.filter(s => s.isActive && s.wasConfirmed !== false).map((session, i) => (
                         <div key={session._id || i} className="flex justify-between items-center py-3 border-b border-[#eee]">
                           <div className="flex gap-4 items-center">
                             <div className="text-[24px] text-[#666]">{(session.device || '').includes('iPhone') || (session.device || '').includes('Mobile') ? '📱' : '💻'}</div>
                             <div>
                               <div className="font-bold">{session.location || 'Unknown Location'}</div>
                               <div className="text-[11px] text-[#666]">
                                 {new Date(session.lastActive).toLocaleString()} · {session.device || 'Unknown Device'}
                               </div>
                             </div>
                           </div>
                           <button onClick={async () => {
                             try {
                               await axios.delete(`http://localhost:5000/api/users/sessions/${session._id}`, { headers: { Authorization: `Bearer ${token}` } });
                               setLoginSessions(prev => prev.filter(s => s._id !== session._id));
                               showTemporaryToast("Logged out of session");
                             } catch (e) { console.error(e); }
                           }} className="retro-button px-3 py-1 text-[11px]">Log Out</button>
                         </div>
                       ))}
                       {loginSessions.filter(s => s.isActive && s.wasConfirmed !== false).length === 0 && (
                         <div className="py-3 text-[#666]">No active sessions found.</div>
                       )}
                     </div>
                   </div>
                 )}

                 {activeSettingsTab === 'Emails from Instagram' && (
                   <div className="flex flex-col gap-6">
                     <div>
                       <h3 className="font-bold text-[16px] mb-2 border-b border-[#ccc] pb-1">Security</h3>
                       <p className="text-[#666] text-[11px] mb-3">Security and login emails from Instagram in the last 14 days will appear here. You can use this list to verify which emails are actually from Instagram.</p>
                       
                       {emailsFromInsta.filter(e => e.category === 'security').length > 0 ? (
                         <div className="flex flex-col border border-[#ccc]">
                           {emailsFromInsta.filter(e => e.category === 'security').map(email => (
                             <div key={email._id} className="p-3 border-b border-[#ccc] flex justify-between items-center hover:bg-[#f0f0f0] cursor-pointer">
                               <div className="flex flex-col">
                                 <span className="font-bold">{email.subject}</span>
                                 <span className="text-[#666] text-[10px]">To: {authUser?.email}</span>
                               </div>
                               <span className="text-[#999] text-[10px]">{new Date(email.sentAt).toLocaleDateString()}</span>
                             </div>
                           ))}
                         </div>
                       ) : (
                         <div className="border border-[#ccc] bg-[#f9f9f9] p-3 text-center text-[#666] italic">
                           No recent security emails.
                         </div>
                       )}
                     </div>
                     
                     <div>
                       <h3 className="font-bold text-[16px] mb-2 border-b border-[#ccc] pb-1">Other Emails</h3>
                       <p className="text-[#666] text-[11px] mb-3">Other emails from Instagram in the last 14 days will appear here.</p>
                       
                       {emailsFromInsta.filter(e => e.category === 'other').length > 0 ? (
                         <div className="flex flex-col border border-[#ccc]">
                           {emailsFromInsta.filter(e => e.category === 'other').map(email => (
                             <div key={email._id} className="p-3 border-b border-[#ccc] flex justify-between items-center hover:bg-[#f0f0f0] cursor-pointer">
                               <div className="flex flex-col">
                                 <span className="font-bold">{email.subject}</span>
                                 <span className="text-[#666] text-[10px]">To: {authUser?.email}</span>
                               </div>
                               <span className="text-[#999] text-[10px]">{new Date(email.sentAt).toLocaleDateString()}</span>
                             </div>
                           ))}
                         </div>
                       ) : (
                         <div className="border border-[#ccc] bg-[#f9f9f9] p-3 text-center text-[#666] italic">
                           No other emails.
                         </div>
                       )}
                     </div>
                   </div>
                 )}

                 {activeSettingsTab === 'Time Management' && (
                   <div className="flex flex-col gap-6">
                     <div>
                       <h3 className="font-bold text-[16px] mb-2 border-b border-[#ccc] pb-1">Time on Instagram</h3>
                       <p className="text-[#666] text-[11px] mb-4">See how much time you spend on Instagram and set limits to help you manage your time.</p>
                       
                       <div className="flex flex-col gap-1 mb-6">
                         <div className="text-[28px] font-bold text-center">{timeSpentToday} m</div>
                         <div className="text-[#666] text-[11px] text-center">Daily Average</div>
                       </div>
                       
                       <div className="flex flex-col gap-4">
                         <div className="flex flex-col gap-1 border-b border-[#eee] pb-3">
                           <div className="flex justify-between items-center">
                             <span className="font-bold">Set daily time limit</span>
                             <select className="vintage-input px-2 py-1 bg-[#f9f9f9] text-[11px] cursor-pointer" value={dailyTimeLimit} onChange={async (e) => {
                               const val = parseInt(e.target.value);
                               setDailyTimeLimit(val);
                               try { await axios.put(`${API_BASE}/api/users/time-settings', { dailyTimeLimit: val }, { headers: { Authorization: `Bearer ${token}` } }); showTemporaryToast("Time settings updated"); } catch (err) { console.error(err); }
                             }}>
                               <option value={0}>Off</option>
                               <option value={15}>15 minutes</option>
                               <option value={30}>30 minutes</option>
                               <option value={45}>45 minutes</option>
                               <option value={60}>1 hour</option>
                               <option value={120}>2 hours</option>
                             </select>
                           </div>
                           <p className="text-[10px] text-[#666]">We'll send you a reminder when you've reached the time limit you set for yourself.</p>
                         </div>
                         
                         <div className="flex flex-col gap-1 border-b border-[#eee] pb-3">
                           <div className="flex justify-between items-center">
                             <span className="font-bold">Break reminder</span>
                             <select className="vintage-input px-2 py-1 bg-[#f9f9f9] text-[11px] cursor-pointer" value={breakReminder} onChange={async (e) => {
                               const val = parseInt(e.target.value);
                               setBreakReminder(val);
                               try { await axios.put(`${API_BASE}/api/users/time-settings', { breakReminder: val }, { headers: { Authorization: `Bearer ${token}` } }); showTemporaryToast("Time settings updated"); } catch (err) { console.error(err); }
                             }}>
                               <option value={0}>Off</option>
                               <option value={10}>Every 10 minutes</option>
                               <option value={20}>Every 20 minutes</option>
                               <option value={30}>Every 30 minutes</option>
                             </select>
                           </div>
                           <p className="text-[10px] text-[#666]">Schedule a reminder to take a break when you spend this amount of time at once on Instagram.</p>
                         </div>
                         
                         <div className="flex flex-col gap-1 pb-3">
                           <div className="flex justify-between items-center">
                             <span className="font-bold">Mute push notifications</span>
                             <input type="checkbox" className="cursor-pointer" checked={mutePushNotifications} onChange={async (e) => {
                               const val = e.target.checked;
                               setMutePushNotifications(val);
                               try { await axios.put(`${API_BASE}/api/users/time-settings', { mutePushNotifications: val }, { headers: { Authorization: `Bearer ${token}` } }); showTemporaryToast("Time settings updated"); } catch (err) { console.error(err); }
                             }} />
                           </div>
                           <p className="text-[10px] text-[#666]">Mute push notifications to focus on other things.</p>
                         </div>
                       </div>
                     </div>
                   </div>
                 )}
               </div>
            </div>
          )}

          {activeView === 'More' && (
            <div className="vintage-panel p-4 bg-[#fdfdfd] max-w-[300px] mx-auto mt-8 w-full">
               <h3 className="font-bold text-[#333] text-[14px] mb-3 border-b border-[#ccc] pb-1">More Options</h3>
               <div className="flex flex-col gap-2 text-[12px]">
                 <button onClick={() => { setActiveView('Settings'); setActiveSettingsTab('Edit Profile'); }} className="retro-button w-full py-1.5 font-bold text-left px-3">⚙️ Settings</button>
                 <button onClick={() => setActiveView('Your Activity')} className="retro-button w-full py-1.5 font-bold text-left px-3">⏱️ Your Activity</button>
                 <button onClick={() => setActiveView('Archive')} className="retro-button w-full py-1.5 font-bold text-left px-3">🕰️ Archive</button>
                 <button className="retro-button w-full py-1.5 font-bold text-left px-3">🔖 Saved</button>
                 <button onClick={() => setActiveView('Close Friends')} className="retro-button w-full py-1.5 font-bold text-left px-3">🟢 Close Friends</button>
                 <button onClick={() => setActiveView('Switch Appearance')} className="retro-button w-full py-1.5 font-bold text-left px-3">☀️ Switch Appearance</button>
                 <button onClick={() => setActiveView('Report a problem')} className="retro-button w-full py-1.5 font-bold text-left px-3">⚠️ Report a problem</button>
                 <div className="h-[1px] bg-[#ccc] my-1"></div>
                 <button onClick={() => setActiveView('Home')} className="retro-button w-full py-1.5 font-bold text-left px-3">Switch Accounts</button>
                 <button onClick={handleLogout} className="retro-button w-full py-1.5 font-bold text-left px-3 text-red-600">Log Out</button>
               </div>
            </div>
          )}

          {activeView === 'Your Activity' && (
            <div className="vintage-panel bg-[#fdfdfd] w-full max-w-[500px] mx-auto flex flex-col mt-4">
               <div className="p-4 border-b border-[#ccc] bg-[#f0f0f0]">
                 <h2 className="font-bold text-[18px]">Your Activity</h2>
                 <p className="text-[11px] text-[#666] mt-1">One place to manage your activity.</p>
               </div>
               <div className="flex flex-col text-[13px] overflow-y-auto max-h-[600px]">
                 <div onClick={() => { setActiveView('Settings'); setActiveSettingsTab('Time Management'); }} className="flex justify-between items-center p-4 border-b border-[#eee] hover:bg-[#f5f5f5] cursor-pointer">
                   <div className="flex gap-4">
                     <span className="text-[20px]">⏱️</span>
                     <div className="flex flex-col">
                       <span className="font-bold">Time spent</span>
                       <span className="text-[11px] text-[#666]">See how much time you usually spend on Instagram.</span>
                     </div>
                   </div>
                   <span className="text-[#999]">›</span>
                 </div>
                 
                 <div onClick={() => setActiveView('PhotosAndVideos')} className="flex justify-between items-center p-4 border-b border-[#eee] hover:bg-[#f5f5f5] cursor-pointer">
                   <div className="flex gap-4">
                     <span className="text-[20px]">📸</span>
                     <div className="flex flex-col">
                       <span className="font-bold">Photos and videos</span>
                       <span className="text-[11px] text-[#666]">View, archive or delete photos and videos you've shared.</span>
                     </div>
                   </div>
                   <span className="text-[#999]">›</span>
                 </div>
                 
                 <div onClick={() => setActiveView('Interactions')} className="flex justify-between items-center p-4 border-b border-[#eee] hover:bg-[#f5f5f5] cursor-pointer">
                   <div className="flex gap-4">
                     <span className="text-[20px]">💬</span>
                     <div className="flex flex-col">
                       <span className="font-bold">Interactions</span>
                       <span className="text-[11px] text-[#666]">Review and delete likes, comments and your other interactions.</span>
                     </div>
                   </div>
                   <span className="text-[#999]">›</span>
                 </div>
                 
                 <div onClick={() => setActiveView('AccountHistory')} className="flex justify-between items-center p-4 border-b border-[#eee] hover:bg-[#f5f5f5] cursor-pointer">
                   <div className="flex gap-4">
                     <span className="text-[20px]">📅</span>
                     <div className="flex flex-col">
                       <span className="font-bold">Account history</span>
                       <span className="text-[11px] text-[#666]">Review changes you've made to your account since you created it.</span>
                     </div>
                   </div>
                   <span className="text-[#999]">›</span>
                 </div>

                 <div onClick={() => setActiveView('Archive')} className="flex justify-between items-center p-4 border-b border-[#eee] hover:bg-[#f5f5f5] cursor-pointer">
                   <div className="flex gap-4">
                     <span className="text-[20px]">🕰️</span>
                     <div className="flex flex-col">
                       <span className="font-bold">Archived</span>
                       <span className="text-[11px] text-[#666]">View content you've hidden from your profile.</span>
                     </div>
                   </div>
                   <span className="text-[#999]">›</span>
                 </div>
                 
                 <div onClick={() => setActiveView('RecentlyDeleted')} className="flex justify-between items-center p-4 border-b border-[#eee] hover:bg-[#f5f5f5] cursor-pointer">
                   <div className="flex gap-4">
                     <span className="text-[20px]">🗑️</span>
                     <div className="flex flex-col">
                       <span className="font-bold">Recently deleted</span>
                       <span className="text-[11px] text-[#666]">View and manage content you've recently deleted.</span>
                     </div>
                   </div>
                   <span className="text-[#999]">›</span>
                 </div>

                 <div onClick={() => setActiveView('Unfollowers')} className="flex justify-between items-center p-4 hover:bg-[#f5f5f5] cursor-pointer">
                   <div className="flex gap-4">
                     <span className="text-[20px]">💔</span>
                     <div className="flex flex-col">
                       <span className="font-bold">People who unfollowed you</span>
                       <span className="text-[11px] text-[#666]">See who recently stopped following you.</span>
                     </div>
                   </div>
                   <span className="text-[#999]">›</span>
                 </div>
               </div>
            </div>
          )}

           {activeView === 'Unfollowers' && (() => {
            const getTimeAgo = (dateStr: string) => {
              const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
              let interval = seconds / 31536000;
              if (interval > 1) return Math.floor(interval) + " years ago";
              interval = seconds / 2592000;
              if (interval > 1) return Math.floor(interval) + " months ago";
              interval = seconds / 86400;
              if (interval > 1) return Math.floor(interval) + " days ago";
              interval = seconds / 3600;
              if (interval > 1) return Math.floor(interval) + " hours ago";
              interval = seconds / 60;
              if (interval > 1) return Math.floor(interval) + " minutes ago";
              return Math.floor(seconds) + " seconds ago";
            };

            return (
            <div className="vintage-panel bg-[#fdfdfd] w-full max-w-[500px] mx-auto flex flex-col mt-4">
               <div className="p-4 border-b border-[#ccc] bg-[#f0f0f0] flex items-center gap-3">
                 <button onClick={() => setActiveView('Your Activity')} className="text-[16px] font-bold text-[#333] hover:text-[#0000EE]">‹ Back</button>
                 <h2 className="font-bold text-[18px]">People who unfollowed you</h2>
               </div>
               <div className="flex flex-col gap-3 p-4 text-[13px] overflow-y-auto max-h-[600px]">
                 {unfollowersList.length === 0 ? (
                   <div className="text-gray-400 italic text-center py-4">No recent unfollowers</div>
                 ) : (
                   unfollowersList.map((record) => {
                     const user = record.unfollowerId;
                     if (!user) return null;
                     return (
                       <div key={record._id} className="flex items-center gap-3 pb-3 border-b border-[#eee]">
                         <img src={user.profilePic || `https://i.pravatar.cc/150?u=${user.username}`} className="w-10 h-10 border border-[#ccc] rounded-full object-cover cursor-pointer" alt={user.username} onClick={() => {
                             setActiveUserProfile({
                               username: user.username,
                               name: user.fullName,
                               avatar: user.profilePic || `https://i.pravatar.cc/150?u=${user.username}`
                             });
                             setActiveView('Profile');
                         }} />
                         <div className="flex-1">
                           <span className="font-bold vintage-link cursor-pointer" onClick={() => {
                               setActiveUserProfile({
                                 username: user.username,
                                 name: user.fullName,
                                 avatar: user.profilePic || `https://i.pravatar.cc/150?u=${user.username}`
                               });
                               setActiveView('Profile');
                           }}>@{user.username}</span> unfollowed you.
                           <div className="text-[#888] text-[10px]">{getTimeAgo(record.unfollowedAt)}</div>
                         </div>
                       </div>
                     );
                   })
                 )}
               </div>
            </div>
            );
          })()}

          {activeView === 'PhotosAndVideos' && (
            <div className="vintage-panel bg-[#fdfdfd] w-full max-w-[500px] mx-auto flex flex-col mt-4">
               <div className="p-4 border-b border-[#ccc] bg-[#f0f0f0] flex items-center gap-3">
                 <button onClick={() => setActiveView('Your Activity')} className="text-[16px] font-bold text-[#333] hover:text-[#0000EE]">‹ Back</button>
                 <h2 className="font-bold text-[18px]">Photos and videos</h2>
               </div>
               <div className="flex flex-col gap-1 p-4 text-[13px] overflow-y-auto max-h-[600px]">
                 <div onClick={() => setActiveView('PhotosAndVideos_Posts')} className="flex justify-between items-center p-3 border-b border-[#eee] hover:bg-[#f5f5f5] cursor-pointer">
                   <span className="font-bold">Posts</span>
                   <span className="text-[#999]">›</span>
                 </div>
                 <div onClick={() => setActiveView('PhotosAndVideos_Reels')} className="flex justify-between items-center p-3 border-b border-[#eee] hover:bg-[#f5f5f5] cursor-pointer">
                   <span className="font-bold">Reels</span>
                   <span className="text-[#999]">›</span>
                 </div>
                 <div className="flex justify-between items-center p-3 border-b border-[#eee] hover:bg-[#f5f5f5] cursor-pointer opacity-50 cursor-not-allowed" title="No Highlights yet">
                   <span className="font-bold">Highlights</span>
                   <span className="text-[#999]">›</span>
                 </div>
               </div>
            </div>
          )}

          {activeView === 'PhotosAndVideos_Posts' && (() => {
            const userPosts = feedPosts.filter(p => p.user?.username === authUser?.username && p.contentFileType !== 'video');
            return (
            <div className="vintage-panel bg-[#fdfdfd] w-full max-w-[500px] mx-auto flex flex-col mt-4 h-[600px]">
               <div className="p-4 border-b border-[#ccc] bg-[#f0f0f0] flex items-center gap-3">
                 <button onClick={() => setActiveView('PhotosAndVideos')} className="text-[16px] font-bold text-[#333] hover:text-[#0000EE]">‹ Back</button>
                 <h2 className="font-bold text-[18px]">Your Posts</h2>
               </div>
               <div className="flex-1 p-4 overflow-y-auto grid grid-cols-3 gap-1 content-start bg-[#fafafa]">
                 {userPosts.length === 0 ? (
                   <div className="col-span-3 text-center text-gray-400 py-10 italic">You haven't shared any posts yet.</div>
                 ) : (
                   userPosts.map((post, idx) => (
                     <div key={post.id || idx} className="aspect-[9/16] bg-black relative group cursor-pointer border border-[#ccc] overflow-hidden flex items-center justify-center">
                       <img src={post.contentImg} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Your post" />
                     </div>
                   ))
                 )}
               </div>
            </div>
            );
          })()}

          {activeView === 'PhotosAndVideos_Reels' && (() => {
            const userReels = reels.filter(r => r.username === authUser?.username);
            return (
            <div className="vintage-panel bg-[#fdfdfd] w-full max-w-[500px] mx-auto flex flex-col mt-4 h-[600px]">
               <div className="p-4 border-b border-[#ccc] bg-[#f0f0f0] flex items-center gap-3">
                 <button onClick={() => setActiveView('PhotosAndVideos')} className="text-[16px] font-bold text-[#333] hover:text-[#0000EE]">‹ Back</button>
                 <h2 className="font-bold text-[18px]">Your Reels</h2>
               </div>
               <div className="flex-1 p-4 overflow-y-auto grid grid-cols-3 gap-1 content-start bg-[#fafafa]">
                 {userReels.length === 0 ? (
                   <div className="col-span-3 text-center text-gray-400 py-10 italic">You haven't shared any reels yet.</div>
                 ) : (
                   userReels.map((reel, idx) => (
                     <div key={reel.id || idx} className="aspect-[9/16] bg-black relative group cursor-pointer border border-[#ccc] overflow-hidden flex items-center justify-center">
                       <video src={reel.videoUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" muted />
                       <div className="absolute top-2 right-2 text-[14px]">🎬</div>
                     </div>
                   ))
                 )}
               </div>
            </div>
            );
          })()}

          {activeView === 'Interactions' && (
            <div className="vintage-panel bg-[#fdfdfd] w-full max-w-[500px] mx-auto flex flex-col mt-4">
               <div className="p-4 border-b border-[#ccc] bg-[#f0f0f0] flex items-center gap-3">
                 <button onClick={() => setActiveView('Your Activity')} className="text-[16px] font-bold text-[#333] hover:text-[#0000EE]">‹ Back</button>
                 <h2 className="font-bold text-[18px]">Interactions</h2>
               </div>
               <div className="flex flex-col gap-1 p-4 text-[13px] overflow-y-auto max-h-[600px]">
                 <div onClick={() => setActiveView('Interactions_Comments')} className="flex justify-between items-center p-3 border-b border-[#eee] hover:bg-[#f5f5f5] cursor-pointer">
                   <span className="font-bold">Comments</span>
                   <span className="text-[#999]">›</span>
                 </div>
                 <div onClick={() => setActiveView('Interactions_Likes')} className="flex justify-between items-center p-3 border-b border-[#eee] hover:bg-[#f5f5f5] cursor-pointer">
                   <span className="font-bold">Likes</span>
                   <span className="text-[#999]">›</span>
                 </div>
                 <div onClick={() => setActiveView('Interactions_StoryReplies')} className="flex justify-between items-center p-3 border-b border-[#eee] hover:bg-[#f5f5f5] cursor-pointer">
                   <span className="font-bold">Story replies</span>
                   <span className="text-[#999]">›</span>
                 </div>
                 <div onClick={() => setActiveView('Interactions_Reviews')} className="flex justify-between items-center p-3 border-b border-[#eee] hover:bg-[#f5f5f5] cursor-pointer">
                   <span className="font-bold">Reviews</span>
                   <span className="text-[#999]">›</span>
                 </div>
               </div>
            </div>
          )}

          {activeView === 'AccountHistory' && (
            <div className="vintage-panel bg-[#fdfdfd] w-full max-w-[500px] mx-auto flex flex-col mt-4">
               <div className="p-4 border-b border-[#ccc] bg-[#f0f0f0] flex items-center gap-3">
                 <button onClick={() => setActiveView('Your Activity')} className="text-[16px] font-bold text-[#333] hover:text-[#0000EE]">‹ Back</button>
                 <h2 className="font-bold text-[18px]">Account history</h2>
               </div>
               <div className="flex flex-col gap-3 p-4 text-[13px] overflow-y-auto max-h-[600px]">
                 <div className="flex flex-col pb-3 border-b border-[#eee]">
                   <div className="flex justify-between items-start">
                     <div className="flex flex-col">
                       <span className="font-bold">Bio</span>
                       <span className="text-[#666]">Changed bio</span>
                     </div>
                     <span className="text-[#999] text-[11px]">1 month ago</span>
                   </div>
                 </div>
                 <div className="flex flex-col pb-3 border-b border-[#eee]">
                   <div className="flex justify-between items-start">
                     <div className="flex flex-col">
                       <span className="font-bold">Privacy</span>
                       <span className="text-[#666]">Changed account privacy to Public</span>
                     </div>
                     <span className="text-[#999] text-[11px]">3 months ago</span>
                   </div>
                 </div>
                 <div className="flex flex-col pb-3 border-b border-[#eee]">
                   <div className="flex justify-between items-start">
                     <div className="flex flex-col">
                       <span className="font-bold">Account created</span>
                       <span className="text-[#666]">You created your account.</span>
                     </div>
                     <span className="text-[#999] text-[11px]">
                       {authUser?.createdAt ? new Date(authUser.createdAt).toLocaleDateString() : 'Loading...'}
                     </span>
                   </div>
                 </div>
               </div>
            </div>
          )}

          {activeView === 'RecentlyDeleted' && (
            <div className="vintage-panel bg-[#fdfdfd] w-full max-w-[500px] mx-auto flex flex-col mt-4">
               <div className="p-4 border-b border-[#ccc] bg-[#f0f0f0] flex items-center gap-3">
                 <button onClick={() => setActiveView('Your Activity')} className="text-[16px] font-bold text-[#333] hover:text-[#0000EE]">‹ Back</button>
                 <h2 className="font-bold text-[18px]">Recently deleted</h2>
               </div>
               <div className="flex flex-col gap-3 p-4 text-[13px] items-center justify-center flex-1">
                 <span className="text-[40px] text-[#999] mb-2">🗑️</span>
                 <span className="font-bold text-[#333] text-[16px]">No recently deleted content</span>
                 <span className="text-[#666] text-center max-w-[300px]">Only you can see these posts. They will be permanently deleted after 30 days.</span>
               </div>
            </div>
          )}

          {activeView === 'Archive' && (() => {
            const userPosts = feedPosts.filter(p => p.user?.username === authUser?.username);
            return (
            <div className="vintage-panel bg-[#fdfdfd] w-full max-w-[600px] mx-auto h-[600px] flex flex-col mt-4">
               <div className="p-4 border-b border-[#ccc] flex justify-between items-center bg-[#f0f0f0]">
                 <h2 className="font-bold text-[18px]">Archive</h2>
                 <select className="vintage-input px-2 py-1 bg-[#fff] font-bold">
                   <option>Posts Archive</option>
                 </select>
               </div>
               <div className="flex-1 p-4 overflow-y-auto grid grid-cols-3 gap-1 content-start bg-[#fafafa]">
                 {userPosts.length === 0 ? (
                   <div className="col-span-3 text-center text-gray-400 py-10 italic">No posts in your archive</div>
                 ) : (
                   userPosts.map((post, idx) => {
                     const isVideo = post.videoUrl?.match(/\.(mp4|webm|ogg)$/i);
                     return (
                       <div key={post._id || idx} className="aspect-[9/16] bg-black relative group cursor-pointer border border-[#ccc] overflow-hidden flex items-center justify-center">
                         {isVideo ? (
                           <video src={post.videoUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" muted />
                         ) : (
                           <img src={post.videoUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Archived post" />
                         )}
                         <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-[2px] font-bold shadow-sm">
                           {post.createdAt ? new Date(post.createdAt).getFullYear() : ''}
                         </div>
                       </div>
                     );
                   })
                 )}
               </div>
            </div>
            );
          })()}

          {activeView === 'Close Friends' && (
            <div className="vintage-panel bg-[#fdfdfd] w-full max-w-[400px] mx-auto h-[500px] flex flex-col mt-4">
               <div className="p-4 border-b border-[#ccc] flex flex-col items-center bg-[#f0f0f0] gap-2">
                 <div className="w-16 h-16 rounded-full border-[3px] border-[#3897f0] flex items-center justify-center text-[30px] bg-white shadow-sm">
                   <span className="text-[#2ecc71]">★</span>
                 </div>
                 <h2 className="font-bold text-[18px]">Close Friends</h2>
                 <p className="text-[11px] text-[#666] text-center">We don't send notifications when you edit your close friends list.</p>
               </div>
               <div className="p-2 border-b border-[#ccc]">
                 <input 
                   type="text" 
                   className="vintage-input w-full p-2 text-[12px]" 
                   placeholder="Search" 
                   value={globalSearchQuery}
                   onChange={(e) => setGlobalSearchQuery(e.target.value)}
                 />
               </div>
               <div className="flex-1 p-2 overflow-y-auto flex flex-col gap-1">
                 <div className="flex justify-between items-center p-2">
                   <span className="font-bold text-[13px] text-[#333]">Suggested</span>
                 </div>
                 {searchResults.length === 0 ? (
                   <div className="text-gray-400 italic text-center py-4">No users found. Try searching!</div>
                 ) : (
                   searchResults.map((u, i) => {
                     const isTopFriend = authUser?.topFriends?.includes(u._id) || false;
                     return (
                       <div key={i} className="flex justify-between items-center p-2 hover:bg-[#f5f5f5] border border-transparent hover:border-[#eee] rounded-[2px]">
                         <div className="flex items-center gap-3">
                           <img src={u.profilePic || `https://i.pravatar.cc/150?u=${u.username}`} className="w-10 h-10 rounded-full border border-[#ccc] object-cover" alt={u.username} />
                           <span className="font-bold text-[13px]">{u.username}</span>
                         </div>
                         <input type="checkbox" defaultChecked={isTopFriend} className="w-4 h-4 cursor-pointer accent-[#2ecc71]" />
                       </div>
                     );
                   })
                 )}
               </div>
               <div className="p-3 border-t border-[#ccc] bg-[#f0f0f0]">
                 <button onClick={() => setActiveView('Profile')} className="retro-blue-button w-full py-2 font-bold shadow-sm">Done</button>
               </div>
            </div>
          )}

          {activeView === 'Switch Appearance' && (
            <div className="vintage-panel bg-[#fdfdfd] w-full max-w-[400px] mx-auto flex flex-col mt-4">
               <div className="p-4 border-b border-[#ccc] flex items-center bg-[#f0f0f0] gap-4">
                 <button onClick={() => setActiveView('More')} className="font-bold text-[18px]">‹</button>
                 <h2 className="font-bold text-[18px]">Switch Appearance</h2>
               </div>
               <div className="p-4 flex flex-col gap-4">
                 <div className="flex items-center justify-between">
                   <span className="font-bold">Dark mode</span>
                   <input type="checkbox" checked={isDarkMode} onChange={(e) => setIsDarkMode(e.target.checked)} className="cursor-pointer accent-[#0095f6] w-4 h-4" />
                 </div>
               </div>
            </div>
          )}

          {activeView === 'Report a problem' && (
            <div className="vintage-panel bg-[#fdfdfd] w-full max-w-[500px] mx-auto flex flex-col mt-4">
               <div className="p-4 border-b border-[#ccc] flex items-center bg-[#f0f0f0] gap-4">
                 <button onClick={() => setActiveView('More')} className="font-bold text-[18px]">‹</button>
                 <h2 className="font-bold text-[18px]">Report a problem</h2>
               </div>
               <div className="p-4 flex flex-col gap-4">
                 <p className="text-[12px] text-[#666]">Briefly explain what happened or what's not working.</p>
                 <textarea className="vintage-input w-full p-2 h-[100px] text-[12px]" placeholder="Please include as much information as possible..."></textarea>
                 <div className="flex justify-between items-center mt-2">
                   <button className="retro-button px-4 py-1.5 font-bold text-[12px]">Add image</button>
                   <button onClick={() => { showTemporaryToast('Report submitted to server!'); setActiveView('More'); }} className="retro-blue-button px-6 py-1.5 font-bold shadow-sm">Send Report</button>
                 </div>
               </div>
            </div>
          )}
        </div>
        
        {/* Right Resizer */}
        <div 
          className="w-1 cursor-col-resize bg-[#d4d0c8] hover:bg-[#999] shrink-0 border-l border-[#999] hidden md:block"
          onMouseDown={() => setIsDraggingRight(true)}
        />
        
        {/* Right Sidebar (Classic Desktop Style) */}
        <div style={{ width: rightWidth }} className="hidden md:flex flex-col shrink-0 border-l border-[#999] bg-[#f0f0f0] overflow-y-auto">
          {/* User Profile & Stats */}
          <div className="vintage-panel p-4 flex flex-col gap-3 border-0 border-b border-[#999]">
            <div className="flex items-center gap-3">
              <img 
                src={authUser?.profilePic || `https://i.pravatar.cc/150?u=${authUser?.username}`} 
                className="w-14 h-14 rounded-[0px] border border-[#ccc] shadow-[1px_1px_2px_rgba(0,0,0,0.2)] cursor-pointer object-cover" 
                alt="Profile"
                onClick={() => setActiveView('Profile')}
              />
              <div>
                <button 
                  onClick={() => setActiveView('Profile')}
                  className="vintage-link font-bold text-[14px] bg-transparent border-none p-0 text-left cursor-pointer"
                >
                  {authUser?.username || 'Loading...'}
                </button>
                <div className="text-[#666] text-[11px] mt-1">Status: Online</div>
              </div>
            </div>
            
            <div className="flex border-t border-[#ccc] pt-3 justify-between text-center px-2">
              <div className="flex flex-col cursor-pointer hover:bg-gray-100 rounded p-1 transition-all" onClick={() => setActiveView('Profile')}>
                <span className="font-bold text-[16px] text-[#333]">{feedPosts.filter(p => p.user?.username === authUser?.username).length}</span>
                <span className="text-[10px] text-[#999] uppercase">Posts</span>
              </div>
              <div className="flex flex-col cursor-pointer hover:bg-gray-100 rounded p-1 transition-all" onClick={() => setActiveFollowModal('followers')}>
                <span className="font-bold text-[16px] text-[#333]">{followersCount}</span>
                <span className="text-[10px] text-[#999] uppercase hover:underline">Followers</span>
              </div>
              <div className="flex flex-col cursor-pointer hover:bg-gray-100 rounded p-1 transition-all" onClick={() => setActiveFollowModal('following')}>
                <span className="font-bold text-[16px] text-[#333]">{followingCount}</span>
                <span className="text-[10px] text-[#999] uppercase hover:underline">Following</span>
              </div>
            </div>
          </div>

          {/* Currently Playing / Music Player */}
          <div className="vintage-panel border-0 border-b border-[#999]">
            <div className="px-3 py-2 border-b border-[#ccc] bg-[#e0e0e0] font-bold text-[12px] text-[#333] flex justify-between">
              <span>🎵 Now Playing</span>
              <button 
                onClick={() => {
                  setCustomSongTitle(nowPlayingTrack.title.split(' - ')[1] || nowPlayingTrack.title);
                  setCustomSongArtist(nowPlayingTrack.title.split(' - ')[0] || '');
                  setShowEditMusicModal(true);
                }}
                className="text-[10px] text-blue-600 bg-transparent border-none font-bold cursor-pointer hover:underline p-0"
              >
                Edit
              </button>
            </div>
            <div className="p-3 bg-[#fdfdfd] flex flex-col gap-2">
               <div className="flex items-center gap-3">
                 <button 
                   onClick={() => setIsMusicPlaying(!isMusicPlaying)}
                   className="w-8 h-8 bg-neutral-800 text-amber-500 flex items-center justify-center text-[12px] rounded-full border border-neutral-700 shadow-md hover:bg-neutral-700 active:scale-95 transition-all cursor-pointer shrink-0"
                   title={isMusicPlaying ? "Pause Track" : "Play Track"}
                 >
                   {isMusicPlaying ? '❚❚' : '▶'}
                 </button>
                 <div className="flex-1 min-w-0 flex flex-col">
                   <button 
                     onClick={() => handleOpenAudioDetails(nowPlayingTrack.title)}
                     className="font-bold text-[11px] text-[#333] hover:text-blue-600 hover:underline cursor-pointer text-left bg-transparent border-none p-0 truncate w-full"
                     title="Click to view track hub"
                   >
                     {nowPlayingTrack.title}
                   </button>
                   <span className="text-[10px] text-[#666] mt-0.5 font-mono">
                     {formatTime(nowPlayingProgress)} ━━──────── {nowPlayingTrack.duration}
                   </span>
                 </div>
                 
                 {isMusicPlaying && (
                   <div className="flex items-end gap-[2px] h-4 pb-1 shrink-0">
                     <div className="w-[3px] bg-amber-500 animate-pulse" style={{ height: '70%', animationDuration: '0.4s' }} />
                     <div className="w-[3px] bg-amber-500 animate-pulse" style={{ height: '100%', animationDuration: '0.6s' }} />
                     <div className="w-[3px] bg-amber-500 animate-pulse" style={{ height: '40%', animationDuration: '0.5s' }} />
                   </div>
                 )}
               </div>
               <p className="text-[8px] text-neutral-400 text-center font-mono">
                 {isMusicPlaying ? '💿 Cassette loop actively spinning...' : '💿 Tape deck idle. Click play!'}
               </p>
            </div>
          </div>
          
          {/* Top Friends */}
          <div className="vintage-panel border-0 border-b border-[#999]">
            <div className="px-3 py-2 border-b border-[#ccc] bg-[#e0e0e0] font-bold text-[12px] text-[#333] flex justify-between items-center">
              <span>👥 Top Friends</span>
              <button 
                onClick={() => setShowTopFriendsModal(true)}
                className="text-[10px] text-blue-600 bg-transparent border-none font-bold cursor-pointer hover:underline p-0"
              >
                View all
              </button>
            </div>
            <div className="p-3 grid grid-cols-4 gap-2 text-center bg-[#fdfdfd]">
               {topFriendsList.length === 0 ? (
                 <div className="col-span-4 text-[10px] text-gray-400 italic py-2">No top friends yet. Add some!</div>
               ) : (
                 topFriendsList.map((fname, i) => (
                   <div 
                     key={i} 
                     onClick={() => setActiveUserProfile({
                       username: fname,
                       name: fname === 'kevin' ? 'Kevin O.' : fname === 'doglover' ? 'Dog Lover' : fname === 'sarah' ? 'Sarah Connor' : fname === 'vintage_cars' ? 'Vintage Cars' : fname === 'mike99' ? 'Michael Scott' : fname === 'photofan' ? 'Photo Fan' : fname === 'coolkid' ? 'Cool Kid' : 'Jessica Day',
                       avatar: `https://i.pravatar.cc/150?u=${fname}`
                     })}
                     className="flex flex-col items-center gap-1 cursor-pointer group"
                   >
                     <img src={`https://i.pravatar.cc/150?u=${fname}`} className="w-10 h-10 border border-[#ccc] group-hover:border-[#0000EE] transition-all object-cover" alt={fname} />
                     <span className="text-[9px] text-[#0000EE] group-hover:underline w-full truncate font-mono">@{fname}</span>
                   </div>
                 ))
               )}
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className="vintage-panel border-0 border-b border-[#999]">
            <div className="px-3 py-2 border-b border-[#ccc] bg-[#e0e0e0] font-bold text-[12px] text-[#333]">
              Recent Activity
            </div>
            <div className="p-3 flex flex-col gap-2 text-[11px] text-[#555] bg-[#fdfdfd]">
              {recentActivity.length === 0 ? (
                <div className="text-gray-400 italic">No recent activity</div>
              ) : (
                recentActivity.slice(0, 10).map((activity, idx) => {
                  let icon = '•';
                  let color = '#555';
                  let message = '';
                  
                  const eventType = activity.event || activity.type;
                  const activityUser = activity.user || activity.sender;
                  
                  if (!activityUser) return null;

                  if (eventType === 'like_reel' || eventType === 'like') { icon = '♥'; color = '#0000EE'; message = 'liked your post.'; }
                  if (eventType === 'comment') { icon = '📝'; color = '#551A8B'; message = `commented on your post.`; }
                  if (eventType === 'follow') { icon = '👥'; color = '#008000'; message = 'started following you.'; }
                  if (eventType === 'unfollow') { icon = '−'; color = '#FF0000'; message = 'unfollowed you.'; }
                  if (eventType === 'mention') { icon = '@'; color = '#FF8C00'; message = 'mentioned you.'; }

                  return (
                    <div key={idx} className="flex items-start gap-2 border-b border-[#eee] pb-2">
                      <span style={{ color, fontWeight: 'bold' }}>{icon}</span>
                      <span>
                        <button 
                          onClick={() => setActiveUserProfile({ 
                            username: activityUser.username, 
                            name: activityUser.fullName || activityUser.username, 
                            avatar: activityUser.profilePic || `https://i.pravatar.cc/150?u=${activityUser.username}` 
                          })}
                          className="vintage-link font-bold bg-transparent border-none p-0 text-left cursor-pointer inline hover:underline mr-1"
                        >
                          {activityUser.username}
                        </button>
                        {message} <span className="text-[#999] text-[9px] ml-1">{new Date(activity.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          {/* Trending Tags */}
          <div className="vintage-panel border-0 border-b border-[#999]">
            <div className="px-3 py-2 border-b border-[#ccc] bg-[#e0e0e0] font-bold text-[12px] text-[#333]">
              Trending Tags
            </div>
            <div className="p-3 flex flex-wrap gap-2 text-[12px] bg-[#fdfdfd]">
              {['#vintage', '#retro', '#polaroid', '#2000s', '#classic', '#oldweb', '#aesthetic'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setGlobalSearchQuery(tag);
                    setActiveView('Search');
                    showTemporaryToast(`Searching for trending tag: ${tag}`);
                  }}
                  className="vintage-link hover:underline bg-transparent border-none cursor-pointer p-0 text-left font-bold"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 flex flex-wrap gap-x-2 text-[10px] text-[#888] font-bold">
            <a href="#" className="hover:underline">About us</a> | 
            <a href="#" className="hover:underline">Support</a> | 
            <a href="#" className="hover:underline">Press</a> | 
            <a href="#" className="hover:underline">API</a> | 
            <a href="#" className="hover:underline">Privacy</a> | 
            <a href="#" className="hover:underline">Terms</a>
            <div className="w-full mt-1 font-normal">
              © 2008 Vintage Gram
            </div>
          </div>
        </div>
      </main>

      {/* Fullscreen Story Modal */}
      {activeStory && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-md select-none font-sans">
          {/* Close button */}
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300 text-4xl font-light cursor-pointer z-[120] transition-colors duration-200"
            onClick={handleCloseStory}
          >
            ×
          </button>
          
          {/* Story Container */}
          <div 
            className="relative w-full max-w-[420px] h-[90vh] max-h-[840px] bg-neutral-900 rounded-xl overflow-hidden flex flex-col shadow-2xl border border-neutral-800"
            onMouseDown={() => setIsStoryPaused(true)}
            onMouseUp={() => setIsStoryPaused(false)}
            onTouchStart={() => setIsStoryPaused(true)}
            onTouchEnd={() => setIsStoryPaused(false)}
          >
            {activeStory.image?.match(/\.(mp4|webm|ogg)$/i) ? (
              <video 
                src={activeStory.image}
                className="absolute inset-0 w-full h-full object-cover cursor-pointer select-none"
                autoPlay 
                playsInline
                muted={false}
                loop={false}
                onEnded={handleCloseStory}
                onClick={handleDoubleTap}
              />
            ) : (
              <div 
                className="absolute inset-0 w-full h-full bg-cover bg-center cursor-pointer select-none"
                style={{ backgroundImage: `url(${activeStory.image})` }}
                onDoubleClick={handleDoubleTap}
              />
            )}
              {/* Dark vignette to ensure high legibility of white text on top/bottom */}
              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
              
              {/* Display Stickers */}
              {activeStory.stickers && activeStory.stickers.map((sticker: any) => {
                let content = null;
                if (sticker.type === 'text') {
                  content = (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Cycle text sticker styles / palettes!
                        const palettes = [
                          { color: '#ffffff', bg: '#000000b0' },
                          { color: '#000000', bg: '#ffffffd0' },
                          { color: '#ffffff', bg: '#ef4444d0' },
                          { color: '#ffffff', bg: '#3b82f6d0' },
                          { color: '#ffffff', bg: '#10b981d0' },
                          { color: '#ffffff', bg: '#f59e0bd0' }
                        ];
                        // Find current index
                        const currentIndex = palettes.findIndex(p => p.color === sticker.color && p.bg === sticker.bg);
                        const nextPalette = palettes[(currentIndex + 1) % palettes.length];
                        
                        // Update activeStory sticker state in-place to allow real-time color cycling!
                        sticker.color = nextPalette.color;
                        sticker.bg = nextPalette.bg;
                        
                        // Force state trigger
                        setActiveStory(prev => prev ? { ...prev } : null);
                        showTemporaryToast(`🎨 Sticker theme cycled!`);
                      }}
                      className="px-3 py-1.5 rounded-md font-bold tracking-tight text-center shadow-lg text-sm transition-transform hover:scale-105 active:scale-95" 
                      style={{ color: sticker.color, backgroundColor: sticker.bg }}
                    >
                      {sticker.text}
                    </div>
                  );
                } else if (sticker.type === 'location') {
                  content = (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        const colorThemes = [
                          { bg: 'bg-blue-500 border-blue-400 text-white' },
                          { bg: 'bg-purple-600 border-purple-500 text-white' },
                          { bg: 'bg-emerald-500 border-emerald-400 text-white' },
                          { bg: 'bg-orange-500 border-orange-400 text-white' },
                          { bg: 'bg-zinc-800 border-zinc-700 text-white' }
                        ];
                        const currentTheme = sticker.colorTheme || 'bg-blue-500 border-blue-400 text-white';
                        const currentIndex = colorThemes.findIndex(t => t.bg === currentTheme);
                        const nextTheme = colorThemes[(currentIndex + 1) % colorThemes.length].bg;
                        
                        sticker.colorTheme = nextTheme;
                        setActiveStory(prev => prev ? { ...prev } : null);
                        showTemporaryToast(`📍 Location sticker style cycled!`);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-md border transition-transform hover:scale-105 active:scale-95 ${sticker.colorTheme || 'bg-blue-500 border-blue-400 text-white'}`}
                    >
                      <span>📍</span> {sticker.text}
                    </div>
                  );
                } else if (sticker.type === 'music') {
                  content = (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        const themes = [
                          { class: 'bg-black/80 text-white border-white/20' },
                          { class: 'bg-gradient-to-r from-purple-900 to-indigo-900 text-white border-purple-500' },
                          { class: 'bg-emerald-950 text-emerald-400 border-emerald-700' },
                          { class: 'bg-amber-100 text-amber-900 border-amber-300' }
                        ];
                        const currentTheme = sticker.musicTheme || 'bg-black/80 text-white border-white/20';
                        const currentIndex = themes.findIndex(t => t.class === currentTheme);
                        const nextTheme = themes[(currentIndex + 1) % themes.length].class;
                        
                        sticker.musicTheme = nextTheme;
                        setActiveStory(prev => prev ? { ...prev } : null);
                        showTemporaryToast(`🎵 Music track style cycled!`);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs border flex items-center gap-2 shadow-lg max-w-[200px] truncate transition-transform hover:scale-105 active:scale-95 ${sticker.musicTheme || 'bg-black/80 text-white border-white/20'}`}
                    >
                      <span className="animate-pulse text-sm">🎵</span>
                      <div className="flex flex-col text-left">
                        <span className="truncate">{sticker.text}</span>
                        <span className="text-[8px] opacity-75">Soundtrack</span>
                      </div>
                    </div>
                  );
                } else if (sticker.type === 'poll') {
                  const userVote = pollVotes[sticker.id];
                  const hasVoted = !!userVote;
                  const yesPercent = userVote === 'yes' ? 75 : 45;
                  const noPercent = 100 - yesPercent;

                  content = (
                    <div className="p-3 rounded-xl bg-white text-black border border-gray-300 shadow-xl flex flex-col gap-2 min-w-[150px] items-center">
                      <span className="font-bold text-[11px] text-center text-neutral-800">{sticker.text}</span>
                      {hasVoted ? (
                        <div className="flex flex-col gap-1.5 w-full text-[10px] font-bold">
                          {/* Yes option bar */}
                          <div className="relative w-full h-6 bg-neutral-100 rounded overflow-hidden flex items-center px-2">
                            <div className="absolute inset-y-0 left-0 bg-blue-500/20 transition-all duration-500" style={{ width: `${yesPercent}%` }} />
                            <span className="relative z-10 text-neutral-700 flex justify-between w-full">
                              <span>{sticker.extra?.yes || 'Yes'} {userVote === 'yes' && '✓'}</span>
                              <span>{yesPercent}%</span>
                            </span>
                          </div>
                          {/* No option bar */}
                          <div className="relative w-full h-6 bg-neutral-100 rounded overflow-hidden flex items-center px-2">
                            <div className="absolute inset-y-0 left-0 bg-blue-500/20 transition-all duration-500" style={{ width: `${noPercent}%` }} />
                            <span className="relative z-10 text-neutral-700 flex justify-between w-full">
                              <span>{sticker.extra?.no || 'No'} {userVote === 'no' && '✓'}</span>
                              <span>{noPercent}%</span>
                            </span>
                          </div>
                          <span className="text-[8px] text-gray-400 font-normal text-center mt-0.5">Vote recorded!</span>
                        </div>
                      ) : (
                        <div className="flex gap-2 w-full text-[10px]">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setPollVotes(prev => ({ ...prev, [sticker.id]: 'yes' }));
                              showTemporaryToast("Voted Yes! 📊");
                            }}
                            className="flex-1 py-1 bg-neutral-100 font-bold hover:bg-neutral-200 rounded border border-neutral-300 text-neutral-700 transition-colors"
                          >
                            {sticker.extra?.yes || 'Yes'}
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setPollVotes(prev => ({ ...prev, [sticker.id]: 'no' }));
                              showTemporaryToast("Voted No! 📊");
                            }}
                            className="flex-1 py-1 bg-neutral-100 font-bold hover:bg-neutral-200 rounded border border-neutral-300 text-neutral-700 transition-colors"
                          >
                            {sticker.extra?.no || 'No'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                } else if (sticker.type === 'countdown') {
                  content = (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        const themes = [
                          { class: 'from-pink-500 to-purple-600 text-white' },
                          { class: 'from-cyan-500 to-blue-600 text-white' },
                          { class: 'from-amber-500 to-red-600 text-white' },
                          { class: 'from-emerald-400 to-teal-600 text-white' }
                        ];
                        const currentTheme = sticker.countdownTheme || 'from-pink-500 to-purple-600 text-white';
                        const currentIndex = themes.findIndex(t => t.class === currentTheme);
                        const nextTheme = themes[(currentIndex + 1) % themes.length].class;
                        
                        sticker.countdownTheme = nextTheme;
                        setActiveStory(prev => prev ? { ...prev } : null);
                        showTemporaryToast(`⏳ Countdown style cycled!`);
                      }}
                      className={`p-2.5 rounded-xl bg-gradient-to-br shadow-xl flex flex-col gap-1 min-w-[150px] items-center transition-transform hover:scale-105 active:scale-95 ${sticker.countdownTheme || 'from-pink-500 to-purple-600 text-white'}`}
                    >
                      <span className="font-bold text-[9px] uppercase tracking-wider text-pink-100">{sticker.text || 'COUNTDOWN'}</span>
                      <div className="flex gap-1 text-center font-mono font-bold text-xs">
                        <div className="bg-black/25 p-1 rounded min-w-[22px]">12<div className="text-[6px] font-sans font-normal">d</div></div>
                        <div className="bg-black/25 p-1 rounded min-w-[22px]">04<div className="text-[6px] font-sans font-normal">h</div></div>
                        <div className="bg-black/25 p-1 rounded min-w-[22px]">59<div className="text-[6px] font-sans font-normal">m</div></div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    key={sticker.id}
                    className="absolute z-20 pointer-events-auto cursor-pointer"
                    style={{ left: `${sticker.x}%`, top: `${sticker.y}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    {content}
                  </div>
                );
              })}

            {/* Progress bar */}
            <div className="absolute top-3 left-0 right-0 px-3 flex gap-1.5 z-30" onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
              <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-75 ease-linear" 
                  style={{ width: `${storyProgress}%` }}
                />
              </div>
            </div>
            
            {/* User info header */}
            <div 
              className="absolute top-6 left-0 right-0 px-3 py-1 flex items-center justify-between z-30 pointer-events-auto"
              onMouseDown={e => e.stopPropagation()} 
              onTouchStart={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-[34px] h-[34px] rounded-full p-[1.5px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500">
                  <img 
                    src={`https://i.pravatar.cc/150?u=${activeStory.name}`} 
                    className="w-full h-full rounded-full object-cover border border-black" 
                    alt={activeStory.name} 
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-bold text-[13px] drop-shadow-md">@{activeStory.name}</span>
                  {activeStory.isOwnStory && (
                    <span className="text-white/60 text-[10px]">Your active story</span>
                  )}
                </div>
                <span className="text-white/60 text-[11px] drop-shadow-md font-medium">• 3h</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsStoryPaused(!isStoryPaused)} 
                  className="text-white/80 hover:text-white transition-colors p-1"
                >
                  {isStoryPaused ? (
                    <span className="text-[14px]">▶ Resume</span>
                  ) : (
                    <span className="text-[14px]">⏸ Pause</span>
                  )}
                </button>
              </div>
            </div>

            {/* Giant Pulsing Heart Overlay for Double Tap */}
            <AnimatePresence>
              {showGiantHeart && (
                <motion.div 
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: [0.3, 1.2, 1.0], opacity: [0, 1, 1] }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
                >
                  <span className="text-7xl drop-shadow-2xl">❤️</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Flying Emojis Reactions Canvas */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-30">
              <AnimatePresence>
                {flyingEmojis.map((fe) => (
                  <motion.div
                    key={fe.id}
                    initial={{ y: '100vh', x: `${fe.left}%`, scale: fe.scale, rotate: fe.rotation, opacity: 1 }}
                    animate={{ y: '-10vh', x: [`${fe.left}%`, `${fe.left + (Math.random() * 20 - 10)}%`, `${fe.left + (Math.random() * 40 - 20)}%`], opacity: [1, 1, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2.2, ease: 'easeOut', delay: fe.delay }}
                    className="absolute text-3xl select-none"
                  >
                    {fe.emoji}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Story Interactivity Toast Banner */}
            <AnimatePresence>
              {storyToast && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white text-[12px] font-bold px-4 py-2 rounded-full shadow-lg border border-white/10 z-[50] pointer-events-none"
                >
                  {storyToast}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Actions Overlay */}
            <div 
              className="absolute bottom-0 left-0 right-0 p-4 flex flex-col z-40 pointer-events-auto"
              onMouseDown={e => e.stopPropagation()} 
              onTouchStart={e => e.stopPropagation()}
            >
              {activeStory.isOwnStory ? (
                <div className="w-full bg-black/75 backdrop-blur-md border border-neutral-800 rounded-xl p-3 flex flex-col gap-2 max-h-[220px] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-1">
                    <span className="text-white text-[12px] font-bold flex items-center gap-1.5">
                      <span className="text-[16px]">👁</span> {activeStory.viewers?.length || 0} Viewers
                    </span>
                    <span className="text-neutral-400 text-[10px]">Only visible to you</span>
                  </div>
                  {activeStory.viewers && activeStory.viewers.length > 0 ? (
                    activeStory.viewers.map((viewer, i) => (
                      <div key={i} className="flex items-center justify-between py-0.5">
                        <div className="flex items-center gap-2">
                          <img src={`https://i.pravatar.cc/150?u=${viewer.name}`} className="w-7 h-7 rounded-full border border-neutral-700 object-cover" alt={viewer.name} />
                          <span className="text-white font-medium text-[12px]">@{viewer.name}</span>
                        </div>
                        <span className="text-neutral-400 text-[10px]">{viewer.timestamp}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-neutral-500 text-[11px]">No viewers yet</div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3 w-full">
                  {/* Quick Reactions Palette */}
                  <div className="flex justify-between px-3 pb-1">
                    {['😂', '😮', '😍', '😢', '👏', '🔥'].map(emoji => (
                       <button 
                         key={emoji} 
                         onClick={() => handleStoryReaction(emoji)}
                         className="text-[28px] hover:scale-135 transition-transform duration-150 active:scale-95 drop-shadow-md cursor-pointer filter hover:brightness-125"
                       >
                         {emoji}
                       </button>
                    ))}
                  </div>

                  {/* Reply Input & Interactive Row */}
                  <div className="flex items-center gap-3.5 w-full">
                    <form 
                      onSubmit={handleStoryReplySubmit}
                      className="flex-1 relative"
                    >
                      <input 
                        type="text" 
                        placeholder={`Reply to @${activeStory.name}...`} 
                        value={storyReplyText}
                        onChange={(e) => {
                          setStoryReplyText(e.target.value);
                          if (!isStoryPaused) setIsStoryPaused(true);
                        }}
                        onFocus={() => setIsStoryPaused(true)}
                        onBlur={() => setIsStoryPaused(false)}
                        className="w-full bg-black/40 hover:bg-black/60 focus:bg-black/80 border border-white/30 focus:border-white rounded-full px-4 py-2.5 text-white text-[13px] placeholder-white/70 outline-none transition-all duration-200 backdrop-blur-sm" 
                      />
                      {storyReplyText.trim() && (
                        <button 
                          type="submit" 
                          className="absolute right-3 top-1.5 text-blue-400 font-bold text-[12px] hover:text-white transition-colors px-2 py-1"
                        >
                          Send
                        </button>
                      )}
                    </form>

                    {/* Liking */}
                    <button 
                      onClick={handleStoryLike}
                      className="text-white hover:scale-110 active:scale-90 transition-transform cursor-pointer drop-shadow-md p-1"
                      title="Like Story"
                    >
                      {likedStories[activeStory.image] ? (
                        <span className="text-red-500 text-2xl filter drop-shadow-md animate-[pulse_0.3s_ease-in-out]">❤️</span>
                      ) : (
                        <span className="text-2xl text-white">♡</span>
                      )}
                    </button>

                    {/* Comments Toggle */}
                    <button 
                      onClick={() => {
                        setShowStoryCommentsPanel(true);
                        setIsStoryPaused(true);
                      }}
                      className="text-white hover:scale-110 transition-transform cursor-pointer drop-shadow-md p-1 relative"
                      title="View Comments"
                    >
                      <span className="text-2xl">💬</span>
                      {(storyComments[activeStory.image] || []).length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-black scale-95">
                          {(storyComments[activeStory.image] || []).length}
                        </span>
                      )}
                    </button>

                    {/* Share Direct Toggle */}
                    <button 
                      onClick={() => {
                        setShowStorySharePanel(true);
                        setIsStoryPaused(true);
                      }}
                      className="text-white hover:scale-110 transition-transform cursor-pointer drop-shadow-md p-1"
                      title="Share to DM"
                    >
                      <span className="text-2xl">↗</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Comments Panel Slide-up */}
            <AnimatePresence>
              {showStoryCommentsPanel && (
                <motion.div 
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="absolute inset-x-0 bottom-0 h-[65%] bg-neutral-950/95 backdrop-blur-xl rounded-t-2xl border-t border-neutral-800 z-50 flex flex-col pointer-events-auto"
                  onMouseDown={e => e.stopPropagation()} 
                  onTouchStart={e => e.stopPropagation()}
                >
                  {/* Header bar */}
                  <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-900">
                    <span className="text-white font-bold text-[13px] flex items-center gap-1.5">
                      💬 Comments <span className="text-neutral-500 font-medium">({(storyComments[activeStory.image] || []).length})</span>
                    </span>
                    <button 
                      onClick={() => {
                        setShowStoryCommentsPanel(false);
                        setIsStoryPaused(false);
                      }}
                      className="text-neutral-400 hover:text-white text-xl font-bold p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Scrollable comments list */}
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5">
                    {(storyComments[activeStory.image] || []).length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 gap-1.5">
                        <span className="text-3xl opacity-40">💬</span>
                        <p className="font-bold text-[12px] text-neutral-300">No comments yet</p>
                        <p className="text-[10px]">Be the first to say something about @{activeStory.name}'s story!</p>
                      </div>
                    ) : (
                      (storyComments[activeStory.image] || []).map((comment) => (
                        <div key={comment.id} className="flex items-start gap-3 text-[12px]">
                          <img src={`https://i.pravatar.cc/150?u=${comment.username}`} className="w-8 h-8 rounded-full border border-neutral-800 object-cover shrink-0" alt={comment.username} />
                          <div className="flex flex-col flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-neutral-200">@{comment.username}</span>
                              <span className="text-neutral-500 text-[10px]">{comment.time}</span>
                            </div>
                            <span className="text-neutral-300 mt-0.5">{comment.text}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Comment submit form */}
                  <form 
                    onSubmit={handleStoryCommentSubmit}
                    className="p-3 border-t border-neutral-900 bg-neutral-950 flex gap-2 items-center"
                  >
                    <input 
                      type="text" 
                      placeholder="Add a comment..." 
                      value={newStoryCommentText}
                      onChange={(e) => setNewStoryCommentText(e.target.value)}
                      className="flex-1 bg-neutral-900 border border-neutral-800 rounded-full px-3.5 py-2 text-white text-[12px] outline-none focus:border-neutral-700"
                    />
                    <button 
                      type="submit" 
                      disabled={!newStoryCommentText.trim()}
                      className="text-blue-500 disabled:opacity-40 font-bold text-[12px] hover:text-blue-400 px-3 cursor-pointer"
                    >
                      Post
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Interactive Share/Send to DM Panel Slide-up */}
            <AnimatePresence>
              {showStorySharePanel && (
                <motion.div 
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="absolute inset-x-0 bottom-0 h-[65%] bg-neutral-950/95 backdrop-blur-xl rounded-t-2xl border-t border-neutral-800 z-50 flex flex-col pointer-events-auto"
                  onMouseDown={e => e.stopPropagation()} 
                  onTouchStart={e => e.stopPropagation()}
                >
                  {/* Header bar */}
                  <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-900">
                    <span className="text-white font-bold text-[13px]">
                      ↗ Send Story to Friends
                    </span>
                    <button 
                      onClick={() => {
                        setShowStorySharePanel(false);
                        setIsStoryPaused(false);
                      }}
                      className="text-neutral-400 hover:text-white text-xl font-bold p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Friends search */}
                  <div className="p-2 border-b border-neutral-900 bg-neutral-950/50">
                    <input 
                      type="text" 
                      placeholder="Search friends..." 
                      className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-lg px-3 py-1.5 text-[11px] outline-none" 
                    />
                  </div>

                  {/* Friends share list */}
                  <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
                    {[
                      { name: 'kevin', subtitle: 'Kevin Systrom' },
                      { name: 'doglover', subtitle: 'Dog Lover' },
                      { name: 'sarah', subtitle: 'Sarah Jenkins' },
                      { name: 'vintage_cars', subtitle: 'Classic Rides' },
                      { name: 'mike99', subtitle: 'Mike Johnson' }
                    ].map((friend) => {
                      // isSent check removed (chatThreads not in scope here)
                      const isSent = false;

                      return (
                        <div key={friend.name} className="flex justify-between items-center p-2 hover:bg-neutral-900 rounded-lg transition-colors">
                          <div className="flex items-center gap-2.5">
                            <img src={`https://i.pravatar.cc/150?u=${friend.name}`} className="w-8 h-8 rounded-full border border-neutral-800 object-cover" alt={friend.name} />
                            <div className="flex flex-col">
                              <span className="text-white text-[12px] font-bold">@{friend.name}</span>
                              <span className="text-neutral-500 text-[10px]">{friend.subtitle}</span>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => {
                              if (!isSent) {
                                handleSendMessage(friend.name, "Sent you a story", { storyImg: activeStory.image });
                                showTemporaryToast(`Story sent to @${friend.name}!`);
                              }
                            }}
                            className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${isSent ? 'bg-neutral-800 text-neutral-400 cursor-default' : 'bg-blue-500 hover:bg-blue-400 text-white cursor-pointer active:scale-95'}`}
                          >
                            {isSent ? 'Sent ✓' : 'Send'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Side screen navigation areas to tap to next/prev story or close */}
          <div className="absolute top-0 bottom-0 left-0 w-[15%] z-10 cursor-pointer" onClick={handleCloseStory} />
          <div className="absolute top-0 bottom-0 right-0 w-[15%] z-10 cursor-pointer" onClick={handleCloseStory} />
        </div>
      )}

      {/* Interactive Reel Share/Send to DM Panel Slide-up */}
      <AnimatePresence>
        {isShareReelOpen && sharingReel && (
          <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-xs flex items-end justify-center">
            <div className="absolute inset-0" onClick={() => setIsShareReelOpen(false)} />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-[420px] h-[65%] bg-neutral-950/95 border-t border-neutral-800 rounded-t-2xl flex flex-col shadow-2xl z-50 pointer-events-auto"
              onMouseDown={e => e.stopPropagation()} 
              onTouchStart={e => e.stopPropagation()}
            >
              {/* Drag Indicator */}
              <div className="w-10 h-1 bg-neutral-800 rounded-full mx-auto my-2 shrink-0" />

              {/* Header bar */}
              <div className="flex justify-between items-center px-4 pb-3 border-b border-neutral-900">
                <span className="text-white font-bold text-[13px] flex items-center gap-1.5">
                  <span className="text-blue-400">↗</span> Share Reel with Friends
                </span>
                <button 
                  onClick={() => {
                    setIsShareReelOpen(false);
                    setSharingReel(null);
                    setShareSearchQuery('');
                  }}
                  className="text-neutral-400 hover:text-white text-xl font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Friends search */}
              <div className="p-2 border-b border-neutral-900 bg-neutral-950/50">
                <input 
                  type="text" 
                  placeholder="Search friends..." 
                  value={shareSearchQuery}
                  onChange={(e) => setShareSearchQuery(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-lg px-3 py-1.5 text-[11px] outline-none placeholder-gray-500 focus:border-neutral-700" 
                />
              </div>

              {/* Friends share list */}
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
                {[
                  { name: 'kevin', subtitle: 'Kevin Systrom' },
                  { name: 'doglover', subtitle: 'Dog Lover' },
                  { name: 'sarah', subtitle: 'Sarah Jenkins' },
                  { name: 'vintage_cars', subtitle: 'Classic Rides' },
                  { name: 'mike99', subtitle: 'Mike Johnson' }
                ]
                .filter(friend => friend.name.toLowerCase().includes(shareSearchQuery.toLowerCase()) || friend.subtitle.toLowerCase().includes(shareSearchQuery.toLowerCase()))
                .map((friend) => {
                  // isSent check removed (chatThreads not in scope here)
                  const isSent = false;

                  return (
                    <div key={friend.name} className="flex justify-between items-center p-2 hover:bg-neutral-900 rounded-lg transition-colors">
                      <div className="flex items-center gap-2.5">
                        <img src={`https://i.pravatar.cc/150?u=${friend.name}`} className="w-8 h-8 rounded-full border border-neutral-800 object-cover" alt={friend.name} />
                        <div className="flex flex-col">
                          <span className="text-white text-[12px] font-bold">@{friend.name}</span>
                          <span className="text-neutral-500 text-[10px]">{friend.subtitle}</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => {
                          if (!isSent) {
                            handleSendMessage(friend.name, `Shared a Reel: "${sharingReel.caption || 'Retro Reel'}"`, { storyImg: sharingReel.image });
                            showTemporaryToast(`Reel shared with @${friend.name}!`);
                          }
                        }}
                        className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${isSent ? 'bg-neutral-800 text-neutral-400 cursor-default' : 'bg-blue-500 hover:bg-blue-400 text-white cursor-pointer active:scale-95'}`}
                      >
                        {isSent ? 'Sent ✓' : 'Send'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}

        {/* Interactive Reel Comments Drawer */}
        {isReelCommentsOpen && selectedReelForComments && (
          <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-xs flex items-end justify-center">
            <div className="absolute inset-0" onClick={() => setIsReelCommentsOpen(false)} />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-[420px] h-[65%] bg-neutral-950/95 border-t border-neutral-800 rounded-t-2xl flex flex-col shadow-2xl z-50 pointer-events-auto"
              onMouseDown={e => e.stopPropagation()} 
              onTouchStart={e => e.stopPropagation()}
            >
              {/* Drag Indicator */}
              <div className="w-10 h-1 bg-neutral-800 rounded-full mx-auto my-2 shrink-0" />

              {/* Header bar */}
              <div className="flex justify-between items-center px-4 pb-3 border-b border-neutral-900">
                <span className="text-white font-bold text-[13px] flex items-center gap-1.5">
                  <span className="text-purple-400">💬</span> Comments
                </span>
                <button 
                  onClick={() => {
                    setIsReelCommentsOpen(false);
                    setSelectedReelForComments(null);
                    setNewReelCommentText('');
                  }}
                  className="text-neutral-400 hover:text-white text-xl font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Comments list container */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {/* Reel description/author comment */}
                <div className="flex items-start gap-2.5 pb-3 border-b border-neutral-900">
                  <img src={selectedReelForComments.avatar} className="w-8 h-8 rounded-full border border-neutral-800 object-cover" alt={selectedReelForComments.username} />
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[12px] text-white">
                      <span className="font-bold mr-1.5">@{selectedReelForComments.username}</span>
                      <span className="text-neutral-300">{selectedReelForComments.caption}</span>
                    </div>
                    <span className="text-neutral-600 text-[9px]">Author • 🎵 {selectedReelForComments.audio}</span>
                  </div>
                </div>

                {/* User posted comments */}
                {((reelCommentsList[selectedReelForComments.id] || [])).length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-10">
                    <span className="text-3xl">💬</span>
                    <span className="text-[11px] text-neutral-400 font-bold">No comments yet</span>
                    <p className="text-[9px] text-neutral-500 max-w-[200px]">Start the conversation by adding a comment below!</p>
                  </div>
                ) : (
                  (reelCommentsList[selectedReelForComments.id] || []).map((comment) => (
                    <div key={comment.id} className="flex items-start gap-2.5 group">
                      <img src={`https://i.pravatar.cc/150?u=${comment.username}`} className="w-7 h-7 rounded-full border border-neutral-900 object-cover" alt={comment.username} />
                      <div className="flex-1 flex flex-col gap-0.5">
                        <div className="text-[11px] text-white">
                          <span className="font-extrabold mr-1.5">@{comment.username}</span>
                          <span className="text-neutral-200">{comment.text}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[8px] text-neutral-500 font-mono">
                          <span>{comment.time || '1m'}</span>
                          <button className="hover:text-neutral-300 font-bold">Reply</button>
                          <button className="hover:text-neutral-300 font-bold">Like</button>
                        </div>
                      </div>
                      <span className="text-[10px] text-neutral-600 hover:text-red-500 cursor-pointer self-center opacity-0 group-hover:opacity-100 transition-opacity">♡</span>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Input form */}
              <div className="p-3 bg-neutral-950 border-t border-neutral-900 flex gap-2 items-center">
                <img src={authUser?.profilePic || "https://i.pravatar.cc/150?u=default"} className="w-8 h-8 rounded-full border border-neutral-800 object-cover" alt="My avatar" />
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newReelCommentText.trim()) return;
                    
                    try {
                      const res = await axios.post(`http://localhost:5000/api/reels/${selectedReelForComments.id}/comments`, {
                        text: newReelCommentText.trim()
                      }, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      
                      const newComment = {
                        id: res.data.data._id || Date.now(),
                        username: authUser?.username || 'user',
                        text: newReelCommentText.trim(),
                        time: 'Just now'
                      };

                      setReelCommentsList(prev => ({
                        ...prev,
                        [selectedReelForComments.id]: [...(prev[selectedReelForComments.id] || []), newComment]
                      }));

                      setNewReelCommentText('');
                      showTemporaryToast("Comment posted successfully!");
                    } catch (err) {
                      console.error('Comment failed', err);
                      showTemporaryToast("Failed to post comment.");
                    }
                  }}
                  className="flex-1 flex gap-2"
                >
                  <input 
                    type="text"
                    value={newReelCommentText}
                    onChange={(e) => setNewReelCommentText(e.target.value)}
                    placeholder={`Comment as @${authUser?.username || 'user'}...`}
                    className="flex-1 bg-neutral-900 border border-neutral-800 text-white rounded-full px-3.5 py-1.5 text-[11px] outline-none placeholder-gray-500 focus:border-neutral-700"
                  />
                  <button 
                    type="submit" 
                    disabled={!newReelCommentText.trim()}
                    className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold transition-all ${newReelCommentText.trim() ? 'bg-blue-500 hover:bg-blue-400 text-white cursor-pointer active:scale-95' : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'}`}
                  >
                    Post
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* 🎬 Interactive Highlight Player Modal */}
        {activeHighlight && activeHighlight.stories[activeHighlight.index] && (() => {
          const slide = activeHighlight.stories[activeHighlight.index];
          return (
            <div className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center backdrop-blur-md select-none font-sans">
              {/* Close Button */}
              <button 
                className="absolute top-4 right-4 text-white hover:text-gray-300 text-4xl font-light cursor-pointer z-[130] transition-colors duration-200"
                onClick={() => setActiveHighlight(null)}
              >
                ×
              </button>

              {/* Story Container */}
              <div 
                className="relative w-full max-w-[420px] h-[90vh] max-h-[840px] bg-neutral-900 rounded-xl overflow-hidden flex flex-col shadow-2xl border border-neutral-800"
                onMouseDown={() => setIsHighlightPaused(true)}
                onMouseUp={() => setIsHighlightPaused(false)}
                onTouchStart={() => setIsHighlightPaused(true)}
                onTouchEnd={() => setIsHighlightPaused(false)}
              >
                {/* Background image */}
                <div 
                  className="absolute inset-0 w-full h-full bg-cover bg-center cursor-pointer select-none"
                  style={{ backgroundImage: `url(${slide.image})` }}
                >
                  {/* Vignette */}
                  <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

                  {/* Display Stickers */}
                  {slide.stickers && slide.stickers.map((sticker: any, idx: number) => {
                    let content = null;
                    if (sticker.type === 'text') {
                      content = (
                        <div 
                          className="px-3 py-1.5 rounded-md font-bold tracking-tight text-center shadow-lg text-sm"
                          style={{ color: sticker.color || '#fff', backgroundColor: sticker.bg || '#000000a0' }}
                        >
                          {sticker.text}
                        </div>
                      );
                    } else if (sticker.type === 'location') {
                      content = (
                        <div className="px-3 py-1.5 rounded-full font-bold tracking-tight text-center shadow-lg text-xs bg-blue-500 border border-blue-400 text-white flex items-center gap-1">
                          📍 {sticker.text}
                        </div>
                      );
                    } else if (sticker.type === 'music') {
                      content = (
                        <div className="px-3.5 py-2 bg-black/75 border border-neutral-800 text-amber-400 font-mono text-[11px] rounded-lg shadow-2xl flex items-center gap-2">
                          🎵 {sticker.text}
                        </div>
                      );
                    }
                    return (
                      <div 
                        key={idx}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20"
                        style={{ left: `${sticker.x}%`, top: `${sticker.y}%` }}
                      >
                        {content}
                      </div>
                    );
                  })}
                </div>

                {/* Progress Indicators */}
                <div className="absolute top-3 inset-x-4 flex gap-1 z-30">
                  {activeHighlight.stories.map((_, i) => {
                    let widthPercent = 0;
                    if (i < activeHighlight.index) widthPercent = 100;
                    else if (i === activeHighlight.index) widthPercent = highlightProgress;
                    return (
                      <div key={i} className="flex-1 h-[2px] bg-white/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white transition-all duration-50 ease-linear"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Header info */}
                <div className="absolute top-7 left-4 right-4 flex justify-between items-center z-30">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full border border-amber-500/50 p-[1px] bg-black overflow-hidden flex items-center justify-center">
                      <img src={authUser?.profilePic || "https://i.pravatar.cc/150?u=default"} className="w-full h-full rounded-full object-cover" alt="avatar" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white text-[12px] font-bold">{authUser?.username || 'user'}</span>
                      <span className="text-white/70 text-[9px] font-bold flex items-center gap-1">
                        Highlighted • {activeHighlight.name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interactive Taps Left/Right */}
                <div 
                  className="absolute top-20 bottom-16 left-0 w-[45%] z-20 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeHighlight.index > 0) {
                      setActiveHighlight({
                        ...activeHighlight,
                        index: activeHighlight.index - 1
                      });
                      setHighlightProgress(0);
                    } else {
                      showTemporaryToast("👈 First slide of highlight!");
                    }
                  }}
                />
                <div 
                  className="absolute top-20 bottom-16 right-0 w-[45%] z-20 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeHighlight.index + 1 < activeHighlight.stories.length) {
                      setActiveHighlight({
                        ...activeHighlight,
                        index: activeHighlight.index + 1
                      });
                      setHighlightProgress(0);
                    } else {
                      setActiveHighlight(null);
                    }
                  }}
                />

                {/* Bottom Reply/Like Bar */}
                <div className="absolute bottom-4 inset-x-4 flex items-center gap-3 z-30 pointer-events-auto">
                  <div className="flex-1 bg-black/40 border border-white/20 backdrop-blur-md rounded-full px-4 py-2 text-[11px] text-white/90 text-center">
                    Viewing {authUser?.username || 'Your'} Highlight stories
                  </div>
                  <button 
                    onClick={() => {
                      showTemporaryToast("❤️ You liked this highlight!");
                    }}
                    className="w-10 h-10 rounded-full bg-black/40 border border-white/20 backdrop-blur-md flex items-center justify-center text-white text-lg hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                  >
                    ♡
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ✨ Create Highlight Modal */}
        {isCreateHighlightOpen && (
          <div className="fixed inset-0 z-[130] bg-black/60 flex items-center justify-center font-sans p-4">
            <div className="bg-white rounded-2xl w-full max-w-[380px] border border-[#ccc] shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
              {/* Header */}
              <div className="p-4 border-b border-[#eee] flex justify-between items-center bg-[#fdfdfd]">
                <h3 className="font-bold text-[14px] text-gray-800">Create Highlight</h3>
                <button 
                  onClick={() => setIsCreateHighlightOpen(false)}
                  className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
                {/* Highlight Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Highlight Name</label>
                  <input 
                    type="text"
                    value={newHighlightName}
                    onChange={(e) => setNewHighlightName(e.target.value)}
                    placeholder="e.g. Summer Vibes 🌊"
                    className="w-full bg-[#fcfcfc] border border-gray-300 rounded-lg px-3 py-2 text-[12px] outline-none focus:border-amber-500 font-medium text-gray-800"
                  />
                </div>

                {/* Cover Image Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Select Cover Image</label>
                  <div className="flex gap-2.5 overflow-x-auto py-1">
                    {[
                      'https://images.unsplash.com/photo-1542931287-023b922fa89b?auto=format&fit=crop&q=80&w=150&h=150',
                      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=150&h=150',
                      'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=150&h=150',
                      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=150&h=150',
                      'https://images.unsplash.com/photo-1505628346881-b72b27e84530?auto=format&fit=crop&q=80&w=150&h=150'
                    ].map((coverUrl) => (
                      <div 
                        key={coverUrl}
                        onClick={() => setNewHighlightCover(coverUrl)}
                        className={`w-12 h-12 rounded-full cursor-pointer overflow-hidden border-2 flex-shrink-0 transition-transform ${newHighlightCover === coverUrl ? 'border-amber-500 scale-105' : 'border-gray-200'}`}
                      >
                        <img src={coverUrl} className="w-full h-full object-cover" alt="cover" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stories to Include */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Add Stories (Choose 1 or more)</label>
                  <div className="grid grid-cols-3 gap-2 py-1 max-h-[180px] overflow-y-auto">
                    {[
                      { id: 'st1', title: 'Neon Vibes', img: 'https://images.unsplash.com/photo-1542931287-023b922fa89b?auto=format&fit=crop&q=80&w=200&h=300' },
                      { id: 'st2', title: 'Blue Ocean', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=200&h=300' },
                      { id: 'st3', title: 'Chill Coffee', img: 'https://images.unsplash.com/photo-1497215848529-f19b67160759?auto=format&fit=crop&q=80&w=200&h=300' },
                      { id: 'st4', title: 'Vintage Road', img: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=200&h=300' },
                      { id: 'st5', title: 'Retro Portrait', img: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=200&h=300' },
                      { id: 'st6', title: 'Vinyl Record', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200&h=300' }
                    ].map((st) => {
                      const isSelected = selectedStoriesForHighlight.includes(st.id);
                      return (
                        <div 
                          key={st.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedStoriesForHighlight(prev => prev.filter(id => id !== st.id));
                            } else {
                              setSelectedStoriesForHighlight(prev => [...prev, st.id]);
                            }
                          }}
                          className={`relative aspect-[2/3] rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${isSelected ? 'border-amber-500 scale-[0.98]' : 'border-transparent'}`}
                        >
                          <img src={st.img} className="w-full h-full object-cover" alt="story" />
                          <div className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="bg-amber-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px]">✓</div>
                          </div>
                          <span className="absolute bottom-1 left-1 text-[7px] text-white bg-black/60 px-1 rounded truncate w-[85%]">{st.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[#eee] flex gap-2">
                <button 
                  onClick={() => setIsCreateHighlightOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg py-2 text-[11px] font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (!newHighlightName.trim()) {
                      showTemporaryToast("⚠️ Please enter a highlight name!");
                      return;
                    }
                    if (selectedStoriesForHighlight.length === 0) {
                      showTemporaryToast("⚠️ Please select at least one story!");
                      return;
                    }
                    
                    const allPredefinedStories: Record<string, any> = {
                      'st1': { name: 'Neon Vibes', image: 'https://images.unsplash.com/photo-1542931287-023b922fa89b?auto=format&fit=crop&q=80&w=800&h=1200', stickers: [{ id: 201, type: 'text', text: 'Neon Glow ✨', color: '#fff', bg: '#000', x: 50, y: 50 }] },
                      'st2': { name: 'Blue Ocean', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800&h=1200', stickers: [{ id: 202, type: 'location', text: 'Maldives 🏖️', x: 50, y: 30 }] },
                      'st3': { name: 'Chill Coffee', image: 'https://images.unsplash.com/photo-1497215848529-f19b67160759?auto=format&fit=crop&q=80&w=800&h=1200', stickers: [{ id: 203, type: 'text', text: 'Coffee first. ☕', color: '#000', bg: '#fff', x: 50, y: 40 }] },
                      'st4': { name: 'Vintage Road', image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800&h=1200', stickers: [{ id: 204, type: 'music', text: 'Born to be Wild 📻', x: 50, y: 35 }] },
                      'st5': { name: 'Retro Portrait', image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=800&h=1200', stickers: [{ id: 205, type: 'text', text: 'Retro mood 🎞️', color: '#fff', bg: '#ef4444', x: 50, y: 45 }] },
                      'st6': { name: 'Vinyl Record', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800&h=1200', stickers: [{ id: 206, type: 'text', text: 'Spinning records 🎵', color: '#000', bg: '#fcd34d', x: 50, y: 55 }] }
                    };

                    const selectedStories = selectedStoriesForHighlight.map(id => allPredefinedStories[id]);
                    
                    const newHighlight = {
                      id: `highlight-${Date.now()}`,
                      name: newHighlightName.trim(),
                      img: newHighlightCover,
                      stories: selectedStories
                    };

                    setProfileHighlights(prev => [...prev, newHighlight]);
                    setIsCreateHighlightOpen(false);
                    showTemporaryToast(`✅ Highlight "${newHighlightName.trim()}" created!`);
                  }}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg py-2 text-[11px] font-bold cursor-pointer transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 📷 Profile Grid Item Post Details Modal */}
        {selectedProfilePost && (
          <div className="fixed inset-0 z-[125] bg-black/75 flex items-center justify-center font-sans p-4">
            <div className="absolute inset-0" onClick={() => setSelectedProfilePost(null)} />
            
            <div className="relative bg-white rounded-2xl w-full max-w-[380px] border border-neutral-300 shadow-2xl flex flex-col overflow-hidden max-h-[85vh] z-10 animate-fade-in">
              {/* Header */}
              <div className="p-3 border-b border-[#eee] flex justify-between items-center bg-[#fdfdfd]">
                <div className="flex items-center gap-2">
                  <img src={authUser?.profilePic || `https://i.pravatar.cc/150?u=${authUser?.username}`} className="w-7 h-7 rounded-full border border-gray-200 object-cover" alt="author" />
                  <span className="text-[12px] font-bold text-gray-800">@{authUser?.username}</span>
                </div>
                <button 
                  onClick={() => setSelectedProfilePost(null)}
                  className="text-gray-400 hover:text-gray-600 font-bold text-[14px] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Main Photo with vintage effect */}
              <div className="aspect-square w-full relative bg-black flex items-center justify-center overflow-hidden">
                {selectedProfilePost.image?.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video 
                    src={selectedProfilePost.image} 
                    className="w-full h-full object-cover" 
                    style={{ filter: 'contrast(1.1) saturate(1.1) sepia(0.15)' }} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    onDoubleClick={() => {
                      showTemporaryToast("❤️ Post Liked!");
                    }}
                  />
                ) : (
                  <img 
                    src={selectedProfilePost.image} 
                    className="w-full h-full object-cover" 
                    style={{ filter: 'contrast(1.1) saturate(1.1) sepia(0.15)' }} 
                    alt="Post content" 
                    onDoubleClick={() => {
                      showTemporaryToast("❤️ Post Liked!");
                    }}
                  />
                )}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white rounded px-2 py-0.5 text-[8px] font-mono">
                  Double tap to like
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-4 py-2 border-b border-[#eee] flex justify-between items-center bg-[#fafafa]">
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      showTemporaryToast("❤️ Post Liked!");
                    }}
                    className="text-[16px] text-gray-700 hover:text-red-500 cursor-pointer active:scale-90 transition-all"
                  >
                    ❤️
                  </button>
                  <button 
                    onClick={() => {
                      showTemporaryToast("💬 Scroll down to view/add comments!");
                    }}
                    className="text-[16px] text-gray-700 hover:text-blue-500 cursor-pointer"
                  >
                    💬
                  </button>
                  <button 
                    onClick={() => {
                      showTemporaryToast("↗️ Post link copied to clipboard!");
                    }}
                    className="text-[16px] text-gray-700 hover:text-amber-500 cursor-pointer"
                  >
                    ↗️
                  </button>
                </div>
                <div className="text-[12px] text-gray-800 mb-3 border-b border-[#eee] pb-2">
                  <span className="font-bold mr-2">{authUser?.username}</span>
                  <span>{selectedProfilePost.caption}</span>
                </div>          <div className="text-[10px] font-mono text-gray-500">
                  {selectedProfilePost.likes} Likes
                </div>
              </div>

              {/* Comments Section */}
              <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3 max-h-[160px] bg-white">
                {/* Author's Caption */}
                <div className="flex items-start gap-2">
                  <img src={authUser?.profilePic || "https://i.pravatar.cc/150?u=default"} className="w-6 h-6 rounded-full border border-gray-100 object-cover" alt="author" />
                  <div className="text-[11px] text-gray-800">
                    <span className="font-extrabold mr-1">{authUser?.username || 'user'}</span>
                    <span>{selectedProfilePost.caption}</span>
                  </div>
                </div>

                {/* Other Comments */}
                {selectedProfilePost.comments && selectedProfilePost.comments.map((comment: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <img src={`https://i.pravatar.cc/150?u=${comment.username}`} className="w-6 h-6 rounded-full border border-gray-100 object-cover" alt="user" />
                    <div className="text-[11px] text-gray-800">
                      <span className="font-extrabold mr-1">{comment.username}</span>
                      <span>{comment.text}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Comment Input */}
              <div className="p-3 border-t border-[#eee] bg-[#fafafa]">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = (e.currentTarget.elements.namedItem('commentInput') as HTMLInputElement);
                    const val = input?.value?.trim();
                    if (!val) return;
                    
                    setSelectedProfilePost((prev: any) => ({
                      ...prev,
                      comments: [...(prev.comments || []), { username: authUser?.username || 'user', text: val }]
                    }));
                    
                    input.value = '';
                    showTemporaryToast("Comment added! 💬");
                  }}
                  className="flex gap-2"
                >
                  <input 
                    name="commentInput"
                    type="text"
                    placeholder="Add a comment..."
                    className="flex-1 bg-white border border-gray-200 rounded-full px-3 py-1.5 text-[11px] outline-none placeholder-gray-400 focus:border-amber-500 text-gray-800"
                  />
                  <button 
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-3 py-1 text-[10px] font-bold cursor-pointer transition-colors active:scale-95"
                  >
                    Post
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Reels Options Modal */}
        {activeReelOptions && (
          <div className="fixed inset-0 z-[130] bg-black/75 flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setActiveReelOptions(null)} />
            
            <div className="relative bg-[#fafafa] rounded-2xl border border-neutral-300 w-full max-w-[280px] shadow-2xl flex flex-col overflow-hidden animate-fade-in text-center font-sans">
              <div className="p-4 border-b border-gray-200">
                <span className="text-[12px] font-bold text-gray-800">Reel Options</span>
                <p className="text-[10px] text-gray-500 mt-1">Select an engagement action for this Reel</p>
              </div>

              <button 
                onClick={() => {
                  const targetReel = activeReelOptions;
                  setActiveReelOptions(null);
                  setRemixingFromReel(targetReel);
                  setCreateTab('REEL');
                  setReelsSoundtrack(targetReel.audio);
                  setActiveView('Create');
                  showTemporaryToast(`🎬 Side-by-side Remix mode loaded for @${targetReel.username}'s Reel!`);
                }}
                className="py-3 text-[11px] font-bold text-blue-600 hover:bg-blue-50/50 transition-colors border-b border-gray-200 cursor-pointer active:bg-blue-100"
              >
                🎬 Remix side-by-side
              </button>

              <button 
                onClick={() => {
                  const targetReel = activeReelOptions;
                  setActiveReelOptions(null);
                  const isSaved = savedReelIds.includes(targetReel.id);
                  if (isSaved) {
                    setSavedReelIds(prev => prev.filter(id => id !== targetReel.id));
                    showTemporaryToast("Removed from Saved Collection! 🔖");
                  } else {
                    setSavedReelIds(prev => [...prev, targetReel.id]);
                    showTemporaryToast("Saved to collection! 🔖");
                  }
                }}
                className="py-3 text-[11px] font-medium text-gray-800 hover:bg-gray-100 transition-colors border-b border-gray-200 cursor-pointer"
              >
                {savedReelIds.includes(activeReelOptions.id) ? '🔖 Unsave Reel' : '🔖 Save / Bookmark'}
              </button>

              <button 
                onClick={() => {
                  setActiveReelOptions(null);
                  navigator.clipboard.writeText(window.location.href);
                  showTemporaryToast("🔗 Vintage Reel URL copied to clipboard!");
                }}
                className="py-3 text-[11px] font-medium text-gray-800 hover:bg-gray-100 transition-colors border-b border-gray-200 cursor-pointer"
              >
                🔗 Copy Link
              </button>

              <button 
                onClick={() => setActiveReelOptions(null)}
                className="py-3 text-[11px] font-bold text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* 👥 Follow Modal (Followers/Following) */}
        {activeFollowModal && (
          <div className="fixed inset-0 z-[140] bg-black/50 flex items-center justify-center font-sans p-4">
            <div className="absolute inset-0" onClick={() => setActiveFollowModal(null)} />
            <div className="vintage-panel w-full max-w-[340px] shadow-2xl flex flex-col bg-[#f0f0f0] relative z-10 animate-fade-in">
              {/* Retro Title Bar */}
              <div className="px-3 py-1.5 border-b border-[#ccc] bg-gradient-to-r from-blue-800 to-blue-500 font-bold text-[12px] text-white flex justify-between items-center">
                <span>📁 {authUser?.username}'s {activeFollowModal === 'followers' ? 'Followers' : 'Following'}</span>
                <button onClick={() => setActiveFollowModal(null)} className="text-white hover:text-red-300 font-bold text-[13px] bg-transparent border-none cursor-pointer">✕</button>
              </div>

              {/* Search Inside Modal */}
              <div className="p-2 bg-[#e0e0e0] border-b border-[#ccc] flex gap-2">
                <input 
                  type="text" 
                  placeholder={`Search ${activeFollowModal}...`}
                  value={followSearchQuery}
                  onChange={(e) => setFollowSearchQuery(e.target.value)}
                  className="vintage-input flex-1 px-2 py-1 text-[11px]"
                />
                {followSearchQuery && (
                  <button onClick={() => setFollowSearchQuery('')} className="text-[10px] text-gray-500 font-bold px-1.5">✕</button>
                )}
              </div>

              {/* User List */}
              <div className="p-2 bg-white max-h-[250px] overflow-y-auto flex flex-col gap-2">
                {(activeFollowModal === 'followers' ? followersList : followingList)
                  .filter(u => u.username.toLowerCase().includes(followSearchQuery.toLowerCase()) || u.name.toLowerCase().includes(followSearchQuery.toLowerCase()))
                  .map((user) => (
                    <div key={user.username} className="flex items-center justify-between p-1 hover:bg-[#f5f5f5] rounded">
                      <div 
                        onClick={() => {
                          setActiveUserProfile(user);
                          setActiveFollowModal(null);
                        }}
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <img src={user.avatar} className="w-8 h-8 rounded-full border border-[#ccc]" alt={user.username} />
                        <div className="flex flex-col">
                          <span className="font-bold text-[12px] text-blue-600 hover:underline">@{user.username}</span>
                          <span className="text-[10px] text-gray-500 truncate max-w-[130px]">{user.name}</span>
                        </div>
                      </div>

                      {/* Interactive Follow/Following Action Button */}
                      <button 
                        onClick={() => {
                          if (activeFollowModal === 'followers') {
                            // Toggle follow state in followers list
                            setFollowersList(prev => prev.map(f => {
                              if (f.username === user.username) {
                                const nextState = !f.isFollowing;
                                // Add/Remove from following list too to keep consistent!
                                if (nextState) {
                                  setFollowingList(old => {
                                    if (old.some(x => x.username === f.username)) return old;
                                    return [...old, { ...f, isFollowing: true }];
                                  });
                                  showTemporaryToast(`Followed @${user.username}!`);
                                } else {
                                  setFollowingList(old => old.filter(x => x.username !== user.username));
                                  showTemporaryToast(`Unfollowed @${user.username}.`);
                                }
                                return { ...f, isFollowing: nextState };
                              }
                              return f;
                            }));
                          } else {
                            // Unfollow from following list
                            setFollowingList(prev => prev.filter(f => f.username !== user.username));
                            // Also update followers list state if they are in there!
                            setFollowersList(prev => prev.map(f => f.username === user.username ? { ...f, isFollowing: false } : f));
                            showTemporaryToast(`Unfollowed @${user.username}.`);
                          }
                        }}
                        className={`retro-button px-2.5 py-1 text-[10px] font-bold ${user.isFollowing ? 'bg-[#e0e0e0] text-gray-700' : 'bg-blue-600 text-white border-blue-800'}`}
                      >
                        {user.isFollowing ? 'Following' : 'Follow'}
                      </button>
                    </div>
                ))}
              </div>
              <div className="p-2 border-t border-[#ccc] bg-[#e0e0e0] text-right">
                <button onClick={() => setActiveFollowModal(null)} className="retro-button px-4 py-1 text-[11px] font-bold">OK</button>
              </div>
            </div>
          </div>
        )}

        {/* 👤 Immersive User Profile Modal View */}
        {activeUserProfile && (() => {
          const u = activeUserProfile;
          
          // Check if currently following
          const isUserFollowed = followingList.some(item => item.username === u.username);
          
          // Generate customized mock posts for this user for high fidelity
          const userMockPosts = (() => {
            const tag = u.username;
            if (tag === 'kevin') {
              return [
                { image: 'https://images.unsplash.com/photo-1542931287-023b922fa89b?auto=format&fit=crop&q=80&w=300&h=300', caption: 'Capturing moments on old films. #vintage', likes: 210 },
                { image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=300&h=300', caption: 'Analog photography hits different.', likes: 145 },
                { image: 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?auto=format&fit=crop&q=80&w=300&h=300', caption: 'Dreaming of neon signs.', likes: 198 }
              ];
            } else if (tag === 'doglover') {
              return [
                { image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=300&h=300', caption: 'My handsome boy! 🐾', likes: 320 },
                { image: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&q=80&w=300&h=300', caption: 'Retro dog aesthetic. 🐶', likes: 289 }
              ];
            } else if (tag === 'sarah') {
              return [
                { image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=300&h=300', caption: 'Nostalgic golden hour at the coastline.', likes: 180 },
                { image: 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?auto=format&fit=crop&q=80&w=300&h=300', caption: 'Summer vibes ☀️ #classic', likes: 215 }
              ];
            } else if (tag === 'vintage_cars') {
              return [
                { image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=300&h=300', caption: 'Classic muscle car in red.', likes: 450 },
                { image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=300&h=300', caption: 'Sleek speedster. #vintagecars', likes: 388 }
              ];
            } else {
              return [
                { image: 'https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?auto=format&fit=crop&q=80&w=300&h=300', caption: 'Perspective in retro sepia lens.', likes: 98 },
                { image: 'https://images.unsplash.com/photo-1497215848529-f19b67160759?auto=format&fit=crop&q=80&w=300&h=300', caption: 'Minimalist workspace, classic setup.', likes: 112 }
              ];
            }
          })();

          // Custom user stats
          const customUserStats = {
            posts: userMockPosts.length,
            followers: u.username === 'kevin' ? 984 : u.username === 'vintage_cars' ? 4500 : 256,
            following: u.username === 'kevin' ? 321 : u.username === 'vintage_cars' ? 120 : 188
          };

          return (
            <div className="fixed inset-0 z-[135] bg-black/75 flex items-center justify-center font-sans p-2 overflow-y-auto animate-fade-in">
              <div className="absolute inset-0" onClick={() => setActiveUserProfile(null)} />
              
              <div className="relative bg-[#f0f0f0] border-2 border-[#999] rounded-[2px] w-full max-w-[420px] shadow-2xl flex flex-col overflow-hidden max-h-[92vh] z-10">
                {/* Vintage Title Bar */}
                <div className="px-3 py-1.5 border-b border-[#ccc] bg-gradient-to-r from-blue-800 to-blue-500 font-bold text-[12px] text-white flex justify-between items-center shrink-0">
                  <span className="truncate">👤 User Profile: @{u.username}</span>
                  <button onClick={() => setActiveUserProfile(null)} className="text-white hover:text-red-300 font-bold text-[13px] bg-transparent border-none cursor-pointer">✕</button>
                </div>

                {/* Profile Modal Body */}
                <div className="overflow-y-auto flex-1 bg-white p-4">
                  {/* Banner / Header Card */}
                  <div className="vintage-panel p-3 bg-[#e8e8e8] mb-4 relative rounded-none flex flex-col gap-3">
                    <div className="flex gap-4 items-center">
                      <img src={u.avatar} className="w-16 h-16 border-2 border-amber-500 shadow-[1px_1px_3px_rgba(0,0,0,0.3)] object-cover bg-white" alt={u.username} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-[15px] text-[#333] truncate">@{u.username}</h3>
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold font-mono">VERIFIED</span>
                        </div>
                        <p className="text-[11px] text-gray-600 mt-1">{u.name}</p>
                      </div>
                    </div>

                    {/* Bio details */}
                    <p className="text-[11px] text-gray-700 bg-white/60 p-2 border border-gray-200 text-center font-mono italic">
                      "Vintage enthusiast, old web lover, sharing daily analog highlights."
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center py-2 bg-white/85 border border-[#ccc]">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-gray-900">{customUserStats.posts}</span>
                        <span className="text-[9px] text-gray-500 uppercase">Posts</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-gray-900">
                          {customUserStats.followers + (isUserFollowed ? 1 : 0)}
                        </span>
                        <span className="text-[9px] text-gray-500 uppercase">Followers</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-gray-900">{customUserStats.following}</span>
                        <span className="text-[9px] text-gray-500 uppercase">Following</span>
                      </div>
                    </div>

                    {/* Actions: Follow / Unfollow & Message */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          if (isUserFollowed) {
                            // Unfollow
                            setFollowingList(prev => prev.filter(item => item.username !== u.username));
                            setFollowersList(prev => prev.map(f => f.username === u.username ? { ...f, isFollowing: false } : f));
                            showTemporaryToast(`Unfollowed @${u.username}`);
                          } else {
                            // Follow
                            setFollowingList(prev => {
                              if (prev.some(x => x.username === u.username)) return prev;
                              return [...prev, { username: u.username, name: u.name, avatar: u.avatar, isFollowing: true }];
                            });
                            setFollowersList(prev => prev.map(f => f.username === u.username ? { ...f, isFollowing: true } : f));
                            showTemporaryToast(`Followed @${u.username}!`);
                          }
                        }}
                        className={`flex-1 retro-button py-1.5 font-bold text-[11px] ${isUserFollowed ? 'bg-[#d0d0d0] text-gray-700' : 'bg-blue-600 text-white border-blue-800'}`}
                      >
                        {isUserFollowed ? '✓ Following' : '➕ Follow'}
                      </button>
                      <button 
                        onClick={() => {
                          showTemporaryToast(`✉️ Direct Message channel opened with @${u.username}`);
                          alert(`Message interface ready! Direct messaging @${u.username} is fully connected.`);
                        }}
                        className="retro-button px-3 py-1.5 font-bold text-[11px]"
                      >
                        ✉️ Message
                      </button>
                    </div>
                  </div>

                  {/* Users post grid header */}
                  <h4 className="font-bold text-[11px] text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">
                    📸 Gallery Highlights
                  </h4>

                  {/* Grid of posts */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {userMockPosts.map((post, idx) => (
                      <div 
                        key={idx}
                        onClick={() => {
                          setSelectedProfilePost({
                            image: post.image,
                            caption: post.caption,
                            likes: post.likes,
                            comments: []
                          });
                        }}
                        className="aspect-square bg-cover bg-center border border-gray-300 cursor-pointer hover:opacity-85 hover:scale-102 transition-transform"
                        style={{ backgroundImage: `url(${post.image})`, filter: 'contrast(1.1) saturate(1.1) sepia(0.15)' }}
                      />
                    ))}
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="p-3 border-t border-[#ccc] bg-[#e0e0e0] flex justify-end gap-2 shrink-0">
                  <button onClick={() => setActiveUserProfile(null)} className="retro-button px-4 py-1 text-[11px] font-bold">Close Profile</button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 👥 Edit Top Friends List Modal */}
        {showTopFriendsModal && (
          <div className="fixed inset-0 z-[145] bg-black/50 flex items-center justify-center font-sans p-4">
            <div className="absolute inset-0" onClick={() => setShowTopFriendsModal(null)} />
            <div className="vintage-panel w-full max-w-[340px] shadow-2xl flex flex-col bg-[#f0f0f0] relative z-10 animate-fade-in">
              <div className="px-3 py-1.5 border-b border-[#ccc] bg-gradient-to-r from-blue-800 to-blue-500 font-bold text-[12px] text-white flex justify-between items-center">
                <span>⭐ Edit Top Friends List</span>
                <button onClick={() => setShowTopFriendsModal(null)} className="text-white hover:text-red-300 font-bold text-[13px] bg-transparent border-none cursor-pointer">✕</button>
              </div>
              <div className="p-3 bg-white max-h-[280px] overflow-y-auto flex flex-col gap-2">
                <p className="text-[11px] text-gray-500 mb-2">Toggle star to add/remove users from your featured top friends sidebar widget.</p>
                {[
                  { username: 'kevin', name: 'Kevin O.' },
                  { username: 'doglover', name: 'Dog Lover' },
                  { username: 'sarah', name: 'Sarah Connor' },
                  { username: 'vintage_cars', name: 'Vintage Cars Club' },
                  { username: 'mike99', name: 'Michael Scott' },
                  { username: 'photofan', name: 'Photo Fanatic' },
                  { username: 'coolkid', name: 'Cool Kid' },
                  { username: 'jessica', name: 'Jessica Day' },
                  { username: 'retro_glow', name: 'Retro Glow' },
                  { username: 'polaroid_queen', name: 'Polaroid Queen' }
                ].map((user) => {
                  const isTopFriend = topFriendsList.includes(user.username);
                  return (
                    <div key={user.username} className="flex items-center justify-between p-1 hover:bg-[#f9f9f9]">
                      <div className="flex items-center gap-2">
                        <img src={`https://i.pravatar.cc/150?u=${user.username}`} className="w-8 h-8 rounded-full border" alt="" />
                        <div className="flex flex-col">
                          <span className="font-bold text-[12px]">@{user.username}</span>
                          <span className="text-[10px] text-gray-400">{user.name}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          if (isTopFriend) {
                            setTopFriendsList(prev => prev.filter(u => u !== user.username));
                            showTemporaryToast(`Removed @${user.username} from Top Friends`);
                          } else {
                            setTopFriendsList(prev => [...prev, user.username]);
                            showTemporaryToast(`Added @${user.username} to Top Friends!`);
                          }
                        }}
                        className={`retro-button px-2.5 py-1 text-[10px] font-bold ${isTopFriend ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {isTopFriend ? '⭐ Top Friend' : '☆ Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="p-2 border-t border-[#ccc] bg-[#e0e0e0] text-right">
                <button 
                  onClick={() => {
                    updateRetroProfileBackend({ topFriends: topFriendsList.map(name => ({ username: name })) });
                    setShowTopFriendsModal(null);
                  }} 
                  className="retro-button px-4 py-1 text-[11px] font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🎵 Edit Soundtrack Track Info Modal */}
        {showEditMusicModal && (
          <div className="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center font-sans p-4">
            <div className="absolute inset-0" onClick={() => setShowEditMusicModal(null)} />
            <div className="vintage-panel w-full max-w-[320px] shadow-2xl flex flex-col bg-[#f0f0f0] relative z-10 animate-fade-in">
              <div className="px-3 py-1.5 border-b border-[#ccc] bg-gradient-to-r from-blue-800 to-blue-500 font-bold text-[12px] text-white flex justify-between items-center">
                <span>💿 Edit Sound Soundtrack</span>
                <button onClick={() => setShowEditMusicModal(null)} className="text-white hover:text-red-300 font-bold text-[13px] bg-transparent border-none cursor-pointer">✕</button>
              </div>
              <div className="p-4 bg-white flex flex-col gap-3">
                <p className="text-[11px] text-gray-500 font-sans leading-relaxed">
                  Enter your custom favorite song track and artist to update the tape soundtrack currently playing on your vintage tape deck widget.
                </p>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase">Track Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Numb"
                    value={customSongTitle}
                    onChange={(e) => setCustomSongTitle(e.target.value)}
                    className="vintage-input px-2.5 py-1.5 text-[12px]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase">Artist / Band</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Linkin Park"
                    value={customSongArtist}
                    onChange={(e) => setCustomSongArtist(e.target.value)}
                    className="vintage-input px-2.5 py-1.5 text-[12px]"
                  />
                </div>
              </div>
              <div className="p-2 border-t border-[#ccc] bg-[#e0e0e0] flex justify-end gap-2">
                <button onClick={() => setShowEditMusicModal(null)} className="retro-button px-3 py-1 text-[11px]">Cancel</button>
                <button 
                  onClick={() => {
                    if (!customSongTitle.trim()) {
                      alert('Track title is required!');
                      return;
                    }
                    const fullTitle = customSongArtist.trim() ? `${customSongArtist.trim()} - ${customSongTitle.trim()}` : customSongTitle.trim();
                    const newTrack = {
                      title: fullTitle,
                      artist: customSongArtist.trim() || 'Unknown Artist',
                      duration: '3:05'
                    };
                    setNowPlayingTrack(newTrack);
                    updateRetroProfileBackend({ nowPlaying: newTrack });
                    setNowPlayingProgress(0);
                    setIsMusicPlaying(true);
                    setShowEditMusicModal(false);
                    showTemporaryToast(`🎵 Soundtrack updated: "${fullTitle}"!`);
                  }} 
                  className="retro-blue-button px-4 py-1 text-[11px] font-bold text-white bg-blue-600"
                >
                  Apply Tape
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Audio Detail / Track Hub Page Modal */}
        {activeAudioDetail && (
          <div className="fixed inset-0 z-[120] bg-white flex flex-col font-sans overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-[#ccc] bg-[#f8f8f8] flex justify-between items-center shrink-0">
              <button 
                onClick={() => setActiveAudioDetail(null)}
                className="retro-button px-3 py-1 text-[11px] font-bold flex items-center gap-1"
              >
                ◀ Back
              </button>
              <span className="font-bold text-[13px] text-gray-800">Track Hub</span>
              <div className="w-[45px]" />
            </div>

            {/* Hub Body */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 bg-[#fcfcfc]">
              <div className="flex gap-4 items-center">
                {/* Vintage audio tape or vinyl design */}
                <div className="w-[80px] h-[80px] rounded-full border-2 border-amber-500 bg-neutral-900 flex items-center justify-center shadow-lg relative shrink-0 animate-spin" style={{ animationDuration: '8s' }}>
                  <div className="w-8 h-8 rounded-full bg-amber-500 border border-neutral-900 flex items-center justify-center">
                    <span className="text-neutral-900 text-[10px] font-bold">LP</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 min-w-0">
                  <h3 className="font-bold text-[15px] text-gray-900 truncate">{activeAudioDetail.title}</h3>
                  <span className="text-[11px] text-gray-500 font-mono">by {activeAudioDetail.creator}</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold w-max">
                    {activeAudioDetail.count}
                  </span>
                </div>
              </div>

              {/* Action: Use Audio */}
              <button 
                onClick={() => {
                  setCreateTab('REEL');
                  setReelsSoundtrack(activeAudioDetail.title);
                  setActiveAudioDetail(null);
                  setActiveView('Create');
                  showTemporaryToast(`🎵 Loaded track: "${activeAudioDetail.title}" for your new Reel!`);
                }}
                className="retro-blue-button w-full py-2.5 font-bold text-[12px] flex items-center justify-center gap-1.5 shadow-md"
              >
                <span>🎬</span> Use this Audio in a New Reel
              </button>

              {/* Grid of matching reels using this soundtrack */}
              <div>
                <span className="font-bold text-[11px] text-gray-400 uppercase tracking-wider block mb-3">Reels using this audio</span>
                {activeAudioDetail.reels.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-[11px]">
                    No other reels use this soundtrack preset yet. Be the first!
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {activeAudioDetail.reels.map((r) => (
                      <div 
                        key={r.id}
                        onClick={() => {
                          const globalIdx = reels.findIndex(gr => gr.id === r.id);
                          if (globalIdx !== -1) {
                            setActiveReelIndex(globalIdx);
                            setActiveAudioDetail(null);
                            setActiveView('Reels');
                          }
                        }}
                        className="aspect-[9/16] bg-cover bg-center border border-gray-200 shadow-sm cursor-pointer relative group overflow-hidden"
                        style={{ backgroundImage: `url(${r.image})` }}
                      >
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1 z-10">
                          <span>❤️ {r.likes}</span>
                        </div>
                        <div className="absolute bottom-1.5 left-1.5 text-[10px] text-white/95 drop-shadow-md z-10">▶</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
