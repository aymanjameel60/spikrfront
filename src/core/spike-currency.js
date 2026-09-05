/* Spike custom currency system. Display conversion is controlled only by Spike Admin settings. */
function spikeCurrencies(){
  const rows=Array.isArray(state.spikeContent?.currencies)?state.spikeContent.currencies:[];
  const enabled=rows.filter(x=>x&&x.enabled!==false&&x.code);
  return enabled.length?enabled:[{id:'usd',code:'USD',name:'الدولار الأمريكي',symbol:'$',rate_to_usd:1,enabled:true}];
}
function spikeCurrency(code){return spikeCurrencies().find(x=>String(x.code).toUpperCase()===String(code||'').toUpperCase())||null}
function spikeSelectedCurrency(){
  const requested=String(state.settings?.currency||state.spikeContent?.default_currency||'USD').toUpperCase();
  return spikeCurrency(requested)||spikeCurrencies()[0];
}
function spikeRate(code){const c=spikeCurrency(code);if(c)return Number(c.rate_to_usd||1)||1;return String(code||'').toUpperCase()==='USD'?1:1}
function spikeConvert(amount,sourceCode,targetCode){
  const n=Number(amount||0);if(!Number.isFinite(n))return 0;
  const source=String(sourceCode||'USD').toUpperCase(),target=String(targetCode||spikeSelectedCurrency().code).toUpperCase();
  if(source===target)return n;
  return (n/spikeRate(source))*spikeRate(target);
}
function spikeFormat(amount,c){
  const cur=c||spikeSelectedCurrency(),n=Number(amount||0),rate=Number(cur.rate_to_usd||1);
  const decimals=(String(cur.code).includes('YER')||rate>=100)?0:2;
  return `${n.toLocaleString('en-US',{minimumFractionDigits:decimals,maximumFractionDigits:decimals})} ${cur.symbol||cur.code}`;
}

/* Display currency must never switch Medusa regions. Product/source pricing stays on the USD/base region. */
fetchMercurRegion=async function(){
  const regions=state.liveRegions?.length?state.liveRegions:await fetchMercurRegions();
  return regions.find(r=>String(r.currency_code||'').toUpperCase()==='USD')||regions[0]||null;
};

apiMoneyString=function(amount,sourceCurrency='USD'){
  const target=spikeSelectedCurrency();
  return spikeFormat(spikeConvert(amount,sourceCurrency,target.code),target);
};
currencyInfo=function(){const c=spikeSelectedCurrency();return {symbol:c.symbol||c.code,rate:Number(c.rate_to_usd||1),decimals:(String(c.code).includes('YER')?0:2),code:c.code,name:c.name}}
money=function(value){const c=spikeSelectedCurrency();return spikeFormat(Number(value||0)*Number(c.rate_to_usd||1),c)}
displayPrice=function(value){return money(parsePrice(value))}
currencyShort=function(){return spikeSelectedCurrency().symbol||spikeSelectedCurrency().code}
currencyLabel=function(code,isArabic=true){const c=spikeCurrency(code)||spikeSelectedCurrency();return c.name||c.code}
currencyCodeLabel=function(code){const c=spikeCurrency(code)||spikeSelectedCurrency();return `${c.code}  ${c.symbol||''}`}
settingsCurrencySheet=function(draft,isArabic){
  const rows=spikeCurrencies();
  return `<div class="shade ${state.settingsCurrencySheet?'show':''}" data-action="currency-sheet-close"></div><div class="settings-bottom-sheet ${state.settingsCurrencySheet?'show':''}"><div class="sheet-handle"></div><div class="settings-sheet-head"><h3>${isArabic?'اختر العملة':'Choose currency'}</h3><button class="sheet-close-btn icon-button" data-action="currency-sheet-close">${icon('x',20)}</button></div><div class="currency-list">${rows.map(c=>`<button class="currency-option ${draft.currency===c.code?'selected':''}" data-action="settings-currency" data-value="${esc(c.code)}"><span><strong>${esc(c.name||c.code)}</strong><small>${esc(c.code)} ${esc(c.symbol||'')}</small></span><b class="settings-radio"></b></button>`).join('')}</div></div>`;
};
currencySheet=function(){
  const rows=spikeCurrencies(),selected=spikeSelectedCurrency();
  return `<div class="shade ${state.currencySheet?'show':''}" data-action="close-currency"></div><div class="currency-sheet ${state.currencySheet?'show':''}"><div class="sheet-handle"></div><h3>اختر العملة</h3><div class="currency-list">${rows.map(c=>`<button class="currency-option ${selected.code===c.code?'selected':''}" data-action="spike-currency-select" data-value="${esc(c.code)}"><span><strong>${esc(c.name||c.code)}</strong><small>${esc(c.code)} ${esc(c.symbol||'')}</small></span><b class="settings-radio"></b></button>`).join('')}</div></div>`;
};

document.addEventListener('click',e=>{
  const el=e.target.closest('[data-action]');if(!el)return;
  const action=el.dataset.action;
  if(action==='open-currency'){state.currencySheet=true;render();}
  if(action==='close-currency'){state.currencySheet=false;render();}
  if(action==='spike-currency-select'){
    const code=String(el.dataset.value||'USD').toUpperCase();
    if(!spikeCurrency(code))return;
    state.settings={...state.settings,currency:code};
    state.settingsDraft=state.settingsDraft?{...state.settingsDraft,currency:code}:state.settingsDraft;
    try{localStorage.setItem('storm-settings',JSON.stringify(state.settings))}catch(_){ }
    state.currencySheet=false;render();
  }
},true);
