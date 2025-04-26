import React from 'react';
import { ViewProps } from 'react-native';
import { useTheme } from 'styled-components/native';
import { useAppContext } from '../../contexts/AppContext';
import light from '../../theme/light';
import { BarContainer, Bar } from './styles';

export interface HorizontalBarProps extends ViewProps {
  color: keyof typeof light.colors;
  grow?: number;
  surplusGrow?: number;
}

const HorizontalBar: React.FC<HorizontalBarProps> = ({
  grow,
  color,
  surplusGrow,
  ...viewProps
}) => {
  const { hideValues } = useAppContext();

  const theme = useTheme();

  const barColor = hideValues ? theme.colors.lightGray : theme.colors[color];

  const containerGrow = hideValues ? 1 : grow || 1;

  const surplusBarGrow = hideValues || !surplusGrow ? 0 : surplusGrow;
  const mainBarGrow = 1 - surplusBarGrow;

  return (
    <BarContainer flexGrow={containerGrow} {...viewProps}>
      <Bar backgroundColor={barColor} flexGrow={mainBarGrow} />
      <Bar backgroundColor={theme?.colors?.error} flexGrow={surplusBarGrow} />
    </BarContainer>
  );
};

export default HorizontalBar;
