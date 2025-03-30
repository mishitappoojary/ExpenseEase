import { StyleSheet } from 'react-native';
import theme from '../../theme/common';

export const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: theme.colors.background, // ✅ Background color from theme
  },
  input: {
    borderColor: theme.colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
    marginBottom: 10,
    paddingHorizontal: 10,
    width: '100%',
    color: theme.colors.text, // ✅ Ensure input text is visible
  },
  logo: {
    height: 200,
    marginBottom: 20,
    width: 200,
  },
  signInButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    marginTop: 10,
    padding: 12,
    width: '100%',
  },
  signInButtonText: {
    color: '#FFFFFF', // ✅ Contrast color since textContrast is not defined
    fontSize: theme.text.title,
    fontFamily: theme.font.bold, // ✅ Using theme font
  },
  signUpButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    marginTop: 10,
    padding: 12,
    width: '100%',
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: theme.text.title,
    fontFamily: theme.font.bold,
  },
  signInLink: {
    marginTop: 15,
    color: "#007bff",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  title: {
    fontSize: theme.text.heading,
    fontFamily: theme.font.bold,
    color: theme.colors.text, // ✅ Text color from theme
  },
});
