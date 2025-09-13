import { HerbIcon, SpoonIcon, SkilletIcon } from "./ui/CookingIcons";

export function HeroSection() {
  return (
    <section className="relative py-12 mb-8 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-4 left-8">
          <HerbIcon className="h-8 w-8 text-primary/20 rotate-12" />
        </div>
        <div className="absolute top-8 right-12">
          <SpoonIcon className="h-6 w-6 text-primary/20 -rotate-12" />
        </div>
        <div className="absolute bottom-6 left-16">
          <SkilletIcon className="h-7 w-7 text-primary/20 rotate-45" />
        </div>
        <div className="absolute bottom-8 right-8">
          <HerbIcon className="h-5 w-5 text-primary/20 -rotate-45" />
        </div>
      </div>

      <div className="relative text-center max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
          <HerbIcon className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            Fresh • Seasonal • Delicious
          </span>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
          Discover recipes that bring joy to your{" "}
          <span className="text-primary">kitchen</span>
        </h2>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          From farm-fresh ingredients to time-honored techniques, find recipes
          that match your taste, dietary needs, and cooking style. Every meal is
          a chance to nourish and delight.
        </p>
      </div>
    </section>
  );
}
