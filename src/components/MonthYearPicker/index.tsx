import { MaterialIcons } from '@expo/vector-icons';
import moment, { Moment } from 'moment';
import React, { useState } from 'react';
import { Modal, View } from 'react-native';
import { useTheme } from 'styled-components/native';
import Divider from '../Divider';
import Text from '../Text';
import {
  ActionButton,
  Card,
  Content,
  Header,
  MonthButton,
  Overlay,
} from './styles';

type MonthYearPickerProps = {
  isOpen: boolean;
  selectedDate: Moment;
  minimumDate: Moment;
  onChange?: (value: Moment) => void;
  onClose?: () => void;
};

const now = moment();

const currentMonthNumber = now.month() + 1;
const currentYearNumber = now.year();

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  isOpen,
  selectedDate,
  minimumDate,
  onChange,
  onClose,
}) => {
  const [displayedYear, setDisplayedYear] = useState(currentYearNumber);

  const theme = useTheme();

  const selectedMonth = selectedDate
    ? selectedDate.month() + 1
    : currentMonthNumber;
  const selectedYear = selectedDate ? selectedDate.year() : currentYearNumber;

  const minimumDateMonth = minimumDate ? minimumDate.month() + 1 : 1;
  const minimumDateYear = minimumDate ? minimumDate.year() : currentYearNumber;


  const prevYear = () => setDisplayedYear(displayedYear - 1);
  const nextYear = () => setDisplayedYear(displayedYear + 1);

  const handleMonthOnPress = (month: number) => {
    if (onChange) {
      const date = moment({ day: 1, month: month - 1, year: displayedYear });
      onChange(date);
    }
  };

  const handleModalOnClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const renderMonthItem = () => {
    return [...Array(12).keys()].map((i) => {
      const currentMonthIndex = i + 1;

      const isDisabled =
        (displayedYear >= currentYearNumber
          ? currentMonthIndex > currentMonthNumber
          : false) ||
        (displayedYear <= minimumDateYear
          ? currentMonthIndex < minimumDateMonth
          : false);

      const isSelected =
        displayedYear === selectedYear
          ? currentMonthIndex === selectedMonth
          : false;

      return (
        <MonthButton
          key={i}
          disabled={isDisabled}
          onPress={() => handleMonthOnPress(currentMonthIndex)}
          active={isSelected}
        >
          <Text variant="title" color="primary" transform="capitalize">
            {moment.monthsShort()[i]}
          </Text>
        </MonthButton>
      );
    });
  };

  return (
    <Modal
      animationType="fade"
      visible={isOpen}
      transparent={true}
      onRequestClose={handleModalOnClose}
    >
      <Overlay onPress={handleModalOnClose}>
        <Card
          style={{
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <Header>
            <ActionButton
              onPress={prevYear}
              disabled={displayedYear <= minimumDateYear}
            >
              <MaterialIcons
                name="navigate-before"
                size={32}
                color={theme.colors.secondary}
              />
            </ActionButton>
            <Text variant="heading" color="primary">
              {displayedYear}
            </Text>
            <ActionButton
              onPress={nextYear}
              disabled={displayedYear >= currentYearNumber}
            >
              <MaterialIcons
                name="navigate-next"
                size={32}
                color={theme.colors.secondary}
              />
            </ActionButton>
          </Header>
          <View>
            <Divider />
          </View>
          <Content>{renderMonthItem()}</Content>
        </Card>
      </Overlay>
    </Modal>
  );
};

export default MonthYearPicker;
