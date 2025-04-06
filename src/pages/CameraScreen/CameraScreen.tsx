import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, Image, FlatList, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';

const CameraScreen: React.FC = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraRef, setCameraRef] = useState<Camera | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<{ id: number; amount: number; date: string }[]>([]); // Transaction list
  const [loading, setLoading] = useState<boolean>(false);
  const userId = 1; // Change this dynamically based on the logged-in user

  useEffect(() => {
    const requestCameraPermission = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    requestCameraPermission();
  }, []);

  const takePicture = async () => {
    if (cameraRef) {
      const photo = await cameraRef.takePictureAsync();
      const compressedPhoto = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 800 } }], // Resize for better OCR accuracy
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      setImageUri(compressedPhoto.uri);
      uploadReceipt(compressedPhoto.uri);
    }
  };

  const uploadReceipt = async (uri: string) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('image', {
      uri,
      name: 'receipt.jpg',
      type: 'image/jpeg',
    } as any);
    formData.append('user_id', userId.toString());

    try {
      const response = await fetch('http://127.0.0.1:8000/api/process-receipt/', {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = await response.json();
      setLoading(false);

      if (data.status === 'success') {
        setTransactions((prevTransactions) => [
          ...prevTransactions,
          { id: data.transaction.id, amount: data.transaction.amount, date: data.transaction.date },
        ]);
        Alert.alert('Success', `Transaction added: ₹${data.transaction.amount}`);
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      setLoading(false);
      console.error('Upload Error:', error);
      Alert.alert('Upload Failed', 'Could not process the receipt.');
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} ref={setCameraRef}>
        <View style={styles.buttonContainer}>
          <Button title="Take Picture" onPress={takePicture} color="#1E90FF" />
        </View>
      </Camera>

      {imageUri && <Image source={{ uri: imageUri }} style={styles.capturedImage} />}

      {loading && <Text style={styles.loadingText}>Processing receipt...</Text>}

      <View style={styles.transactionList}>
        <Text style={styles.transactionHeader}>Extracted Transactions:</Text>
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Text style={styles.transactionItem}>₹{item.amount.toFixed(2)} - {item.date}</Text>
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: 'center',
    bottom: 30,
    left: 20,
    position: 'absolute',
    right: 20,
  },
  camera: {
    flex: 1,
  },
  capturedImage: {
    height: 200,
    marginTop: 10,
    resizeMode: 'contain',
    width: '100%',
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    backgroundColor: '#f8f8f8',
    flex: 1,
  },
  loadingText: {
    color: '#1E90FF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  transactionHeader: {
    color: '#444',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  transactionItem: {
    color: '#222',
    fontSize: 12,
    paddingVertical: 5,
  },
  transactionList: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 3,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 10,
  },
});

export default CameraScreen;
