"use client"

import * as React from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Search, Utensils, Clock, DollarSign, Leaf, Users } from "lucide-react"
import { MealItem } from "./types"

interface MealSearchCommandProps {
  meals: MealItem[]
  onMealSelect: (meal: MealItem) => void
  categories: string[]
  selectedCategory?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MealSearchCommand({
  meals,
  onMealSelect,
  categories,
  selectedCategory,
  open,
  onOpenChange
}: MealSearchCommandProps) {
  const [searchValue, setSearchValue] = React.useState("")

  // Filter meals based on search and category
  const filteredMeals = React.useMemo(() => {
    let filtered = meals
    
    if (selectedCategory && selectedCategory !== "All") {
      filtered = filtered.filter(meal => meal.category === selectedCategory)
    }
    
    if (searchValue) {
      filtered = filtered.filter(meal =>
        meal.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        meal.description.toLowerCase().includes(searchValue.toLowerCase()) ||
        meal.ingredients.some(ingredient =>
          ingredient.toLowerCase().includes(searchValue.toLowerCase())
        )
      )
    }
    
    return filtered
  }, [meals, selectedCategory, searchValue])

  // Group meals by category for better organization
  const mealsByCategory = React.useMemo(() => {
    return filteredMeals.reduce((acc, meal) => {
      if (!acc[meal.category]) {
        acc[meal.category] = []
      }
      acc[meal.category].push(meal)
      return acc
    }, {} as Record<string, MealItem[]>)
  }, [filteredMeals])

  const handleMealSelect = (meal: MealItem) => {
    onMealSelect(meal)
    onOpenChange(false)
    setSearchValue("")
  }

  return (
    <Command className="rounded-lg border shadow-md" shouldFilter={false}>
      <CommandInput
        placeholder="Search meals, ingredients, or dietary preferences..."
        value={searchValue}
        onValueChange={setSearchValue}
        icon={Search}
        className="h-12"
      />
      <CommandList className="max-h-[400px]">
        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <Utensils className="h-8 w-8 text-muted-foreground/50" />
            <span>No meals found matching your search.</span>
            <span className="text-xs">Try different keywords or browse categories.</span>
          </div>
        </CommandEmpty>
        
        {Object.entries(mealsByCategory).map(([category, categoryMeals]) => (
          <CommandGroup key={category} heading={category} className="mb-2">
            {categoryMeals.map((meal) => (
              <CommandItem
                key={meal.id}
                onSelect={() => handleMealSelect(meal)}
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <Card className="w-full border-none shadow-none bg-transparent p-0">
                  <div className="flex items-start gap-3">
                    {/* Meal Image */}
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {meal.image ? (
                        <img
                          src={meal.image}
                          alt={meal.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Utensils className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      {/* Availability indicator */}
                      <div className={`absolute top-1 right-1 h-3 w-3 rounded-full ${
                        meal.available ? "bg-green-500" : "bg-red-500"
                      }`} />
                    </div>
                    
                    {/* Meal Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">{meal.name}</h4>
                        <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                          <DollarSign className="h-3 w-3" />
                          {meal.price}
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {meal.description}
                      </p>
                      
                      {/* Meal metadata badges */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {meal.preparationTime && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">
                            <Clock className="h-2.5 w-2.5 mr-1" />
                            {meal.preparationTime}min
                          </Badge>
                        )}
                        
                        {meal.nutritionInfo?.calories && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">
                            {meal.nutritionInfo.calories} cal
                          </Badge>
                        )}
                        
                        {meal.dietaryInfo?.vegetarian && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5 text-green-600">
                            <Leaf className="h-2.5 w-2.5 mr-1" />
                            Veg
                          </Badge>
                        )}
                        
                        {meal.servingSize && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">
                            <Users className="h-2.5 w-2.5 mr-1" />
                            {meal.servingSize}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  )
}

// Enhanced search with filters component
export function MealSearchWithFilters({
  meals,
  onMealSelect,
  categories
}: {
  meals: MealItem[]
  onMealSelect: (meal: MealItem) => void
  categories: string[]
}) {
  const [open, setOpen] = React.useState(false)
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All")

  return (
    <div className="space-y-4">
      {/* Quick category filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["All", ...categories].map((category) => (
          <Badge
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            className="cursor-pointer whitespace-nowrap px-3 py-1 text-xs"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Badge>
        ))}
      </div>
      
      {/* Search command */}
      <MealSearchCommand
        meals={meals}
        onMealSelect={onMealSelect}
        categories={categories}
        selectedCategory={selectedCategory}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  )
}