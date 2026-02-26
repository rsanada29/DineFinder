import { useState, useRef, useCallback, useEffect } from "react";

const RESTAURANT_IMAGES = {
  1: ["https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=600&h=800&fit=crop"],
  2: ["https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&h=800&fit=crop"],
  3: ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1574966740793-953ad399ebdb?w=600&h=800&fit=crop"],
  4: ["https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=800&fit=crop"],
  5: ["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1559305616-3f99cd43e353?w=600&h=800&fit=crop"],
  6: ["https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1432139509613-5c4255a1d197?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&h=800&fit=crop"],
  7: ["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&h=800&fit=crop"],
  8: ["https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=800&fit=crop"],
  9: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=600&h=800&fit=crop"],
  10: ["https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&h=800&fit=crop"],
  11: ["https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=800&fit=crop"],
  12: ["https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?w=600&h=800&fit=crop"],
  13: ["https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1582234372722-50d7ccc30ebd?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=600&h=800&fit=crop"],
  14: ["https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1567533708067-5aa77f3c0c95?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1583032015879-e5022cb87c3b?w=600&h=800&fit=crop"],
  15: ["https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1580651214613-f4692d6d138f?w=600&h=800&fit=crop"],
  16: ["https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=600&h=800&fit=crop"],
  17: ["https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&h=800&fit=crop"],
  18: ["https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1503764654157-72d979d9af2f?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=600&h=800&fit=crop"],
  19: ["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=800&fit=crop"],
  20: ["https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&h=800&fit=crop", "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=800&fit=crop"],
};

