import styled from 'styled-components/native';
import Text from '../Text/index';

export const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => {
    // console.log('Theme in Container:', theme); // Debugging
    return theme?.colors?.primary || 'red'; // Default to 'red' for debugging
  }};
  align-items: center;
  justify-content: center;
`;

export const StatusText = styled(Text)`
  position: absolute;
  bottom: 64px;
  color: ${({ theme }) =>
    theme?.colors?.text || 'red'}; // Default color for debugging
`;
