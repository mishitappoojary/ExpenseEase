import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  topContainer: {
    padding: 16,
  },
  balanceContainer: {
    marginTop: 16,
  },

  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },

  connectBankButton: {
    flexDirection: 'row',
    backgroundColor: '#40BEBE',
    paddingVertical: 6,
    paddingHorizontal: 12,
    top: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  
  connectBankText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 6,
  },

  horizontalBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceWithTrending: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overviewContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  addTransactionButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#40BEBE',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  PlaidActionsButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    backgroundColor: '#40BEBE',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  addTransactionText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
  },

  addButton: {
    backgroundColor: '#40E0D0',
    borderRadius: 50,
    elevation: 5,
    padding: 15,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 24,
  },
  container: {
    alignItems: 'center',
    bottom: 30,
    position: 'absolute',
    right: 20,
  },
  iconBackground: {
    alignItems: 'center',
    backgroundColor: '#40BEBE',
    borderRadius: 50,
    justifyContent: 'center',
    padding: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'absolute',
    right: 0,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  
  leftIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  
  transactionContent: {
    flex: 1,
  },
  
  bankLine: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  
  bankName: {
    color: '#333',
  },
  
  transactionText: {
    fontSize: 14,
    color: '#555',
  },
  
  transactionDate: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 2,
  },
  
  categoryCircle: {
    width: 36,
    height: 36,
    borderRadius: 50,
    backgroundColor: '#40BEBE',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  SMScontainer: {
    flex: 1,
    padding: 10,
  },
  
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 10,
    color: '#00A8A1',
  },
  
  reloadButton: {
    fontSize: 16,
    color: '#f5f5f5',
    fontWeight: 'bold',
    marginBottom: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  categoryText: {
    marginLeft: 10,
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 10,
    alignSelf: 'center',
  },
  cancelText: {
    color: '#F44336',
    fontSize: 16,
  },
  summaryContainer: {
    padding: 5,
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 20,
    marginBottom:10,
  },
  card: {
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
    opacity: 0.8,
  },
  moneyText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'right',
    paddingLeft: 10,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLogo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  chip: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  }
  
  
  
});