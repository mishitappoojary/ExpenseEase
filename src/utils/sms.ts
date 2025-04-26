import { PermissionsAndroid } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import {categorizeSMS} from './category';

export const requestSmsPermission = async () => {
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.READ_SMS,
    {
      title: 'SMS Permission',
      message: 'This app needs access to read your bank transaction SMS.',
      buttonPositive: 'OK',
    }
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

export const reloadMessages = async (latestTimestampRef, transactions, setTransactions, parseBankSMS) => {
  console.log("🔁 Reloading messages from timestamp:", latestTimestampRef.current);
  SmsAndroid.list(
    JSON.stringify({
      box: 'inbox',
      maxCount: 1000,
      minDate: latestTimestampRef.current || 0,
    }),
    (fail) => {
      console.log('SMS fetch failed:', fail);
    },
    (count, smsList) => {
      const parsed = JSON.parse(smsList);
      const filtered = parsed.filter(
        (msg) =>
          msg.address &&
          (msg.address.toUpperCase().includes('SBIUPI') || msg.address.toUpperCase().includes('HDFCBK'))
      );

      console.log(`📬 Filtered ${filtered.length} relevant messages`);

      const uniqueRefs = new Set(transactions.map((tx) => tx.refNumber));
      const newMessages = [];

      filtered.forEach((msg) => {
        console.log('💬 SMS BODY:', msg.body, '| DATE:', msg.date);
        const cleaned = parseBankSMS(msg);
        if (cleaned && !uniqueRefs.has(cleaned.refNumber)) {
          uniqueRefs.add(cleaned.refNumber);
          newMessages.push(cleaned);
        }
      });

      if (newMessages.length > 0) {
        const newestTimestamp = Math.max(...filtered.map((msg) => msg.date));
        latestTimestampRef.current = Math.max(latestTimestampRef.current, newestTimestamp);
        setTransactions((prev) => [...newMessages, ...prev]);
      }
    }
  );
};

export const parseBankSMS = (msg) => {
  const { body, address, date } = msg;
  const upperAddr = address.toUpperCase();
  const lowerBody = body.toLowerCase();

  if (upperAddr.includes('SBI')) {
    const creditMatch = body.match(/credited by Rs\.?(\d+(\.\d+)?)/i);
    const debitMatch = body.match(/debited by (\d+(\.\d+)?)/i);
    const merchantMatch = body.match(/(?:trf|transfer) (?:to|from) (.+?) Ref(?: No)?/i);
    const refMatch = body.match(/Ref(?: No)?[ :]?(\d+)/i) || body.match(/Refno (\d+)/i);

    if ((creditMatch || debitMatch) && merchantMatch && refMatch) {
      const amount = parseFloat((creditMatch || debitMatch)[1]);
      return {
        bank: 'SBI',
        amount,
        type: creditMatch ? 'credit' : 'debit',
        merchant: merchantMatch[1].trim(),
        refNumber: refMatch[1],
        timestamp: date,
      };
    }
  }

  if (upperAddr.includes('HDFC')) {
    const creditMatch = body.match(/Received Rs\.?(\d+(\.\d+)?)/i);
    const debitMatch = body.match(/Sent Rs\.?(\d+(\.\d+)?)/i);
    const merchantMatch = body.match(/(?:to|from) ([^\n]+?)(?:\n| on)/i);
    const refMatch = body.match(/Ref[: ](\d+)/i);

    if ((creditMatch || debitMatch) && merchantMatch && refMatch) {
      const amount = parseFloat((creditMatch || debitMatch)[1]);
      return {
        bank: 'HDFC',
        amount,
        type: creditMatch ? 'credit' : 'debit',
        merchant: merchantMatch[1].trim(),
        refNumber: refMatch[1],
        timestamp: date,
      };
    }
  }

  if (upperAddr.includes('KOTAK')) {
    const creditMatch = body.match(/Received Rs\.?(\d+(\.\d+)?)/i);
    const debitMatch = body.match(/Sent Rs\.?(\d+(\.\d+)?)/i);
    const merchantMatch = body.match(/(?:from|to) ([^\n]+?) on/i);
    const refMatch = body.match(/Ref[: ]?(\d+)/i);

    if ((creditMatch || debitMatch) && merchantMatch && refMatch) {
      const amount = parseFloat((creditMatch || debitMatch)[1]);
      return {
        bank: 'KOTAK',
        amount,
        type: creditMatch ? 'credit' : 'debit',
        merchant: merchantMatch[1].trim(),
        refNumber: refMatch[1],
        timestamp: date,
      };
    }
  }

   // ICICI
   if (upperAddr.includes('ICICI')) {
    const creditMatch = body.match(/credited with Rs\.?(\d+(\.\d+)?)/i);
    const debitMatch = body.match(/debited with Rs\.?(\d+(\.\d+)?)/i);
    const merchantMatch = body.match(/(?:to|from) ([^\n]+?) Ref/i);
    const refMatch = body.match(/Ref[: ]?(\d+)/i);

    if ((creditMatch || debitMatch) && merchantMatch && refMatch) {
      const amount = parseFloat((creditMatch || debitMatch)[1]);
      return {
        bank: 'ICICI',
        amount,
        type: creditMatch ? 'credit' : 'debit',
        merchant: merchantMatch[1].trim(),
        refNumber: refMatch[1],
        timestamp: date,
      };
    }
  }

  // AXIS
  if (upperAddr.includes('AXIS')) {
    const creditMatch = body.match(/credited with Rs\.?(\d+(\.\d+)?)/i);
    const debitMatch = body.match(/debited with Rs\.?(\d+(\.\d+)?)/i);
    const merchantMatch = body.match(/(?:to|from) ([^\n]+?) Ref/i);
    const refMatch = body.match(/Ref[: ]?(\d+)/i);

    if ((creditMatch || debitMatch) && merchantMatch && refMatch) {
      const amount = parseFloat((creditMatch || debitMatch)[1]);
      return {
        bank: 'AXIS',
        amount,
        type: creditMatch ? 'credit' : 'debit',
        merchant: merchantMatch[1].trim(),
        refNumber: refMatch[1],
        timestamp: date,
      };
    }
  }

  // YES BANK
  if (upperAddr.includes('YESBANK')) {
    const creditMatch = body.match(/credited with Rs\.?(\d+(\.\d+)?)/i);
    const debitMatch = body.match(/debited with Rs\.?(\d+(\.\d+)?)/i);
    const merchantMatch = body.match(/(?:to|from) ([^\n]+?) Ref/i);
    const refMatch = body.match(/Ref[: ]?(\d+)/i);

    if ((creditMatch || debitMatch) && merchantMatch && refMatch) {
      const amount = parseFloat((creditMatch || debitMatch)[1]);
      return {
        bank: 'YES BANK',
        amount,
        type: creditMatch ? 'credit' : 'debit',
        merchant: merchantMatch[1].trim(),
        refNumber: refMatch[1],
        timestamp: date,
      };
    }
  }

  // PNB
  if (upperAddr.includes('PNB')) {
    const creditMatch = body.match(/credited with Rs\.?(\d+(\.\d+)?)/i);
    const debitMatch = body.match(/debited with Rs\.?(\d+(\.\d+)?)/i);
    const merchantMatch = body.match(/(?:to|from) ([^\n]+?) Ref/i);
    const refMatch = body.match(/Ref[: ]?(\d+)/i);

    if ((creditMatch || debitMatch) && merchantMatch && refMatch) {
      const amount = parseFloat((creditMatch || debitMatch)[1]);
      return {
        bank: 'PNB',
        amount,
        type: creditMatch ? 'credit' : 'debit',
        merchant: merchantMatch[1].trim(),
        refNumber: refMatch[1],
        timestamp: date,
      };
    }
  }

  // BANK OF BARODA
  if (upperAddr.includes('BARODA')) {
    const creditMatch = body.match(/credited with Rs\.?(\d+(\.\d+)?)/i);
    const debitMatch = body.match(/debited with Rs\.?(\d+(\.\d+)?)/i);
    const merchantMatch = body.match(/(?:to|from) ([^\n]+?) Ref/i);
    const refMatch = body.match(/Ref[: ]?(\d+)/i);

    if ((creditMatch || debitMatch) && merchantMatch && refMatch) {
      const amount = parseFloat((creditMatch || debitMatch)[1]);
      return {
        bank: 'Bank of Baroda',
        amount,
        type: creditMatch ? 'credit' : 'debit',
        merchant: merchantMatch[1].trim(),
        refNumber: refMatch[1],
        timestamp: date,
      };
    }
  }

  // UNION BANK
  if (upperAddr.includes('UNION')) {
    const creditMatch = body.match(/Rs\.?(\d+(\.\d+)?) credited/i);
    const debitMatch = body.match(/Rs\.?(\d+(\.\d+)?) debited/i);
    const merchantMatch = body.match(/(?:to|from) ([^\n]+?) on/i);
    const refMatch = body.match(/Ref(?: No)?[ :]?(\d+)/i);

    if ((creditMatch || debitMatch) && merchantMatch && refMatch) {
      const amount = parseFloat((creditMatch || debitMatch)[1]);
      return {
        bank: 'Union Bank',
        amount,
        type: creditMatch ? 'credit' : 'debit',
        merchant: merchantMatch[1].trim(),
        refNumber: refMatch[1],
        timestamp: date,
      };
    }
  }

  // CANARA BANK
  if (upperAddr.includes('CANARA')) {
    const creditMatch = body.match(/credited for Rs\.?(\d+(\.\d+)?)/i);
    const debitMatch = body.match(/debited for Rs\.?(\d+(\.\d+)?)/i);
    const merchantMatch = body.match(/to ([^\n]+?) Ref/i);
    const refMatch = body.match(/Ref(?: No)?[ :]?(\d+)/i);

    if ((creditMatch || debitMatch) && merchantMatch && refMatch) {
      const amount = parseFloat((creditMatch || debitMatch)[1]);
      return {
        bank: 'Canara Bank',
        amount,
        type: creditMatch ? 'credit' : 'debit',
        merchant: merchantMatch[1].trim(),
        refNumber: refMatch[1],
        timestamp: date,
      };
    }
  }

  // IDFC FIRST
  if (upperAddr.includes('IDFC')) {
    const creditMatch = body.match(/Rs\.?(\d+(\.\d+)?) credited/i);
    const debitMatch = body.match(/Rs\.?(\d+(\.\d+)?) debited/i);
    const merchantMatch = body.match(/(?:to|from) ([^\n]+?) Ref/i);
    const refMatch = body.match(/Ref(?: No)?[ :]?(\d+)/i);

    if ((creditMatch || debitMatch) && merchantMatch && refMatch) {
      const amount = parseFloat((creditMatch || debitMatch)[1]);
      return {
        bank: 'IDFC FIRST Bank',
        amount,
        type: creditMatch ? 'credit' : 'debit',
        merchant: merchantMatch[1].trim(),
        refNumber: refMatch[1],
        timestamp: date,
      };
    }
  }

  // INDUSIND BANK
  if (upperAddr.includes('INDUSIND')) {
    const creditMatch = body.match(/credited with INR\.?(\d+(\.\d+)?)/i);
    const debitMatch = body.match(/debited with INR\.?(\d+(\.\d+)?)/i);
    const merchantMatch = body.match(/(?:to|from) ([^\n]+?) Ref/i);
    const refMatch = body.match(/Ref(?: No)?[ :]?(\d+)/i);

    if ((creditMatch || debitMatch) && merchantMatch && refMatch) {
      const amount = parseFloat((creditMatch || debitMatch)[1]);
      return {
        bank: 'IndusInd Bank',
        amount,
        type: creditMatch ? 'credit' : 'debit',
        merchant: merchantMatch[1].trim(),
        refNumber: refMatch[1],
        timestamp: date,
      };
    }
  }

  // FEDERAL BANK
  if (upperAddr.includes('FEDERAL')) {
    const creditMatch = body.match(/Rs\.?(\d+(\.\d+)?) credited/i);
    const debitMatch = body.match(/Rs\.?(\d+(\.\d+)?) debited/i);
    const merchantMatch = body.match(/(?:to|from) ([^\n]+?) Ref/i);
    const refMatch = body.match(/Ref(?: No)?[ :]?(\d+)/i);

    if ((creditMatch || debitMatch) && merchantMatch && refMatch) {
      const amount = parseFloat((creditMatch || debitMatch)[1]);
      return {
        bank: 'Federal Bank',
        amount,
        type: creditMatch ? 'credit' : 'debit',
        merchant: merchantMatch[1].trim(),
        refNumber: refMatch[1],
        timestamp: date,
      };
    }
  }

  // RBL BANK
  if (upperAddr.includes('RBL')) {
    const creditMatch = body.match(/Rs\.?(\d+(\.\d+)?) has been credited/i);
    const debitMatch = body.match(/Rs\.?(\d+(\.\d+)?) has been debited/i);
    const merchantMatch = body.match(/(?:to|from|by) ([^\n]+?) Ref/i);
    const refMatch = body.match(/Ref(?: No)?[ :]?(\d+)/i);

    if ((creditMatch || debitMatch) && merchantMatch && refMatch) {
      const amount = parseFloat((creditMatch || debitMatch)[1]);
      return {
        bank: 'RBL Bank',
        amount,
        type: creditMatch ? 'credit' : 'debit',
        merchant: merchantMatch[1].trim(),
        refNumber: refMatch[1],
        timestamp: date,
      };
    }
  }

  // KARUR VYSYA BANK
  if (upperAddr.includes('KVB')) {
    const creditMatch = body.match(/Rs\.?(\d+(\.\d+)?) has been credited/i);
    const debitMatch = body.match(/Rs\.?(\d+(\.\d+)?) has been debited/i);
    const merchantMatch = body.match(/to ([^\n]+?) Ref/i);
    const refMatch = body.match(/Ref(?: No)?[ :]?(\d+)/i);

    if ((creditMatch || debitMatch) && merchantMatch && refMatch) {
      const amount = parseFloat((creditMatch || debitMatch)[1]);
      return {
        bank: 'KVB',
        amount,
        type: creditMatch ? 'credit' : 'debit',
        merchant: merchantMatch[1].trim(),
        refNumber: refMatch[1],
        timestamp: date,
      };
    }
  }

  // SOUTH INDIAN BANK
  if (upperAddr.includes('SIB')) {
    const creditMatch = body.match(/INR\.?(\d+(\.\d+)?) credited/i);
    const debitMatch = body.match(/INR\.?(\d+(\.\d+)?) debited/i);
    const merchantMatch = body.match(/(?:from|to) ([^\n]+?) Ref/i);
    const refMatch = body.match(/Ref(?: No)?[ :]?(\d+)/i);

    if ((creditMatch || debitMatch) && merchantMatch && refMatch) {
      const amount = parseFloat((creditMatch || debitMatch)[1]);
      return {
        bank: 'South Indian Bank',
        amount,
        type: creditMatch ? 'credit' : 'debit',
        merchant: merchantMatch[1].trim(),
        refNumber: refMatch[1],
        timestamp: date,
      };
    }
  }

  return null;
};
