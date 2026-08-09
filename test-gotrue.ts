import dotenv from 'dotenv';
dotenv.config();

import { getSupabaseClient } from './src/services/supabase/client';

async function testGoTrue() {
  const client = getSupabaseClient();
  const testEmail = `user_${Date.now()}@example.com`;
  const testPass = 'Password_Reminiq123!';

  console.log('Attempting signUp with:', testEmail);
  const { data, error } = await client.auth.signUp({
    email: testEmail,
    password: testPass,
  });

  console.log('SignUp result:', {
    user: data?.user?.id,
    session: Boolean(data?.session),
    error: error?.message,
  });

  if (data?.session && data.user) {
    console.log('Got active session! Testing upload...');
    const { uploadMemoryImage } = await import('./src/services/supabase/memoryStorage');
    const dummyBlob = new Blob(['test-binary-data'], { type: 'image/png' });
    const res = await uploadMemoryImage(dummyBlob, {
      userId: data.user.id,
      originalFilename: 'test.png',
    });
    console.log('UPLOAD SUCCESS:', res);
  }
}

testGoTrue();
