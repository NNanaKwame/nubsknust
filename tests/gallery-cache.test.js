import test from 'node:test';
import assert from 'node:assert/strict';
const response = () => ({ headers: {}, setHeader(k,v){this.headers[k]=v;}, json(body){this.body=body;return this;}, status(code){this.code=code;return this;} });
test('gallery shares concurrent loads, expires and retries failed traversals', async () => {
 const originalFetch=globalThis.fetch, originalNow=Date.now;
 const saved={...process.env};
 process.env.GALLERY_PHOTOS_FOLDER_ID='photos'; process.env.GALLERY_VIDEOS_FOLDER_ID='videos'; process.env.GOOGLE_API_KEY='test';
 let calls=0, fail=false, time=1000;
 Date.now=()=>time;
 globalThis.fetch=async()=>{calls++;return new Response(JSON.stringify(fail?{error:'temporary'}:{files:[]}),{status:fail?503:200});};
 try {
  const {default:handler}=await import('../api/get-gallery-media.js');
  const a=response(), b=response();
  await Promise.all([handler({},a),handler({},b)]);
  assert.equal(calls,2);assert.deepEqual(a.body,{photos:[],videos:[]});assert.deepEqual(a.body,b.body);
  await handler({},response());assert.equal(calls,2);
  time+=300001;fail=true;
  const failed=response();await handler({},failed);assert.equal(calls,4);assert.equal(failed.headers['Cache-Control'],'no-store');
  fail=false;await handler({},response());assert.equal(calls,6);
  await handler({},response());assert.equal(calls,6);
 } finally {
  globalThis.fetch=originalFetch;Date.now=originalNow;
  for(const k of ['GALLERY_PHOTOS_FOLDER_ID','GALLERY_VIDEOS_FOLDER_ID','GOOGLE_API_KEY']){if(saved[k]===undefined)delete process.env[k];else process.env[k]=saved[k];}
 }
});
