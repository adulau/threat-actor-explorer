// Run ./start-standalone.sh first, then: node tests/graph-tools.mjs
// Uses the Playwright dependency installed by npm ci in the Pivotick submodule.
import { chromium } from '../pivotick/node_modules/@playwright/test/index.mjs';
import assert from 'node:assert/strict';
const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
try {
  const page = await browser.newPage({viewport:{width:1600,height:1100},acceptDownloads:true});
  const errors=[];
  page.on('pageerror',error=>{console.error(error.stack);errors.push(error.message);});
  await page.addInitScript(()=>{
    localStorage.setItem('misp-galaxy.theme','dark');
    let ctor;
    Object.defineProperty(window,'Pivotick',{configurable:true,get:()=>ctor,set:value=>{
      ctor=typeof value==='function'?new Proxy(value,{construct(target,args){
        const graph=Reflect.construct(target,args); window.testGraph=graph; return graph;
      }}):value;
    }});
  });
  await page.goto(process.env.EXPLORER_URL || 'http://127.0.0.1:8000/misp-threat-actor-explorer.html');
  await page.waitForFunction(()=>window.testGraph?.getNodes().length>0,{},{timeout:60000});
  console.log('Graph loaded');
  const original=await page.evaluate(()=>({nodes:testGraph.getNodes().length,edges:testGraph.getEdges().length}));
  assert(original.nodes>1,'loaded a real Galaxy neighbourhood');
  await page.locator('#simplifyBtn').click();
  await page.locator('.pvt-flyout-simplify.open').waitFor();
  assert.equal(await page.locator('.pvt-simplifyflyout-rule').count(),5);
  // Exercise a real grouping on the loaded data, with a threshold that folds leaves.
  await page.evaluate(()=>{
    const rule=testGraph.simplify.getRules().find(r=>r.kind==='degree');
    testGraph.simplify.setRuleSetting(rule.id,10);
  });
  await page.locator('.pvt-simplifyflyout-rule[data-rule="degree"] .pvt-simplifyflyout-rule-switch').click();
  await page.waitForFunction(()=>testGraph.simplify.summary().folded>0);
  assert.deepEqual(await page.evaluate(()=>({nodes:testGraph.getNodes().length,edges:testGraph.getEdges().length})),original,'grouping preserves data');
  // Group opening and closing must preserve members too.
  await page.evaluate(()=>{const group=testGraph.simplify.getGroups()[0];testGraph.simplify.open(group.id);testGraph.simplify.close(group.id);});
  console.log('Grouping passed');
  await page.locator('#graphTableBtn').click();
  await page.waitForFunction(()=>testGraph.UIManager.dock?.getActiveTabId()===testGraph.UIManager.table?.dockTabId());
  console.log('Table opened');
  const downloadEvent=page.waitForEvent('download');
  await page.getByRole('button',{name:'Export neighbourhood',exact:true}).click();
  const download=await downloadEvent;
  const {readFile}=await import('node:fs/promises');
  const exported=JSON.parse(await readFile(await download.path(),'utf8'));
  assert.equal(exported.nodes.length,original.nodes,'JSON export retains grouped nodes');
  assert.equal(exported.relationships.length,original.edges);
  console.log('Export passed');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#resetGraphBtn').click();
  await page.waitForFunction(()=>testGraph.simplify.getRules().every(r=>!r.enabled));
  assert.deepEqual(await page.evaluate(()=>({nodes:testGraph.getNodes().length,edges:testGraph.getEdges().length})),original);
  await page.locator('#themeBtn').click();
  await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
  assert.equal(await page.locator('#simplifyBtn').isEnabled(),true);
  assert.deepEqual(errors,[],'no browser runtime errors');
  console.log(`PASS: Galaxy load (${original.nodes} nodes, ${original.edges} edges), five simplification rules, grouping, table, JSON export, reset and light theme`);
} finally { await browser.close(); }
