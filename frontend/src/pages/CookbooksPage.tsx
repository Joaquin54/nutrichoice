import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCookbooks } from '../hooks/useCookbooks';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { CookbookRecipeSelector } from '../components/cookbook';
import { BookOpen, Plus, BookMarked, MoreVertical, Pencil, Trash2 } from 'lucide-react';

export function CookbooksPage() {
  const navigate = useNavigate();
  const { cookbooks, createCookbook, updateCookbook, deleteCookbook } = useCookbooks();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [addRecipesCookbookId, setAddRecipesCookbookId] = useState<string | null>(null);
  const [renameCookbookId, setRenameCookbookId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [renameDescription, setRenameDescription] = useState('');
  const [deleteCookbookId, setDeleteCookbookId] = useState<string | null>(null);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    const created = await createCookbook(name, newDescription.trim() || undefined);
    setNewName('');
    setNewDescription('');
    setIsCreateOpen(false);
    navigate(`/cookbooks/${created.id}`);
  };

  const openRename = (cb: { id: string; name: string; description?: string }) => {
    setRenameCookbookId(cb.id);
    setRenameName(cb.name);
    setRenameDescription(cb.description ?? '');
  };

  const handleRename = () => {
    if (!renameCookbookId || !renameName.trim()) return;
    updateCookbook(renameCookbookId, {
      name: renameName.trim(),
      description: renameDescription.trim() || undefined,
    });
    setRenameCookbookId(null);
    setRenameName('');
    setRenameDescription('');
  };

  const handleDelete = () => {
    if (!deleteCookbookId) return;
    deleteCookbook(deleteCookbookId);
    setDeleteCookbookId(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Cookbooks
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Create collections of recipes and flip through them like a real cookbook
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-[#6ec257] hover:bg-[#6ec257]/90 text-white shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Cookbook
        </Button>
      </div>

      {cookbooks.length === 0 ? (
        <Card className="border-dashed border-2 border-[#6ec257]/40 bg-[#6ec257]/5 dark:bg-[#6ec257]/10">
          <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <BookOpen className="h-16 w-16 text-[#6ec257]/60 mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No cookbooks yet
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
              Create your first cookbook, then add recipes from the Recipe Feed or Favorites. You can flip through it like a real book.
            </p>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-[#6ec257] hover:bg-[#6ec257]/90 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Cookbook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {cookbooks.map((cb) => (
            <Card
              key={cb.id}
              className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-[#6ec257]/40 group flex flex-col w-full max-w-[220px] mx-auto p-0"
            >
              {/* Closed book shape: spine + cover, all inside one card */}
              <div className="flex flex-1 min-h-[320px] rounded-lg overflow-hidden">
                {/* Spine (left edge of closed book) */}
                <div className="w-3 sm:w-4 shrink-0 bg-gradient-to-b from-amber-700 via-amber-800 to-amber-900 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900 shadow-[inset_2px_0_6px_rgba(0,0,0,0.15)]" />
                {/* Cover - contains menu, title, and Add recipes */}
                <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-[#fef9f0] to-amber-100/80 dark:from-stone-900 dark:to-stone-800/90 relative">
                  {/* 3-dot menu: top left */}
                  <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 rounded-full shadow border border-border text-muted-foreground hover:text-foreground bg-background/80"
                          aria-label="Cookbook options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-44 p-1 z-50" align="start" side="bottom">
                        <button
                          type="button"
                          className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                          onClick={() => openRename(cb)}
                        >
                          <Pencil className="h-4 w-4" />
                          Rename
                        </button>
                        <button
                          type="button"
                          className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => setDeleteCookbookId(cb.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </PopoverContent>
                    </Popover>
                  </div>
                  {/* Title + recipe count (clickable → open cookbook) */}
                  <Link
                    to={`/cookbooks/${cb.id}`}
                    className="flex-1 flex flex-col min-h-0 px-3 pt-12 pb-2 text-center"
                  >
                    <h3 className="font-serif font-semibold text-base text-gray-900 dark:text-white line-clamp-3 leading-tight">
                      {cb.name}
                    </h3>
                    <p className="mt-auto pt-3 text-xs text-muted-foreground">
                      {cb.recipeCount} recipe{cb.recipeCount !== 1 ? 's' : ''}
                    </p>
                  </Link>
                  {/* Add recipes: bottom of book */}
                  <div className="p-3 pt-0" onClick={(e) => e.preventDefault()}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-[#6ec257]/40 text-[#6ec257] hover:bg-[#6ec257]/10 hover:text-[#5ba045] text-xs"
                      onClick={(e) => {
                        e.preventDefault();
                        setAddRecipesCookbookId(cb.id);
                      }}
                    >
                      <BookMarked className="mr-1.5 h-3.5 w-3.5" />
                      Add recipes
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {addRecipesCookbookId && (() => {
        const cb = cookbooks.find((c) => c.id === addRecipesCookbookId);
        if (!cb) return null;
        return (
          <CookbookRecipeSelector
            cookbookId={cb.id}
            cookbookName={cb.name}
            onClose={() => setAddRecipesCookbookId(null)}
          />
        );
      })()}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Cookbook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cookbook-name">Name</Label>
              <Input
                id="cookbook-name"
                placeholder="e.g. Weeknight Dinners"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cookbook-desc">Description (optional)</Label>
              <Input
                id="cookbook-desc"
                placeholder="A few of my go-to recipes"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#6ec257] hover:bg-[#6ec257]/90 text-white"
              onClick={handleCreate}
              disabled={!newName.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renameCookbookId} onOpenChange={(open) => !open && setRenameCookbookId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename cookbook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rename-cookbook-name">Name</Label>
              <Input
                id="rename-cookbook-name"
                placeholder="e.g. Weeknight Dinners"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rename-cookbook-desc">Description (optional)</Label>
              <Input
                id="rename-cookbook-desc"
                placeholder="A few of my go-to recipes"
                value={renameDescription}
                onChange={(e) => setRenameDescription(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameCookbookId(null)}>
              Cancel
            </Button>
            <Button
              className="bg-[#6ec257] hover:bg-[#6ec257]/90 text-white"
              onClick={handleRename}
              disabled={!renameName.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteCookbookId} onOpenChange={(open) => !open && setDeleteCookbookId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete cookbook</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to delete this cookbook? This cannot be undone. Recipes in the cookbook will not be deleted.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCookbookId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
