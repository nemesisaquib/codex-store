import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";

const InstagramIcon = ({ size = 24 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FEED_POSTS = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80",
    likes: "12.4k",
    comments: "342",
    link: "#",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80",
    likes: "8.9k",
    comments: "156",
    link: "#",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80",
    likes: "15.1k",
    comments: "420",
    link: "#",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80",
    likes: "22.3k",
    comments: "892",
    link: "#",
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80",
    likes: "10.5k",
    comments: "214",
    link: "#",
  },
];

export default function SocialFeed() {
  return (
    <section className="py-20 border-t border-neutral-100 dark:border-neutral-900 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 mb-10 text-center">
        <p className="text-[#e02020] text-xs font-bold tracking-[0.2em] uppercase mb-3 flex items-center justify-center gap-2">
          <InstagramIcon size={14} /> @eshopofficial
        </p>
        <h2 className="font-display font-bold text-3xl md:text-4xl text-neutral-900 dark:text-white mb-4">
          Shop Our Instagram
        </h2>
        <p className="text-neutral-500 max-w-lg mx-auto text-sm md:text-base">
          Tag your looks with #EShopStyle for a chance to be featured on our official feed.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1 md:gap-0 w-full">
        {FEED_POSTS.map((post) => (
          <Link
            key={post.id}
            href={post.link}
            className="group relative block w-full aspect-[4/5] overflow-hidden bg-neutral-200 dark:bg-neutral-900"
          >
            <img
              src={post.image}
              alt="Instagram post"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6 text-white backdrop-blur-[2px]">
              <div className="flex items-center gap-2 font-semibold">
                <Heart size={20} className="fill-white" />
                <span>{post.likes}</span>
              </div>
              <div className="flex items-center gap-2 font-semibold">
                <MessageCircle size={20} className="fill-white" />
                <span>{post.comments}</span>
              </div>
            </div>
            {/* Instagram Icon Badge (visible when not hovered) */}
            <div className="absolute top-4 right-4 text-white/80 group-hover:opacity-0 transition-opacity duration-300 drop-shadow-md">
              <InstagramIcon size={20} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
