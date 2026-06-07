"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Play, Pause, Volume2, VolumeX, ArrowRight } from "lucide-react";

// Reliable free stock video (Google sample CDN — hotlink-safe, always up)
const VIDEO_SRC = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4";
const POSTER_BG = "linear-gradient(135deg,#1a1a1a 0%,#2d1818 50%,#3d0808 100%)";

export default function VideoShowcase() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };
  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  return (
    <section className="relative w-full overflow-hidden bg-neutral-950">
      <div className="relative h-[70vh] min-h-[480px] max-h-[760px]">
        {/* Gradient fallback (shows while/if video fails) */}
        <div className="absolute inset-0" style={{ background: POSTER_BG }} />

        {/* Video */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={VIDEO_SRC}
          autoPlay
          loop
          muted
          playsInline
          poster=""
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />

        {/* Dark overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/50" />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-center max-w-[1440px] mx-auto px-6 lg:px-16">
          <span className="text-[#e02020] text-xs font-bold tracking-[0.3em] uppercase mb-4">— The Film</span>
          <h2 className="font-display font-black text-white text-4xl md:text-6xl lg:text-7xl leading-[0.95] max-w-2xl mb-6">
            Movement in<br /><em className="italic text-[#e02020]">motion.</em>
          </h2>
          <p className="text-white/70 text-base md:text-lg max-w-md mb-8">
            See the Summer 2026 collection come alive. Crafted for the way you move through the world.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/new-arrivals"
              className="group inline-flex items-center gap-2 px-7 py-3.5 bg-[#e02020] hover:bg-[#c01a1a] text-white font-semibold rounded-full text-sm transition-all hover:scale-[1.02]"
            >
              Shop the Collection
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/category/women"
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/25 text-white font-semibold rounded-full text-sm hover:bg-white/10 transition-colors"
            >
              Browse Women
            </Link>
          </div>
        </div>

        {/* Video controls — bottom right */}
        <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
          <button
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
            className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>
          <button
            onClick={toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
            className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </div>
    </section>
  );
}
