import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from './supabase';
import { Upload as TusUpload } from 'tus-js-client';
import {
  Folder, File as FileIcon, Upload, Plus, ChevronRight, Home,
  Loader2, Download, AlertCircle, X, Image, FileText,
  Film, Music, Archive, Code, CheckCircle2, FolderOpen,
  Cloud, Shield, Zap, Globe, ArrowRight, ArrowLeft,
  Sparkles, Lock, LogOut, Star, Search, Share2, Copy, Check,
  BarChart2, Key, Eye, EyeOff, ShieldCheck, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from '@supabase/supabase-js';

type FileItem = {
  name: string;
  fullPath: string;
  isFolder: boolean;
  size?: number;
};

type Toast = {
  id: string;
  type: 'success' | 'error';
  message: string;
};

type View = 'landing' | 'app';
type Category = 'all' | 'photos' | 'videos' | 'documents' | 'archives' | 'starred';
type SpaceMode = 'public' | 'private';

const BUCKET_NAME = 'r-drive';

function isPhoto(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'avif'].includes(ext);
}

function isVideo(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);
}

function isAudio(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return ['mp3', 'wav', 'flac', 'ogg', 'm4a'].includes(ext);
}

function isArchive(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return ['zip', 'tar', 'gz', 'rar', '7z'].includes(ext);
}

function isDocument(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return ['pdf', 'doc', 'docx', 'txt', 'md', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext);
}

function isCode(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return ['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'html', 'css', 'json'].includes(ext);
}

function getFileIcon(name: string) {
  if (isPhoto(name)) return { Icon: Image, color: 'text-pink-400', bg: 'bg-pink-500/15', category: 'photos' };
  if (isVideo(name)) return { Icon: Film, color: 'text-purple-400', bg: 'bg-purple-500/15', category: 'videos' };
  if (isAudio(name)) return { Icon: Music, color: 'text-yellow-400', bg: 'bg-yellow-500/15', category: 'audio' };
  if (isArchive(name)) return { Icon: Archive, color: 'text-orange-400', bg: 'bg-orange-500/15', category: 'archives' };
  if (isCode(name)) return { Icon: Code, color: 'text-green-400', bg: 'bg-green-500/15', category: 'code' };
  if (isDocument(name)) return { Icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/15', category: 'documents' };
  return { Icon: FileIcon, color: 'text-slate-400', bg: 'bg-slate-500/15', category: 'other' };
}

function formatSize(bytes?: number) {
  if (bytes === undefined || bytes === null) return '';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ─── Floating file-type icon for hero ───────────────────────────────────────
function FloatingIcon({
  icon: Icon, color, bg, style, delay = 0
}: {
  icon: React.ElementType; color: string; bg: string;
  style: React.CSSProperties; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, type: 'spring' }}
      className={`absolute w-12 h-12 rounded-2xl ${bg} border border-white/10 flex items-center justify-center shadow-xl backdrop-blur-sm pointer-events-none hidden sm:flex`}
      style={style}
    >
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [0, 4, 0] }}
        transition={{ duration: 3 + delay, repeat: Infinity, ease: 'easeInOut', delay: delay * 0.5 }}
      >
        <Icon size={22} className={color} />
      </motion.div>
    </motion.div>
  );
}

// ─── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.06] bg-black/20 backdrop-blur-sm mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
        <div className="flex flex-col items-center md:items-start gap-3 max-w-sm text-center md:text-left">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="ZupShare Logo" className="w-7 h-7 rounded-lg shadow-sm" />
            <span className="font-semibold text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">
              ZupShare
            </span>
          </div>
          <p className="text-foreground/40 text-xs leading-relaxed">
            ZupShare is your free public & private cloud file sharing hub. Seamlessly upload, organize, and share files worldwide with zero friction.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-8 text-sm">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="font-semibold text-foreground/80 text-xs tracking-wider uppercase">Platform</span>
            <a href="/" className="text-foreground/40 hover:text-foreground/80 transition-colors text-xs">Home</a>
            <a href="#features" className="text-foreground/40 hover:text-foreground/80 transition-colors text-xs">Features</a>
            <a href="#how-it-works" className="text-foreground/40 hover:text-foreground/80 transition-colors text-xs">How it Works</a>
          </div>
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="font-semibold text-foreground/80 text-xs tracking-wider uppercase">Connect</span>
            <a href="https://twitter.com/rushalbangar" target="_blank" rel="noopener noreferrer" className="text-foreground/40 hover:text-foreground/80 transition-colors text-xs">Twitter / X</a>
            <a href="https://github.com/rushalbangar" target="_blank" rel="noopener noreferrer" className="text-foreground/40 hover:text-foreground/80 transition-colors text-xs">GitHub</a>
            <a href="https://linkedin.com/in/rushalbangar" target="_blank" rel="noopener noreferrer" className="text-foreground/40 hover:text-foreground/80 transition-colors text-xs">LinkedIn</a>
          </div>

          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="font-semibold text-foreground/80 text-xs tracking-wider uppercase">Legal</span>
            <a href="#" className="text-foreground/40 hover:text-foreground/80 transition-colors text-xs">Privacy Policy</a>
            <a href="#" className="text-foreground/40 hover:text-foreground/80 transition-colors text-xs">Terms of Service</a>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-6 py-4 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
          <span className="text-foreground/25 text-xs">© 2026 ZupShare. All rights reserved.</span>
          <span className="hidden sm:block text-foreground/10 text-xs">•</span>
          <span className="text-foreground/40 text-xs">
            Created by <a href="https://twitter.com/rushalbangar" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Rushal Bangar</a> with ❤️
          </span>
        </div>
        <div className="flex items-center gap-6 text-xs text-foreground/40">
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground/70 transition-colors flex items-center gap-1.5"
            aria-label="Powered by Supabase"
          >
            <Cloud size={12} />
            Powered by Supabase
          </a>
        </div>
      </div>
    </footer>
  );
}

