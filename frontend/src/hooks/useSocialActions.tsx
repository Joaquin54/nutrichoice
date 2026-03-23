import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { mockUsers, type SocialUser } from '../data/mockUsers';
import {
  getFollowing,
  createFollow,
  deleteFollow,
  getBlocks,
  createBlock,
  deleteBlock,
  getAuthToken,
} from '../api';

interface SocialActionsContextType {
  followers: SocialUser[];
  following: SocialUser[];
  blockedUsers: SocialUser[];
  suggestedUsers: SocialUser[];
  followUser: (user: SocialUser) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  blockUser: (user: SocialUser) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  isFollowing: (userId: string) => boolean;
  isBlocked: (userId: string) => boolean;
}

const SocialActionsContext = createContext<SocialActionsContextType | undefined>(undefined);

// Map a backend follow edge to a SocialUser for display.
function followToSocialUser(followeeId: number, username: string): SocialUser {
  return {
    id: String(followeeId),
    username,
    displayName: username,
  };
}

// Map a backend block edge to a SocialUser for display.
function blockToSocialUser(blockedId: number, username: string): SocialUser {
  return {
    id: String(blockedId),
    username,
    displayName: username,
  };
}

export function SocialActionsProvider({ children }: { children: ReactNode }) {
  const [following, setFollowing] = useState<SocialUser[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<SocialUser[]>([]);

  // Edge ID maps for deletion: user string ID → backend edge ID
  const followEdgeIds = useRef<Map<string, number>>(new Map());
  const blockEdgeIds = useRef<Map<string, number>>(new Map());

  // Hydrate from backend on mount
  useEffect(() => {
    if (!getAuthToken()) return;

    getFollowing()
      .then((edges) => {
        const users: SocialUser[] = [];
        edges.forEach((e) => {
          const user = followToSocialUser(e.followee, e.followee_username);
          users.push(user);
          followEdgeIds.current.set(user.id, e.id);
        });
        setFollowing(users);
      })
      .catch(() => {
        // Non-fatal — keep empty list
      });

    getBlocks()
      .then((edges) => {
        const users: SocialUser[] = [];
        edges.forEach((e) => {
          const user = blockToSocialUser(e.blocked, e.blocked_username);
          users.push(user);
          blockEdgeIds.current.set(user.id, e.id);
        });
        setBlockedUsers(users);
      })
      .catch(() => {
        // Non-fatal — keep empty list
      });
  }, []);

  // No "get my followers" backend endpoint yet — this will be empty until
  // that feature is built.
  const followers: SocialUser[] = [];

  // Suggested users from mock data, filtered to exclude already-followed and blocked.
  const suggestedUsers = useMemo(() => {
    const followingIds = new Set(following.map((u) => u.id));
    const blockedIds = new Set(blockedUsers.map((u) => u.id));
    return mockUsers.filter((u) => !followingIds.has(u.id) && !blockedIds.has(u.id));
  }, [following, blockedUsers]);

  const followUser = useCallback(async (user: SocialUser) => {
    if (followEdgeIds.current.has(user.id)) return;

    // Optimistic update
    setFollowing((prev) => [...prev, user]);

    const numericId = parseInt(user.id, 10);
    if (isNaN(numericId)) return; // mock user — optimistic only

    try {
      const edge = await createFollow(numericId);
      followEdgeIds.current.set(user.id, edge.id);
    } catch {
      // Revert
      setFollowing((prev) => prev.filter((u) => u.id !== user.id));
    }
  }, []);

  const unfollowUser = useCallback(async (userId: string) => {
    // Optimistic update
    setFollowing((prev) => prev.filter((u) => u.id !== userId));

    const edgeId = followEdgeIds.current.get(userId);
    if (edgeId == null) return; // no backend edge to delete

    try {
      await deleteFollow(edgeId);
      followEdgeIds.current.delete(userId);
    } catch {
      // Revert — re-add the user (we lost the SocialUser object so just refetch isn't possible here;
      // a page reload will restore state from backend)
    }
  }, []);

  const blockUser = useCallback(async (user: SocialUser) => {
    if (blockEdgeIds.current.has(user.id)) return;

    // Auto-unfollow when blocking
    await unfollowUser(user.id);

    // Optimistic update
    setBlockedUsers((prev) => [...prev, user]);

    const numericId = parseInt(user.id, 10);
    if (isNaN(numericId)) return; // mock user — optimistic only

    try {
      const edge = await createBlock(numericId);
      blockEdgeIds.current.set(user.id, edge.id);
    } catch {
      // Revert
      setBlockedUsers((prev) => prev.filter((u) => u.id !== user.id));
    }
  }, [unfollowUser]);

  const unblockUser = useCallback(async (userId: string) => {
    // Optimistic update
    setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));

    const edgeId = blockEdgeIds.current.get(userId);
    if (edgeId == null) return;

    try {
      await deleteBlock(edgeId);
      blockEdgeIds.current.delete(userId);
    } catch {
      // Non-fatal — state inconsistency resolved on next mount
    }
  }, []);

  const isFollowing = useCallback(
    (userId: string) => following.some((u) => u.id === userId),
    [following]
  );

  const isBlocked = useCallback(
    (userId: string) => blockedUsers.some((u) => u.id === userId),
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
