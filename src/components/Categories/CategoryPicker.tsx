import React from 'react';
import { Modal, View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useCategories } from '../../contexts/CategoriesContext';

const CategoryPicker = ({ visible, onClose, onSelect }) => {
  const { categories } = useCategories();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Select a Category</Text>

          <FlatList
            data={categories}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <MaterialIcons name={item.icon as any} size={40} color="#0369A1" />
                <Text style={styles.itemText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  container: { backgroundColor: 'white', width: '80%', borderRadius: 10, padding: 20, maxHeight: '80%' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  itemText: { fontSize: 16, marginLeft: 10 },
  closeButton: { marginTop: 10, alignSelf: 'center', padding: 10 },
  closeText: { color: 'red', fontSize: 16 },
});

export default CategoryPicker;
