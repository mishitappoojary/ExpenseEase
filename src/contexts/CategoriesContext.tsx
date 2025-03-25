import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialCategories = [
  { id: 1, name: 'Food', icon: 'restaurant' },
  { id: 2, name: 'Shopping', icon: 'shopping-cart' },
  { id: 3, name: 'Travel', icon: 'flight' },
  { id: 4, name: 'Health', icon: 'favorite' },
  { id: 5, name: 'Luxury', icon: 'attach-money' },
  { id: 6, name: 'Bills', icon: 'receipt' },
  { id: 7, name: 'Entertainment', icon: 'live-tv' },
  { id: 8, name: 'Stationary', icon: 'menu-book' },
  { id: 9, name: 'Education', icon: 'school' },
  { id: 10, name: 'Pets', icon: 'pets' },
  { id: 11, name: 'Fitness', icon: 'fitness-center' },
];

type Category = {
  id: number;
  name: string;
  icon: string;
};

type CategoriesContextType = {
  categories: Category[];
  addCategory: (name: string, icon: string) => void;
  deleteCategory: (name: string) => void;
};

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

export const useCategories = () => {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
};

export const CategoriesProvider = ({ children }: { children: React.ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const savedCategories = await AsyncStorage.getItem('categories');
      if (savedCategories) {
        const existingCategories = JSON.parse(savedCategories);
        const mergedCategories = [...initialCategories, ...existingCategories.filter(
          (savedCategory: Category) =>
            !initialCategories.some((defaultCategory) => defaultCategory.name === savedCategory.name)
        )];
        setCategories(mergedCategories);
        await saveCategories(mergedCategories);
      } else {
        setCategories(initialCategories);
        await saveCategories(initialCategories);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const saveCategories = async (updatedCategories: Category[]) => {
    try {
      await AsyncStorage.setItem('categories', JSON.stringify(updatedCategories));
    } catch (error) {
      console.error('Failed to save categories:', error);
    }
  };

  const addCategory = async (name: string, icon: string) => {
    if (categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('Category already exists');
    }

    const newCategory = {
      id: categories.length > 0 ? categories[categories.length - 1].id + 1 : 1,
      name,
      icon,
    };

    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    await saveCategories(updatedCategories);
  };

  const deleteCategory = async (name: string) => {
    const updatedCategories = categories.filter((category) => category.name !== name);
    setCategories(updatedCategories);
    await saveCategories(updatedCategories);
  };

  return (
    <CategoriesContext.Provider value={{ categories, addCategory, deleteCategory }}>
      {children}
    </CategoriesContext.Provider>
  );
};
