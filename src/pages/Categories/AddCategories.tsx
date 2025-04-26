import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScrollView } from 'react-native';

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

const AddCategories = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newIcon, setNewIcon] = useState('category');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const savedCategories = await AsyncStorage.getItem('categories');
      if (savedCategories) {
        const existingCategories = JSON.parse(savedCategories);
  
        // Merge default categories with saved ones, avoiding duplicates
        const mergedCategories = [...initialCategories, ...existingCategories.filter(
          (savedCategory) =>
            !initialCategories.some(
              (defaultCategory) => defaultCategory.name === savedCategory.name
            )
        )];
  
        setCategories(mergedCategories);
        await saveCategories(mergedCategories);
      } else {
        // Save initialCategories to AsyncStorage when there's no existing data
        setCategories(initialCategories);
        await saveCategories(initialCategories);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };
  
  

  const saveCategories = async (updatedCategories) => {
    try {
      await AsyncStorage.setItem('categories', JSON.stringify(updatedCategories));
    } catch (error) {
      console.error('Failed to save categories:', error);
    }
  };

  const handlePress = (categoryName: string) => {
    setSelectedCategory(categoryName);
  };

  const handleDelete = async () => {
    if (selectedCategory) {
      const updatedCategories = categories.filter(
        (category) => category.name !== selectedCategory
      );
      setCategories(updatedCategories);
      await saveCategories(updatedCategories);
      setSelectedCategory(null);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      Alert.alert('Invalid', 'Category name cannot be empty!');
      return;
    }

    if (categories.some((category) => category.name.toLowerCase() === newCategory.toLowerCase())) {
      Alert.alert('Duplicate', 'Category already exists!');
      return;
    }

    const newId = categories.length > 0 ? categories[categories.length - 1].id + 1 : 1;
    const newCategoryObj = {
      id: newId,
      name: newCategory.trim(),
      icon: newIcon,
    };

    const updatedCategories = [...categories, newCategoryObj];
    setCategories(updatedCategories);
    await saveCategories(updatedCategories);
    setNewCategory('');
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add Category</Text>
      <ScrollView contentContainerStyle={styles.grid}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.card}
            onPress={() => handlePress(category.name)}
          >
            <MaterialIcons name={category.icon as any} size={40} color="#0369A1" />
            <Text style={styles.cardText}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedCategory && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={true}
          onRequestClose={() => setSelectedCategory(null)}
        >
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setSelectedCategory(null)}
          >
            <View style={styles.modalContainer}>
              <Text style={styles.modalText}>
                Delete "{selectedCategory}"?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setSelectedCategory(null)} style={styles.cancelButton}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      <Modal
        transparent={true}
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackground}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>Add New Category</Text>
            <TextInput
              style={styles.input}
              placeholder="Category name"
              value={newCategory}
              onChangeText={setNewCategory}
            />
            <TouchableOpacity onPress={handleAddCategory} style={styles.addButton}>
              <MaterialIcons name="add-circle-outline" size={24} color="#fff" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
        <MaterialIcons name="add-circle-outline" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Add Category</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 50,
    backgroundColor: '#F9F9F9',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '45%',
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cardText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 40,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#0369A1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default AddCategories;
