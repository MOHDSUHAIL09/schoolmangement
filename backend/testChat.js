import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { generateSmartSchoolReply, detectLanguage } from './services/aiChatService.js';
import User from './models/User.js';

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ role: 'parent' });

  const testQueries = [
    'kal school khula hai?',
    'fees kitni baaki hai?',
    'school timing kya hai?',
    'admission kaise hoga?',
    'principal kaun hai?',
    'kya school me computer lab aur library hai?',
    'PTM kab hai?',
    'uniform rules kya hain?',
    'homework kya mila hai?',
    'meri attendance kitni hai?',
    'kese ho bhai?',
    'क्या कल स्कूल खुला है?',
    'मेरी फीस कितनी है?',
    'کیا کل اسکول کھلا ہے؟',
    'Is school open tomorrow?',
    'What are the school fees?'
  ];

  console.log('--- STARTING AI CHAT TESTS ---');
  for (const q of testQueries) {
    const lang = detectLanguage(q);
    const reply = await generateSmartSchoolReply({
      rawMessage: q,
      senderUser: user || { name: 'Vikram Sharma', role: 'parent' }
    });
    console.log(`\nQ: "${q}" [Language: ${lang}]`);
    console.log(`A: ${reply}`);
  }

  await mongoose.disconnect();
}
test();
