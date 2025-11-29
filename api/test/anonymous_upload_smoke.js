// Simple smoke test for anonymous upload flow
// Usage: set API_BASE if testing against deployed Functions; default is http://localhost:7071/api

const API_BASE = process.env.API_BASE || 'http://localhost:7071/api';

async function run() {
  console.log('Testing anonymous upload against', API_BASE);

  try {
    const sasResp = await fetch(`${API_BASE}/files/upload-sas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: 'anon-test.txt', parentId: null, fileType: 'text', fileSize: 11 })
    });

    console.log('upload-sas status:', sasResp.status);
    const sasJson = await sasResp.json().catch(() => null);
    console.log('upload-sas body:', sasJson);

    if (!sasResp.ok) {
      console.error('upload-sas failed; anonymous uploads may be disabled or require auth.');
      process.exit(sasResp.status);
    }

    const sasUrl = sasJson.sasUrl;
    console.log('PUT to SAS URL', sasUrl.slice(0, 80) + '...');

    const put = await fetch(sasUrl, { method: 'PUT', headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': 'text/plain' }, body: 'hello world' });
    console.log('PUT status:', put.status);

    if (!put.ok) {
      console.error('PUT to SAS URL failed');
      process.exit(put.status);
    }

    const complete = await fetch(`${API_BASE}/files/upload-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: sasJson.metadata.fileId, fileName: sasJson.metadata.fileName, parentId: sasJson.metadata.parentId, fileType: sasJson.metadata.fileType, blobName: sasJson.blobName, fileSize: sasJson.metadata.fileSize })
    });

    console.log('upload-complete status:', complete.status);
    const completeJson = await complete.json().catch(() => null);
    console.log('upload-complete body:', completeJson);

    if (!complete.ok) {
      console.error('upload-complete failed');
      process.exit(complete.status);
    }

    console.log('Anonymous upload smoke test succeeded — file created with id', completeJson?.id || '(unknown)');
  } catch (err) {
    console.error('Smoke test error:', err);
    process.exit(1);
  }
}

run();
