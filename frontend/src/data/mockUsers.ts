export interface SocialUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
}

export const mockUsers: SocialUser[] = [
  {
    id: 'u1',
    username: 'foodie_sarah',
    displayName: 'Sarah Chen',
    bio: 'Plant-based cooking enthusiast 🌿',
  },
  {
    id: 'u2',
    username: 'chef_marco',
    displayName: 'Marco Rossi',
    bio: 'Italian home cook. Pasta is life.',
  },
  {
    id: 'u3',
    username: 'healthyeats',
    displayName: 'Jamie Rivera',
    bio: 'Nutritionist & meal prep queen 💪',
  },
  {
    id: 'u4',
    username: 'spicylover',
    displayName: 'Priya Nair',
    bio: 'Exploring flavors from around the world 🌶️',
  },
  {
    id: 'u5',
    username: 'veganvibes',
    displayName: 'Alex Thompson',
    bio: 'Making vegan food fun and delicious',
  },
  {
    id: 'u6',
    username: 'bakersdozen',
    displayName: 'Emma Davis',
    bio: 'Weekend baker & full-time food lover 🧁',
  },
  {
    id: 'u7',
    username: 'grillmaster',
    displayName: 'Carlos Mendez',
    bio: 'BBQ champion 🔥',
  },
  {
    id: 'u8',
    username: 'sweettooth',
    displayName: 'Lily Park',
    bio: 'Dessert developer and sugar addict 🍰',
  },
  {
    id: 'u9',
    username: 'keto_king',
    displayName: 'Ryan O\'Brien',
    bio: 'Low-carb lifestyle advocate',
  },
  {
    id: 'u10',
    username: 'soupseason',
    displayName: 'Nina Kowalski',
    bio: 'Soup for every season 🍲',
  },
];

// Users who are mock-following you by default (to seed the followers list)
export const INITIAL_FOLLOWER_IDS = ['u1', 'u3', 'u5', 'u7', 'u10'];
