import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { CookbookBookshelf, CookbookRecipeSelector } from '../components/cookbook';
import { BookOpen, Plus } from 'lucide-react';

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
        <Card className="border-[#6ec257]/20 bg-gradient-to-b from-card to-muted/20 py-4 overflow-visible">
          <CardContent className="px-0 pb-0 pt-0">
            <p className="mb-3 px-6 text-sm text-muted-foreground">
              The first cookbook starts open. Hover another spine to switch the open book; it stays open
              when you move the pointer away. On touch, tap to toggle. Use the round arrows to open the
              previous or next cookbook. You can still scroll the shelf with a trackpad or by dragging.
              Press Escape to shelve the open book.
            </p>
            <CookbookBookshelf
              cookbooks={cookbooks}
              onAddRecipes={(id: string) => setAddRecipesCookbookId(id)}
              onRename={openRename}
              onDelete={(id: string) => setDeleteCookbookId(id)}
            />
          </CardContent>
        </Card>
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