const MOCK_RESTAURANTS = [
  { id: 1, name: "Sushi Kaido", genre: "Japanese", rating: 4.7, reviews: 1243, distance: 0.3, price: "$30〜$80", phone: "+61 2 9283 1234", address: "12 George St, Sydney NSW 2000", hours: "11:30 AM – 10:00 PM", priceLevel: 3, lat: -33.8688, lng: 151.2070 },
  { id: 2, name: "Paddy McGuire's", genre: "Pub / Izakaya", rating: 4.2, reviews: 3876, distance: 0.5, price: "$15〜$40", phone: "+61 2 9251 5678", address: "38 Circular Quay W, Sydney NSW 2000", hours: "11:00 AM – 12:00 AM", priceLevel: 2, lat: -33.8607, lng: 151.2105 },
  { id: 3, name: "Oiden Izakaya", genre: "Pub / Izakaya", rating: 4.6, reviews: 987, distance: 0.8, price: "$20〜$50", phone: "+61 2 9267 4321", address: "Level 1, 505 George St, Sydney NSW 2000", hours: "5:00 PM – 11:30 PM", priceLevel: 2, lat: -33.8756, lng: 151.2065 },
  { id: 4, name: "Single O Surry Hills", genre: "Cafe", rating: 4.5, reviews: 2156, distance: 0.4, price: "$5〜$25", phone: "+61 2 9211 0665", address: "60-64 Reservoir St, Surry Hills NSW 2010", hours: "7:00 AM – 3:00 PM", priceLevel: 1, lat: -33.8830, lng: 151.2110 },
  { id: 5, name: "Bourke Street Bakery", genre: "Cafe", rating: 4.4, reviews: 4521, distance: 1.1, price: "$8〜$22", phone: "+61 2 9699 1011", address: "633 Bourke St, Surry Hills NSW 2010", hours: "7:00 AM – 5:00 PM", priceLevel: 1, lat: -33.8843, lng: 151.2128 },
  { id: 6, name: "The Grill House", genre: "Lunch", rating: 4.3, reviews: 1876, distance: 0.7, price: "$18〜$45", phone: "+61 2 9264 1122", address: "88 Liverpool St, Sydney NSW 2000", hours: "11:00 AM – 3:00 PM", priceLevel: 2, lat: -33.8755, lng: 151.2099 },
  { id: 7, name: "Devon Cafe", genre: "Lunch", rating: 4.5, reviews: 2340, distance: 1.3, price: "$15〜$35", phone: "+61 2 9698 4455", address: "76 Devonshire St, Surry Hills NSW 2010", hours: "7:30 AM – 3:30 PM", priceLevel: 2, lat: -33.8851, lng: 151.2094 },
  { id: 8, name: "Fratelli Paradiso", genre: "Italian", rating: 4.6, reviews: 3210, distance: 2.1, price: "$25〜$55", phone: "+61 2 9357 1744", address: "12-16 Challis Ave, Potts Point NSW 2011", hours: "7:00 AM – 11:00 PM", priceLevel: 3, lat: -33.8700, lng: 151.2263 },
  { id: 9, name: "Ormeggio at The Spit", genre: "Italian", rating: 4.8, reviews: 654, distance: 8.5, price: "$50〜$120", phone: "+61 2 9969 4088", address: "D'Albora Marinas, Spit Rd, Mosman NSW 2088", hours: "12:00 PM – 10:00 PM", priceLevel: 4, lat: -33.8054, lng: 151.2490 },
  { id: 10, name: "Chat Thai", genre: "Thai", rating: 4.4, reviews: 5678, distance: 0.2, price: "$12〜$25", phone: "+61 2 9211 1808", address: "20 Campbell St, Haymarket NSW 2000", hours: "10:00 AM – 11:00 PM", priceLevel: 1, lat: -33.8794, lng: 151.2044 },
  { id: 11, name: "Home Thai", genre: "Thai", rating: 4.3, reviews: 1432, distance: 1.6, price: "$14〜$28", phone: "+61 2 9212 3456", address: "199 Elizabeth St, Sydney NSW 2000", hours: "11:00 AM – 10:00 PM", priceLevel: 1, lat: -33.8735, lng: 151.2089 },
  { id: 12, name: "Guzman y Gomez", genre: "Mexican", rating: 4.1, reviews: 4320, distance: 0.6, price: "$10〜$22", phone: "+61 2 8065 7890", address: "175 Pitt St, Sydney NSW 2000", hours: "10:00 AM – 10:00 PM", priceLevel: 1, lat: -33.8701, lng: 151.2091 },
  { id: 13, name: "El Camino Cantina", genre: "Mexican", rating: 4.3, reviews: 2876, distance: 2.5, price: "$18〜$40", phone: "+61 2 9245 3287", address: "The Rocks, 1 Kendall Ln, Sydney NSW 2000", hours: "11:30 AM – 11:00 PM", priceLevel: 2, lat: -33.8598, lng: 151.2082 },
  { id: 14, name: "Korean BBQ King", genre: "Korean", rating: 4.5, reviews: 1987, distance: 0.9, price: "$20〜$45", phone: "+61 2 9267 5588", address: "321 Pitt St, Sydney NSW 2000", hours: "11:00 AM – 11:00 PM", priceLevel: 2, lat: -33.8760, lng: 151.2075 },
  { id: 15, name: "Arisun", genre: "Korean", rating: 4.6, reviews: 1543, distance: 1.4, price: "$15〜$35", phone: "+61 2 9283 9903", address: "Shop 2, 363 Pitt St, Sydney NSW 2000", hours: "11:30 AM – 10:30 PM", priceLevel: 2, lat: -33.8772, lng: 151.2072 },
  { id: 16, name: "Sake Restaurant", genre: "Japanese", rating: 4.5, reviews: 2654, distance: 1.8, price: "$40〜$90", phone: "+61 2 9259 5656", address: "12 Argyle St, The Rocks NSW 2000", hours: "12:00 PM – 10:30 PM", priceLevel: 3, lat: -33.8592, lng: 151.2080 },
  { id: 17, name: "Mr. Wong", genre: "Chinese", rating: 4.6, reviews: 5432, distance: 0.4, price: "$25〜$60", phone: "+61 2 9240 3000", address: "3 Bridge Ln, Sydney NSW 2000", hours: "12:00 PM – 11:00 PM", priceLevel: 3, lat: -33.8650, lng: 151.2078 },
  { id: 18, name: "Saigon Lane", genre: "Vietnamese", rating: 4.3, reviews: 876, distance: 1.0, price: "$12〜$22", phone: "+61 2 9221 7890", address: "27 Dixon St, Haymarket NSW 2000", hours: "10:00 AM – 9:30 PM", priceLevel: 1, lat: -33.8790, lng: 151.2036 },
  { id: 19, name: "Bar Luca", genre: "Lunch", rating: 4.4, reviews: 3210, distance: 0.3, price: "$15〜$28", phone: "+61 2 9262 5500", address: "46 King St, Sydney NSW 2000", hours: "11:00 AM – 9:00 PM", priceLevel: 1, lat: -33.8675, lng: 151.2086 },
  { id: 20, name: "Saga Indian", genre: "Indian", rating: 4.4, reviews: 1654, distance: 2.3, price: "$16〜$35", phone: "+61 2 9212 3344", address: "197 Harris St, Pyrmont NSW 2009", hours: "11:30 AM – 10:00 PM", priceLevel: 2, lat: -33.8710, lng: 151.1945 },
];

const GENRES = ["All", "Cafe", "Lunch", "Italian", "Japanese", "Thai", "Mexican", "Korean", "Chinese", "Vietnamese", "Indian", "Pub / Izakaya"];
const MEMBER_AVATARS = ["🧑‍🦰", "👩‍🦱", "🧑‍🦳", "👨‍🦲", "👩", "🧔", "👱‍♀️", "👨‍🦱"];
const MEMBER_NAMES = ["You", "Emma", "Liam", "Sophie", "Noah", "Mia", "James", "Olivia"];

const StarRating = ({ rating, size = 14 }) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {[...Array(5)].map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i < full ? "#FF6B35" : i === full && half ? "url(#half)" : "#ddd"} xmlns="http://www.w3.org/2000/svg">
          <defs><linearGradient id="half"><stop offset="50%" stopColor="#FF6B35" /><stop offset="50%" stopColor="#ddd" /></linearGradient></defs>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      <span style={{ fontSize: size - 1, fontWeight: 700, color: "#FF6B35", marginLeft: 4 }}>{rating}</span>
    </div>
  );
};

