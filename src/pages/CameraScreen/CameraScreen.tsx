import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, Image, FlatList } from 'react-native';
import { Camera } from 'expo-camera';
import Tesseract from 'tesseract.js';

const CameraScreen: React.FC = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraRef, setCameraRef] = useState<Camera | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string>('');
  const [transactions, setTransactions] = useState<number[]>([]); // Store extracted amounts

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
      setImageUri(photo.uri);
      recognizeText(photo.uri);
    }
  };

  const addTransaction = (amount: number) => {
    setTransactions((prevTransactions) => [...prevTransactions, amount]);
  };

  const recognizeText = async (uri: string) => {
    if (uri) {
      try {
        const {
          data: { text },
        } = await Tesseract.recognize(uri, 'eng', {
          logger: (info) => console.log(info), // Log progress
        });

        console.log('Extracted Text:', text);

        // Regex to extract the last occurring amount (handles ₹, $, €, and decimal numbers)
        const amountMatch = text.match(/(?:₹|\$|€)?\s?(\d{1,}[,.]?\d{0,2})/g);

        if (amountMatch) {
          const billAmount = parseFloat(
            amountMatch[amountMatch.length - 1].replace(',', ''),
          ); // Convert to number
          setOcrText(`Extracted Amount: ₹${billAmount.toFixed(2)}`);
          addTransaction(billAmount);
        } else {
          setOcrText('No amount found.');
        }
      } catch (error) {
        console.error('OCR error:', error);
        setOcrText('Error recognizing text');
      }
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

      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.capturedImage} />
      ) : null}


      <Text style={styles.ocrText}>
        {ocrText ? String(ocrText) : 'No text recognized yet.'}
      </Text>

      <View style={styles.transactionList}>
        <Text style={styles.transactionHeader}>Extracted Transactions:</Text>
        <FlatList
          data={transactions}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <Text style={styles.transactionItem}>₹{item.toFixed(2)}</Text>
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
  ocrText: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
    padding: 10,
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
