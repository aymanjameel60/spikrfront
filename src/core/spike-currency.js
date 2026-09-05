/* Spike custom currency system. Only currencies enabled by Spike Admin are selectable. */
function spikeCurrencies(){
  const rows=Array.isArray(state.spikeContent?.currencies)?state.spikeContent.currencies:[];
  return rows.filter(x=>x&&x.enabled!==false&&x.code&&Number(x.rate_to_usd)>0);
}
function spikeCurrency(code){return spikeCurrencies().find(x=>String(x.code).toUpperCase()===String(code||'').toUpperCase())||null}
function spikeSelectedCurrency(){
  const rows=spikeCurrencies();
  const requested=String(state.settings?.currency||state.spikeContent?.default_currency||'').toUpperCase();
  return spikeCurrency(requested)||spikeCurrency(state.spikeContent?.default_currency)||rows[0]||{id:'usd',code:'USD',name:'الدولار الأمريكي',symbol:'$',rate_to_usd:1,enabled:true};
}
function spikeRate(code){const c=spikeCurrency(code);if(c)return Number(c.rate_to_usd)||1;return String(code||'').toUpperCase()==='USD'?1:1}
function spikeConvert(amount,sourceCode,targetCode){
  const n=Number(amount||0);if(!Number.isFinite(n))return 0;
  const source=String(sourceCode||'USD').toUpperCase(),target=String(targetCode||spikeSelectedCurrency().code).toUpperCase();
  if(source===target)return n;
  const sourceRate=source==='USD'?1:spikeRate(source),targetRate=target==='USD'?1:spikeRate(target);
  return (n/sourceRate)*targetRate;
}
function spikeFormat(amount,c){
  const cur=c||spikeSelectedCurrency(),n=Number(amount||0),rate=Number(cur.rate_to_usd||1);
  const decimals=(String(cur.code).includes('YER')||rate>=100)?0:2;
  return `${n.toLocaleString('en-US',{minimumFractionDigits:decimals,maximumFractionDigits:decimals})} ${cur.symbol||cur.name||cur.code}`;
}
async function refreshSpikeCurrencies(){
  try{
    const fresh=await fetchSpikeContent();
    if(fresh&&typeof fresh==='object')state.spikeContent={...(state.spikeContent||{}),...fresh};
    const selected=spikeSelectedCurrency();
    if(!spikeCurrency(state.settings?.currency)){
      state.settings={...state.settings,currency:selected.code};
      try{localStorage.setItem('storm-settings',JSON.stringify(state.settings))}catch(_){}
    }
    return spikeCurrencies();
  }catch(_){return spikeCurrencies()}
}

/* Currency sheets are closed by default and only opened by an explicit user action. */
state.currencySheet=false;
state.settingsCurrencySheet=false;

/* Display currency never switches Medusa regions; product source prices remain on the base/USD region. */
fetchMercurRegion=async function(){
  const regions=state.liveRegions?.length?state.liveRegions:await fetchMercurRegions();
  return regions.find(r=>String(r.currency_code||'').toUpperCase()==='USD')||regions[0]||null;
};

apiMoneyString=function(amount,sourceCurrency='USD'){
  const target=spikeSelectedCurrency();
  return spikeFormat(spikeConvert(amount,sourceCurrency,target.code),target);
};
currencyInfo=function(){const c=spikeSelectedCurrency();return {symbol:c.symbol||c.name||c.code,rate:Number(c.rate_to_usd||1),decimals:(String(c.code).includes('YER')?0:2),code:c.code,name:c.name}}
money=function(value){const c=spikeSelectedCurrency();return spikeFormat(Number(value||0)*Number(c.rate_to_usd||1),c)}
displayPrice=function(value){return money(parsePrice(value))}
currencyShort=function(){return spikeSelectedCurrency().symbol||spikeSelectedCurrency().name||spikeSelectedCurrency().code}
currencyLabel=function(code,isArabic=true){const c=spikeCurrency(code)||spikeSelectedCurrency();return c.name||c.code}
currencyCodeLabel=function(code){const c=spikeCurrency(code)||spikeSelectedCurrency();return c.symbol||c.name||c.code}
function spikeCurrencyRows(selectedCode,action){
  const rows=spikeCurrencies();
  if(!rows.length)return '<div class="currency-empty">لا توجد عملات مفعلة من لوحة التحكم</div>';
  return rows.map(c=>`<button class="currency-option spike-currency-option ${String(selectedCode)===String(c.code)?'selected':''}" data-action="${action}" data-value="${esc(c.code)}"><span class="currency-option-main"><strong>${esc(c.name||c.code)}</strong><small>1 USD = ${Number(c.rate_to_usd).toLocaleString('en-US')} ${esc(c.symbol||c.name||c.code)}</small></span><span class="currency-option-side"><em>${esc(c.symbol||c.name||c.code)}</em><b class="settings-radio"></b></span></button>`).join('');
}
settingsCurrencySheet=function(draft,isArabic){
  if(!state.settingsCurrencySheet)return '';
  return `<div class="shade show" data-action="currency-sheet-close"></div><div class="settings-bottom-sheet spike-currency-sheet show"><div class="sheet-handle"></div><div class="settings-sheet-head"><div><h3>${isArabic?'اختر العملة':'Choose currency'}</h3><p>${isArabic?'العملات المفعلة من لوحة التحكم':'Currencies enabled by admin'}</p></div><button class="sheet-close-btn icon-button" data-action="currency-sheet-close">${icon('x',20)}</button></div><div class="currency-list">${spikeCurrencyRows(draft.currency,'settings-currency')}</div></div>`;
};
currencySheet=function(){
  if(!state.currencySheet)return '';
  const selected=spikeSelectedCurrency();
  return `<div class="shade show" data-action="close-currency"></div><div class="settings-bottom-sheet spike-currency-sheet show"><div class="sheet-handle"></div><div class="settings-sheet-head"><div><h3>اختر العملة</h3><p>سيتم تحديث جميع الأسعار مباشرة</p></div><button class="sheet-close-btn icon-button" data-action="close-currency">${icon('x',20)}</button></div><div class="currency-list">${spikeCurrencyRows(selected.code,'spike-currency-select')}</div></div>`;
};

document.addEventListener('click',async e=>{
  const el=e.target.closest('[data-action]');if(!el)return;
  const action=el.dataset.action;
  if(action==='open-currency'||action==='currency'){
    state.currencySheet=true;render();
    await refreshSpikeCurrencies();
    if(state.currencySheet)render();
  }
  if(action==='currency-sheet'){
    state.settingsCurrencySheet=true;
    await refreshSpikeCurrencies();
    if(state.settingsCurrencySheet)render();
  }
  if(action==='currency-sheet-close'){state.settingsCurrencySheet=false;render();}
  if(action==='close-currency'){state.currencySheet=false;render();}
  if(action==='spike-currency-select'){
    const code=String(el.dataset.value||'').toUpperCase();
    if(!spikeCurrency(code))return;
    state.settings={...state.settings,currency:code};
    if(state.settingsDraft)state.settingsDraft={...state.settingsDraft,currency:code};
    try{localStorage.setItem('storm-settings',JSON.stringify(state.settings))}catch(_){}
    state.currencySheet=false;render();
    if(typeof showToast==='function')showToast(`تم تغيير العملة إلى ${spikeSelectedCurrency().name}`);
  }
},true);
