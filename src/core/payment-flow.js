/* Spike payment flow: orders are created first; transfer receipts are uploaded from My Orders. */

/* Force offline checkout methods to use a manual/system provider. Never fall back to a card gateway. */
selectPaymentProvider=function(providers){
  const rows=Array.isArray(providers)?providers:[];
  const wanted=state.payment==='cod'?['cod','cash','manual','system']:['transfer','bank','manual','system'];
  const score=p=>{const id=String(p?.id||p?.provider_id||'').toLowerCase();let s=-1;wanted.forEach((k,i)=>{if(id.includes(k)&&s<0)s=i});return s};
  const matches=rows.map(p=>({p,s:score(p)})).filter(x=>x.s>=0).sort((a,b)=>a.s-b.s);
  if(!matches.length)throw new Error(state.payment==='cod'?'لا توجد طريقة دفع عند الاستلام مفعلة في النظام':'لا توجد طريقة تحويل مالي/دفع يدوي مفعلة في النظام');
  return matches[0].p;
};

/* Checkout shows transfer account details, but receipt upload happens only after the order is created. */
checkout=function(){
  const cart=state.remoteCart;const cur=cart?.currency_code||'USD';
  const subtotal=Number(cart?.subtotal??0),platformTotal=Number(cart?.total??subtotal);
  const temp=state.temporaryDelivery;const delivery=Number(temp?.delivery_total||0);const grand=platformTotal+delivery;
  const transfer=state.payment==='transfer';
  const accounts=(state.spikeContent?.bank_accounts||[]).filter(a=>a?.enabled!==false);
  const accountsHtml=transfer?`<div class="transfer-panel"><h3>بيانات التحويل</h3>${accounts.length?accounts.map(a=>`<div class="bank-account-card"><strong>${esc(a.name||'تحويل مالي')}</strong><span>${esc(a.account_name||'')}</span><b dir="ltr">${esc(a.account_number||'')}</b>${a.instructions?`<small>${esc(a.instructions)}</small>`:''}</div>`).join(''):'<div class="empty-ux">لا توجد بيانات حساب مضافة من الإدارة.</div>'}<div class="spike-inline-note" style="margin-top:10px">بعد إنشاء الطلب سترفع سند الحوالة من صفحة طلباتي.</div></div>`:'';
  return `<section class="screen">${simpleHead('تأكيد الطلب والدفع')}<div class="page-wrap forms">
    <button class="delivery-address" data-action="open-addresses"><span>${icon('map-pin',20)}</span><b>${state.activeAddress?`${esc(state.activeAddress.label)} - ${esc(state.activeAddress.area)}`:'اختر عنوان التوصيل'}</b><u>تغيير</u></button>
    <div class="menu-row">${icon('truck',18)} <span>مكتب التوصيل محدد لكل منتج من التاجر</span><b>${delivery?liveMoney(delivery,cur):''}</b></div>
    <div style="font-size:12px;margin:14px 5px 0">طريقة الدفع</div><div class="radio-row"><label><input type="radio" name="pay" value="transfer" ${transfer?'checked':''}> حوالة مالية</label><label><input type="radio" name="pay" value="cod" ${state.payment==='cod'?'checked':''}> أثناء التوصيل</label></div>
    ${accountsHtml}
    <div class="shopping-invoice"><div class="invoice-line"><span>المنتجات بعد الخصومات</span><b>${liveMoney(platformTotal,cur)}</b></div><div class="invoice-line"><span>رسوم مكتب التوصيل</span><b>${delivery?liveMoney(delivery,cur):'تحسب عند التأكيد'}</b></div><div class="invoice-total"><span>الإجمالي مع التوصيل</span><strong>${liveMoney(grand,cur)}</strong></div></div>
    <button class="red-action full" data-action="pay">تأكيد الطلب</button></div></section>${bottom('cart')}`
}

function checkoutCompletionError(d){
  const e=d?.error;
  if(typeof e==='string'&&e.trim())return e;
  if(e?.message)return e.message;
  if(d?.message)return d.message;
  const errors=d?.errors||d?.cart?.errors;
  if(Array.isArray(errors)&&errors.length)return errors.map(x=>x?.message||String(x)).join(' — ');
  return 'تعذر إكمال الطلب بعد تهيئة الشحن والدفع';
}

