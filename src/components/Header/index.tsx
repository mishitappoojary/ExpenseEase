import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { ViewProps } from 'react-native';
import Text from '../Text';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from 'styled-components/native';
import {
  Actions,
  Container,
  TitleButton,
  UserIconContainer,
  DropdownMenu,
  DropdownItem,
} from './styles';

type Action = {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress?: () => void;
  onLongPress?: () => void;
  hidden?: boolean;
};

export interface HeaderProps extends ViewProps {
  userIcon?: keyof typeof MaterialIcons.glyphMap;
  title: string;
  titleIcon?: keyof typeof MaterialIcons.glyphMap;
  onTitlePress?: () => void;
  actions?: Action[];
  hideGoBackIcon?: boolean;
  userName?: string;
}

const Header: React.FC<HeaderProps> = ({
  userIcon,
  title,
  titleIcon,
  onTitlePress,
  actions,
  hideGoBackIcon,
  userName,
  ...viewProps
}) => {
  const [canGoBack, setCanGoBack] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const theme = useTheme();
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      setCanGoBack(navigation.canGoBack());
    }, [navigation])
  );

  const toggleUserDropdown = () => {
    setShowUserDropdown((prev) => !prev);
  };

  return (
    <Container {...viewProps}>
      {userIcon && (
        <UserIconContainer>
          <MaterialIcons name={userIcon} color={'white'} size={40} onPress={toggleUserDropdown} />
          {showUserDropdown && (
            <DropdownMenu>
              <DropdownItem>
                <Text style={{ fontWeight: 'bold', fontSize: 16, color: theme.colors.text }}>
                  Hi, {userName || 'User'} !!
                </Text>
              </DropdownItem>
              <DropdownItem>
                <Text style={{ color: theme.colors.text }}>BudBot</Text>
              </DropdownItem>
              <DropdownItem>
                <Text style={{ color: theme.colors.text }}>Budget</Text>
              </DropdownItem>
              <DropdownItem>
                <Text style={{ color: theme.colors.text }}>Graphs</Text>
              </DropdownItem>
              <DropdownItem onPress={() => navigation.navigate('goals')}>
                <Text style={{ color: theme.colors.text }}>Goals</Text>
              </DropdownItem>
              <DropdownItem onPress={() => navigation.navigate('addCategories')}>
                <Text style={{ color: theme.colors.text }}>Add Categories</Text>
              </DropdownItem>
            </DropdownMenu>
          )}
        </UserIconContainer>
      )}

      {!hideGoBackIcon && canGoBack && (
        <MaterialIcons
          name="navigate-before"
          color={theme.colors.secondary}
          size={32}
          onPress={() => navigation.goBack()}
        />
      )}

      {onTitlePress ? (
        <TitleButton onPress={onTitlePress}>
          <>
            <Text variant="heading" color="textWhite" transform="capitalize">
              {title}
            </Text>
            {titleIcon && (
              <MaterialIcons name={titleIcon} color={theme.colors.secondary} size={28} />
            )}
          </>
        </TitleButton>
      ) : (
        <Text
          style={{
            fontSize: 14,
            fontWeight: 'bold',
            color: theme.colors.textWhite,
          }}
        >
          {title}
        </Text>
      )}

      {actions && (
        <Actions>
          {actions
            .filter((action) => !action.hidden)
            .map((action, index) => (
              <MaterialIcons
                key={index}
                name={action.icon}
                color={theme.colors.textWhite}
                size={28}
                onPress={action.onPress}
                onLongPress={action.onLongPress}
              />
            ))}
        </Actions>
      )}
    </Container>
  );
};

export default Header;
