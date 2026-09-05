/* Spike checkout UI: keep bank-transfer details visible, but upload receipt only after order creation. */
checkout=function(){
  if(!customerToken())return `<section class="screen">${simpleHead('تسجيل الدخول مطلوب')}<div class="page-wrap forms"><div class="empty-state rich-empty"><strong>سجّل الدخول لإكمال الطلب</strong><span>بعد تسجيل الدخول سنعيدك مباشرة إلى صفحة الدفع.</span><button class="red-action full" data-nav="login">تسجيل الدخول</button></div></div></section>${bottom('cart')}`;
  const cart=state.remoteCart;const cur=cart?.currency_code||'USD';
  const subtotal=Number(cart?.subtotal??0),platformTotal=Number(cart?.total??subtotal);
  const temp=state.temporaryDelivery;const delivery=Number(temp?.delivery_total||0);const grand=platformTotal+delivery;
  const accounts=(state.spikeContent?.bank_accounts||[]).filter(a=>a?.enabled!==false);
  const transfer=state.payment==='transfer';
  const accountsHtml=transfer?`<div class="transfer-panel"><h3>بيانات التحويل</h3>${accounts.length?accounts.map(a=>`<div class="bank-account-card"><strong>${esc(a.name||'تحويل مالي')}</strong><span>${esc(a.account_name||'')}</span><b dir="ltr">${esc(a.account_number||'')}</b>${a.instructions?`<small>${esc(a.instructions)}</small>`:''}</div>`).join(''):'<div class="empty-ux">لا توجد بيانات حساب مضافة من الإدارة.</div>'}<div class="spike-inline-note" style="margin-top:10px">بعد تأكيد الطلب سترفع سند الحوالة من قسم طلباتي.</div></div>`:'';
  return `<section class="screen">${simpleHead('تأكيد الطلب والدفع')}<div class="page-wrap forms">
    <button class="delivery-address" data-action="open-addresses"><span>${icon('map-pin',20)}</span><b>${state.activeAddress?`${esc(state.activeAddress.label)} - ${esc(state.activeAddress.area)}`:'اختر عنوان التوصيل'}</b><u>تغيير</u></button>
    <div class="menu-row">${icon('truck',18)} <span>مكتب التوصيل محدد لكل منتج من التاجر</span><b>${delivery?liveMoney(delivery,cur):''}</b></div>
    <div style="font-size:12px;margin:14px 5px 0">طريقة الدفع</div><div class="radio-row"><label><input type="radio" name="pay" value="transfer" ${transfer?'checked':''}> حوالة مالية</label><label><input type="radio" name="pay" value="cod" ${state.payment==='cod'?'checked':''}> أثناء التوصيل</label></div>
    ${accountsHtml}
    <div class="shopping-invoice"><div class="invoice-line"><span>المنتجات بعد الخصومات</span><b>${liveMoney(platformTotal,cur)}</b></div><div class="invoice-line"><span>رسوم مكتب التوصيل</span><b>${delivery?liveMoney(delivery,cur):'تحسب عند التأكيد'}</b></div><div class="invoice-total"><span>الإجمالي مع التوصيل</span><strong>${liveMoney(grand,cur)}</strong></div></div>
    <button class="red-action full" data-action="pay">تأكيد الطلب</button></div></section>${bottom('cart')}`;
};

success=function(){
  const transfer=state.lastPlacedPaymentMethod==='transfer'||state.payment==='transfer';
  return `<section class="screen">${simpleHead('تم إنشاء الطلب')}<div class="page-wrap"><div class="success-card"><div class="check">✓</div><h2>تم إضافة الطلب إلى طلباتك</h2><p style="font-size:12px;line-height:1.8">${transfer?'الرجاء إرسال سند التحويل من تفاصيل الطلب حتى تتم مراجعته واعتماد الطلب.':'طلبك قيد مراجعة الإدارة.'}</p><button class="black-action full" data-nav="orders">الذهاب لطلباتي</button><button class="black-action full" style="margin-top:10px" data-nav="home">الرجوع للرئيسية</button></div></div></section>${bottom('cart')}`;
};
