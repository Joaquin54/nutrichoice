import { useSocialActions } from '../../hooks/useSocialActions';
import { useRecipeActions } from '../../hooks/useRecipeActions';

type SocialTab = 'followers' | 'following' | 'blocked';

interface SocialStatsProps {
  onOpenTab: (tab: SocialTab) => void;
}

export function SocialStats({ onOpenTab }: SocialStatsProps) {
  const { followers, following } = useSocialActions();
  const { myRecipes } = useRecipeActions();

  const stats = [
    { label: 'Followers', count: followers.length, tab: 'followers' as SocialTab },
    { label: 'Following', count: following.length, tab: 'following' as SocialTab },
    { label: 'Recipes', count: myRecipes.length, tab: null },
  ];

  return (
    <div className="flex items-center gap-0 rounded-xl border bg-card overflow-hidden">
      {stats.map((stat, i) => (
        <div key={stat.label} className="flex-1 relative">
          {i > 0 && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-px bg-border" />
          )}
          {stat.tab ? (
            <button
              onClick={() => onOpenTab(stat.tab!)}
              className="w-full py-3 px-2 text-center hover:bg-muted/50 transition-colors group"
            >
              <div className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-[#6ec257] transition-colors">
                {stat.count}
              </div>
              <div className="text-xs text-muted-foreground group-hover:text-[#6ec257]/80 transition-colors">
                {stat.label}
              </div>
            </button>
          ) : (
            <div className="w-full py-3 px-2 text-center">
              <div className="text-xl font-bold text-gray-900 dark:text-white">{stat.count}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}