import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import type { Cookbook } from "../../types/recipe";

export interface AddToCookbookPopoverProps {
  cookbooks: Cookbook[];
  recipeId: string;
  onAdd: (recipeId: string, cookbookId: string) => void;
}

export function AddToCookbookPopover({
  cookbooks,
  recipeId,
  onAdd,
}: AddToCookbookPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="h-7 min-h-7 shrink-0 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#5ba045] sm:h-9 sm:min-h-9 sm:py-3 sm:text-base 2xl:text-lg w-full rounded-lg bg-[#6ec257]"
        >
          Add to Cookbook
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="center" side="top">
        <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
          Choose a cookbook
        </p>
        {cookbooks.length === 0 ? (
          <p className="px-2 py-2 text-xs text-muted-foreground">
            No cookbooks yet.{" "}
            <Link to="/cookbooks" className="text-[#6ec257] hover:underline">
              Create one
            </Link>
            .
          </p>
        ) : (
          <ul className="max-h-48 overflow-y-auto">
            {cookbooks.map((cb) => {
              const alreadyAdded = cb.recipeIds.includes(recipeId);
              return (
                <li key={cb.id}>
                  <button
                    type="button"
                    onClick={() =>
                      !alreadyAdded && onAdd(recipeId, cb.id)
                    }
                    disabled={alreadyAdded}
                    className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted disabled:cursor-default disabled:opacity-60"
                  >
                    {cb.name}
                    {alreadyAdded && (
                      <span className="ml-1 text-xs text-[#6ec257]">✓</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