async function completeRemoteCart(){
  const cart=await ensureRemoteCart();
  const cartId=cart.id;
  const idemKey=`spike-checkout-${cartId}`;
  let idem=storageGet(idemKey);
  if(!idem){idem=(crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`);storageSet(idemKey,idem)}
  try{
    await prepareRemoteCheckout();
    const paymentMethod=state.payment==='cod'?'cod':'transfer';
    await apiRequest(`/store/carts/${cartId}`,{method:'POST',body:{metadata:{...(state.remoteCart?.metadata||{}),spike_idempotency_key:idem,spike_payment_method:paymentMethod,spike_payment_review:'pending'}}});
    const d=await apiRequest(`/store/carts/${cartId}/complete`,{method:'POST'});
    if(d?.type==='order'||d?.order){
      const order=d.order||d;
      state.lastPlacedPaymentMethod=paymentMethod;
      await apiOptional('/store/spike/order-payment-state',{method:'POST',auth:true,body:{order_id:order.id,payment_method:paymentMethod}});
      return finalizeCompletedCheckout(order,cartId,idemKey);
    }
    /* Some Mercur/Medusa responses complete the cart but don't return the order shape immediately. */
    const recovered=await recoverCompletedCartOrder(cartId).catch(()=>null);
    if(recovered){
      state.lastPlacedPaymentMethod=paymentMethod;
      await apiOptional('/store/spike/order-payment-state',{method:'POST',auth:true,body:{order_id:recovered.id,payment_method:paymentMethod}});
      return finalizeCompletedCheckout(recovered,cartId,idemKey);
    }
    console.error('[Spike complete cart response]',d);
    throw new Error(checkoutCompletionError(d));
  }catch(error){
    if(isCompletedCartError(error)){
      const existing=await recoverCompletedCartOrder(cartId).catch(()=>null);
      if(existing){
        state.lastPlacedPaymentMethod=state.payment==='cod'?'cod':'transfer';
        return finalizeCompletedCheckout(existing,cartId,idemKey);
      }
      storageSet(idemKey,'');setRemoteCartId('');state.remoteCart=null;
      throw new Error('تم إكمال هذه السلة مسبقًا ولم أجد الطلب المرتبط بها. تم تنظيف السلة القديمة، أعد إضافة المنتجات مرة واحدة.');
    }
    throw error;
  }
}

async function completeSpikeCheckout(){
  if(!customerToken())throw new Error('سجّل الدخول أولاً لإكمال الطلب');
  if(!state.cartItems?.length&&!(state.remoteCart?.items||[]).length)throw new Error('السلة فارغة');
  try{
    const order=await completeRemoteCart();
    if(!order?.id)throw new Error('لم يتم إنشاء رقم طلب من الخادم');
    return order;
  }catch(e){console.error('[Spike checkout]',e);throw new Error(e?.message||'فشل إنشاء الطلب. لم يتم تفريغ السلة.')}
}
window.completeSpikeCheckout=completeSpikeCheckout;

function selectedLiveOrder(){
  const id=String(state.selectedOrder||'');
  return (state.liveOrders||[]).find(x=>String(x.id)===id||String(x.raw?.id)===id||String(x.raw?.display_id)===id)||null;
}
function orderPaymentMethod(order){return String(order?.raw?.metadata?.spike_payment_method||order?.raw?.metadata?.payment_method||'transfer')}
function orderPaymentReview(order){return String(order?.raw?.metadata?.spike_payment_review||'pending')}

async function uploadReceiptForOrder(order,file){
  if(!order?.raw?.id)throw new Error('تعذر تحديد الطلب');
  if(!file)throw new Error('اختر صورة سند الحوالة');
  if(!/^image\/(png|jpeg|jpg|webp)$/i.test(file.type||''))throw new Error('السند يجب أن يكون PNG أو JPG أو WEBP');
  if(file.size>5*1024*1024)throw new Error('حجم السند يجب ألا يتجاوز 5MB');
  const dataUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('تعذر قراءة السند'));r.readAsDataURL(file)});
  const d=await apiRequest('/store/spike/payment-receipts',{method:'POST',auth:true,body:{order_id:order.raw.id,cart_id:order.raw.cart_id||null,filename:file.name,data_url:dataUrl}});
  order.raw.metadata={...(order.raw.metadata||{}),spike_payment_method:'transfer',spike_payment_review:'receipt_pending'};
  await syncNotifications({silent:true});
  return d.receipt;
}

app.addEventListener('change',async e=>{
  if(e.target.id!=='order-transfer-receipt')return;
  const file=e.target.files?.[0];const order=selectedLiveOrder();
  try{e.target.disabled=true;showToast('جاري رفع سند الحوالة...');await uploadReceiptForOrder(order,file);showToast('تم رفع السند وسيتم مراجعته من الإدارة');render()}
  catch(err){e.target.disabled=false;showToast(err.message||'تعذر رفع السند')}
});