const PriceLevel = ({ level }) => (
  <span style={{ fontWeight: 600, fontSize: 13 }}>
    {[...Array(4)].map((_, i) => (<span key={i} style={{ color: i < level ? "#FF6B35" : "#ddd" }}>$</span>))}
  </span>
);

// ─── Photo Gallery ───
const PhotoGallery = ({ restaurantId, isTop }) => {
  const [idx, setIdx] = useState(0);
  const images = RESTAURANT_IMAGES[restaurantId] || [];
  const count = images.length;
  return (
    <>
      <img src={images[idx] || images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} draggable={false} />
      {count > 1 && isTop && (
        <>
          <div style={{ position: "absolute", top: 54, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5, zIndex: 8 }}>
            {images.map((_, i) => (
              <div key={i} style={{ width: i === idx ? 18 : 6, height: 6, borderRadius: 3, background: i === idx ? "white" : "rgba(255,255,255,0.5)", transition: "all 0.3s" }} />
            ))}
          </div>
          <div onClick={e => { e.stopPropagation(); setIdx(p => Math.max(0, p - 1)); }}
            style={{ position: "absolute", top: 0, left: 0, width: "30%", height: "60%", zIndex: 7, cursor: "pointer" }} />
          <div onClick={e => { e.stopPropagation(); setIdx(p => Math.min(count - 1, p + 1)); }}
            style={{ position: "absolute", top: 0, right: 0, width: "30%", height: "60%", zIndex: 7, cursor: "pointer" }} />
        </>
      )}
    </>
  );
};

