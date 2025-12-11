import { type Recipe } from '../types/recipe';
import spaghetticarbonaraImg from './spaghetticarbonara.jpg';
import bakedsalmonImg from './bakedsalmon.jpg';
import mushroomrisottoImg from './mushroomrisotto.jpg';
import chocolatebananaImg from './chocolatebanana.jpg';
import indianbutterchickenImg from './indianbutterchicken.jpg';
import mediteraneanquinoaImg from './mediterraneanquinoa.jpg';
import avocadotoastImg from './avocadotoast.jpg';

export const mockRecipes: Recipe[] = [
  {
    id: '1',
    title: 'Mediterranean Quinoa Bowl',
    description: 'A fresh and healthy bowl packed with quinoa, roasted vegetables, and herbs.',
    image: mediteraneanquinoaImg,
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
    image: spaghetticarbonaraImg,
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
    id: '5',
    title: 'Baked Salmon with Lemon Herbs',
    description: 'Flaky salmon fillet baked with fresh herbs and lemon for a healthy dinner.',
    image: bakedsalmonImg,
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
    image: mushroomrisottoImg,
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
  },

  
  {
    id: '9',
    title: 'Greek Salad Bowl',
    description: 'Fresh Mediterranean salad with feta cheese, olives, and a lemon-oregano dressing.',
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1080',
    cookTime: 15,
    servings: 2,
    difficulty: 'Easy',
    dietaryTags: ['Vegetarian', 'Gluten-Free'],
    ingredients: [
      '2 cups mixed greens',
      '1 cucumber, diced',
      '2 tomatoes, chopped',
      '1/2 red onion, thinly sliced',
      '1/2 cup Kalamata olives',
      '1/2 cup feta cheese, crumbled',
      '3 tbsp olive oil',
      '2 tbsp lemon juice',
      '1 tsp dried oregano',
      'Salt and pepper to taste'
    ],
    instructions: [
      'Combine greens, cucumber, tomatoes, and red onion in a large bowl.',
      'Add olives and crumbled feta cheese.',
      'Whisk together olive oil, lemon juice, and oregano for dressing.',
      'Season dressing with salt and pepper.',
      'Toss salad with dressing and serve immediately.'
    ]
  },
  {
    id: '10',
    title: 'Japanese Miso Ramen',
    description: 'Comforting Japanese noodle soup with miso broth, soft-boiled eggs, and vegetables.',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1080',
    cookTime: 40,
    servings: 4,
    difficulty: 'Medium',
    dietaryTags: ['Pescatarian'],
    ingredients: [
      '4 servings ramen noodles',
      '4 cups chicken or vegetable broth',
      '3 tbsp miso paste',
      '2 soft-boiled eggs',
      '1 cup sliced mushrooms',
      '2 green onions, sliced',
      '1 sheet nori, cut into strips',
      '1 cup bean sprouts',
      '2 tbsp soy sauce',
      '1 tsp sesame oil'
    ],
    instructions: [
      'Cook ramen noodles according to package directions and set aside.',
      'Heat broth in a large pot and whisk in miso paste until dissolved.',
      'Add soy sauce and sesame oil to broth.',
      'Sauté mushrooms until tender.',
      'Divide noodles among bowls and top with hot broth.',
      'Add mushrooms, bean sprouts, green onions, and soft-boiled egg.',
      'Garnish with nori strips and serve hot.'
    ]
  },
  {
    id: '11',
    title: 'Chocolate Chip Banana Bread',
    description: 'Moist and tender banana bread loaded with chocolate chips - perfect for breakfast or snack.',
    image: chocolatebananaImg,
    cookTime: 60,
    servings: 10,
    difficulty: 'Easy',
    dietaryTags: ['Vegetarian'],
    ingredients: [
      '3 ripe bananas, mashed',
      '1/3 cup melted butter',
      '1 cup sugar',
      '1 egg, beaten',
      '1 tsp vanilla extract',
      '1 tsp baking soda',
      'Pinch of salt',
      '1.5 cups all-purpose flour',
      '1/2 cup chocolate chips'
    ],
    instructions: [
      'Preheat oven to 350°F (175°C) and grease a loaf pan.',
      'Mix mashed bananas with melted butter in a large bowl.',
      'Stir in sugar, egg, and vanilla extract.',
      'Add baking soda and salt, then mix in flour.',
      'Fold in chocolate chips.',
      'Pour batter into prepared pan and bake for 50-60 minutes.',
      'Cool in pan for 10 minutes before removing to wire rack.'
    ]
  },

  {
    id: '13',
    title: 'Indian Butter Chicken',
    description: 'Creamy and flavorful Indian curry with tender chicken in a rich tomato-based sauce.',
    image: indianbutterchickenImg,
    cookTime: 45,
    servings: 4,
    difficulty: 'Medium',
    dietaryTags: ['Gluten-Free'],
    ingredients: [
      '1.5 lbs chicken breast, cubed',
      '1 cup heavy cream',
      '1 can tomato sauce',
      '1 onion, diced',
      '3 cloves garlic, minced',
      '1 tbsp fresh ginger, grated',
      '2 tbsp butter',
      '1 tbsp garam masala',
      '1 tsp turmeric',
      '1 tsp cumin',
      'Basmati rice for serving'
    ],
    instructions: [
      'Marinate chicken with yogurt, garam masala, and salt for 30 minutes.',
      'Heat butter in a large pan and cook chicken until browned. Set aside.',
      'In same pan, sauté onion, garlic, and ginger until fragrant.',
      'Add spices and cook for 1 minute.',
      'Add tomato sauce and simmer for 10 minutes.',
      'Return chicken to pan and add cream.',
      'Simmer for 15 minutes until sauce thickens.',
      'Serve over basmati rice with naan bread.'
    ]
  },
  {
    id: '14',
    title: 'Avocado Toast with Poached Egg',
    description: 'Simple yet delicious breakfast featuring creamy avocado and perfectly poached egg on sourdough.',
    image: avocadotoastImg,
    cookTime: 10,
    servings: 2,
    difficulty: 'Easy',
    dietaryTags: ['Vegetarian', 'Gluten-Free'],
    ingredients: [
      '2 slices sourdough bread',
      '1 ripe avocado',
      '2 eggs',
      '1 tbsp lemon juice',
      'Red pepper flakes',
      'Salt and pepper to taste',
      'Fresh chives, chopped'
    ],
    instructions: [
      'Toast bread slices until golden brown.',
      'Mash avocado with lemon juice, salt, and pepper.',
      'Bring water to a gentle simmer and add vinegar.',
      'Crack eggs into small bowls and gently slide into water.',
      'Poach eggs for 3-4 minutes until whites are set.',
      'Spread mashed avocado on toast.',
      'Top with poached egg and garnish with chives and red pepper flakes.'
    ]
  }
];