// ─── Share Link Modal ─────────────────────────────────────────────────────────
function ShareModal({ item, onClose, addToast }: { item: FileItem; onClose: () => void; addToast: (type: 'success' | 'error', msg: string) => void }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  const publicUrl = useMemo(() => {
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(item.fullPath);
    return data.publicUrl || '';
  }, [item]);

  const markdownSnippet = `![${item.name}](${publicUrl})`;

  const copyToClipboard = (text: string, isMd: boolean) => {
    navigator.clipboard.writeText(text);
    if (isMd) {
      setCopiedMarkdown(true);
      setTimeout(() => setCopiedMarkdown(false), 2000);
      addToast('success', 'Markdown snippet copied!');
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      addToast('success', 'Public URL copied to clipboard!');
    }
  };

  const fileType = getFileIcon(item.name);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/75 backdrop-blur-md" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass-panel w-full max-w-md p-6 rounded-2xl relative border border-white/10"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-foreground/50 hover:text-foreground transition-colors">
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-xl ${fileType.bg} ${fileType.color}`}>
            <Share2 size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold">Share File</h3>
            <p className="text-xs text-foreground/50 truncate max-w-[260px]">{item.name}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider block mb-2">Direct Public Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-foreground/80 outline-none select-all"
              />
              <button
                onClick={() => copyToClipboard(publicUrl, false)}
                className="px-3.5 py-2 rounded-xl bg-primary hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                {copiedLink ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {isPhoto(item.name) && (
            <div>
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider block mb-2">Markdown Image Embed</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={markdownSnippet}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-foreground/80 outline-none select-all"
                />
                <button
                  onClick={() => copyToClipboard(markdownSnippet, true)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/10"
                >
                  {copiedMarkdown ? <Check size={14} /> : <Copy size={14} />}
                  {copiedMarkdown ? 'Copied' : 'Embed'}
                </button>
              </div>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2.5 leading-relaxed">
            <Globe size={16} className="shrink-0 mt-0.5" />
            <span>Anyone with this link can view or download this file directly without signing in.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Photo & Media Lightbox Modal ───────────────────────────────────────────────
function LightboxModal({
  items,
  currentIndex,
  onClose,
  onNavigate,
  onDownload,
  onShare,
  isStarred,
  onToggleStar,
}: {
  items: FileItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onDownload: (item: FileItem) => void;
  onShare: (item: FileItem) => void;
  isStarred: (path: string) => boolean;
  onToggleStar: (path: string) => void;
}) {
  const currentItem = items[currentIndex];
  const [zoom, setZoom] = useState(1);

  const mediaItems = useMemo(() => items.filter(i => !i.isFolder && (isPhoto(i.name) || isVideo(i.name))), [items]);
  const currentMediaIndex = useMemo(() => mediaItems.findIndex(i => i.fullPath === currentItem?.fullPath), [mediaItems, currentItem]);

  const publicUrl = useMemo(() => {
    if (!currentItem) return '';
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(currentItem.fullPath);
    return data.publicUrl || '';
  }, [currentItem]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && currentMediaIndex < mediaItems.length - 1) {
        const nextItem = mediaItems[currentMediaIndex + 1];
        const nextIdx = items.findIndex(i => i.fullPath === nextItem.fullPath);
        if (nextIdx !== -1) onNavigate(nextIdx);
      }
      if (e.key === 'ArrowLeft' && currentMediaIndex > 0) {
        const prevItem = mediaItems[currentMediaIndex - 1];
        const prevIdx = items.findIndex(i => i.fullPath === prevItem.fullPath);
        if (prevIdx !== -1) onNavigate(prevIdx);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMediaIndex, mediaItems, items, onNavigate, onClose]);

  if (!currentItem) return null;

  const isImg = isPhoto(currentItem.name);
  const isVid = isVideo(currentItem.name);

  return (
    <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex flex-col justify-between overflow-hidden">
      {/* Top Navbar */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-black/40 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h3 className="font-semibold text-sm text-white truncate max-w-xs">{currentItem.name}</h3>
            {currentItem.size && <p className="text-xs text-white/50">{formatSize(currentItem.size)}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isImg && (
            <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1 text-xs">
              <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="px-2.5 py-1 hover:bg-white/10 rounded-lg text-white font-medium">-</button>
              <span className="px-2 text-white/70">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="px-2.5 py-1 hover:bg-white/10 rounded-lg text-white font-medium">+</button>
              <button onClick={() => setZoom(1)} className="px-2 py-1 hover:bg-white/10 rounded-lg text-white/70 text-[10px]">Reset</button>
            </div>
          )}

          <button
            onClick={() => onToggleStar(currentItem.fullPath)}
            className={`p-2.5 rounded-xl border transition-colors ${
              isStarred(currentItem.fullPath)
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
            }`}
          >
            <Star size={16} fill={isStarred(currentItem.fullPath) ? 'currentColor' : 'none'} />
          </button>

          <button onClick={() => onShare(currentItem)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors">
            <Share2 size={16} />
          </button>

          <button onClick={() => onDownload(currentItem)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-lg">
            <Download size={14} /> Download
          </button>

          <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Preview */}
      <div className="flex-1 relative flex items-center justify-center p-4 select-none">
        {currentMediaIndex > 0 && (
          <button
            onClick={() => {
              const prevItem = mediaItems[currentMediaIndex - 1];
              const idx = items.findIndex(i => i.fullPath === prevItem.fullPath);
              if (idx !== -1) { setZoom(1); onNavigate(idx); }
            }}
            className="absolute left-6 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {isImg ? (
          <motion.img
            key={currentItem.fullPath}
            src={publicUrl}
            alt={currentItem.name}
            style={{ transform: `scale(${zoom})` }}
            transition={{ type: 'spring', damping: 25 }}
            className="max-h-[82vh] max-w-[88vw] object-contain rounded-lg shadow-2xl transition-transform duration-200"
          />
        ) : isVid ? (
          <video src={publicUrl} controls autoPlay className="max-h-[82vh] max-w-[88vw] rounded-lg shadow-2xl" />
        ) : (
          <div className="text-center p-8 rounded-2xl bg-white/5 border border-white/10">
            <FileText size={64} className="text-white/40 mx-auto mb-4" />
            <p className="text-white font-medium text-lg">{currentItem.name}</p>
            <p className="text-white/50 text-sm mt-1">Preview not available for this file type</p>
          </div>
        )}

        {currentMediaIndex < mediaItems.length - 1 && (
          <button
            onClick={() => {
              const nextItem = mediaItems[currentMediaIndex + 1];
              const idx = items.findIndex(i => i.fullPath === nextItem.fullPath);
              if (idx !== -1) { setZoom(1); onNavigate(idx); }
            }}
            className="absolute right-6 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Bottom Counter */}
      <div className="py-3 text-center border-t border-white/10 bg-black/40 text-xs text-white/50">
        {currentMediaIndex + 1} of {mediaItems.length} media items
      </div>
    </div>
  );
}

// ─── Auth Modal (Sign In / Sign Up) ──────────────────────────────────────────
function AuthModal({
  isOpen,
  onClose,
  addToast,
  onAuthSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  addToast: (type: 'success' | 'error', msg: string) => void;
  onAuthSuccess: (user: User) => void;
}) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          addToast('success', 'Account created successfully! You are now logged in.');
          onAuthSuccess(data.user);
          onClose();
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          addToast('success', 'Welcome back! Signed into Private Safe Space.');
          onAuthSuccess(data.user);
          onClose();
        }
      }
    } catch (err: any) {
      addToast('error', err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 bg-black/80 backdrop-blur-md" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass-panel w-full max-w-md p-7 rounded-3xl relative border border-white/10 shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-5 right-5 p-1.5 rounded-lg hover:bg-white/10 text-foreground/50 hover:text-foreground transition-colors">
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg">
            <Lock size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Private Safe Space</h3>
            <p className="text-xs text-foreground/50">{mode === 'signin' ? 'Sign in to access your secured drive' : 'Create an account to get private storage'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider block mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500 focus:bg-white/[0.08] transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider block mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500 focus:bg-white/[0.08] transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/80 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (mode === 'signin' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-white/10 text-center text-xs text-foreground/50">
          {mode === 'signin' ? (
            <p>
              Don't have an account?{' '}
              <button onClick={() => setMode('signup')} className="text-violet-400 font-semibold hover:underline">
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={() => setMode('signin')} className="text-violet-400 font-semibold hover:underline">
                Sign In
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Landing Page ────────────────────────────────────────────────────────────
function LandingPage({ onGetStarted, onOpenAuth }: { onGetStarted: () => void; onOpenAuth: () => void }) {
  const features = [
    { icon: Upload, color: 'text-blue-400', bg: 'bg-blue-500/15', title: 'Resumable Chunk Uploads', desc: 'Drag files or whole folders. Pause, resume, and auto-recover drops seamlessly.' },
    { icon: Lock, color: 'text-violet-400', bg: 'bg-violet-500/15', title: 'Private Safe Space', desc: 'Secure user-authenticated private storage isolated per account.' },
    { icon: Image, color: 'text-pink-400', bg: 'bg-pink-500/15', title: 'Photo Lightbox Gallery', desc: 'Full-screen media lightbox with zoom, slideshow navigation, and metadata.' },
    { icon: Globe, color: 'text-emerald-400', bg: 'bg-emerald-500/15', title: 'Public Sharing Link', desc: 'Generate one-click public URL or Markdown embeds with zero friction.' },
    { icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/15', title: 'Lightning Fast CDN', desc: 'Delivered instantly through Supabase high-speed global storage edges.' },
    { icon: Shield, color: 'text-cyan-400', bg: 'bg-cyan-500/15', title: 'AES-256 Encryption', desc: 'Encrypted storage at rest ensuring your files remain secure 24/7.' },
  ];

  const steps = [
    { num: '01', icon: Globe, title: 'Open ZupShare', desc: 'Access Public Drive immediately with zero sign-up or setup barriers.', color: 'from-blue-500 to-cyan-500' },
    { num: '02', icon: Upload, title: 'Upload & Organize', desc: 'Drag and drop files, organize folders, star key items, and filter by type.', color: 'from-violet-500 to-purple-500' },
    { num: '03', icon: ShieldCheck, title: 'Share or Secure', desc: 'Copy public share links or lock private files inside your personal Safe Space.', color: 'from-emerald-500 to-teal-500' },
  ];

  const floatingIcons = [
    { icon: Image, color: 'text-pink-400', bg: 'bg-pink-500/15', style: { top: '15%', left: '8%' }, delay: 0.2 },
    { icon: Film, color: 'text-purple-400', bg: 'bg-purple-500/15', style: { top: '60%', left: '5%' }, delay: 0.5 },
    { icon: Music, color: 'text-yellow-400', bg: 'bg-yellow-500/15', style: { top: '30%', right: '7%' }, delay: 0.3 },
    { icon: Archive, color: 'text-orange-400', bg: 'bg-orange-500/15', style: { top: '70%', right: '10%' }, delay: 0.6 },
    { icon: Code, color: 'text-green-400', bg: 'bg-green-500/15', style: { top: '80%', left: '15%' }, delay: 0.4 },
    { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/15', style: { top: '10%', right: '20%' }, delay: 0.7 },
  ];

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Nav ── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-background/80 backdrop-blur-xl"
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="ZupShare Logo" className="w-8 h-8 rounded-xl shadow-lg shadow-blue-500/30" />
            <span className="font-bold text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">
              ZupShare
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-foreground/80 text-xs font-semibold transition-all"
            >
              <Lock size={13} className="text-violet-400" />
              Safe Space
            </button>
            <button
              onClick={onGetStarted}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all"
            >
              Open Drive <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-6 py-24 overflow-hidden min-h-[85vh]">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-60px] left-1/4 w-[400px] h-[400px] bg-violet-600/[0.08] rounded-full blur-[120px]" />
        </div>

        {/* Floating file icons */}
        {floatingIcons.map((fi, i) => (
          <FloatingIcon key={i} {...fi} />
        ))}

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-medium mb-6"
        >
          <Sparkles size={12} className="text-blue-400" />
          Public Sharing · Private Safe Space 🔒 · 100% Free
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[1.1] max-w-4xl"
        >
          Your files,{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-violet-400">
            your control.
          </span>
          <br />
          <span className="text-foreground/70">Shared or Secured.</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="mt-6 text-lg text-foreground/55 max-w-xl leading-relaxed"
        >
          A clean, powerful alternative to Google Drive & Photos. Public instant sharing plus an encrypted private Safe Space.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <button
            onClick={onGetStarted}
            className="group relative flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-white font-bold text-base shadow-2xl shadow-primary/40 hover:shadow-primary/60 hover:bg-blue-500 transition-all duration-200 overflow-hidden"
          >
            <span className="relative z-10">Open Public Drive</span>
            <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2.5 px-7 py-4 rounded-2xl border border-white/10 hover:border-violet-500/40 hover:bg-violet-500/10 text-foreground/80 font-medium text-base transition-all duration-200"
          >
            <Lock size={16} className="text-violet-400" />
            Enter Safe Space
          </button>
        </motion.div>

        {/* Technical Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl w-full pt-10 border-t border-white/[0.07]"
        >
          {[
            { val: '₹0', label: 'Free Storage' },
            { val: 'TUS', label: 'Resumable Uploads' },
            { val: 'AES-256', label: 'Encryption at Rest' },
            { val: '0', label: 'Sign-up Friction' },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-2xl font-extrabold text-white tracking-tight">{s.val}</span>
              <span className="text-xs text-foreground/40 mt-1">{s.label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 bg-white/[0.015]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium mb-4">
              Everything Included
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Built for Storage & Media</h2>
            <p className="mt-4 text-foreground/50 max-w-md mx-auto">Inspired by modern drive architectures for seamless file handling.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group p-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-sm hover:border-blue-500/25 hover:bg-blue-500/5 hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon size={20} className={f.color} />
                </div>
                <h3 className="font-bold text-sm mb-2">{f.title}</h3>
                <p className="text-xs text-foreground/50 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Three Simple Steps</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center p-8 rounded-3xl border border-white/[0.07] bg-white/[0.02]">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl mb-5`}>
                  <step.icon size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-bold mb-3">{step.title}</h3>
                <p className="text-sm text-foreground/50 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// ─── Main App (File Manager) ─────────────────────────────────────────────────
