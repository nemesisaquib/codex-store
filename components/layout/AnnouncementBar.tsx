"use client";

const messages = [
  "✦ FREE SHIPPING on orders over $150",
  "✦ NEW ARRIVALS — Summer Edit now live",
  "✦ USE CODE WELCOME10 for 10% off your first order",
  "✦ EXPRESS DELIVERY available to 40+ countries",
  "✦ RETURNS accepted within 30 days — no questions asked",
];

export default function AnnouncementBar() {
  const track = [...messages, ...messages];
  return (
    <div className="bg-[#0a0a0a] text-white text-xs font-medium tracking-widest uppercase overflow-hidden h-8 flex items-center">
      <div className="marquee-track whitespace-nowrap">
        {track.map((msg, i) => (
          <span key={i} className="inline-flex items-center px-10 gap-2">
            {msg}
          </span>
        ))}
      </div>
    </div>
  );
}
