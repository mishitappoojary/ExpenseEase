import * as FileSystem from 'expo-file-system';

const HF_TOKEN = process.env.EXPO_PUBLIC_HF_TOKEN;

export const extractTextFromImage = async (imageUri) => {
  try {
    // Read the image file and convert it to base64 format
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Call Hugging Face's API to extract text
    const response = await fetch(
      'https://api-inference.huggingface.co/models/gokaygokay/Florence-2',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: `data:image/jpeg;base64,${base64Image}` }),
      }
    );

    // Check for response errors
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    // Parse the result
    const result = await response.json();
    console.log('Extracted Text:', result);
    return result;
  } catch (error) {
    // Handle any errors that occur
    console.error('Error extracting text:', error);
    throw error;
  }
};