// ─── Swipe Card ───
const SwipeCard = ({ restaurant, onSwipe, isTop }) => {
  const startX = useRef(0);
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDir, setSwipeDir] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const handleStart = x => { if (!isTop) return; startX.current = x; setIsDragging(true); };
  const handleMove = x => { if (!isDragging || !isTop) return; const d = x - startX.current; setOffset(d); setSwipeDir(d > 50 ? "right" : d < -50 ? "left" : null); };
  const handleEnd = () => {
    if (!isDragging || !isTop) return; setIsDragging(false);
    if (offset > 120) { setOffset(500); setTimeout(() => onSwipe("right"), 250); }
    else if (offset < -120) { setOffset(-500); setTimeout(() => onSwipe("left"), 250); }
    else { setOffset(0); setSwipeDir(null); }
  };
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.lat},${restaurant.lng}`;

  return (
    <div onMouseDown={e => handleStart(e.clientX)} onMouseMove={e => handleMove(e.clientX)} onMouseUp={handleEnd} onMouseLeave={() => isDragging && handleEnd()}
      onTouchStart={e => handleStart(e.touches[0].clientX)} onTouchMove={e => handleMove(e.touches[0].clientX)} onTouchEnd={handleEnd}
      style={{ position: "absolute", width: "100%", height: "100%", borderRadius: 20, overflow: "hidden", cursor: isTop ? "grab" : "default",
        transform: isTop ? `translateX(${offset}px) rotate(${offset * 0.08}deg)` : "scale(0.95) translateY(12px)",
        transition: isDragging ? "none" : "all 0.4s cubic-bezier(.175,.885,.32,1.275)",
        opacity: isTop ? Math.max(0, 1 - Math.abs(offset) / 500) : 0.6, zIndex: isTop ? 2 : 1, userSelect: "none", boxShadow: "0 8px 40px rgba(0,0,0,0.15)" }}>
      <div style={{ position: "relative", width: "100%", height: "100%", background: "#f0f0f0" }}>
        <PhotoGallery restaurantId={restaurant.id} isTop={isTop} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "65%", background: "linear-gradient(transparent, rgba(0,0,0,0.85))", pointerEvents: "none" }} />
        {swipeDir === "right" && <div style={{ position: "absolute", top: 40, left: 20, border: "4px solid #4ADE80", borderRadius: 12, padding: "8px 20px", transform: "rotate(-15deg)", zIndex: 10 }}><span style={{ color: "#4ADE80", fontSize: 28, fontWeight: 900, letterSpacing: 2 }}>SAVE</span></div>}
        {swipeDir === "left" && <div style={{ position: "absolute", top: 40, right: 20, border: "4px solid #F87171", borderRadius: 12, padding: "8px 20px", transform: "rotate(15deg)", zIndex: 10 }}><span style={{ color: "#F87171", fontSize: 28, fontWeight: 900, letterSpacing: 2 }}>SKIP</span></div>}
        <div style={{ position: "absolute", top: 16, right: 16, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", borderRadius: 20, padding: "6px 14px", display: "flex", alignItems: "center", gap: 5 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span style={{ color: "white", fontSize: 13, fontWeight: 600 }}>{restaurant.distance}km</span>
        </div>
        <div style={{ position: "absolute", top: 16, left: 16, background: "#FF6B35", borderRadius: 20, padding: "6px 14px" }}><span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>{restaurant.genre}</span></div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 20px 24px", zIndex: 5 }}>
          <h2 style={{ color: "white", fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>{restaurant.name}</h2>
          <StarRating rating={restaurant.rating} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>({restaurant.reviews} reviews)</span>
            <span style={{ color: "rgba(255,255,255,0.4)" }}>•</span>
            <PriceLevel level={restaurant.priceLevel} />
          </div>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>{restaurant.hours}
          </div>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>{restaurant.phone}
          </div>
          <button onClick={e => { e.stopPropagation(); setExpanded(!expanded); }} style={{ marginTop: 10, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "8px 16px", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", backdropFilter: "blur(10px)" }}>
            {expanded ? "Close" : "See Details"} ▾
          </button>
          {expanded && (
            <div style={{ marginTop: 12, padding: 14, background: "rgba(255,255,255,0.1)", borderRadius: 12, backdropFilter: "blur(10px)" }}>
              <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>{restaurant.address}
              </div>
              <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, marginTop: 8 }}>💰 {restaurant.price}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <a href={`tel:${restaurant.phone}`} style={{ flex: 1, background: "#4ADE80", borderRadius: 10, padding: "10px", color: "#1a1a1a", fontSize: 13, fontWeight: 700, textDecoration: "none", textAlign: "center", display: "block" }}>📞 Call</a>
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, background: "#60A5FA", borderRadius: 10, padding: "10px", color: "white", fontSize: 13, fontWeight: 700, textDecoration: "none", textAlign: "center", display: "block" }}>🗺️ Go Here</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Filter Modal ───
const FilterModal = ({ show, onClose, filters, setFilters }) => {
  if (!show) return null;
  const [l, setL] = useState({ ...filters });
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 430, background: "#FFFAF5", borderRadius: "24px 24px 0 0", padding: "20px 24px 40px", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, background: "#ddd", borderRadius: 2, margin: "0 auto 20px" }} />
        <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 20px", color: "#1a1a1a" }}>Filters</h3>
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 14, fontWeight: 700, color: "#555", marginBottom: 10, display: "block" }}>Distance: within {l.maxDistance}km</label>
          <input type="range" min="0.5" max="20" step="0.5" value={l.maxDistance} onChange={e => setL({ ...l, maxDistance: parseFloat(e.target.value) })} style={{ width: "100%", accentColor: "#FF6B35" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#999" }}><span>0.5km</span><span>20km</span></div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 14, fontWeight: 700, color: "#555", marginBottom: 10, display: "block" }}>Category</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {GENRES.map(g => (<button key={g} onClick={() => setL({ ...l, genre: g })} style={{ padding: "8px 16px", borderRadius: 20, border: "none", background: l.genre === g ? "#FF6B35" : "#f0e8e0", color: l.genre === g ? "white" : "#666", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{g}</button>))}
          </div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 14, fontWeight: 700, color: "#555", marginBottom: 10, display: "block" }}>Sort By</label>
          {[{ k: "distance", t: "Nearest First" }, { k: "rating", t: "Highest Rated" }, { k: "reviews", t: "Most Reviews" }, { k: "priceAsc", t: "Price: Low → High" }, { k: "priceDesc", t: "Price: High → Low" }].map(s => (
            <button key={s.k} onClick={() => setL({ ...l, sort: s.k })} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 16px", borderRadius: 12, border: "none", background: l.sort === s.k ? "#FFF0E8" : "transparent", marginBottom: 4, cursor: "pointer" }}>
              <div style={{ width: 20, height: 20, borderRadius: 10, border: `2px solid ${l.sort === s.k ? "#FF6B35" : "#ccc"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>{l.sort === s.k && <div style={{ width: 10, height: 10, borderRadius: 5, background: "#FF6B35" }} />}</div>
              <span style={{ fontSize: 14, color: "#333", fontWeight: l.sort === s.k ? 600 : 400 }}>{s.t}</span>
            </button>
          ))}
        </div>
        <div style={{ marginBottom: 30 }}>
          <label style={{ fontSize: 14, fontWeight: 700, color: "#555", marginBottom: 10, display: "block" }}>Price Range</label>
          <div style={{ display: "flex", gap: 8 }}>
            {[1, 2, 3, 4].map(p => (<button key={p} onClick={() => { const s = new Set(l.priceLevels); s.has(p) ? s.delete(p) : s.add(p); setL({ ...l, priceLevels: [...s] }); }} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "none", background: l.priceLevels.includes(p) ? "#FF6B35" : "#f0e8e0", color: l.priceLevels.includes(p) ? "white" : "#666", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{"$".repeat(p)}</button>))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => setL({ maxDistance: 20, genre: "All", sort: "distance", priceLevels: [1, 2, 3, 4] })} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "2px solid #ddd", background: "transparent", fontSize: 15, fontWeight: 700, cursor: "pointer", color: "#666" }}>Reset</button>
          <button onClick={() => { setFilters(l); onClose(); }} style={{ flex: 2, padding: "14px", borderRadius: 14, border: "none", background: "#FF6B35", color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Apply</button>
        </div>
      </div>
    </div>
  );
};

