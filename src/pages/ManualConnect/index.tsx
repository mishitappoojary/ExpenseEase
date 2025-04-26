import React, { useState } from 'react';
import ScreenContainer from '../../components/ScreenContainer';
import Text from '../../components/Text';
import { BottomSheet, Button, StyledHeader, TextInput } from './styles';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import plaidApi from '../../services/pluggy/apiAdapter';

const ManualConnect: React.FC = () => {
  const [id, setId] = useState('');
  const navigation = useNavigation();

  const saveConnection = async () => {
    if (!id) {
      Toast.show({ type: 'error', text1: 'Please enter a valid identifier!' });
      return;
    }

    try {
      const response = await plaidApi.exchangePublicToken(id);
      if (response.access_token) {
        Toast.show({
          type: 'success',
          text1: 'Bank account connected successfully!',
        });
        navigation.navigate('connections');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error connecting account:', error);
      Toast.show({ type: 'error', text1: 'Unable to connect account!' });
    }
  };

  return (
    <ScreenContainer>
      <StyledHeader title="Manual Connection" />
      <BottomSheet>
        <TextInput
          placeholder="Enter Public Token"
          onChangeText={setId}
          value={id}
        />
        <Button onPress={saveConnection}>
          <Text variant="title" color="textWhite">
            Connect Account
          </Text>
        </Button>
      </BottomSheet>
    </ScreenContainer>
  );
};

export default ManualConnect;
