import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '/Users/qiaojinliang/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/Users/qiaojinliang/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell', headless: true });
const observations=[];
for (const [name,url] of [['app','https://app.eden.so'],['marketing','https://eden.so']]) {
  for (const [width,height] of [[1440,1000],[768,1024],[375,812]]) {
    const context=await browser.newContext({ viewport:{width,height}, deviceScaleFactor:1, colorScheme:'light', reducedMotion:'reduce' });
    const page=await context.newPage();
    const consoleErrors=[], failedRequests=[];
    await page.route('**/*',route=>['GET','HEAD','OPTIONS'].includes(route.request().method())?route.continue():route.abort());
    page.on('pageerror',error=>consoleErrors.push(error.message));
    page.on('response',response=>{if(response.status()>=400)failedRequests.push({url:response.url().split('?')[0],status:response.status()})});
    await page.addInitScript(()=>{window.__captureMetrics={lcp:null,cls:0};try{new PerformanceObserver(l=>{for(const e of l.getEntries())window.__captureMetrics.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__captureMetrics.cls+=e.value}).observe({type:'layout-shift',buffered:true})}catch{}});
    try {
      await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
      await page.waitForTimeout(3500);
      const artifact=`screenshots/${name}-${width}x${height}.png`;
      await page.screenshot({path:fileURLToPath(new URL(artifact,import.meta.url)),fullPage:false});
      const visible=await page.evaluate(()=>({ title:document.title, url:location.origin+location.pathname, bodyText:document.body.innerText.slice(0,8000), font:getComputedStyle(document.body).fontFamily, bodyColor:getComputedStyle(document.body).color, bodyBackground:getComputedStyle(document.body).backgroundColor, rootVars:Object.fromEntries(['--surface-sidebar','--surface-page','--surface-card','--font-sans','--text-primary','--accent','--border-subtle'].map(x=>[x,getComputedStyle(document.documentElement).getPropertyValue(x).trim()])), horizontalOverflow:document.documentElement.scrollWidth>innerWidth, metrics:window.__captureMetrics, images:[...document.images].slice(0,20).map(i=>({alt:i.alt,src:i.currentSrc,loaded:i.complete&&i.naturalWidth>0}))}));
      observations.push({name,viewport:`${width}x${height}`,artifact,...visible,consoleErrors,failedRequests});
    } catch(error) { observations.push({name,viewport:`${width}x${height}`,error:String(error),consoleErrors,failedRequests}); }
    await context.close();
  }
}
await browser.close();
fs.writeFileSync(new URL('public-page-observations.json',import.meta.url),JSON.stringify(observations,null,2));
console.log(JSON.stringify(observations.map(({name,viewport,artifact,url,font,bodyBackground,horizontalOverflow,metrics,error})=>({name,viewport,artifact,url,font,bodyBackground,horizontalOverflow,metrics,error})),null,2));
