const p = require('puppeteer');
(async ()=>{
  const b=await p.launch({headless:'new',args:['--no-sandbox','--no-proxy-server']});
  const pg=await b.newPage();
  pg.on('pageerror',e=>console.log('PE:'+e.message));
  await pg.goto('https://english-workspace.onrender.com/',{waitUntil:'networkidle2',timeout:30000});
  await new Promise(r=>setTimeout(r,5000));
  const r = await pg.evaluate(()=>{
    // Check raw localStorage
    const ls = localStorage.getItem('enws_learnedDialogs');
    return {
      lsValue: ls,
      lsType: typeof ls,
      DBtype: typeof DB,
      DBloadType: DB ? typeof DB.load : 'no DB',
      DBkeys: DB ? Object.keys(DB) : 'no DB',
      stateKeys: Object.keys(state),
      stateLearned: typeof state.learnedDialogs
    };
  });
  console.log(JSON.stringify(r, null, 2));
  await b.close();
})();