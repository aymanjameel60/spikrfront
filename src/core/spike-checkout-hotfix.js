/* Spike checkout/address bridge: Google Maps link is user-facing; coordinates stay internal. */
(function(){
  window.spikeCheckoutState=function(){state.spikeCheckout=state.spikeCheckout||{error:'',selected:{}};return state.spikeCheckout};
  window.saveRemoteAddress=async function(addr){
    if(!customerToken())throw new Error('سجّل الدخول أولاً');
    let cityId=addr.city_id||addr.raw?.city_id;
    const cityName=String(addr.label||addr.raw?.city_name||'').trim();
    if(!cityId){const cities=state.spikeCities?.length?state.spikeCities:(await SpikeCommerce.req('/cities')).cities||[];cityId=cities.find(c=>String(c.name).trim()===cityName)?.id}
    if(!cityId)throw new Error('اختر مدينة متاحة من مدن التغطية');
    const maps=String(addr.google_maps_url||'').trim();
    if(!maps)throw new Error('أضف رابط Google Maps للموقع');
    const body={city_id:cityId,label:addr.type||addr.area||'home',recipient_name:state.userProfile?.name||'Customer',phone:addr.phone||state.userProfile?.phone||'',address_line:addr.details||'',is_active:!!state.addressFormDefault,google_maps_url:maps};
    const editing=addr.id&&/^[0-9a-f-]{36}$/i.test(addr.id),path=editing?`/addresses/${addr.id}`:'/addresses';
    const d=await SpikeCommerce.req(path,{method:editing?'PUT':'POST',body,auth:true});await syncCustomer({silent:true});return d.address;
  };
  window.saveAddressFromForm=async function(){
    const old=state.editingAddressId?state.addresses.find(x=>x.id===state.editingAddressId):null;
    const details=(document.getElementById('address-line1')?.value||'').trim();
    const line2=(document.getElementById('address-line2')?.value||'').trim();
    const landmark=(document.getElementById('address-landmark')?.value||'').trim();
    const city=(document.getElementById('address-city')?.value||'').trim();
    const maps=(document.getElementById('address-maps')?.value||'').trim();
    const phone=(document.getElementById('address-phone')?.value||'').trim();
    if(!details||!city||!phone||!maps){showToast('أكمل العنوان والمدينة والجوال ورابط Google Maps');return}
    try{const saved=await saveRemoteAddress({...(old||{}),id:old?.id,label:city,details:[details,line2,landmark].filter(Boolean).join(' - '),phone,type:state.addressFormType||'home',google_maps_url:maps});state.editingAddressId=null;state.activeAddress=state.addresses.find(x=>x.id===saved?.id)||state.activeAddress;showToast('تم حفظ العنوان وتحديد الموقع تلقائيًا');go('addresses',false)}catch(e){showToast(e.message||'تعذر حفظ العنوان')}
  };
  window.requireSpikeDeliveryCoverage=function(){const q=state.spikeDeliveryQuote;if(!q||q.covered!==true)throw new Error(state.spikeCheckoutError||q?.message||'تعذر حساب التوصيل لهذا العنوان');return q};
})();
