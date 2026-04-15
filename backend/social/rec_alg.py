from users.models import User
from models import TriedRecipe
from recipes.models import Recipe
from django.db.models import QuerySet
from users.models import User
from django.db.models import Count, BigAutoField


#HOW TO USE THIS CLASS
#
# First create a object of type dataConverter, and call recipesAndTriedRecipes
# Store this in a tuple (recipes, triedRecipes)
#
# Create an object of type recommendation_algorithm, with parameters (recipe currently being analzyed, recipes, triedRecipes)
# Call the similar recipes method with this object, which will then return in a list three most related recipes ids

#A tuple that represents a tried recipe relationship
class TriedRecipeTuple():
    def __init__(self, user, triedRecipe):
        self.user = user
        self.recipe = triedRecipe
    def __str__(self):
        return f"User: {self.user}, Recipe: {self.recipe}"
    
#Convert django querrysets into a usable format for Rec_alg
class dataConverter():
    def recipesAndTriedRecipes(self):
        return (self.__convertRecipes__, self.__convertTriedRecipes__)

    def __convertRecipes__(self):
        recipes = []

        rawRecipes = Recipe.objects.all().values("id")

        for eachRecipe in rawRecipes:
            id = eachRecipe.get("id", None)
            if(id):
                recipes.append(id)

        return recipes
    
    def __convertTriedRecipes__(self):

        triedRecipes = []

        rawTR = TriedRecipe.objects.all().values("recipe", "tried_by")

        for eachTR in rawTR:
            if(eachTR["recipe"] or eachTR["tried_by"] is None):
                pass
            newTuple = TriedRecipeTuple(eachTR["tried_by"], eachTR["RECIPE"])

            triedRecipes.append(newTuple)

        return triedRecipes
    
    def __countUsers__(self):

        return(len(User.objects.all()))
        

# This class will be used for easier interpration of the recommendation algorithm
# Rather than working with a 2D array, we will work with a 1D array of objects
# This class is exclusive to the recommendation algorithm
class RecipeTuple():
    def __init__(self, lift, recipe):
        self.lift = lift
        self.recipe = recipe

    def __str__(self):
        return f"Recipe: {self.recipe}, Lift: {self.lift}"
    
    def __gt__(self, tuple2):
        return self.lift > tuple2.lift

    def __ge__(self, tuple2):
        return self.lift >= tuple2.lift
    
    def __lt__(self, tuple2):
        return self.lift < tuple2.lift

    def __le__(self, tuple2):
        return self.lift <= tuple2.lift

    def __eq__(self, tuple2):
        return self.lift == tuple2.lift

    def __ne__(self, tuple2):
        return self.lift != tuple2.lift


#@param ID -> id of recipe
#@param triedRecipes -> List of Tuples, where each tuple contains a user and a recipe they have tried
#Ex: [(user1, "Burger"), (user1, "Fries"), (user2, "Salad")]
#@param recipes -> List of all recipes
class recommendation_algorithms():
    def __init__(self, id, triedRecipes, Recipes, UserCount):
        self.id = id
        self.triedRecipes = triedRecipes
        self.Recipes = Recipes
        self.UserCount = UserCount

    #Returns how many times each recipe has been tried
    def __getRecipeFreq__(self):

        #Dictionary that contains the frequency of each item
        freqDict = {}

        for eachTuple in self.triedRecipes:
            #Instantiate any recipes that haven't been added
            if(freqDict.get(eachTuple.recipe, 0) == 0):
                freqDict[eachTuple.recipe] = 0
            freqDict[eachTuple.recipe] += 1

        return freqDict


    #Determine how many times each recipe has been tried, but only for a subset of users that have tried the same given recipe
    def __getFreqForSubset__(self):

        userSubset = []
        freqDict = {}

        #Find each user who has tried the recipe
        for eachTuple in self.triedRecipes:
            if(eachTuple.recipe == self.id):
                userSubset.append(eachTuple.user)

        for eachTuple in self.triedRecipes:
            if eachTuple.user in userSubset:
                if(freqDict.get(eachTuple.recipe,0) == 0):
                    freqDict[eachTuple.recipe] = 0
                freqDict[eachTuple.recipe] += 1
        
        return freqDict, len(userSubset)
    
    def calculateLift(self, supportX, supportY, supportXandY):
        # Formula used is lift = supportX union Y / (supportX * supportY)
        # This informs the likelihood of the user wanting to try a certain recipe

        denominator = supportX * supportY

        if(denominator <= 0):
            return 0
        
        return supportXandY / denominator


    #Univerisal Set - everyone
    #Fries / Tried = 10%

    #Burger Subset -> Everyone who has tried burger
    #Fries / Tried = 50%

    #Will be used for "users also purchased"
    def findSimilarRecipes(self):

        RETURNED_RECIPES = 3

        freq = self.__getRecipeFreq__()
        
        freqOfSimilar,similarCount = self.__getFreqForSubset__()

        if(self.UserCount == 0):
            return None #Return no similar recipes if no users are registered
        
        if(similarCount == 0): 
            return None
        
        supportOfRecipe =  freq.get(self.id, 0) / self.UserCount

        similarRecipes = []
        # See RecipeTuples class for context

        smallestStoredLift = 0 #Of the top recipes, which is the least lift

        #Will loop through each recipe, and see if a given recipe is more popular amongst a given subset
        for eachRecipe in self.Recipes:

            if(eachRecipe == self.id):
                continue

            supportOfCurr = freq.get(eachRecipe, 0) / self.UserCount


            if(similarCount == 0): 
                continue

            subsetSupOfRecipe = freqOfSimilar.get(eachRecipe, 0) / similarCount

            currLift = self.calculateLift(supportOfRecipe, supportOfCurr, subsetSupOfRecipe)

            if(currLift > smallestStoredLift or len(similarRecipes) < RETURNED_RECIPES):
                currTuple = RecipeTuple(currLift, eachRecipe)
                smallestStoredLift = self.updateSimilarRecipes(similarRecipes, currTuple, RETURNED_RECIPES)

        return similarRecipes
    
    #Stores the top three recipes, replaces if a new top three recipe is found
    def updateSimilarRecipes(self, similarRecipes : list, newRecipe : RecipeTuple, RETURNED_RECIPES : int):

        if(len(similarRecipes) < RETURNED_RECIPES - 1):
            similarRecipes.append(newRecipe)
            return 0
        elif(len(similarRecipes) == RETURNED_RECIPES - 1):
            similarRecipes.append(newRecipe)
            return min(similarRecipes).lift
        
        minval = min(similarRecipes)

        idx = similarRecipes.index(minval)

        similarRecipes[idx] = newRecipe

        return min(similarRecipes).lift

        '''

        toReplace = smallestStoredLift #The previous smallest value, we want to replace this
        tempSmallest = newRecipe.lift

        #Iterates through similar recipes, replaces the smallest value with the new recipe, and determines the new smallest lift
        for i in range(len(similarRecipes)):

            item = similarRecipes[i]

            if item.lift > newRecipe.lift:
                continue
                
            elif item.lift == toReplace:
                similarRecipes[i] = newRecipe
                break

            elif item.lift < tempSmallest:
                tempSmallest = item.lift

       '''

        #return tempSmallest
        return 0
   
        #Count the frequencies of all tried recipes


        #From the given recipe, get all users who have also tried this recipe, and find the frequencies of all recipes
        #from this user subset. We will then compare this to the item frequncies for all users to see if there are any
        #statistical differences


    
