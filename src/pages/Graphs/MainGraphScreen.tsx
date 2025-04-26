import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Footer from '../../components/Footer/Footer';
import TrendsScreen from './GraphScreen';  // Trends screen component
import SummaryScreen from './SummaryScreen';  // Summary screen component
import CategoryScreen from './CategoryScreen';  // Category screen component

const MainGraphScreen = () => {
  const [activeTab, setActiveTab] = useState('Trends');  // Default is Trends

  // Render the active screen based on the activeTab state
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'Summary':
        return <SummaryScreen />;
      case 'Category':
        return <CategoryScreen />;
      case 'Trends':
      default:
        return <TrendsScreen />;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.contentContainer}>
        {renderActiveTab()}
      </View>

      {/* Footer to navigate between tabs */}
      <Footer setActiveTab={setActiveTab} />
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MainGraphScreen;