// ─── Saved Page ───
const SavedPage = ({ saved, onRemove }) => {
  const [f, setF] = useState("All");
  const [s, setS] = useState("distance");
  let list = saved.filter(r => f === "All" || r.genre === f);
  list.sort((a, b) => s === "distance" ? a.distance - b.distance : s === "rating" ? b.rating - a.rating : a.priceLevel - b.priceLevel);
  return (
    <div style={{ padding: "0 20px 100px", overflowY: "auto", height: "calc(100% - 60px)" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: "20px 0 4px", color: "#1a1a1a" }}>Saved Places</h2>
      <p style={{ color: "#999", fontSize: 13, margin: "0 0 16px" }}>{saved.length} saved</p>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, marginBottom: 8 }}>
        {["All", ...new Set(saved.map(r => r.genre))].map(g => (<button key={g} onClick={() => setF(g)} style={{ padding: "6px 14px", borderRadius: 20, border: "none", background: f === g ? "#FF6B35" : "#f0e8e0", color: f === g ? "white" : "#666", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{g}</button>))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[{ k: "distance", t: "Distance" }, { k: "rating", t: "Rating" }, { k: "priceAsc", t: "Price" }].map(x => (<button key={x.k} onClick={() => setS(x.k)} style={{ padding: "6px 12px", borderRadius: 8, border: s === x.k ? "1.5px solid #FF6B35" : "1.5px solid #e0e0e0", background: s === x.k ? "#FFF5EE" : "white", color: s === x.k ? "#FF6B35" : "#888", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{x.t}</button>))}
      </div>
      {list.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#999" }}><div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div><p style={{ fontSize: 16, fontWeight: 600 }}>No saved places yet</p><p style={{ fontSize: 13 }}>Swipe right to save restaurants!</p></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {list.map(r => (
            <div key={r.id} style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f0e8e0" }}>
              <div style={{ display: "flex" }}>
                <img src={RESTAURANT_IMAGES[r.id]?.[0]} alt={r.name} style={{ width: 100, height: 130, objectFit: "cover" }} />
                <div style={{ flex: 1, padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div><span style={{ fontSize: 10, fontWeight: 700, color: "#FF6B35", background: "#FFF5EE", padding: "2px 8px", borderRadius: 6 }}>{r.genre}</span><h4 style={{ fontSize: 15, fontWeight: 700, margin: "4px 0 2px", color: "#1a1a1a" }}>{r.name}</h4></div>
                    <button onClick={() => onRemove(r.id)} style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "#ccc", padding: 4 }}>✕</button>
                  </div>
                  <StarRating rating={r.rating} size={12} />
                  <div style={{ display: "flex", gap: 8, marginTop: 6, fontSize: 12, color: "#888" }}><span>📍{r.distance}km</span><span>{r.price}</span></div>
                </div>
              </div>
              <div style={{ display: "flex", borderTop: "1px solid #f5f0eb" }}>
                <a href={`tel:${r.phone}`} style={{ flex: 1, padding: "10px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#FF6B35", textDecoration: "none", borderRight: "1px solid #f5f0eb" }}>📞 Call</a>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "10px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#60A5FA", textDecoration: "none" }}>🗺️ Go Here</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Group Match Page ───
const GroupMatchPage = () => {
  const [groups, setGroups] = useState([
    { id: 1, name: "Friday Dinner 🍕", code: "MESH-7K2X", members: [0, 1, 2], swiped: { 0: [10, 8, 14, 17, 3], 1: [10, 14, 6, 17], 2: [10, 17, 8, 13, 14] } },
    { id: 2, name: "Weekend Lunch 🌮", code: "MESH-9R4P", members: [0, 3, 4], swiped: { 0: [12, 19, 7], 3: [12, 7, 4], 4: [12, 19, 7, 4] } },
  ]);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showMatches, setShowMatches] = useState(false);
  const [pulse, setPulse] = useState(false);

  const getMatches = g => {
    const sets = g.members.map(m => new Set(g.swiped[m] || []));
    if (!sets.length) return [];
    let common = [...sets[0]];
    for (let i = 1; i < sets.length; i++) common = common.filter(id => sets[i].has(id));
    return common.map(id => MOCK_RESTAURANTS.find(r => r.id === id)).filter(Boolean);
  };

  const createGroup = () => {
    if (!newName.trim()) return;
    const code = "MESH-" + Math.random().toString(36).substring(2, 6).toUpperCase();
    setGroups(p => [...p, { id: Date.now(), name: newName, code, members: [0], swiped: { 0: [] } }]);
    setNewName(""); setCreating(false);
  };

  if (selected) {
    const g = groups.find(x => x.id === selected);
    if (!g) { setSelected(null); return null; }
    const matches = getMatches(g);
    const progress = g.members.map(m => ({ name: MEMBER_NAMES[m], avatar: MEMBER_AVATARS[m], count: (g.swiped[m] || []).length }));

    return (
      <div style={{ padding: "0 20px 100px", overflowY: "auto", height: "calc(100% - 60px)" }}>
        <button onClick={() => { setSelected(null); setShowMatches(false); }} style={{ background: "none", border: "none", fontSize: 14, color: "#FF6B35", fontWeight: 600, cursor: "pointer", padding: "16px 0", display: "flex", alignItems: "center", gap: 4 }}>← Back</button>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: "#1a1a1a" }}>{g.name}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: "#999", background: "#f5f0eb", padding: "4px 10px", borderRadius: 6, fontFamily: "monospace" }}>{g.code}</span>
          <button onClick={() => navigator.clipboard?.writeText(g.code)} style={{ background: "none", border: "none", fontSize: 12, color: "#FF6B35", cursor: "pointer", fontWeight: 600 }}>Copy</button>
        </div>

        <div style={{ background: "white", borderRadius: 16, padding: 16, marginBottom: 16, border: "1px solid #f0e8e0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "#555", margin: "0 0 12px" }}>Members ({g.members.length})</h4>
          {progress.map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 28 }}>{m.avatar}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>{m.name}</span>
                  <span style={{ fontSize: 12, color: "#999" }}>{m.count} swiped</span>
                </div>
                <div style={{ height: 6, background: "#f0e8e0", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, (m.count / 20) * 100)}%`, background: "linear-gradient(90deg, #FF6B35, #FF9F6B)", borderRadius: 3, transition: "width 0.5s" }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => { setShowMatches(true); setPulse(true); setTimeout(() => setPulse(false), 800); }}
          style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none", background: matches.length > 0 ? "linear-gradient(135deg, #FF6B35, #E8390E)" : "#ddd", color: "white", fontSize: 16, fontWeight: 800, cursor: matches.length > 0 ? "pointer" : "default", marginBottom: 16, boxShadow: matches.length > 0 ? "0 4px 20px rgba(255,107,53,0.4)" : "none", position: "relative", overflow: "hidden" }}>
          {matches.length > 0 ? `🎉 ${matches.length} Match${matches.length > 1 ? "es" : ""} Found!` : "No matches yet — keep swiping!"}
          {pulse && <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.3)", animation: "pout 0.8s ease-out" }} />}
        </button>

        {showMatches && matches.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: "#555", margin: "0 0 4px" }}>Everyone agreed on:</h4>
            {matches.map(r => (
              <div key={r.id} style={{ background: "white", borderRadius: 16, overflow: "hidden", border: "2px solid #FF6B35", boxShadow: "0 4px 16px rgba(255,107,53,0.15)" }}>
                <div style={{ display: "flex" }}>
                  <img src={RESTAURANT_IMAGES[r.id]?.[0]} alt={r.name} style={{ width: 100, height: 120, objectFit: "cover" }} />
                  <div style={{ flex: 1, padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#FF6B35" }}>MATCH</span>
                      <span style={{ fontSize: 10, fontWeight: 700, background: "#FFF5EE", color: "#FF6B35", padding: "2px 8px", borderRadius: 6 }}>{r.genre}</span>
                    </div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px", color: "#1a1a1a" }}>{r.name}</h4>
                    <StarRating rating={r.rating} size={12} />
                    <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>📍{r.distance}km • {r.price}</div>
                  </div>
                </div>
                <div style={{ display: "flex", borderTop: "1px solid #FFE0D0" }}>
                  <a href={`tel:${r.phone}`} style={{ flex: 1, padding: "10px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#FF6B35", textDecoration: "none", borderRight: "1px solid #FFE0D0" }}>📞 Call</a>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "10px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#60A5FA", textDecoration: "none" }}>🗺️ Go Here</a>
                </div>
              </div>
            ))}
          </div>
        )}
        <style>{`@keyframes pout{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(1.5)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 20px 100px", overflowY: "auto", height: "calc(100% - 60px)" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: "20px 0 4px", color: "#1a1a1a" }}>Group Match</h2>
      <p style={{ color: "#999", fontSize: 13, margin: "0 0 20px" }}>Swipe together, eat together!</p>
      {creating ? (
        <div style={{ background: "white", borderRadius: 16, padding: 20, marginBottom: 16, border: "1px solid #f0e8e0" }}>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: "#333", margin: "0 0 12px" }}>New Group</h4>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Group name (e.g. Friday dinner 🍕)"
            style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid #e0e0e0", fontSize: 14, outline: "none", marginBottom: 12, boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setCreating(false)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "2px solid #ddd", background: "transparent", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#666" }}>Cancel</button>
            <button onClick={createGroup} style={{ flex: 2, padding: "12px", borderRadius: 12, border: "none", background: "#FF6B35", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Create</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <button onClick={() => setCreating(true)} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", background: "#FF6B35", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(255,107,53,0.3)" }}>+ New Group</button>
          <button style={{ flex: 1, padding: "14px", borderRadius: 14, border: "2px solid #FF6B35", background: "white", color: "#FF6B35", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Join Group</button>
        </div>
      )}
      {groups.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 20px", color: "#999" }}><div style={{ fontSize: 48, marginBottom: 12 }}>👥</div><p style={{ fontSize: 16, fontWeight: 600 }}>No groups yet</p><p style={{ fontSize: 13 }}>Create a group and invite your friends!</p></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {groups.map(g => { const m = getMatches(g); return (
            <button key={g.id} onClick={() => setSelected(g.id)} style={{ background: "white", borderRadius: 16, padding: 18, border: m.length > 0 ? "2px solid #FF6B35" : "1px solid #f0e8e0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", cursor: "pointer", textAlign: "left", position: "relative" }}>
              {m.length > 0 && <div style={{ position: "absolute", top: 12, right: 12, background: "#FF6B35", color: "white", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 10 }}>{m.length} match{m.length > 1 ? "es" : ""}!</div>}
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px", color: "#1a1a1a" }}>{g.name}</h3>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                {g.members.map((x, i) => <span key={i} style={{ fontSize: 22, marginLeft: i > 0 ? -4 : 0 }}>{MEMBER_AVATARS[x]}</span>)}
                <span style={{ fontSize: 12, color: "#999", marginLeft: 8 }}>{g.members.length} members</span>
              </div>
              <span style={{ fontSize: 11, color: "#aaa", fontFamily: "monospace", background: "#f5f0eb", padding: "2px 8px", borderRadius: 4 }}>{g.code}</span>
            </button>
          ); })}
        </div>
      )}
    </div>
  );
};

