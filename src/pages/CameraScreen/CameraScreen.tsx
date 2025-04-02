import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import { useCategories } from '../../contexts/CategoriesContext';
import CategoryPicker from '../../components/Categories/CategoryPicker';

// Define the interface for receipt data
interface ReceiptData {
  business_name: string;
  total_amount: string;
  date: string;
  raw_text?: string[];
}

const CameraScreen: React.FC = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const { categories } = useCategories();

  const cameraRef = useRef<Camera | null>(null);

  // Django backend API URL - update with your actual server URL
  const API_URL = 'http://192.168.0.103:8000/api/process-receipt/';

  useEffect(() => {
    console.log("Updated Categories:", categories);
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      console.log('Camera permission status:', status);
    })();
  }, []);

  const onCameraReady = () => {
    setIsCameraReady(true);
    console.log('Camera is ready');
  };

  const takePicture = async () => {
    if (cameraRef.current && isCameraReady) {
      try {
        console.log('Taking picture...');
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        console.log('Picture taken:', photo.uri);
        setCapturedImage(photo.uri);
        processImage(photo);
      } catch (error) {
        console.error('Failed to take picture:', error);
        Alert.alert('Error', 'Failed to capture image');
      }
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
      processImage({ uri: result.assets[0].uri });
    }
  };


  const processImage = async (photo: any) => {
    setIsProcessing(true);
    console.log('📷 Image captured, preparing to send...');
  
    const startTime = Date.now();  // Start timer
  
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'receipt.jpg',
      } as any);
  
      console.log('🚀 Sending image to API...');
      
      const response = await axios.post(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
  
      const endTime = Date.now();  // End timer
      console.log("✅ Response received in", (endTime - startTime) / 1000, "seconds");
  
      setReceiptData(response.data);
    } catch (error) {
      console.error('❌ Error processing image:', error);
      Alert.alert('Error', 'Failed to process receipt. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  

  const resetCamera = () => {
    console.log('Resetting camera');
    setCapturedImage(null);
    setReceiptData(null);
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }
  
  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to camera. Please grant permission.</Text></View>;
  }

  const handleInputChange = (key: keyof ReceiptData, value: string) => {
    setReceiptData((prevData) =>
      prevData ? { ...prevData, [key]: value } : prevData
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {!capturedImage ? (
        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={Camera.Constants.Type.back}
            onCameraReady={onCameraReady}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
              disabled={!isCameraReady}
            >
              <MaterialIcons name="camera" size={36} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
              <Ionicons name="image" size={36} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          
          {isProcessing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text style={styles.loadingText}>Processing receipt...</Text>
            </View>
          ) : receiptData ? (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>Receipt Details</Text>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Business:</Text>
                <View style={styles.inputBox}>
                <TextInput
                  style={styles.resultValue}
                  value={receiptData.business_name}
                  onChangeText={(text) => handleInputChange('business_name', text)}
                />
                </View>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Amount:</Text>
                <View style={styles.inputBox}>
                <TextInput
                  style={styles.resultValue}
                  value={receiptData.total_amount}
                  onChangeText={(text) => handleInputChange('total_amount', text)}
                />
                </View>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Date:</Text>
                <Text style={styles.resultValue}>{receiptData.date}</Text>
              </View>

              <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Categories:</Text>
              <TouchableOpacity style={styles.button} onPress={() => setPickerVisible(true)}>
                {selectedCategory ? (
                  <View style={styles.selectedCategory}>
                    <MaterialIcons name={selectedCategory.icon} size={24} color="white" />
                    <Text style={styles.buttonText}>{selectedCategory.name}</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Select Category</Text>
                )}
              </TouchableOpacity>

                <CategoryPicker
                  visible={pickerVisible}
                  onClose={() => setPickerVisible(false)}
                  onSelect={(category) => setSelectedCategory(category)}
                />
              </View>
              
              {/* <TouchableOpacity style={styles.scanAgainButton} onPress={resetCamera}>
                <Text style={styles.scanAgainText}>Scan Another Receipt</Text>
              </TouchableOpacity> */}
              <TouchableOpacity 
                style={styles.AddButton} 
                onPress={() => {
                  console.log("📌 Business Name:", receiptData?.business_name);
                  console.log("💰 Amount:", receiptData?.total_amount);
                  console.log("📅 Date:", receiptData?.date);
                  console.log("🏷️ Selected Category:", selectedCategory ? selectedCategory.name : "None");
                  resetCamera();
                }}
              >
                <Text style={styles.scanAgainText}>Add Transaction</Text>
              </TouchableOpacity>

            </View>
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  uploadButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4CAF50',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },

  previewContainer: {
    flex: 1,
  },
  previewImage: {
    width: '100%',
    height: '50%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  resultsContainer: {
    flex: 1,
    padding: 20,
    flexGrow: 1,
    minHeight: '100%',
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  resultItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  resultLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    width: 100,
  },
  resultValue: {
    fontSize: 15,
    flex: 1,
  },
  scanAgainButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },

  AddButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },

  scanAgainText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  
  inputBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Ensures input is tappable
  },
  button: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#3498db', borderRadius: 5 },
  buttonText: { color: 'white', fontSize: 15, marginLeft:10 },
  selectedCategory: { flexDirection: 'row', alignItems: 'center' },
  
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30, // Ensures bottom elements are accessible
  },

});

export default CameraScreen;