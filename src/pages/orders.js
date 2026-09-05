function orders(){
  let list=state.ordersTab==='previous'?previousOrders:currentOrders;
  if(state.orderStatusFilter!=='الكل')list=list.filter(o=>o.status===state.orderStatusFilter);
  return `<section class="screen">${simpleHead('طلباتي')}<div class="page-wrap">
    <div class="orders-toolbar"><div class="orders-tabs"><button class="order-tab ${state.ordersTab==='current'?'active':''}" data-action="orders-current">الحالية</button><button class="order-tab ${state.ordersTab==='previous'?'active':''}" data-action="orders-previous">السابقة</button></div><button class="orders-filter" data-action="orders-filter">⌯</button></div>
    <div class="orders-list">${list.length?list.map(order=>`<button class="storm-order-card" data-action="open-order" data-order="${order.id}"><div class="storm-order-top"><div class="order-status-wrap"><span class="order-status ${order.status==='تم التوصيل'?'delivered':''} ${order.status==='ملغي'?'cancelled':''}">${order.status}</span><small>${order.date}</small></div><span class="order-number">#${order.id}</span></div><div class="storm-order-product"><img src="${A}${order.image}"><div class="order-product-info"><strong>${order.product}</strong><span>${order.store}</span><b>${order.price}</b></div><span class="order-open-arrow">${icon('arrow-left',21)}</span></div></button>`).join(''):`<div class="empty-state"><strong>لا توجد طلبات مطابقة</strong><span>جرّب تغيير الفلتر أو اختيار تبويب آخر.</span></div>`}</div>
  </div>${ordersFilterSheet()}</section>${bottom('profile')}`;
}

function ordersFilterSheet(){
  const statuses=['الكل','قيد المراجعة','قيد التجهيز','تم التأكيد','تم الشحن','تم التوصيل','ملغي','مرتجع'];
  const dates=['اليوم','آخر 7 أيام','آخر 30 يوم','آخر 3 أشهر'];
  return `<div class="shade ${state.ordersFilter?'show':''}" data-action="close-orders-filter"></div><div class="orders-filter-sheet ${state.ordersFilter?'show':''}"><button class="close-filter icon-button" data-action="close-orders-filter">${icon('x',20)}</button><div class="orders-filter-head"><h3>فلترة الطلبات</h3><button data-action="reset-orders-filter">مسح الكل</button></div><div class="filter-group"><h4>الفترة الزمنية</h4><div class="filter-chips">${dates.map(d=>`<button class="filter-chip ${state.orderDateFilter===d?'selected':''}" data-action="select-order-date" data-value="${d}">${d}</button>`).join('')}</div></div><div class="filter-group"><h4>حالة الطلب</h4><div class="filter-chips">${statuses.map(s=>`<button class="filter-chip ${state.orderStatusFilter===s?'selected':''}" data-action="select-order-status" data-value="${s}">${s}</button>`).join('')}</div></div><button class="red-action full" data-action="apply-orders-filter">تطبيق الفلتر</button></div>`;
}

function orderDetails(){
  const all=[...currentOrders,...previousOrders];
  const order=all.find(o=>String(o.id)===String(state.selectedOrder))||currentOrders[0];
  if(!order)return `<section class="screen">${simpleHead('تفاصيل الطلب')}<div class="page-wrap"><div class="empty-state"><strong>الطلب غير موجود</strong></div></div></section>`;
  const raw=order.raw||{},meta=raw.metadata||{};
  const method=String(meta.spike_payment_method||'transfer');
  const review=String(meta.spike_payment_review||'pending');
  const transfer=method==='transfer';
  const paymentBox=transfer?
    (review==='approved'?`<div class="order-detail-card"><h3 class="detail-title">الدفع</h3><div class="detail-row"><span>حالة الحوالة</span><b>تم اعتماد الدفع ✓</b></div></div>`:
    review==='receipt_pending'?`<div class="order-detail-card"><h3 class="detail-title">الدفع</h3><div class="detail-row"><span>حالة الحوالة</span><b>السند قيد مراجعة الإدارة</b></div><small>سنشعرك فور اعتماد الحوالة.</small></div>`:
    `<div class="order-detail-card"><h3 class="detail-title">تثبيت الطلب</h3><p style="font-size:12px;line-height:1.8;margin:0 0 10px">طلبك تم إنشاؤه. لتثبيت الطلب أرسل سند الحوالة وسيقوم فريق Spike بمراجعته.</p><label class="red-action full" style="display:flex;justify-content:center;cursor:pointer">رفع سند الحوالة<input id="order-transfer-receipt" type="file" accept="image/png,image/jpeg,image/webp" hidden></label></div>`):
    `<div class="order-detail-card"><h3 class="detail-title">الدفع</h3><div class="detail-row"><span>طريقة الدفع</span><b>الدفع عند الاستلام</b></div><div class="detail-row"><span>المراجعة</span><b>قيد مراجعة الإدارة</b></div></div>`;
  return `<section class="screen">${simpleHead('تفاصيل الطلب')}<div class="page-wrap">
  <div class="order-detail-card order-summary"><div class="detail-head"><div><small>رقم الطلب</small><strong>#${order.id}</strong></div><span class="order-status ${order.status==='تم التوصيل'?'delivered':''}">${order.status}</span></div><div class="detail-product"><img src="${A}${order.image}"><div><strong>${order.product}</strong><span>الطلب</span><b>${order.price}</b></div></div></div>
  ${paymentBox}
  <div class="order-detail-card"><h3 class="detail-title">حالة الطلب</h3><div class="storm-timeline"><div class="timeline-step done"><i>${icon('check',16)}</i><div><strong>تم إنشاء الطلب</strong><small>${transfer&&review!=='approved'?'بانتظار اعتماد الدفع':'الطلب مسجل في النظام'}</small></div></div><span class="timeline-line"></span><div class="timeline-step ${review==='approved'||method==='cod'?'active':''}"><i>2</i><div><strong>قيد التجهيز</strong><small>يبدأ التاجر التجهيز حسب حالة الطلب</small></div></div><span class="timeline-line"></span><div class="timeline-step"><i>3</i><div><strong>مع المندوب</strong><small>تم تسليم الطلب لمكتب التوصيل</small></div></div><span class="timeline-line"></span><div class="timeline-step"><i>4</i><div><strong>تم التوصيل</strong><small>وصل الطلب إلى عنوانك</small></div></div></div></div>
  <div class="order-detail-card"><h3 class="detail-title">تفاصيل الفاتورة</h3><div class="detail-row"><span>الإجمالي</span><b>${order.price}</b></div><div class="detail-row"><span>طريقة الدفع</span><b>${transfer?'حوالة مالية':'الدفع عند الاستلام'}</b></div></div>
  <div class="order-detail-card"><h3 class="detail-title">معلومات الطلب</h3><div class="detail-row"><span>تاريخ الطلب</span><b>${order.date}</b></div><button class="invoice-btn" data-action="invoice">الحصول على الفاتورة</button></div>
  </div></section>${bottom('profile')}`;
}
