import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Modal } from 'react-native';
import { Container, StatusText } from './styles';

interface LoadingModalProps {
  text?: string;
}

const LoadingModal: React.FC<LoadingModalProps> = ({ text }) => {
  const anim = useRef(new Animated.Value(1));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(anim.current, {
          toValue: 1.25,
          duration: 1000,
          easing: Easing.back(0.5),
          useNativeDriver: true,
        }),
        Animated.timing(anim.current, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop(); // Cleanup on unmount
  }, []);

  return (
    <Modal visible animationType="fade" transparent>
      <Container>
        <Animated.View style={{ transform: [{ scale: anim.current }] }}>
          <Image
            // source={require('../../assets/adaptive-icon.png')}
            source={require('../../assets/adaptive-icon2.jpg')}
            style={{ height: 180, width: 180 }}
          />
        </Animated.View>
        {text ? (
          <StatusText
            style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}
          >
            {text}
          </StatusText>
        ) : null}
      </Container>
    </Modal>
  );
};

export default LoadingModal;