function FileManager({ onBack, authUser, onLogout, onOpenAuth }: { onBack: () => void; authUser: User | null; onLogout: () => void; onOpenAuth: () => void }) {
  const [spaceMode, setSpaceMode] = useState<SpaceMode>('public');
  const [currentPath, setCurrentPath] = useState('');
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [starredPaths, setStarredPaths] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('zupshare_starred_paths') || '[]'); } catch { return []; }
  });

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [sharingItem, setSharingItem] = useState<FileItem | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('zupshare_starred_paths', JSON.stringify(starredPaths));
  }, [starredPaths]);

  const toggleStar = useCallback((path: string) => {
    setStarredPaths(prev => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
  }, []);

  const isStarred = useCallback((path: string) => starredPaths.includes(path), [starredPaths]);

  const effectivePath = useMemo(() => {
    if (spaceMode === 'private') {
      if (!authUser) return '';
      return currentPath ? `private/${authUser.id}/${currentPath}` : `private/${authUser.id}`;
    }
    return currentPath;
  }, [spaceMode, authUser, currentPath]);

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const fetchFiles = useCallback(async (path: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from(BUCKET_NAME).list(path || undefined, {
        sortBy: { column: 'name', order: 'asc' }
      });
      if (error) throw error;

      const folders: FileItem[] = [];
      const files: FileItem[] = [];

      data.forEach(item => {
        if (item.name === '.keep' || item.name === '.emptyFolderPlaceholder') return;
        const isFolder = item.id === null;
        const fullPath = path ? `${path}/${item.name}` : item.name;
        if (isFolder) {
          folders.push({ name: item.name, fullPath, isFolder: true });
        } else {
          files.push({ name: item.name, fullPath, isFolder: false, size: item.metadata?.size });
        }
      });

      setItems([...folders, ...files]);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to load files.');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (spaceMode === 'private' && !authUser) {
      setItems([]);
      setLoading(false);
      return;
    }
    fetchFiles(effectivePath);
  }, [effectivePath, fetchFiles, spaceMode, authUser]);

  // Compute Storage Analytics
  const storageAnalytics = useMemo(() => {
    let totalBytes = 0;
    let photosBytes = 0;
    let videosBytes = 0;
    let docsBytes = 0;
    let archivesBytes = 0;
    let fileCount = 0;

    items.forEach(item => {
      if (!item.isFolder && item.size) {
        fileCount++;
        totalBytes += item.size;
        if (isPhoto(item.name)) photosBytes += item.size;
        else if (isVideo(item.name)) videosBytes += item.size;
        else if (isDocument(item.name)) docsBytes += item.size;
        else if (isArchive(item.name)) archivesBytes += item.size;
      }
    });

    return {
      totalBytes,
      fileCount,
      photosPct: totalBytes > 0 ? (photosBytes / totalBytes) * 100 : 0,
      videosPct: totalBytes > 0 ? (videosBytes / totalBytes) * 100 : 0,
      docsPct: totalBytes > 0 ? (docsBytes / totalBytes) * 100 : 0,
      archivesPct: totalBytes > 0 ? (archivesBytes / totalBytes) * 100 : 0,
    };
  }, [items]);

  // Filtered files list based on Search and Category
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (activeCategory === 'all') return true;
      if (activeCategory === 'starred') return isStarred(item.fullPath);
      if (item.isFolder) return false;

      if (activeCategory === 'photos') return isPhoto(item.name);
      if (activeCategory === 'videos') return isVideo(item.name);
      if (activeCategory === 'documents') return isDocument(item.name);
      if (activeCategory === 'archives') return isArchive(item.name);
      return true;
    });
  }, [items, searchQuery, activeCategory, isStarred]);

  const uploadFile = useCallback((file: File) => {
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_SIZE) {
      addToast('error', 'File size exceeds 50MB limit');
      return;
    }
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueName = `${Date.now()}_${sanitizedName}`;
    const filePath = effectivePath ? `${effectivePath}/${uniqueName}` : uniqueName;

    setIsUploadModalOpen(false);
    setUploadFileName(file.name);
    setUploadProgress(0);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    const upload = new TusUpload(file, {
      endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000],
      headers: {
        authorization: `Bearer ${supabaseAnonKey}`,
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: BUCKET_NAME,
        objectName: filePath,
        contentType: file.type || 'application/octet-stream',
      },
      chunkSize: 6 * 1024 * 1024,
      onError: (error) => {
        addToast('error', error.message || 'Upload failed');
        setUploadProgress(null);
        setUploadFileName('');
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        setUploadProgress((bytesUploaded / bytesTotal) * 100);
      },
      onSuccess: () => {
        setUploadProgress(100);
        setTimeout(() => { 
          setUploadProgress(null); 
          setUploadFileName(''); 
          fetchFiles(effectivePath); 
        }, 800);
        addToast('success', `"${file.name}" uploaded successfully`);
      },
    });

    upload.start();
  }, [effectivePath, fetchFiles, addToast]);

  const handleDownload = async (item: FileItem) => {
    try {
      const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(item.fullPath);
      if (!data.publicUrl) throw new Error('Could not generate download URL');
      const a = document.createElement('a');
      a.href = data.publicUrl;
      a.download = item.name;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to download file');
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const folderPath = effectivePath ? `${effectivePath}/${newFolderName}` : newFolderName;
    try {
      const { error } = await supabase.storage.from(BUCKET_NAME).upload(`${folderPath}/.keep`, new Blob([''], { type: 'text/plain' }));
      if (error) throw error;
      setIsFolderModalOpen(false);
      setNewFolderName('');
      addToast('success', `Folder "${newFolderName}" created`);
      fetchFiles(effectivePath);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to create folder');
    }
  };

  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div
      className="min-h-screen flex flex-col"
      onDrop={(e) => { e.preventDefault(); setIsDraggingOver(false); if (e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]); }}
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={() => setIsDraggingOver(false)}
    >
      {/* Global Drag Overlay */}
      <AnimatePresence>
        {isDraggingOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-primary/10 border-4 border-dashed border-primary/60 flex items-center justify-center pointer-events-none"
          >
            <div className="text-center">
              <Upload size={56} className="text-primary mx-auto mb-3 opacity-90 animate-bounce" />
              <p className="text-xl font-bold text-primary">Drop to upload</p>
              <p className="text-sm text-foreground/60 mt-1">Uploading to {spaceMode === 'private' ? 'Safe Space' : 'Public Hub'}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 items-end pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl pointer-events-auto text-sm font-medium ${
                toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Upload Progress Bar */}
      <AnimatePresence>
        {uploadProgress !== null && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-secondary/95 backdrop-blur-md border-t border-white/10 p-4"
          >
            <div className="max-w-5xl mx-auto flex items-center gap-4">
              <Loader2 className="animate-spin text-primary shrink-0" size={18} />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium truncate max-w-xs">{uploadFileName}</span>
                  <span className="text-foreground/60 shrink-0 ml-2">{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <motion.div className="bg-primary h-full rounded-full" animate={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-4 md:px-8 py-6 gap-5">

        {/* Top Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel px-6 py-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div className="flex items-center gap-3">
            <button onClick={onBack} title="Back to landing" className="p-2 rounded-xl hover:bg-white/10 text-foreground/40 hover:text-foreground transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div className="w-px h-6 bg-white/10" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-accent">
                  ZupShare
                </h1>
                {spaceMode === 'private' && (
                  <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] font-semibold flex items-center gap-1">
                    <Lock size={10} /> Safe Space
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground/50 mt-0.5">
                {spaceMode === 'public' ? 'Public File Sharing Hub' : `Secured Private Drive (${authUser?.email || 'Protected'})`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Space Mode Switcher */}
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 text-xs">
              <button
                onClick={() => { setSpaceMode('public'); setCurrentPath(''); }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  spaceMode === 'public' ? 'bg-primary text-white shadow' : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                <Globe size={13} /> Public
              </button>
              <button
                onClick={() => {
                  if (!authUser) { onOpenAuth(); return; }
                  setSpaceMode('private');
                  setCurrentPath('');
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  spaceMode === 'private' ? 'bg-violet-600 text-white shadow' : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                <Lock size={13} /> Safe Space 🔒
              </button>
            </div>

            {authUser ? (
              <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-foreground/70 hover:text-foreground text-xs font-medium transition-colors">
                <LogOut size={13} /> Logout
              </button>
            ) : (
              <button onClick={onOpenAuth} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-semibold transition-colors">
                <Key size={13} /> Sign In
              </button>
            )}

            <button onClick={() => setIsFolderModalOpen(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium transition-colors">
              <Plus size={14} /> Folder
            </button>

            <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-primary/20 transition-all">
              <Upload size={14} /> Upload
            </button>
          </div>
        </motion.div>

        {/* Storage Analytics Widget */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="glass-panel p-4 rounded-2xl border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-foreground/70 mb-2.5">
            <div className="flex items-center gap-2">
              <BarChart2 size={14} className="text-primary" />
              <span className="font-semibold text-foreground/90">Storage Usage ({spaceMode === 'private' ? 'Safe Space' : 'Current Folder'})</span>
            </div>
            <span className="font-mono text-foreground/50">{formatSize(storageAnalytics.totalBytes)} total · {storageAnalytics.fileCount} files</span>
          </div>

          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden flex">
            {storageAnalytics.photosPct > 0 && <div style={{ width: `${storageAnalytics.photosPct}%` }} className="bg-pink-500 h-full" title="Photos" />}
            {storageAnalytics.videosPct > 0 && <div style={{ width: `${storageAnalytics.videosPct}%` }} className="bg-purple-500 h-full" title="Videos" />}
            {storageAnalytics.docsPct > 0 && <div style={{ width: `${storageAnalytics.docsPct}%` }} className="bg-blue-500 h-full" title="Documents" />}
            {storageAnalytics.archivesPct > 0 && <div style={{ width: `${storageAnalytics.archivesPct}%` }} className="bg-orange-500 h-full" title="Archives" />}
          </div>

          <div className="flex items-center gap-4 mt-2.5 text-[11px] text-foreground/50 flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-pink-500" /> Photos</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500" /> Videos</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Documents</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500" /> Archives</span>
          </div>
        </motion.div>

        {/* Search & Category Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs outline-none focus:border-primary focus:bg-white/[0.08] transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground">
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
            {(['all', 'photos', 'videos', 'documents', 'archives', 'starred'] as Category[]).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-medium capitalize transition-colors whitespace-nowrap flex items-center gap-1 ${
                  activeCategory === cat
                    ? 'bg-primary text-white shadow'
                    : 'bg-white/5 border border-white/10 text-foreground/60 hover:text-foreground'
                }`}
              >
                {cat === 'starred' && <Star size={11} className="fill-amber-400 text-amber-400" />}
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* File Explorer Panel */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-panel rounded-2xl overflow-hidden flex flex-col flex-1 min-h-[480px]">
          {/* Breadcrumbs */}
          <div className="bg-white/[0.03] border-b border-white/[0.07] px-5 py-3 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-sm">
            <button onClick={() => setCurrentPath('')} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${currentPath === '' ? 'text-foreground font-medium' : 'text-foreground/50 hover:text-foreground hover:bg-white/5'}`}>
              <Home size={14} />
              <span>{spaceMode === 'private' ? 'Safe Space Root' : 'Public Root'}</span>
            </button>
            {pathParts.map((part, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <ChevronRight size={13} className="text-foreground/25" />
                <button onClick={() => setCurrentPath(pathParts.slice(0, idx + 1).join('/'))} className={`px-2 py-1 rounded-lg transition-colors ${idx === pathParts.length - 1 ? 'text-foreground font-medium' : 'text-foreground/50 hover:text-foreground hover:bg-white/5'}`}>
                  {part}
                </button>
              </div>
            ))}
            <div className="ml-auto text-foreground/30 text-xs shrink-0 pl-4">
              {!loading && <span>{filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}</span>}
            </div>
          </div>

          {/* Files Grid */}
          <div className="flex-1 p-5">
            {spaceMode === 'private' && !authUser ? (
              <div className="h-full flex flex-col items-center justify-center min-h-[350px] gap-4 text-center">
                <div className="p-5 rounded-3xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                  <Lock size={48} />
                </div>
                <div>
                  <p className="font-bold text-foreground/80 text-lg">Safe Space Locked</p>
                  <p className="text-xs text-foreground/40 mt-1 max-w-xs">Sign in to your account to access your private encrypted drive.</p>
                </div>
                <button onClick={onOpenAuth} className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-lg transition-all">
                  Sign In / Create Account
                </button>
              </div>
            ) : loading ? (
              <div className="h-full flex flex-col items-center justify-center min-h-[350px] gap-3">
                <Loader2 className="animate-spin text-primary" size={36} />
                <p className="text-sm text-foreground/40">Loading items...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center min-h-[350px] gap-4 text-center">
                <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/[0.07]">
                  <FolderOpen size={48} className="text-foreground/20" />
                </div>
                <div>
                  <p className="font-semibold text-foreground/60">No files found</p>
                  <p className="text-sm text-foreground/30 mt-1">Upload a file or adjust your search filter</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                <AnimatePresence>
                  {filteredItems.map((item, i) => {
                    const fileType = item.isFolder ? null : getFileIcon(item.name);
                    const starred = isStarred(item.fullPath);

                    return (
                      <motion.div
                        key={item.fullPath}
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.02, duration: 0.2 }}
                        whileHover={{ y: -3, scale: 1.02 }}
                        onClick={() => {
                          if (item.isFolder) {
                            setCurrentPath(item.fullPath.replace(`private/${authUser?.id}/`, ''));
                          } else if (isPhoto(item.name) || isVideo(item.name)) {
                            const idx = items.findIndex(f => f.fullPath === item.fullPath);
                            if (idx !== -1) setLightboxIndex(idx);
                          } else {
                            handleDownload(item);
                          }
                        }}
                        className="glass rounded-xl p-4 cursor-pointer group hover:border-white/20 hover:bg-white/[0.06] hover:shadow-lg transition-all flex flex-col gap-2.5 relative overflow-hidden"
                      >
                        {/* Star Indicator & Quick Actions */}
                        <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!item.isFolder && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleStar(item.fullPath); }}
                                className={`p-1.5 rounded-lg border transition-colors ${starred ? 'bg-amber-500/30 text-amber-300 border-amber-500/50' : 'bg-white/10 hover:bg-white/20 text-white/70'}`}
                              >
                                <Star size={12} fill={starred ? 'currentColor' : 'none'} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setSharingItem(item); }}
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 transition-colors"
                              >
                                <Share2 size={12} />
                              </button>
                            </>
                          )}
                        </div>

                        {/* File Icon */}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          item.isFolder ? 'bg-accent/20 text-accent' : `${fileType!.bg} ${fileType!.color}`
                        }`}>
                          {item.isFolder ? <Folder size={20} /> : (() => { const Icon = fileType!.Icon; return <Icon size={20} />; })()}
                        </div>

                        {/* File Details */}
                        <div className="min-w-0">
                          <p className="font-medium text-xs leading-tight line-clamp-2 break-all" title={item.name}>
                            {item.name}
                          </p>
                          {!item.isFolder && item.size !== undefined && (
                            <p className="text-[10px] text-foreground/40 mt-1">{formatSize(item.size)}</p>
                          )}
                          {item.isFolder && (
                            <p className="text-[10px] text-foreground/40 mt-1">Folder</p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <Footer />

      {/* Media Lightbox */}
      {lightboxIndex !== null && (
        <LightboxModal
          items={items}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(idx) => setLightboxIndex(idx)}
          onDownload={handleDownload}
          onShare={(item) => setSharingItem(item)}
          isStarred={isStarred}
          onToggleStar={toggleStar}
        />
      )}

      {/* Share Modal */}
      {sharingItem && (
        <ShareModal item={sharingItem} onClose={() => setSharingItem(null)} addToast={addToast} />
      )}

      {/* Create Folder Modal */}
      <AnimatePresence>
        {isFolderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setIsFolderModalOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-panel w-full max-w-sm p-6 rounded-2xl relative">
              <button onClick={() => setIsFolderModalOpen(false)} className="absolute top-4 right-4 text-foreground/50 hover:text-foreground"><X size={18} /></button>
              <h3 className="text-base font-bold mb-4">New Folder</h3>
              <form onSubmit={handleCreateFolder}>
                <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Folder name" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary" autoFocus />
                <div className="mt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsFolderModalOpen(false)} className="px-4 py-2 text-sm text-foreground/70">Cancel</button>
                  <button type="submit" disabled={!newFolderName.trim()} className="px-5 py-2 rounded-xl bg-primary text-white font-semibold text-sm">Create</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload File Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setIsUploadModalOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-panel w-full max-w-md p-6 rounded-2xl relative">
              <button onClick={() => setIsUploadModalOpen(false)} className="absolute top-4 right-4 text-foreground/50 hover:text-foreground"><X size={18} /></button>
              <h3 className="text-base font-bold mb-1">Upload File</h3>
              <p className="text-xs text-foreground/50 mb-5">To: {spaceMode === 'private' ? 'Safe Space' : 'Public Root'}</p>
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/15 hover:border-primary bg-white/[0.03] rounded-xl p-10 text-center cursor-pointer flex flex-col items-center gap-3">
                <Upload size={28} className="text-primary" />
                <p className="font-semibold text-sm">Click or drop file here</p>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadFile(e.target.files[0]); }} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Root App ────────────────────────────────────────────────────────────────
function App() {
  const [view, setView] = useState<View>('landing');
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    addToast('success', 'Logged out of Safe Space');
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <LandingPage onGetStarted={() => setView('app')} onOpenAuth={() => { setView('app'); setIsAuthModalOpen(true); }} />
          </motion.div>
        ) : (
          <motion.div key="app" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            <FileManager
              onBack={() => setView('landing')}
              authUser={authUser}
              onLogout={handleLogout}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* App Toasts */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 items-end pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl pointer-events-auto text-sm font-medium ${
                toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        addToast={addToast}
        onAuthSuccess={(user) => setAuthUser(user)}
      />
    </>
  );
}

export default App;
