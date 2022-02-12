import { firestore } from 'firebase/compat';

export interface AmountDocument {
  amount: number;
  date: firestore.FieldValue;
}
