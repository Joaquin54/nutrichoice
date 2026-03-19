import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Search, UserPlus, UserMinus, UserX, UserCheck, Users, ShieldOff } from 'lucide-react';
import { useSocialActions } from '../../hooks/useSocialActions';
import type { SocialUser } from '../../data/mockUsers';

type SocialTab = 'followers' | 'following' | 'blocked';

interface SocialModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SocialTab;
}

function UserAvatar({ user }: { user: SocialUser }) {
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6ec257]/40 to-[#6ec257]/10 flex items-center justify-center shrink-0 border border-[#6ec257]/20">
      <span className="text-sm font-semibold text-[#6ec257]">
        {user.displayName.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

interface UserRowProps {
  user: SocialUser;
  actions: React.ReactNode;
}

function UserRow({ user, actions }: UserRowProps) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-1 rounded-lg hover:bg-muted/40 transition-colors group">
      <UserAvatar user={user} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {user.displayName}
        </p>
        <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
        {user.bio && (
          <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{user.bio}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">{actions}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground gap-3">
      <Icon className="h-10 w-10 opacity-20" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function SocialModal({ isOpen, onClose, initialTab = 'followers' }: SocialModalProps) {
  const { followers, following, blockedUsers, suggestedUsers, followUser, unfollowUser, blockUser, unblockUser, isFollowing } = useSocialActions();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<SocialTab>(initialTab);

  // Reset tab when modal opens with a new initial tab
  const handleOpenChange = (open: boolean) => {
    if (open) setActiveTab(initialTab);
    if (!open) {
      onClose();
      setSearch('');
    }
  };

  const filter = (users: SocialUser[]) => {
    const q = search.toLowerCase();
    if (!q) return users;
    return users.filter(
      u =>
        u.displayName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q)
    );
  };

  const filteredFollowers = useMemo(() => filter(followers), [followers, search]);
  const filteredFollowing = useMemo(() => filter(following), [following, search]);
  const filteredBlocked = useMemo(() => filter(blockedUsers), [blockedUsers, search]);
  const filteredSuggested = useMemo(() => filter(suggestedUsers), [suggestedUsers, search]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#6ec257]" />
            Social
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="px-5 pb-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={v => setActiveTab(v as SocialTab)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <TabsList className="mx-5 grid grid-cols-3 shrink-0">
            <TabsTrigger value="followers" className="text-xs gap-1">
              Followers
              <span className="text-muted-foreground">({followers.length})</span>
            </TabsTrigger>
            <TabsTrigger value="following" className="text-xs gap-1">
              Following
              <span className="text-muted-foreground">({following.length})</span>
            </TabsTrigger>
            <TabsTrigger value="blocked" className="text-xs gap-1">
              Blocked
              <span className="text-muted-foreground">({blockedUsers.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Followers */}
          <TabsContent value="followers" className="flex-1 overflow-y-auto px-5 mt-3 space-y-0">
            {filteredFollowers.length === 0 ? (
              <EmptyState icon={Users} message={search ? 'No results found' : 'No followers yet'} />
            ) : (
              <div>
                {filteredFollowers.map(user => (
                  <UserRow
                    key={user.id}
                    user={user}
                    actions={
                      <>
                        <Button
                          size="sm"
                          variant={isFollowing(user.id) ? 'outline' : 'default'}
                          onClick={() =>
                            isFollowing(user.id) ? unfollowUser(user.id) : followUser(user)
                          }
                          className={`h-7 text-xs gap-1 ${
                            isFollowing(user.id)
                              ? 'border-[#6ec257]/40 text-[#6ec257] hover:border-red-300 hover:text-red-500'
                              : 'bg-[#6ec257] hover:bg-[#5aad44] text-white'
                          }`}
                        >
                          {isFollowing(user.id) ? (
                            <>
                              <UserCheck className="h-3 w-3" />
                              Following
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-3 w-3" />
                              Follow
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => blockUser(user)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                          aria-label="Block user"
                        >
                          <UserX className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    }
                  />
                ))}
              </div>
            )}

            {/* Suggested users below followers */}
            {filteredSuggested.length > 0 && activeTab === 'followers' && (
              <div className="mt-4 mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Suggested
                </p>
                {filteredSuggested.map(user => (
                  <UserRow
                    key={user.id}
                    user={user}
                    actions={
                      <Button
                        size="sm"
                        onClick={() => followUser(user)}
                        className="h-7 text-xs gap-1 bg-[#6ec257] hover:bg-[#5aad44] text-white"
                      >
                        <UserPlus className="h-3 w-3" />
                        Follow
                      </Button>
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Following */}
          <TabsContent value="following" className="flex-1 overflow-y-auto px-5 mt-3">
            {filteredFollowing.length === 0 ? (
              <EmptyState
                icon={UserPlus}
                message={search ? 'No results found' : "You're not following anyone yet"}
              />
            ) : (
              <div>
                {filteredFollowing.map(user => (
                  <UserRow
                    key={user.id}
                    user={user}
                    actions={
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => unfollowUser(user.id)}
                          className="h-7 text-xs gap-1 border-[#6ec257]/40 text-[#6ec257] hover:border-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <UserMinus className="h-3 w-3" />
                          Unfollow
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => blockUser(user)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                          aria-label="Block user"
                        >
                          <UserX className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    }
                  />
                ))}
              </div>
            )}

            {/* Suggested in following tab if nothing following */}
            {following.length === 0 && filteredSuggested.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  People to follow
                </p>
                {filteredSuggested.map(user => (
                  <UserRow
                    key={user.id}
                    user={user}
                    actions={
                      <Button
                        size="sm"
                        onClick={() => followUser(user)}
                        className="h-7 text-xs gap-1 bg-[#6ec257] hover:bg-[#5aad44] text-white"
                      >
                        <UserPlus className="h-3 w-3" />
                        Follow
                      </Button>
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Blocked */}
          <TabsContent value="blocked" className="flex-1 overflow-y-auto px-5 mt-3 pb-5">
            {filteredBlocked.length === 0 ? (
              <EmptyState
                icon={ShieldOff}
                message={search ? 'No results found' : "You haven't blocked anyone"}
              />
            ) : (
              <div>
                {filteredBlocked.map(user => (
                  <UserRow
                    key={user.id}
                    user={user}
                    actions={
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => unblockUser(user.id)}
                        className="h-7 text-xs gap-1 border-muted-foreground/30 text-muted-foreground hover:text-[#6ec257] hover:border-[#6ec257]/40"
                      >
                        <ShieldOff className="h-3 w-3" />
                        Unblock
                      </Button>
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}