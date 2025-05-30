import React, { useContext, useState } from 'react';
import ScreenContainer from '../../components/ScreenContainer';
import Text from '../../components/Text';
import AppContext from '../../contexts/AppContext';
import { Item } from '../../services/pluggy';
import { BottomSheet, Button, StyledHeader, TextInput } from './styles';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';

const ManualConnect: React.FC = () => {
  const [id, setId] = useState('');

  const { storeItem } = useContext(AppContext);

  const navigation = useNavigation();

  const saveConnection = () => {
    try {
      storeItem({ id } as Item);
      Toast.show({ type: 'success', text1: 'Connection added successfully!' });
      navigation.navigate('connections');
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Unable to add connection!' });
    }
  };

  return (
    <ScreenContainer>
      <StyledHeader title="Manual connection" />
      <BottomSheet>
        <TextInput placeholder="Identificador" onChangeText={setId} value={id} />
        <Button onPress={saveConnection}>
          <Text variant="title" color="textWhite">
            To add
          </Text>
        </Button>
      </BottomSheet>
    </ScreenContainer>
  );
};

export default ManualConnect;