// ─── Account Page ───
const AccountPage = () => {
  const [name, setName] = useState("User");
  const [notif, setNotif] = useState(true);
  const [loc, setLoc] = useState(true);
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState("en");
  const Tog = ({ on, fn }) => (<button onClick={fn} style={{ width: 48, height: 28, borderRadius: 14, border: "none", background: on ? "#FF6B35" : "#ddd", cursor: "pointer", position: "relative", transition: "background 0.3s" }}><div style={{ width: 22, height: 22, borderRadius: 11, background: "white", position: "absolute", top: 3, left: on ? 23 : 3, transition: "left 0.3s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} /></button>);
  const Row = ({ icon, label, right }) => (<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid #f5f0eb" }}><div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ fontSize: 20 }}>{icon}</span><span style={{ fontSize: 14, fontWeight: 500, color: "#333" }}>{label}</span></div>{right}</div>);
  return (
    <div style={{ padding: "0 24px 100px", overflowY: "auto", height: "calc(100% - 60px)" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: "20px 0 24px", color: "#1a1a1a" }}>Account</h2>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: 20, background: "white", borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 24, border: "1px solid #f0e8e0" }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: "linear-gradient(135deg, #FF6B35, #FF9F6B)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🍙</div>
        <div><input value={name} onChange={e => setName(e.target.value)} style={{ fontSize: 18, fontWeight: 700, border: "none", background: "transparent", color: "#1a1a1a", outline: "none", width: "100%" }} /><p style={{ fontSize: 13, color: "#999", margin: 0 }}>Edit Profile</p></div>
      </div>
      <div style={{ background: "white", borderRadius: 20, padding: "4px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 16, border: "1px solid #f0e8e0" }}>
        <Row icon="🔔" label="Notifications" right={<Tog on={notif} fn={() => setNotif(!notif)} />} />
        <Row icon="📍" label="Location Services" right={<Tog on={loc} fn={() => setLoc(!loc)} />} />
        <Row icon="🌙" label="Dark Mode" right={<Tog on={dark} fn={() => setDark(!dark)} />} />
        <Row icon="🌐" label="Language" right={<select value={lang} onChange={e => setLang(e.target.value)} style={{ border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "6px 10px", fontSize: 13, color: "#555", background: "white" }}><option value="en">English</option><option value="ja">日本語</option></select>} />
      </div>
      <div style={{ background: "white", borderRadius: 20, padding: "4px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 16, border: "1px solid #f0e8e0" }}>
        <Row icon="📋" label="Terms of Service" right={<span style={{ color: "#ccc" }}>›</span>} />
        <Row icon="🔒" label="Privacy Policy" right={<span style={{ color: "#ccc" }}>›</span>} />
        <Row icon="💬" label="Contact Us" right={<span style={{ color: "#ccc" }}>›</span>} />
        <Row icon="⭐" label="Rate This App" right={<span style={{ color: "#ccc" }}>›</span>} />
      </div>
      <button style={{ width: "100%", padding: "14px", borderRadius: 14, border: "2px solid #F87171", background: "transparent", color: "#F87171", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 8 }}>Log Out</button>
      <p style={{ textAlign: "center", fontSize: 12, color: "#ccc", marginTop: 16 }}>Meshi Match v1.0.0</p>
    </div>
  );
};

// ─── Main App ───
export default function MeshiMatch() {
  const [page, setPage] = useState("swipe");
  const [saved, setSaved] = useState([]);
  const [skipped, setSkipped] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({ maxDistance: 20, genre: "All", sort: "distance", priceLevels: [1, 2, 3, 4] });
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => { const t = setTimeout(() => setShowSplash(false), 2200); return () => clearTimeout(t); }, []);

  let restaurants = MOCK_RESTAURANTS.filter(r => !saved.find(s => s.id === r.id) && !skipped.includes(r.id)).filter(r => r.distance <= filters.maxDistance).filter(r => filters.genre === "All" || r.genre === filters.genre).filter(r => filters.priceLevels.includes(r.priceLevel));
  restaurants.sort((a, b) => { if (filters.sort === "distance") return a.distance - b.distance; if (filters.sort === "rating") return b.rating - a.rating; if (filters.sort === "reviews") return b.reviews - a.reviews; if (filters.sort === "priceAsc") return a.priceLevel - b.priceLevel; return b.priceLevel - a.priceLevel; });
  const handleSwipe = useCallback(dir => { const c = restaurants[0]; if (!c) return; if (dir === "right") setSaved(p => [...p, c]); if (dir === "left") setSkipped(p => [...p, c.id]); }, [restaurants]);

  if (showSplash) return (
    <div style={{ width: "100%", maxWidth: 430, margin: "0 auto", height: "100vh", maxHeight: 932, background: "linear-gradient(160deg, #FF6B35 0%, #FF4500 50%, #E8390E 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", top: -80, right: -100 }} />
      <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.08)", bottom: -60, left: -60 }} />
      <div style={{ animation: "sb 0.8s ease-out", fontSize: 64, marginBottom: 16 }}>🍱</div>
      <h1 style={{ color: "white", fontSize: 42, fontWeight: 900, margin: 0, letterSpacing: -1 }}>飯マッチ</h1>
      <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 500, marginTop: 8, letterSpacing: 3 }}>MESHI MATCH</p>
      <div style={{ marginTop: 40, width: 40, height: 40, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "sp 0.8s linear infinite" }} />
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}@keyframes sb{0%{transform:scale(0) rotate(-20deg);opacity:0}60%{transform:scale(1.15) rotate(5deg)}100%{transform:scale(1) rotate(0);opacity:1}}`}</style>
    </div>
  );

  return (
    <div style={{ width: "100%", maxWidth: 430, margin: "0 auto", height: "100vh", maxHeight: 932, background: "#FFFAF5", fontFamily: "system-ui, -apple-system, sans-serif", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 0 60px rgba(0,0,0,0.1)" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}::-webkit-scrollbar{display:none}`}</style>
      <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFFAF5", zIndex: 10, borderBottom: "1px solid #f5f0eb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 24 }}>🍱</span><h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, background: "linear-gradient(135deg, #FF6B35, #E8390E)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>飯マッチ</h1></div>
        {page === "swipe" && <button onClick={() => setShowFilter(true)} style={{ background: "#FFF5EE", border: "1.5px solid #FFD4BC", borderRadius: 12, padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="8" cy="6" r="2" fill="#FF6B35"/><circle cx="16" cy="12" r="2" fill="#FF6B35"/><circle cx="10" cy="18" r="2" fill="#FF6B35"/></svg><span style={{ fontSize: 13, fontWeight: 600, color: "#FF6B35" }}>Filter</span></button>}
      </div>
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {page === "swipe" && (
          <div style={{ height: "100%", padding: "12px 16px 8px", position: "relative" }}>
            {restaurants.length === 0 ? (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#999" }}><div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div><p style={{ fontSize: 18, fontWeight: 700, color: "#555" }}>No places found</p><p style={{ fontSize: 14, textAlign: "center" }}>Try adjusting your filters<br/>to discover more places!</p><button onClick={() => setShowFilter(true)} style={{ marginTop: 16, padding: "12px 28px", borderRadius: 14, border: "none", background: "#FF6B35", color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Change Filters</button></div>
            ) : (
              <>
                <div style={{ position: "relative", width: "100%", height: "calc(100% - 70px)" }}>
                  {restaurants.slice(0, 2).reverse().map((r, i) => <SwipeCard key={r.id} restaurant={r} onSwipe={handleSwipe} isTop={i === (Math.min(restaurants.length, 2) - 1)} />)}
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 24, padding: "12px 0" }}>
                  <button onClick={() => handleSwipe("left")} style={{ width: 56, height: 56, borderRadius: 28, border: "2px solid #F87171", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(248,113,113,0.2)" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                  <button onClick={() => handleSwipe("right")} style={{ width: 56, height: 56, borderRadius: 28, border: "2px solid #4ADE80", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(74,222,128,0.2)" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></button>
                </div>
              </>
            )}
          </div>
        )}
        {page === "saved" && <SavedPage saved={saved} onRemove={id => setSaved(p => p.filter(r => r.id !== id))} />}
        {page === "group" && <GroupMatchPage />}
        {page === "account" && <AccountPage />}
      </div>
      <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", padding: "8px 0 26px", background: "#FFFAF5", borderTop: "1px solid #f5f0eb" }}>
        {[{ key: "swipe", icon: "🍽️", label: "Discover" }, { key: "group", icon: "👥", label: "Groups" }, { key: "saved", icon: "❤️", label: "Saved", badge: saved.length }, { key: "account", icon: "👤", label: "Account" }].map(tab => (
          <button key={tab.key} onClick={() => setPage(tab.key)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 12px", position: "relative", opacity: page === tab.key ? 1 : 0.5, transition: "all 0.2s" }}>
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: page === tab.key ? "#FF6B35" : "#999" }}>{tab.label}</span>
            {tab.badge > 0 && <div style={{ position: "absolute", top: -2, right: 2, background: "#FF6B35", color: "white", fontSize: 9, fontWeight: 700, width: 16, height: 16, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>{tab.badge}</div>}
            {page === tab.key && <div style={{ width: 4, height: 4, borderRadius: 2, background: "#FF6B35", marginTop: 1 }} />}
          </button>
        ))}
      </div>
      <FilterModal show={showFilter} onClose={() => setShowFilter(false)} filters={filters} setFilters={setFilters} />
    </div>
  );
}
