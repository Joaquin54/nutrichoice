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
    name: 'Mediterranean Quinoa Bowl',
    description: 'A fresh and healthy bowl packed with quinoa, roasted vegetables, and herbs.',
    image_1:mediteraneanquinoaImg,
    dietary_tags: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Low Carb'],
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
    name: 'Classic Spaghetti Carbonara',
    description: 'Traditional Italian pasta dish with eggs, cheese, and pancetta.',
    image_1:spaghetticarbonaraImg,
    dietary_tags: ['Italian'],
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
    name: 'Herb-Crusted Grilled Chicken',
    description: 'Juicy grilled chicken breast with a flavorful herb crust and fresh avocado.',
    image_1:'https://images.unsplash.com/photo-1744116432654-574391dbe3ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmlsbGVkJTIwY2hpY2tlbiUyMGF2b2NhZG8lMjBoZWFsdGh5fGVufDF8fHx8MTc1NzQ2NjU1NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    dietary_tags: ['Low Carb', 'Keto', 'Gluten-Free', 'Dairy-Free'],
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
    name: 'Baked Salmon with Lemon Herbs',
    description: 'Flaky salmon fillet baked with fresh herbs and lemon for a healthy dinner.',
    image_1:bakedsalmonImg,
    dietary_tags: ['Pescatarian', 'Low Carb', 'Keto', 'Gluten-Free', 'Dairy-Free'],
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
    id: '5',
    name: 'Mushroom Risotto',
    description: 'Creamy Arborio rice cooked with wild mushrooms and Parmesan cheese.',
    image_1:mushroomrisottoImg,
    dietary_tags: ['Vegetarian', 'Italian'],
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
    id: '6',
    name: 'Greek Salad Bowl',
    description: 'Fresh Mediterranean salad with feta cheese, olives, and a lemon-oregano dressing.',
    image_1:'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1080',
    dietary_tags: ['Vegetarian', 'Gluten-Free'],
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
    id: '7',
    name: 'Japanese Miso Ramen',
    description: 'Comforting Japanese noodle soup with miso broth, soft-boiled eggs, and vegetables.',
    image_1:'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1080',
    dietary_tags: ['Pescatarian'],
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
    id: '8',
    name: 'Chocolate Chip Banana Bread',
    description: 'Moist and tender banana bread loaded with chocolate chips - perfect for breakfast or snack.',
    image_1:chocolatebananaImg,
    dietary_tags: ['Vegetarian'],
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
    id: '9',
    name: 'Indian Butter Chicken',
    description: 'Creamy and flavorful Indian curry with tender chicken in a rich tomato-based sauce.',
    image_1:indianbutterchickenImg,
    dietary_tags: ['Gluten-Free'],
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
    id: '10',
    name: 'Avocado Toast with Poached Egg',
    description: 'Simple yet delicious breakfast featuring creamy avocado and perfectly poached egg on sourdough.',
    image_1:avocadotoastImg,
    dietary_tags: ['Vegetarian', 'Gluten-Free'],
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
  },
  {
    id: '11',
    name: 'Thai Green Curry',
    description: 'Aromatic and spicy Thai curry with vegetables and coconut milk.',
    image_1:'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=1080',
    dietary_tags: ['Vegetarian', 'Gluten-Free'],
    ingredients: [
      '2 tbsp green curry paste',
      '1 can coconut milk',
      '2 cups mixed vegetables',
      '1 tbsp fish sauce',
      '1 tsp sugar',
      'Thai basil leaves',
      'Jasmine rice for serving'
    ],
    instructions: [
      'Heat curry paste in a large pan until fragrant.',
      'Add coconut milk and bring to a simmer.',
      'Add vegetables and cook until tender.',
      'Season with fish sauce and sugar.',
      'Garnish with Thai basil and serve over rice.'
    ]
  },
  {
    id: '12',
    name: 'Beef Stir Fry',
    description: 'Quick and flavorful beef stir fry with fresh vegetables.',
    image_1:'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=1080',
    dietary_tags: ['Gluten-Free'],
    ingredients: [
      '1 lb beef sirloin, sliced',
      '2 bell peppers, sliced',
      '1 onion, sliced',
      '2 cloves garlic, minced',
      '2 tbsp soy sauce',
      '1 tbsp sesame oil',
      'Steamed rice for serving'
    ],
    instructions: [
      'Heat oil in a large wok or pan.',
      'Cook beef until browned, then remove.',
      'Stir fry vegetables until crisp-tender.',
      'Return beef to pan and add soy sauce.',
      'Serve hot over steamed rice.'
    ]
  },
  {
    id: '13',
    name: 'Caesar Salad',
    description: 'Classic Caesar salad with crisp romaine and homemade dressing.',
    image_1:'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=1080',
    dietary_tags: ['Vegetarian'],
    ingredients: [
      '2 heads romaine lettuce',
      '1/2 cup Parmesan cheese',
      'Croutons',
      'Caesar dressing',
      'Anchovy paste (optional)'
    ],
    instructions: [
      'Wash and chop romaine lettuce.',
      'Toss with Caesar dressing.',
      'Top with Parmesan cheese and croutons.',
      'Serve immediately.'
    ]
  },
  {
    id: '14',
    name: 'Chicken Tikka Masala',
    description: 'Creamy Indian curry with tender marinated chicken.',
    image_1:'https://images.unsplash.com/photo-1633945274309-2c16f968155f?w=1080',
    dietary_tags: ['Gluten-Free'],
    ingredients: [
      '2 lbs chicken breast, cubed',
      '1 cup heavy cream',
      '1 can tomato sauce',
      'Yogurt for marinating',
      'Garam masala',
      'Basmati rice for serving'
    ],
    instructions: [
      'Marinate chicken in yogurt and spices for 30 minutes.',
      'Grill or pan-fry chicken until cooked.',
      'Simmer tomato sauce with spices.',
      'Add cream and cooked chicken.',
      'Serve over basmati rice.'
    ]
  },
  {
    id: '15',
    name: 'Vegetable Lasagna',
    description: 'Layered pasta dish with vegetables and cheese.',
    image_1:'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=1080',
    dietary_tags: ['Vegetarian'],
    ingredients: [
      'Lasagna noodles',
      'Ricotta cheese',
      'Mozzarella cheese',
      'Parmesan cheese',
      'Mixed vegetables',
      'Marinara sauce'
    ],
    instructions: [
      'Cook lasagna noodles according to package.',
      'Layer noodles, vegetables, and cheese.',
      'Repeat layers and top with sauce and cheese.',
      'Bake at 375°F for 45 minutes.',
      'Let rest 10 minutes before serving.'
    ]
  },
  {
    id: '16',
    name: 'Shrimp Scampi',
    description: 'Garlicky shrimp with pasta in a white wine sauce.',
    image_1:'https://images.unsplash.com/photo-1559847844-5315695dadae?w=1080',
    dietary_tags: ['Pescatarian'],
    ingredients: [
      '1 lb large shrimp',
      'Linguine pasta',
      '4 cloves garlic',
      'White wine',
      'Lemon juice',
      'Butter and olive oil'
    ],
    instructions: [
      'Cook pasta according to package directions.',
      'Sauté garlic in butter and oil.',
      'Add shrimp and cook until pink.',
      'Deglaze with white wine and lemon juice.',
      'Toss with pasta and serve.'
    ]
  },
  {
    id: '17',
    name: 'Chicken Tacos',
    description: 'Seasoned chicken in warm tortillas with fresh toppings.',
    image_1:'https://images.unsplash.com/photo-1565299585323-38174c5e67e3?w=1080',
    dietary_tags: ['Gluten-Free'],
    ingredients: [
      '2 lbs chicken thighs',
      'Taco seasoning',
      'Corn tortillas',
      'Lettuce',
      'Tomatoes',
      'Cheese',
      'Sour cream'
    ],
    instructions: [
      'Season and cook chicken until done.',
      'Shred chicken.',
      'Warm tortillas.',
      'Fill tortillas with chicken and toppings.',
      'Serve immediately.'
    ]
  },
  {
    id: '18',
    name: 'Ramen Bowl',
    description: 'Comforting Japanese noodle soup with broth and toppings.',
    image_1:'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1080',
    dietary_tags: ['Pescatarian'],
    ingredients: [
      'Ramen noodles',
      'Pork or vegetable broth',
      'Soft-boiled eggs',
      'Green onions',
      'Nori sheets',
      'Soy sauce'
    ],
    instructions: [
      'Cook ramen noodles and set aside.',
      'Heat broth and season with soy sauce.',
      'Prepare soft-boiled eggs.',
      'Assemble bowls with noodles and broth.',
      'Top with eggs, green onions, and nori.'
    ]
  },
  {
    id: '19',
    name: 'Caprese Salad',
    description: 'Fresh Italian salad with tomatoes, mozzarella, and basil.',
    image_1:'https://images.unsplash.com/photo-1607532941433-304659e8198a?w=1080',
    dietary_tags: ['Vegetarian', 'Gluten-Free'],
    ingredients: [
      'Fresh mozzarella',
      'Ripe tomatoes',
      'Fresh basil',
      'Balsamic vinegar',
      'Olive oil',
      'Salt and pepper'
    ],
    instructions: [
      'Slice mozzarella and tomatoes.',
      'Alternate slices on a plate.',
      'Tuck basil leaves between slices.',
      'Drizzle with olive oil and balsamic.',
      'Season with salt and pepper.'
    ]
  },
  {
    id: '20',
    name: 'Beef Bourguignon',
    description: 'French stew with beef braised in red wine.',
    image_1:'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1080',
    dietary_tags: ['Gluten-Free'],
    ingredients: [
      '3 lbs beef chuck',
      'Red wine',
      'Carrots',
      'Onions',
      'Mushrooms',
      'Bacon',
      'Fresh herbs'
    ],
    instructions: [
      'Brown beef in a Dutch oven.',
      'Add wine and stock to cover.',
      'Add vegetables and herbs.',
      'Simmer for 2-3 hours until tender.',
      'Serve with crusty bread or potatoes.'
    ]
  }
];