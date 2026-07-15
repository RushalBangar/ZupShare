import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './supabase';
import { Upload as TusUpload } from 'tus-js-client';
import {
  Folder, File as FileIcon, Upload, Plus, ChevronRight, Home,
  Loader2, Download, AlertCircle, X, Image, FileText,
  Film, Music, Archive, Code, CheckCircle2, FolderOpen,
  Cloud, Shield, Zap, Globe, Users, ArrowRight, ArrowLeft,
  Sparkles, ExternalLink, Lock, Trash2, Edit2, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const BUCKET_NAME = 'r-drive';

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'avif'].includes(ext)) return { Icon: Image, color: 'text-pink-400', bg: 'bg-pink-500/15' };
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return { Icon: Film, color: 'text-purple-400', bg: 'bg-purple-500/15' };
  if (['mp3', 'wav', 'flac', 'ogg', 'm4a'].includes(ext)) return { Icon: Music, color: 'text-yellow-400', bg: 'bg-yellow-500/15' };
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) return { Icon: Archive, color: 'text-orange-400', bg: 'bg-orange-500/15' };
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'html', 'css', 'json'].includes(ext)) return { Icon: Code, color: 'text-green-400', bg: 'bg-green-500/15' };
  if (['pdf', 'doc', 'docx', 'txt', 'md', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) return { Icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/15' };
  return { Icon: FileIcon, color: 'text-slate-400', bg: 'bg-slate-500/15' };
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
      className={`absolute w-12 h-12 rounded-2xl ${bg} border border-white/10 flex items-center justify-center shadow-xl backdrop-blur-sm`}
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
            ZupShare is your free public cloud file sharing hub. Seamlessly upload, organize, and instantly share files worldwide with zero friction.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-8 text-sm">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="font-semibold text-foreground/80 text-xs tracking-wider uppercase">Platform</span>
            <a href="/" className="text-foreground/40 hover:text-foreground/80 transition-colors text-xs">Home</a>
            <a href="#how-it-works" className="text-foreground/40 hover:text-foreground/80 transition-colors text-xs">How it Works</a>
            <a href="#" className="text-foreground/40 hover:text-foreground/80 transition-colors text-xs">Upload File</a>
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
            <a href="#" className="text-foreground/40 hover:text-foreground/80 transition-colors text-xs">Contact</a>
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
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground/70 transition-colors flex items-center gap-1.5"
            aria-label="GitHub Repository"
          >
            <ExternalLink size={12} />
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}

// ─── Landing Page ────────────────────────────────────────────────────────────
function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  const features = [
    { icon: Upload, color: 'text-blue-400', bg: 'bg-blue-500/15', title: 'Drag & Drop Upload', desc: 'Drop any file anywhere on the screen to instantly upload it to the cloud.' },
    { icon: Download, color: 'text-emerald-400', bg: 'bg-emerald-500/15', title: 'One-Click Download', desc: 'Click any file to instantly download it — no sign-in, no waiting.' },
    { icon: Folder, color: 'text-amber-400', bg: 'bg-amber-500/15', title: 'Folder Organization', desc: 'Create nested folders to keep your files structured and easy to find.' },
    { icon: Globe, color: 'text-violet-400', bg: 'bg-violet-500/15', title: 'Publicly Accessible', desc: 'Share files with anyone. No account needed to browse or download.' },
    { icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/15', title: 'Lightning Fast', desc: 'Built on Supabase Storage — global CDN delivery for near-instant access.' },
    { icon: Shield, color: 'text-pink-400', bg: 'bg-pink-500/15', title: 'Cloud Reliable', desc: 'Your files are stored safely in the cloud, available 24/7 from anywhere.' },
  ];

  const steps = [
    { num: '01', icon: Globe, title: 'Open ZupShare', desc: 'Navigate to ZupShare — no account, no sign-up, no barriers. You\'re instantly in.', color: 'from-blue-500 to-cyan-500' },
    { num: '02', icon: Upload, title: 'Upload Your File', desc: 'Drag & drop files anywhere, or click "Upload" to pick one from your device.', color: 'from-violet-500 to-purple-500' },
    { num: '03', icon: Users, title: 'Share the Link', desc: 'Copy the file URL and share it — anyone can download it instantly.', color: 'from-emerald-500 to-teal-500' },
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
          <button
            id="nav-get-started"
            onClick={onGetStarted}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-200"
          >
            Open Drive <ArrowRight size={14} />
          </button>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-6 py-28 overflow-hidden min-h-[90vh]">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-60px] left-1/4 w-[400px] h-[400px] bg-violet-600/[0.08] rounded-full blur-[120px]" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-cyan-500/[0.06] rounded-full blur-[80px]" />
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
          Public · Free · No sign-up required
          <Lock size={11} className="text-blue-400/60" />
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
            anywhere.
          </span>
          <br />
          <span className="text-foreground/70">Instantly shared.</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="mt-6 text-lg text-foreground/55 max-w-xl leading-relaxed"
        >
          ZupShare is a lightning-fast, public cloud file storage hub. Upload, organize, and share files with anyone — no account, no friction.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <button
            id="hero-get-started"
            onClick={onGetStarted}
            className="group relative flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-white font-bold text-base shadow-2xl shadow-primary/40 hover:shadow-primary/60 hover:bg-blue-500 transition-all duration-200 overflow-hidden"
          >
            <span className="relative z-10">Get Started</span>
            <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform duration-200" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
          <a
            href="#how-it-works"
            className="flex items-center gap-2 px-6 py-4 rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/5 text-foreground/70 hover:text-foreground font-medium text-base transition-all duration-200"
          >
            How it works
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-16 flex flex-col sm:flex-row items-center gap-8 sm:gap-12 text-sm text-foreground/40"
        >
          {[
            { val: '∞', label: 'Storage' },
            { val: '0', label: 'Sign-ups' },
            { val: '100%', label: 'Free' },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span className="text-2xl font-bold text-foreground/80">{s.val}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-4">
              Simple as 1-2-3
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">How ZupShare Works</h2>
            <p className="mt-4 text-foreground/50 max-w-md mx-auto">Three steps — and your file is in the cloud, ready to share with the world.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-[calc(33.33%+24px)] right-[calc(33.33%+24px)] h-px bg-gradient-to-r from-blue-500/40 via-violet-500/40 to-emerald-500/40" />

            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative flex flex-col items-center text-center p-8 rounded-3xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-sm hover:border-white/15 hover:-translate-y-2 transition-all duration-300 group"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon size={24} className="text-white" />
                </div>
                <div className="absolute top-4 right-4 text-4xl font-black text-white/[0.04] select-none">
                  {step.num}
                </div>
                <h3 className="text-lg font-bold mb-3">{step.title}</h3>
                <p className="text-sm text-foreground/50 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6 bg-white/[0.015]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium mb-4">
              Everything you need
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Packed with Features</h2>
            <p className="mt-4 text-foreground/50 max-w-md mx-auto">Every feature designed to make file sharing as frictionless as possible.</p>
          </motion.div>

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

      {/* ── CTA Banner ── */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="relative p-10 sm:p-14 rounded-3xl border border-blue-500/20 bg-gradient-to-b from-blue-500/10 to-violet-500/5 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-blue-500/20 blur-[60px] rounded-full" />
            <div className="absolute bottom-0 right-1/4 w-48 h-20 bg-violet-500/15 blur-[50px] rounded-full" />
            <h2 className="relative text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              Ready to store your files?
            </h2>
            <p className="relative text-foreground/50 mb-8 max-w-sm mx-auto">
              No account needed. Just open, upload, and share. It's that simple.
            </p>
            <button
              id="cta-get-started"
              onClick={onGetStarted}
              className="relative group inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary hover:bg-blue-500 text-white font-bold text-base shadow-2xl shadow-primary/40 hover:shadow-primary/60 transition-all duration-200"
            >
              Open ZupShare
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}

// ─── Main App (File Manager) ─────────────────────────────────────────────────
function FileManager({ onBack }: { onBack: () => void }) {
  const [currentPath, setCurrentPath] = useState('');
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [activeMobileItem, setActiveMobileItem] = useState<string | null>(null);
  
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renamingItem, setRenamingItem] = useState<FileItem | null>(null);
  const [newRenameName, setNewRenameName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => setActiveMobileItem(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsAdmin(true);
      } else if (sessionStorage.getItem('zupshare_admin_local') === 'true') {
        setIsAdmin(true);
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsAdmin(true);
      } else if (event === 'SIGNED_OUT') {
        setIsAdmin(false);
        sessionStorage.removeItem('zupshare_admin_local');
      }
    });

    return () => subscription.unsubscribe();
  }, []);


  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

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
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        const emailOrPassword = prompt('Enter Admin Email (or Password for local mode):');
        if (!emailOrPassword) return;

        const localAdminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

        // If user directly enters local password
        if (localAdminPassword && emailOrPassword === localAdminPassword) {
          setIsAdmin(true);
          sessionStorage.setItem('zupshare_admin_local', 'true');
          addToast('success', 'Admin mode enabled (Local)');
          return;
        }

        // Otherwise, ask for password
        const pwd = prompt('Enter Admin Password:');
        if (!pwd) return;

        if (localAdminPassword && pwd === localAdminPassword) {
          setIsAdmin(true);
          sessionStorage.setItem('zupshare_admin_local', 'true');
          addToast('success', 'Admin mode enabled (Local)');
          return;
        }

        // Try Supabase authentication
        try {
          const { error } = await supabase.auth.signInWithPassword({
            email: emailOrPassword,
            password: pwd,
          });

          if (!error) {
            setIsAdmin(true);
            addToast('success', 'Admin mode enabled (Supabase)');
          } else {
            addToast('error', 'Login failed: ' + error.message);
          }
        } catch (err: any) {
          addToast('error', 'Login failed: ' + err.message);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addToast]);

  const deleteFolderRecursively = async (path: string) => {
    const { data, error } = await supabase.storage.from(BUCKET_NAME).list(path);
    if (error) throw error;
    if (data && data.length > 0) {
      for (const item of data) {
        if (item.id === null && item.name !== '.keep' && item.name !== '.emptyFolderPlaceholder') {
           await deleteFolderRecursively(`${path}/${item.name}`);
        } else {
           await supabase.storage.from(BUCKET_NAME).remove([`${path}/${item.name}`]);
        }
      }
    }
    await supabase.storage.from(BUCKET_NAME).remove([`${path}/.keep`]);
  };

  const handleDelete = async (e: React.MouseEvent, item: FileItem) => {
    e.stopPropagation();
    if (!isAdmin || !confirm(`Are you sure you want to delete ${item.name}?`)) return;
    setIsDeleting(item.fullPath);
    try {
      if (item.isFolder) {
        await deleteFolderRecursively(item.fullPath);
      } else {
        const { error } = await supabase.storage.from(BUCKET_NAME).remove([item.fullPath]);
        if (error) throw error;
      }
      addToast('success', `Deleted ${item.name}`);
      fetchFiles(currentPath);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // Ignored
    }
    setIsAdmin(false);
    sessionStorage.removeItem('zupshare_admin_local');
    addToast('success', 'Logged out of admin mode');
  };

  const renameFolderRecursively = async (oldFolderPath: string, newFolderPath: string) => {
    const { data, error } = await supabase.storage.from(BUCKET_NAME).list(oldFolderPath);
    if (error) throw error;
    if (data && data.length > 0) {
      for (const item of data) {
        const itemOldPath = `${oldFolderPath}/${item.name}`;
        const itemNewPath = `${newFolderPath}/${item.name}`;
        const isFolder = item.id === null;
        if (isFolder && item.name !== '.keep' && item.name !== '.emptyFolderPlaceholder') {
          await renameFolderRecursively(itemOldPath, itemNewPath);
        } else {
          const { error: moveError } = await supabase.storage.from(BUCKET_NAME).move(itemOldPath, itemNewPath);
          if (moveError) throw moveError;
        }
      }
    }
  };

  const handleStartRename = (e: React.MouseEvent, item: FileItem) => {
    e.stopPropagation();
    setRenamingItem(item);
    setNewRenameName(item.name);
    setIsRenameModalOpen(true);
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingItem || !newRenameName.trim() || newRenameName.trim() === renamingItem.name) return;

    setIsRenaming(true);
    try {
      const fromPath = renamingItem.fullPath;
      const pathParts = fromPath.split('/');
      pathParts[pathParts.length - 1] = newRenameName.trim();
      const toPath = pathParts.join('/');

      if (renamingItem.isFolder) {
        await renameFolderRecursively(fromPath, toPath);
      } else {
        const { error } = await supabase.storage.from(BUCKET_NAME).move(fromPath, toPath);
        if (error) throw error;
      }

      addToast('success', `Renamed "${renamingItem.name}" to "${newRenameName}"`);
      setIsRenameModalOpen(false);
      setRenamingItem(null);
      setNewRenameName('');
      fetchFiles(currentPath);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to rename');
    } finally {
      setIsRenaming(false);
    }
  };

  useEffect(() => { fetchFiles(currentPath); }, [currentPath, fetchFiles]);

  const handleNavigate = (path: string) => setCurrentPath(path);

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) { setCurrentPath(''); return; }
    const parts = currentPath.split('/').filter(Boolean);
    setCurrentPath(parts.slice(0, index + 1).join('/'));
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const folderPath = currentPath ? `${currentPath}/${newFolderName}` : newFolderName;
    try {
      const { error } = await supabase.storage.from(BUCKET_NAME).upload(`${folderPath}/.keep`, new Blob([''], { type: 'text/plain' }));
      if (error) throw error;
      setIsFolderModalOpen(false);
      setNewFolderName('');
      addToast('success', `Folder "${newFolderName}" created`);
      fetchFiles(currentPath);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to create folder');
    }
  };

  const uploadFile = useCallback((file: File) => {
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_SIZE) {
      addToast('error', 'File size exceeds 50MB limit');
      return;
    }
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueName = `${Date.now()}_${sanitizedName}`;
    const filePath = currentPath ? `${currentPath}/${uniqueName}` : uniqueName;
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
        const percentage = (bytesUploaded / bytesTotal) * 100;
        setUploadProgress(percentage);
      },
      onSuccess: () => {
        setUploadProgress(100);
        setTimeout(() => { 
          setUploadProgress(null); 
          setUploadFileName(''); 
          fetchFiles(currentPath); 
        }, 800);
        addToast('success', `"${file.name}" uploaded successfully`);
      },
    });

    upload.start();
  }, [currentPath, fetchFiles, addToast]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) uploadFile(e.target.files[0]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingOver(true); };
  const handleDragLeave = () => setIsDraggingOver(false);

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

  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div
      className="min-h-screen flex flex-col"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Global drag overlay */}
      <AnimatePresence>
        {isDraggingOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-primary/10 border-4 border-dashed border-primary/60 flex items-center justify-center pointer-events-none"
          >
            <div className="text-center">
              <Upload size={56} className="text-primary mx-auto mb-3 opacity-90" />
              <p className="text-xl font-bold text-primary">Drop to upload</p>
              <p className="text-sm text-foreground/60 mt-1">File will go to: {currentPath || 'Root'}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 items-end pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl pointer-events-auto text-sm font-medium ${
                toast.type === 'success'
                  ? 'bg-emerald-500/90 text-white backdrop-blur-sm'
                  : 'bg-red-500/90 text-white backdrop-blur-sm'
              }`}
            >
              {toast.type === 'success'
                ? <CheckCircle2 size={16} />
                : <AlertCircle size={16} />}
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Upload progress bar */}
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
                  <motion.div
                    className="bg-primary h-full rounded-full"
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-4 md:px-8 py-6 gap-5">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel px-6 py-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div className="flex items-center gap-3">
            <button
              id="back-to-landing"
              onClick={onBack}
              title="Back to home"
              aria-label="Back to home"
              className="p-2 rounded-xl hover:bg-white/10 text-foreground/40 hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="w-px h-6 bg-white/10" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-accent">
                  ZupShare
                </h1>
                {isAdmin && (
                  <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-semibold uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground/50 mt-0.5">Public file sharing hub · Drag & drop anywhere to upload</p>
            </div>
          </div>

          <div className="flex gap-2 self-end sm:self-auto">
            {isAdmin && (
              <button
                id="logout-btn"
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 transition-all text-sm font-medium focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
              >
                <LogOut size={15} /> Logout
              </button>
            )}
            <button
              id="new-folder-btn"
              onClick={() => setIsFolderModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <Plus size={15} /> New Folder
            </button>
            <button
              id="upload-file-btn"
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-blue-500 text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all text-sm font-semibold focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <Upload size={15} /> Upload
            </button>
          </div>
        </motion.div>

        {/* File explorer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-panel rounded-2xl overflow-hidden flex flex-col flex-1 min-h-[500px]"
        >
          {/* Breadcrumb bar */}
          <div className="bg-white/[0.03] border-b border-white/[0.07] px-5 py-3 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-sm">
            <button
              id="breadcrumb-home"
              onClick={() => handleBreadcrumbClick(-1)}
              aria-label="Go to root folder"
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${currentPath === '' ? 'text-foreground font-medium' : 'text-foreground/50 hover:text-foreground hover:bg-white/5'}`}
            >
              <Home size={14} />
              <span>Root</span>
            </button>
            {pathParts.map((part, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <ChevronRight size={13} className="text-foreground/25" />
                <button
                  onClick={() => handleBreadcrumbClick(idx)}
                  className={`px-2 py-1 rounded-lg transition-colors ${idx === pathParts.length - 1 ? 'text-foreground font-medium' : 'text-foreground/50 hover:text-foreground hover:bg-white/5'}`}
                >
                  {part}
                </button>
              </div>
            ))}
            <div className="ml-auto flex items-center gap-2 text-foreground/30 text-xs shrink-0 pl-4">
              {!loading && <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>}
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 p-5">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center min-h-[350px] gap-3">
                <div className="relative">
                  <Loader2 className="animate-spin text-primary" size={36} />
                  <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full" />
                </div>
                <p className="text-sm text-foreground/40">Loading files...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center min-h-[350px] gap-4 text-center">
                <div className="relative">
                  <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/[0.07]">
                    <FolderOpen size={48} className="text-foreground/20" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary/30 border border-primary/50 flex items-center justify-center">
                    <Plus size={10} className="text-primary" />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-foreground/60">This folder is empty</p>
                  <p className="text-sm text-foreground/30 mt-1">Upload a file or create a folder to get started</p>
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => setIsFolderModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm"
                  >
                    <Plus size={14} /> New Folder
                  </button>
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 transition-all text-sm font-medium"
                  >
                    <Upload size={14} /> Upload File
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                <AnimatePresence>
                  {items.map((item, i) => {
                    const fileType = item.isFolder ? null : getFileIcon(item.name);
                    return (
                      <motion.div
                        key={item.fullPath}
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03, duration: 0.2 }}
                        whileHover={{ y: -3, scale: 1.02 }}
                        onClick={() => {
                          if (item.isFolder) {
                            handleNavigate(item.fullPath);
                          } else {
                            if (window.innerWidth > 768) {
                              handleDownload(item);
                            } else {
                              const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(item.fullPath);
                              if (data?.publicUrl) window.open(data.publicUrl, '_blank');
                            }
                          }
                        }}
                        onContextMenu={(e) => {
                          if (window.innerWidth <= 768 && !item.isFolder) {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveMobileItem(item.fullPath);
                          }
                        }}
                        className="glass rounded-xl p-4 cursor-pointer group hover:border-white/20 hover:bg-white/[0.06] hover:shadow-lg transition-all flex flex-col gap-2.5 relative overflow-hidden"
                      >
                        <div className={`absolute top-2 right-2 transition-opacity flex gap-1 z-10 ${activeMobileItem === item.fullPath ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}`}>
                          {isAdmin && (
                            <>
                              <button
                                onClick={(e) => handleStartRename(e, item)}
                                aria-label={`Rename ${item.name}`}
                                className="p-1.5 rounded-lg bg-amber-500/20 text-amber-500 hover:bg-amber-500/40 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none transition-colors"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={(e) => handleDelete(e, item)}
                                disabled={isDeleting === item.fullPath}
                                aria-label={`Delete ${item.name}`}
                                className="p-1.5 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/40 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none transition-colors"
                              >
                                {isDeleting === item.fullPath ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                              </button>
                            </>
                          )}
                          {!item.isFolder && (
                            <div 
                              onClick={(e) => { e.stopPropagation(); handleDownload(item); }}
                              className="p-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/40 transition-colors cursor-pointer">
                              <Download size={12} />
                            </div>
                          )}
                        </div>

                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          item.isFolder ? 'bg-accent/20 text-accent' : `${fileType!.bg} ${fileType!.color}`
                        }`}>
                          {item.isFolder
                            ? <Folder size={20} />
                            : (() => { const Icon = fileType!.Icon; return <Icon size={20} />; })()
                          }
                        </div>

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

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setIsUploadModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="glass-panel w-full max-w-md p-6 rounded-2xl relative"
            >
              <button
                onClick={() => setIsUploadModalOpen(false)}
                aria-label="Close upload modal"
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-foreground/50 hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-primary/20 text-primary">
                  <Upload size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold">Upload File</h3>
                  <p className="text-xs text-foreground/50">To: {currentPath || 'Root'}</p>
                </div>
              </div>

              <div
                ref={dropZoneRef}
                onClick={() => fileInputRef.current?.click()}
                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files[0]; if (f) uploadFile(f); }}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-white/15 hover:border-primary/60 bg-white/[0.03] hover:bg-primary/5 rounded-xl p-10 text-center cursor-pointer transition-all flex flex-col items-center gap-3 group"
              >
                <div className="p-3 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Upload size={28} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Click or drop a file here</p>
                  <p className="text-xs text-foreground/40 mt-1">Any file type supported</p>
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileInputChange} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Folder Modal */}
      <AnimatePresence>
        {isFolderModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setIsFolderModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="glass-panel w-full max-w-sm p-6 rounded-2xl relative"
            >
              <button
                onClick={() => setIsFolderModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-foreground/50 hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-accent/20 text-accent">
                  <Folder size={18} />
                </div>
                <h3 className="text-base font-bold">New Folder</h3>
              </div>

              <form onSubmit={handleCreateFolder}>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary focus:bg-white/[0.08] transition-all text-sm placeholder:text-foreground/30"
                  autoFocus
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFolderModalOpen(false)}
                    className="px-4 py-2 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium text-foreground/70"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newFolderName.trim()}
                    className="px-5 py-2 rounded-xl bg-primary hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all text-sm font-semibold shadow-lg shadow-primary/20"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rename Modal */}
      <AnimatePresence>
        {isRenameModalOpen && renamingItem && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && !isRenaming && setIsRenameModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="glass-panel w-full max-w-sm p-6 rounded-2xl relative"
            >
              <button
                disabled={isRenaming}
                onClick={() => setIsRenameModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-foreground/50 hover:text-foreground transition-colors disabled:opacity-50"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500">
                  <Edit2 size={18} />
                </div>
                <h3 className="text-base font-bold">Rename {renamingItem.isFolder ? 'Folder' : 'File'}</h3>
              </div>

              <form onSubmit={handleRename}>
                <input
                  type="text"
                  disabled={isRenaming}
                  value={newRenameName}
                  onChange={(e) => setNewRenameName(e.target.value)}
                  placeholder="New name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary focus:bg-white/[0.08] transition-all text-sm placeholder:text-foreground/30 text-foreground"
                  autoFocus
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={isRenaming}
                    onClick={() => setIsRenameModalOpen(false)}
                    className="px-4 py-2 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium text-foreground/70 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRenaming || !newRenameName.trim() || newRenameName.trim() === renamingItem.name}
                    className="px-5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed border border-amber-500/30 transition-all text-sm font-semibold shadow-lg"
                  >
                    {isRenaming ? 'Renaming...' : 'Rename'}
                  </button>
                </div>
              </form>
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

  return (
    <AnimatePresence mode="wait">
      {view === 'landing' ? (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <LandingPage onGetStarted={() => setView('app')} />
        </motion.div>
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <FileManager onBack={() => setView('landing')} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
