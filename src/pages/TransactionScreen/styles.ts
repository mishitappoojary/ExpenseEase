import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#284D63', // page background color
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    marginTop: 20,
    textAlign: 'center',
  },

  subheader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F0F8FF',
    marginBottom: 20,
    marginTop: 10,
    textAlign: 'center',
  },

  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
    color: '#000',
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  typeButton: {
    backgroundColor: '#3C6E71', // Default button color
    padding: 10,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  selectedTypeButton: {
    backgroundColor: '#00A8A1', // Highlighted button color
  },
  typeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  selectedTypeText: {
    fontWeight: 'bold',
  },
  categoryButton: {
    backgroundColor: '#3C6E71',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  categoryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#00A8A1', // Greenish button color
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 10,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionItem: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionDetails: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  leftCircle: {
    width: 35,
    height: 35,
    backgroundColor: '#fff',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  amountContainer: {
    marginTop: 5,
  },
  transactionAmount: {
    fontSize: 16,
    color: '#fff',
  },
  categoryContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    backgroundColor: '#3C6E71',
    borderRadius: 25,
  },
  categoryCircle: {
    width: 30,
    height: 30,
    backgroundColor: '#fff',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: {
    color: '#00A8A1',
  },
  transactionDate: {
    marginTop: 10,
    marginLeft: 10,
    color: '#fff',
  },
  emptyText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    marginTop: 50,
  },
  showMoreButton: {
    marginTop: 15,
    alignItems: 'center',
    padding: 10,
  },
  showMoreText: {
    color: '#fff',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
