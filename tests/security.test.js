import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import imageProxy from '../api/image-proxy.js';
import events from '../api/get-events.js';
const context = vm.createContext({URL});
vm.runInContext(fs.readFileSync('js/html-safety.js','utf8'), context);
test('untrusted metadata cannot create markup or script links',()=>{
 assert.equal(context.escapeHTML('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
 assert.equal(context.safeBookURL('javascript:alert(1)'), '#');
 assert.equal(context.safeBookURL('https://drive.google.com/file/d/test/view'), 'https://drive.google.com/file/d/test/view');
});
function response(){return {statusCode:200,status(n){this.statusCode=n;return this},send(x){this.body=x;return this},json(x){this.body=x;return this},setHeader(){}}}
test('proxy rejects invalid IDs before fetching',async()=>{
 const res=response();await imageProxy({query:{id:'../anything'}},res);assert.equal(res.statusCode,400);
});
test('proxy refuses HTML responses',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async()=>new Response('<script>alert(1)</script>',{headers:{'content-type':'text/html'}});
 try { const res=response();await imageProxy({query:{id:'valid_drive_file_id'}},res);assert.equal(res.statusCode,502); } finally {globalThis.fetch=original;}
});
test('event pagination rejects excessive or malformed limits',async()=>{
 for(const limit of ['999','0','NaN']){const res=response();await events({query:{limit}},res);assert.equal(res.statusCode,400);}
});
