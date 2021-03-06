import { firestore } from 'firebase';

export interface AmountDocument {
  amount: number;
  date: firestore.FieldValue;
}
