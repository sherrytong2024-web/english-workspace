const p = require('puppeteer');
(async ()=>{
  const b=await p.launch({headless:'new',args:['--no-sandbox','--no-proxy-server']});
  const pg=await b.newPage();
  pg.on('pageerror',e=>console.log('PE:'+e.message));
  await pg.goto('https://english-workspace.onrender.com/',{waitUntil:'networkidle2',timeout:30000});
  await new Promise(r=>setTimeout(r,10000));
  await pg.evaluate(()=>{
    const n=document.querySelector('.nav-item[data-page="dialogues"]');
    if(n) n.click();
  });
  await new Promise(r=>setTimeout(r,6000));
  const r=await pg.evaluate(()=>{
    const dl=document.getElementById('dialog-list');
    return {
      cards:dl?dl.querySelectorAll('.dialog-item').length:0,
      stages:dl?dl.querySelectorAll('.card').length:0,
      dlHTMLlen:dl?dl.innerHTML.length:0,
      hasDlg:dl?dl.innerHTML.includes('dialog-item'):false,
      stateLearned:typeof state.learnedDialogs==='object'?state.learnedDialogs.length:'nope',
      allDlg:typeof state.allDialogues==='object'?state.allDialogues.length:'nope',
    };
  });
  console.log(JSON.stringify(r));
  await b.close();
})();