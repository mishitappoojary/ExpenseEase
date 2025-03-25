import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, FlatList, Alert, Dimensions } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

const GoalsScreen = () => {
  const [goals, setGoals] = useState([]);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalIcon, setGoalIcon] = useState('star');
  const [goalBudget, setGoalBudget] = useState('');

  const availableIcons = [
    'star', 'beach-access', 'directions-car', 'bike-scooter', 'wallet-travel', 'flight-takeoff', 
    'money', 'home', 'shopping-cart', 'restaurant-menu', 'fitness-center', 'spa', 'favorite', 'attach-money'
  ];

  const addGoal = () => {
    if (!goalTitle || !goalBudget || !goalIcon) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    const newGoal = {
      id: Math.random().toString(),
      title: goalTitle,
      icon: goalIcon,
      budget: parseFloat(goalBudget),
      progress: 0,
    };

    setGoals([...goals, newGoal]);
    setGoalTitle('');
    setGoalIcon('star');
    setGoalBudget('');
  };

  const updateProgress = (goalId) => {
    const updatedGoals = goals.map((goal) => {
      if (goal.id === goalId) {
        const updatedProgress = Math.min(goal.progress + 100, goal.budget);
        return { ...goal, progress: updatedProgress };
      }
      return goal;
    });
    setGoals(updatedGoals);
  };

  const renderGoalCard = ({ item }) => (
    <View style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <Icon name={item.icon} size={30} color="#6200ea" />
        <Text style={styles.goalTitle}>{item.title}</Text>
      </View>
      <Text style={styles.goalProgressText}>
        Progress: {item.progress} / {item.budget}
      </Text>
      <ProgressBar progress={item.progress / item.budget} color="#6200ea" style={styles.progressBar} />
      <Button title="Add ₹100" onPress={() => updateProgress(item.id)} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Set Your Financial Goals</Text>
      <TextInput
        style={styles.input}
        placeholder="Goal Title"
        value={goalTitle}
        onChangeText={setGoalTitle}
      />
      <Text style={styles.iconLabel}>Select an Icon:</Text>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => {
          const currentIndex = availableIcons.indexOf(goalIcon);
          const nextIndex = (currentIndex + 1) % availableIcons.length;
          setGoalIcon(availableIcons[nextIndex]);
        }}
      >
        <Icon name={goalIcon} size={50} color="#6200ea" />
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="Budget Required"
        keyboardType="numeric"
        value={goalBudget}
        onChangeText={setGoalBudget}
      />
      <Button title="Add Goal" onPress={addGoal} />
      <FlatList
        data={goals}
        renderItem={renderGoalCard}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  iconLabel: {
    fontSize: 16,
    marginVertical: 10,
  },
  iconButton: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: '#6200ea',
    backgroundColor: '#fff',
    marginVertical: 10,
  },
  goalCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginVertical: 10,
    borderRadius: 10,
    width: Dimensions.get('window').width - 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  goalProgressText: {
    fontSize: 14,
    marginBottom: 10,
  },
  progressBar: {
    width: '100%',
    marginBottom: 10,
  },
});

export default GoalsScreen;
