import React, { useEffect, useRef, useState } from 'react';
import { Button, Text, View, Image, TouchableOpacity } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { extractTextFromImage } from '../../utils/ocr';

const CameraScreen = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setImageUri(photo.uri);
      await processImage(photo.uri);
    }
  };

  const processImage = async (uri: string) => {
    try {
      console.log('Captured Image URI:', uri);
      const text = await extractTextFromImage(uri);
      console.log('Extracted Text:', text);
      setExtractedText(text);
    } catch (error) {
      console.error('OCR Error:', error);
      setExtractedText('Failed to extract text');
    }
  };

  if (hasPermission === null) return <Text>Requesting permission...</Text>;
  if (hasPermission === false) return <Text>No access to camera</Text>;

  return (
    <View style={{ flex: 1 }}>
      {!imageUri ? (
        <>
          <Camera ref={cameraRef} style={{ flex: 1 }} type={CameraType.back} />
          <TouchableOpacity
            onPress={takePicture}
            style={{
              position: 'absolute',
              bottom: 20,
              alignSelf: 'center',
              backgroundColor: '#fff',
              padding: 10,
              borderRadius: 50,
            }}
          >
            <Text style={{ fontSize: 16 }}>📸 Capture</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Image source={{ uri: imageUri }} style={{ width: 300, height: 300, alignSelf: 'center' }} />
          <Text style={{ marginTop: 20, textAlign: 'center' }}>{extractedText || 'No text extracted'}</Text>
          <Button title="Take another" onPress={() => setImageUri(null)} />
        </>
      )}
    </View>
  );
};

export default CameraScreen;
