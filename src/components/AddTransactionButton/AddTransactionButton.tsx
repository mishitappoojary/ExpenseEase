import React, { useState } from 'react';
import { Camera } from 'expo-camera'; // Import camera functionality
import { useNavigation } from '@react-navigation/native';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Text,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const AddTransactionButton: React.FC = () => {
  // Initialize state with null, but expect it to later hold a boolean
  const [hasCameraPermission, setCameraPermission] = useState<boolean | null>(
    null,
  );
  const [isChecked, setIsChecked] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const navigation = useNavigation();

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === 'granted') {
      setCameraPermission(true);
      navigation.navigate('CameraScreen');
    } else {
      setCameraPermission(false);
      console.log('Camera permission not granted');
    }
  };
  const toggleMenu = () => {
    setIsChecked(!isChecked);
    Animated.timing(animation, {
      toValue: isChecked ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const iconStyle = (index: number) => {
    const translateY = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -60 * (index + 1)],
    });
    const opacity = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return {
      transform: [{ translateY }],
      opacity,
    };
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={toggleMenu}>
        <Text style={styles.addButtonText}>{'+'}</Text>
      </TouchableOpacity>
      {isChecked ? (
        <>
          <Animated.View style={[styles.iconContainer, iconStyle(0)]}>
            <TouchableOpacity onPress={requestCameraPermission}>
              <View style={styles.iconBackground}>
                <FontAwesome5 name="camera" size={20} color="#40BEBE" />
              </View>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View style={[styles.iconContainer, iconStyle(1)]}>
            <TouchableOpacity
              onPress={() => navigation.navigate('AddTransaction')}
            >
              <View style={styles.iconBackground}>
                <FontAwesome5 name="keyboard" size={20} color="#40BEBE" />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: '#40E0D0',
    borderRadius: 50,
    elevation: 5,
    padding: 15,
  },
  addButtonText: {
    color: '#40BEBE',
    fontSize: 24,
  },
  container: {
    alignItems: 'center',
    bottom: 50,
    position: 'absolute',
    right: 20,
  },
  iconBackground: {
    alignItems: 'center',
    backgroundColor: '#40BEBE',
    borderRadius: 50,
    justifyContent: 'center',
    padding: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'absolute',
    right: 0,
  },
});

export default AddTransactionButton;
