const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
test('every registered tool has a static hub link and exactly one shared enhancement',()=>{
  const dirs=fs.readdirSync(path.join(root,'ko'),{withFileTypes:true}).filter(d=>d.isDirectory());
  let tools=0;
  for(const dir of dirs){const filename=path.join(root,'ko',dir.name,'index.html');if(!fs.existsSync(filename))continue;const html=fs.readFileSync(filename,'utf8');if(!/slug:\s*"/.test(html))continue;tools++;
    assert.ok(html.includes('class="tool-hub-link" href="/ko/"'),dir.name);
    assert.equal((html.match(/src="\/assets\/js\/tool-inputs.js"/g)||[]).length,1,dir.name);
    assert.equal((html.match(/href="\/assets\/css\/tool-inputs.css"/g)||[]).length,1,dir.name);
  }
  assert.ok(tools>=24);
});
test('magazine pages are not affected by tool-only controls',()=>{
  for(const dir of fs.readdirSync(path.join(root,'blog'),{withFileTypes:true}).filter(d=>d.isDirectory())){
    const file=path.join(root,'blog',dir.name,'index.html');if(fs.existsSync(file))assert.ok(!fs.readFileSync(file,'utf8').includes('/assets/js/tool-inputs.js'),dir.name);
  }
});
