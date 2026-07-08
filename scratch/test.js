import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mzocyjxwbulmofwwyjaa.supabase.co';
const supabaseAnonKey = 'sb_publishable_uNVtv_06Lfc1d_fNHDXn_A_bCr4gt0J';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Testing upload to "r-drive" bucket for ZupShare...');
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('r-drive')
    .upload('test-connection.txt', Buffer.from('Hello ZupShare'), { contentType: 'text/plain', upsert: true });

  if (uploadError) {
    console.error('Error uploading file:', uploadError);
  } else {
    console.log('File uploaded successfully:', uploadData);
    
    console.log('Listing files in "r-drive" bucket...');
    const { data: listData, error: listError } = await supabase.storage.from('r-drive').list('');
    if (listError) {
      console.error('Error listing files:', listError);
    } else {
      console.log('Files list:');
      console.log(JSON.stringify(listData, null, 2));
      
      // Cleanup
      console.log('Cleaning up test file...');
      await supabase.storage.from('r-drive').remove(['test-connection.txt']);
    }
  }
}

run();
