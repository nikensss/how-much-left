import { FieldValue } from 'firebase/firestore';

export interface AmountDocument {
  amount: number;
  date: FieldValue;
}
