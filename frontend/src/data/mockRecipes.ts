   import { type Recipe } from '../types/recipe';

export const mockRecipes: Recipe[] = [
  {
    id: '1',
    title: 'Mediterranean Quinoa Bowl',
    description: 'A fresh and healthy bowl packed with quinoa, roasted vegetables, and herbs.',
    image: 'https://images.unsplash.com/photo-1605034298551-baacf17591d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwYm93bCUyMHZlZ2V0YWJsZXMlMjBjb29raW5nfGVufDF8fHx8MTc1NzQ2NjU0OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    cookTime: 30,
    servings: 4,
    difficulty: 'Easy',
    dietaryTags: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Low Carb'],
    ingredients: [
      '1 cup quinoa',
      '2 cups vegetable broth',
      '1 zucchini, diced',
      '1 bell pepper, diced',
      '1 cup cherry tomatoes',
      '1/2 red onion, sliced',
      '1/4 cup olive oil',
      '2 tbsp lemon juice',
      'Fresh herbs (basil, parsley)',
      'Salt and pepper to taste'
    ],
    instructions: [
      'Rinse quinoa and cook in vegetable broth for 15 minutes until fluffy.',
      'Preheat oven to 400°F (200°C).',
      'Toss vegetables with olive oil, salt, and pepper.',
      'Roast vegetables for 20-25 minutes until tender.',
      'Mix cooked quinoa with lemon juice and fresh herbs.',
      'Serve quinoa topped with roasted vegetables.'
    ]
  },
  {
    id: '2',
    title: 'Classic Spaghetti Carbonara',
    description: 'Traditional Italian pasta dish with eggs, cheese, and pancetta.',
    image: 'https://images.unsplash.com/photo-1591526376841-be96aa0b0881?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXN0YSUyMGl0YWxpYW4lMjBjb29raW5nJTIwZm9vZHxlbnwxfHx8fDE3NTc0NjY1NTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    cookTime: 20,
    servings: 4,
    difficulty: 'Medium',
    dietaryTags: ['Italian'],
    ingredients: [
      '400g spaghetti',
      '200g pancetta or guanciale',
      '4 large eggs',
      '100g Pecorino Romano cheese, grated',
      '2 cloves garlic',
      'Black pepper to taste',
      'Salt for pasta water'
    ],
    instructions: [
      'Bring a large pot of salted water to boil and cook spaghetti according to package directions.',
      'Cut pancetta into small pieces and cook in a large pan until crispy.',
      'Whisk eggs with grated cheese and black pepper in a bowl.',
      'Drain pasta, reserving 1 cup of pasta water.',
      'Add hot pasta to the pan with pancetta.',
      'Remove from heat and quickly mix in egg mixture, adding pasta water as needed.',
      'Serve immediately with extra cheese and black pepper.'
    ]
  },
  {
    id: '3',
    title: 'Herb-Crusted Grilled Chicken',
    description: 'Juicy grilled chicken breast with a flavorful herb crust and fresh avocado.',
    image: 'https://images.unsplash.com/photo-1744116432654-574391dbe3ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmlsbGVkJTIwY2hpY2tlbiUyMGF2b2NhZG8lMjBoZWFsdGh5fGVufDF8fHx8MTc1NzQ2NjU1NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    cookTime: 25,
    servings: 4,
    difficulty: 'Easy',
    dietaryTags: ['Low Carb', 'Keto', 'Gluten-Free', 'Dairy-Free'],
    ingredients: [
      '4 chicken breasts',
      '2 tbsp olive oil',
      '2 tbsp fresh rosemary, chopped',
      '2 tbsp fresh thyme, chopped',
      '2 tbsp fresh parsley, chopped',
      '3 cloves garlic, minced',
      '1 lemon, juiced',
      '2 avocados, sliced',
      'Salt and pepper to taste'
    ],
    instructions: [
      'Preheat grill to medium-high heat.',
      'Mix olive oil, herbs, garlic, lemon juice, salt, and pepper in a bowl.',
      'Pound chicken breasts to even thickness and marinate in herb mixture for 15 minutes.',
      'Grill chicken for 6-7 minutes per side until internal temperature reaches 165°F.',
      'Let chicken rest for 5 minutes before slicing.',
      'Serve with fresh avocado slices and a drizzle of remaining marinade.'
    ]
  },
  {
    id: '4',
    title: 'Vegan Buddha Bowl',
    description: 'Colorful plant-based bowl with roasted vegetables, chickpeas, and tahini dressing.',
    image: 'https://images.unsplash.com/photo-1528756976078-3e6b883f9e43?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb29raW5nJTIwaGVyYnMlMjBpbmdyZWRpZW50cyUyMHJ1c3RpY3xlbnwxfHx8fDE3NTc0NjY1NDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    cookTime: 35,
    servings: 2,
    difficulty: 'Easy',
    dietaryTags: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Dairy-Free'],
    ingredients: [
      '1 cup cooked quinoa',
      '1 can chickpeas, drained and rinsed',
      '1 sweet potato, cubed',
      '1 cup broccoli florets',
      '1 cup kale, massaged',
      '1/4 cup pumpkin seeds',
      '3 tbsp tahini',
      '2 tbsp lemon juice',
      '1 tbsp maple syrup',
      '2 tbsp olive oil',
      'Salt and pepper to taste'
    ],
    instructions: [
      'Preheat oven to 425°F (220°C).',
      'Toss sweet potato and chickpeas with olive oil, salt, and pepper.',
      'Roast for 20 minutes, then add broccoli and roast 10 more minutes.',
      'Massage kale with a little olive oil and salt.',
      'Make tahini dressing by whisking tahini, lemon juice, maple syrup, and water.',
      'Assemble bowls with quinoa, roasted vegetables, and massaged kale.',
      'Top with pumpkin seeds and drizzle with tahini dressing.'
    ]
  },
  {
    id: '5',
    title: 'Baked Salmon with Lemon Herbs',
    description: 'Flaky salmon fillet baked with fresh herbs and lemon for a healthy dinner.',
    image: 'https://images.unsplash.com/photo-1605034298551-baacf17591d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwYm93bCUyMHZlZ2V0YWJsZXMlMjBjb29raW5nfGVufDF8fHx8MTc1NzQ2NjU0OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    cookTime: 18,
    servings: 4,
    difficulty: 'Easy',
    dietaryTags: ['Pescatarian', 'Low Carb', 'Keto', 'Gluten-Free', 'Dairy-Free'],
    ingredients: [
      '4 salmon fillets',
      '2 lemons, sliced',
      '3 tbsp olive oil',
      '2 tbsp fresh dill',
      '2 tbsp fresh parsley',
      '3 cloves garlic, minced',
      'Salt and pepper to taste',
      'Asparagus for serving'
    ],
    instructions: [
      'Preheat oven to 400°F (200°C).',
      'Place salmon fillets on a baking sheet lined with parchment.',
      'Drizzle with olive oil and season with salt and pepper.',
      'Top with minced garlic, fresh herbs, and lemon slices.',
      'Bake for 12-15 minutes until salmon flakes easily.',
      'Serve immediately with roasted asparagus.'
    ]
  },
  {
    id: '6',
    title: 'Mushroom Risotto',
    description: 'Creamy Arborio rice cooked with wild mushrooms and Parmesan cheese.',
    image: 'https://images.unsplash.com/photo-1591526376841-be96aa0b0881?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXN0YSUyMGl0YWxpYW4lMjBjb29raW5nJTIwZm9vZHxlbnwxfHx8fDE3NTc0NjY1NTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    cookTime: 45,
    servings: 4,
    difficulty: 'Hard',
    dietaryTags: ['Vegetarian', 'Italian'],
    ingredients: [
      '1.5 cups Arborio rice',
      '4 cups warm vegetable broth',
      '200g mixed mushrooms, sliced',
      '1 onion, finely chopped',
      '3 cloves garlic, minced',
      '1/2 cup white wine',
      '1/2 cup Parmesan cheese, grated',
      '3 tbsp butter',
      '2 tbsp olive oil',
      'Fresh parsley for garnish'
    ],
    instructions: [
      'Heat olive oil in a large pan and sauté mushrooms until golden. Set aside.',
      'In the same pan, cook onion until translucent, add garlic.',
      'Add rice and stir for 2 minutes until lightly toasted.',
      'Pour in wine and stir until absorbed.',
      'Add warm broth one ladle at a time, stirring constantly.',
      'Continue for 18-20 minutes until rice is creamy and al dente.',
      'Stir in butter, Parmesan, and sautéed mushrooms.',
      'Garnish with fresh parsley and serve immediately.'
    ]
  }
];