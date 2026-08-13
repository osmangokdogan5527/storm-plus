import { db } from './src/firebase';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

async function run() {
  const q = query(collection(db, 'islemler'), where('type', '==', 'sale'), where('account', '==', 'pos'));
  const snap = await getDocs(q);
  console.log('Found docs:', snap.size);
}
run().catch(console.error);
