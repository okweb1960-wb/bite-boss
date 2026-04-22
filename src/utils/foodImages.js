export const FOOD_IMAGES = {
  american: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
  burgers: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
  mexican: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800",
  italian: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
  pizza: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800",
  chinese: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800",
  japanese: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800",
  sushi: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800",
  thai: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800",
  indian: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800",
  mediterranean: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
  bbq: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800",
  seafood: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800",
  breakfast: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800",
  desserts: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800",
  cafe: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800",
  restaurant: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
};

export function getImage(restaurant) {
  if (restaurant?.photo_url) return restaurant.photo_url;
  const cuisine = (restaurant?.cuisine || "").toLowerCase();
  for (const key of Object.keys(FOOD_IMAGES)) {
    if (cuisine.includes(key)) return FOOD_IMAGES[key];
  }
  return FOOD_IMAGES.restaurant;
}