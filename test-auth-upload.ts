import dotenv from 'dotenv';
dotenv.config();

import { getSupabaseClient } from './src/services/supabase/client';
import { ensureAuthenticatedUser } from './src/services/supabase/devAuth';
import { uploadMemoryImage } from './src/services/supabase/memoryStorage';

async function testAuthAndUpload() {
  console.log('Testing dev authentication and upload...');
  const client = getSupabaseClient();

  try {
    const userId = await ensureAuthenticatedUser();
    console.log('Successfully authenticated user ID:', userId);

    // Test a small upload
    const dummyBlob = new Blob(['sample-test-image-binary-data'], { type: 'image/png' });
    const result = await uploadMemoryImage(dummyBlob, {
      userId,
      originalFilename: 'test-direct.png',
    });
    console.log('Upload SUCCESS! Storage path:', result.storagePath);
    console.log('Database record:', result.memory);
    console.log('Signed URL:', result.signedUrl);
  } catch (err: any) {
    console.error('Error during test:', err);
  }
}

testAuthAndUpload();
