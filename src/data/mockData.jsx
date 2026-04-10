import { CheckCircle, Star, Package } from "lucide-react";

// ── MOCK DATA ─────────────────────────────────────────────────────────────────

const nowMs = Date.now();

const mkGig = (id, title, price, cat, loc, eta, poster, initials, color, levelLabel, minsAgo) => ({
  id, title, price, cat, loc, eta, poster, initials, color, levelLabel,
  postedAt: nowMs - minsAgo * 60 * 1000,
  notes: "Please text when you're on the way. Front desk will let you up.",
});

export const ALL_GIGS = [
  mkGig(1, "Grab Chick-fil-A #1 combo from Corbet → Science Hall Rm 225", "$3.00", "Food", "Sci Hall", "~15 min", "Maya T.", "MT", "#6366f1", "Reliable", 3),
  mkGig(2, "Print 12-page PDF at Shields Library → Dorm B Rm 104", "$4.00", "Print", "Dorm B", "~20 min", "Jordan K.", "JK", "#0891b2", "Trusted", 12),
  mkGig(3, "Return 3 overdue library books — in lecture until 5pm", "$5.00", "Errand", "Main Library", "~25 min", "Alex R.", "AR", "#9333ea", "Legend", 28),
  mkGig(4, "Scan + email BIO 101 lecture notes from today", "$6.00", "Notes", "Remote", "~10 min", "Sam L.", "SL", "#0f766e", "New", 47),
  mkGig(5, "Pick up my laptop from Kemper Hall 1065 → MU", "$8.00", "Errand", "MU", "~30 min", "Chris M.", "CM", "#b45309", "Reliable", 62),
  mkGig(6, "Coffee run — large oat milk latte from Coffee House", "$5.00", "Food", "Quad", "~12 min", "Dana P.", "DP", "#be185d", "New", 5),
];

export const REP_LEVELS = [
  { label: "New", min: 0, max: 49, cls: "lv-new" },
  { label: "Reliable", min: 50, max: 149, cls: "lv-reliable" },
  { label: "Trusted", min: 150, max: 299, cls: "lv-trusted" },
  { label: "Legend", min: 300, max: Infinity, cls: "lv-legend" },
];

export const MY_REP = 142;

export const LEADERBOARD = [
  { rank: 1, name: "Sebastian S.", initials: "SS", color: "#9333ea", gigs: 31, rep: 203, isYou: false },
  { rank: 2, name: "Eli H.", initials: "EH", color: "#0891b2", gigs: 27, rep: 187, isYou: false },
  { rank: 3, name: "Maya T.", initials: "MT", color: "#6366f1", gigs: 22, rep: 142, isYou: true },
  { rank: 4, name: "Kayla T.", initials: "KT", color: "#0f766e", gigs: 18, rep: 118, isYou: false },
  { rank: 5, name: "Chris M.", initials: "CM", color: "#b45309", gigs: 14, rep: 95, isYou: false },
  { rank: 6, name: "Dana P.", initials: "DP", color: "#be185d", gigs: 11, rep: 72, isYou: false },
];

export const ACTIVITY = [
  { icon: <CheckCircle size={15} />, t: "Food Run completed", s: "Sci Hall 225 · $3.00 received", d: "+10 pts", pos: true },
  { icon: <Star size={15} />, t: "5-star rating received", s: 'From Jordan K. — "Super fast!"', d: "+5 pts", pos: true },
  { icon: <CheckCircle size={15} />, t: "Notes gig completed", s: "BIO 101 · $6.00 received", d: "+10 pts", pos: true },
  { icon: <Package size={15} />, t: "Errand posted", s: "Library return · waiting", d: "open", pos: false },
];

export const REVIEWS = [
  { name: "Jordan K.", initials: "JK", color: "#0891b2", rating: 5, text: "Super fast and reliable! Delivered exactly as asked.", time: "2 days ago" },
  { name: "Alex R.", initials: "AR", color: "#9333ea", rating: 5, text: "Showed up on time, very communicative. Great campus helper!", time: "1 week ago" },
  { name: "Sam L.", initials: "SL", color: "#0f766e", rating: 4, text: "Good communication, took a little longer than expected.", time: "2 weeks ago" },
  { name: "Chris M.", initials: "CM", color: "#b45309", rating: 5, text: "Amazing! Saved me during finals week. Highly recommend.", time: "3 weeks ago" },
];

export const ALERTS_DATA = [
  { id: 1, iconBg: "#f0fdf4", iconColor: "#16a34a", icon: <CheckCircle size={16} />, title: "Jordan K. accepted your gig", sub: "Library book return · payment pending", time: "2m ago", unread: true },
  { id: 2, iconBg: "#f0fdf4", iconColor: "#16a34a", icon: <span style={{ fontSize: 16, fontWeight: 700 }}>$</span>, title: "Payment received — $4.00", sub: "Print gig completed by Jordan K.", time: "18m ago", unread: true },
  { id: 3, iconBg: "#fefce8", iconColor: "#ca8a04", icon: <Star size={16} />, title: "New review from Alex R.", sub: '"Super fast and reliable!" · ★★★★★', time: "2h ago", unread: true },
  { id: 4, iconBg: "#fef2f2", iconColor: "#dc2626", icon: <span style={{ fontSize: 14 }}>⚠</span>, title: "Issue reported on gig #1042", sub: "User reported incomplete delivery", time: "1d ago", unread: false },
  { id: 5, iconBg: "#f4f4f5", iconColor: "#71717a", icon: <span style={{ fontSize: 14 }}>⏱</span>, title: "Your gig expires in 2 hours", sub: "Food run · Corbet → Sci Hall 225", time: "1d ago", unread: false },
  { id: 6, iconBg: "#f0fdf4", iconColor: "#16a34a", icon: <span style={{ fontSize: 14 }}>🏅</span>, title: "Gig completed! +10 Rep earned", sub: "Notes · BIO 101 · $6.00", time: "3d ago", unread: false },
];

export const CATS = [
  { icon: "Utensils", label: "Food" },
  { icon: "Printer", label: "Print" },
  { icon: "Package", label: "Errand" },
  { icon: "FileText", label: "Notes" },
  { icon: "Bike", label: "Delivery" },
  { icon: "MessageCircle", label: "Other" },
];
