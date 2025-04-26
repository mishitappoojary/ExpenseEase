import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const Footer = ({ setActiveTab, activeTab }) => {
  return (
    <View style={styles.container}>
      {['Trends', 'Summary', 'Category'].map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}  // Update the active tab when pressed
          style={[styles.button, activeTab === tab && styles.selectedButton]} // Add selectedButton style
        >
          <Text
            style={[
              styles.text,
              activeTab === tab ? styles.selectedText : styles.unselectedText, // Apply selected or unselected text color
            ]}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
  },
  button: {
    padding: 10,
  },
  text: {
    fontSize: 14,
  },
  selectedText: {
    color: 'blue', // Text color for the selected tab
  },
  unselectedText: {
    color: '#666', // Text color for unselected tabs
  },
  selectedButton: {
    borderTopWidth: 3,
    borderTopColor: 'blue', // Blue line on top of the selected button
  },
});

export default Footer;
