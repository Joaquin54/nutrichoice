import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { mockUsers, INITIAL_FOLLOWER_IDS, type SocialUser } from '../data/mockUsers';

const FOLLOWING_KEY = 'nutrichoice_following';
const BLOCKED_KEY = 'nutrichoice_blocked';

interface SocialActionsContextType {
  followers: SocialUser[];
  following: SocialUser[];
  blockedUsers: SocialUser[];
  suggestedUsers: SocialUser[];
  followUser: (user: SocialUser) => void;
  unfollowUser: (userId: string) => void;
  blockUser: (user: SocialUser) => void;
  unblockUser: (userId: string) => void;
  isFollowing: (userId: string) => boolean;
  isBlocked: (userId: string) => boolean;
}

const SocialActionsContext = createContext<SocialActionsContextType | undefined>(undefined);

export function SocialActionsProvider({ children }: { children: ReactNode }) {
  const [following, setFollowing] = useState<SocialUser[]>(() => {
    try {
      const stored = localStorage.getItem(FOLLOWING_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [blockedUsers, setBlockedUsers] = useState<SocialUser[]>(() => {
    try {
      const stored = localStorage.getItem(BLOCKED_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Followers = initial mock set + anyone you mutually follow, minus blocked users
  const followers = useMemo(() => {
    const blockedIds = new Set(blockedUsers.map(u => u.id));
    const initialFollowers = mockUsers.filter(
      u => INITIAL_FOLLOWER_IDS.includes(u.id) && !blockedIds.has(u.id)
    );
    // Anyone you follow that isn't in the initial followers set also "follows you back"
    const mutualFollowers = following.filter(
      u => !INITIAL_FOLLOWER_IDS.includes(u.id) && !blockedIds.has(u.id)
    );
    return [...initialFollowers, ...mutualFollowers];
  }, [following, blockedUsers]);

  const suggestedUsers = useMemo(() => {
    const followingIds = new Set(following.map(u => u.id));
    const blockedIds = new Set(blockedUsers.map(u => u.id));
    return mockUsers.filter(u => !followingIds.has(u.id) && !blockedIds.has(u.id));
  }, [following, blockedUsers]);

  const followUser = useCallback((user: SocialUser) => {
    setFollowing(prev => {
      if (prev.find(u => u.id === user.id)) return prev;
      const updated = [...prev, user];
      localStorage.setItem(FOLLOWING_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const unfollowUser = useCallback((userId: string) => {
    setFollowing(prev => {
      const updated = prev.filter(u => u.id !== userId);
      localStorage.setItem(FOLLOWING_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const blockUser = useCallback((user: SocialUser) => {
    // Auto-unfollow when blocking
    setFollowing(prev => {
      const updated = prev.filter(u => u.id !== user.id);
      localStorage.setItem(FOLLOWING_KEY, JSON.stringify(updated));
      return updated;
    });
    setBlockedUsers(prev => {
      if (prev.find(u => u.id === user.id)) return prev;
      const updated = [...prev, user];
      localStorage.setItem(BLOCKED_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const unblockUser = useCallback((userId: string) => {
    setBlockedUsers(prev => {
      const updated = prev.filter(u => u.id !== userId);
      localStorage.setItem(BLOCKED_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isFollowing = useCallback(
    (userId: string) => following.some(u => u.id === userId),
    [following]
  );

  const isBlocked = useCallback(
    (userId: string) => blockedUsers.some(u => u.id === userId),
    [blockedUsers]
  );

  return (
    <SocialActionsContext.Provider
      value={{
        followers,
        following,
        blockedUsers,
        suggestedUsers,
        followUser,
        unfollowUser,
        blockUser,
        unblockUser,
        isFollowing,
        isBlocked,
      }}
    >
      {children}
    </SocialActionsContext.Provider>
  );
}

export function useSocialActions() {
  const context = useContext(SocialActionsContext);
  if (!context) throw new Error('useSocialActions must be used within SocialActionsProvider');
  return context;
}