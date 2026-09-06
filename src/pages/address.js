function addressesPage(){return `<section class="screen">${simpleHead('اختيار العنوان')}<div class="page-wrap address-page"><p class="ux-muted">اختر عنوان التوصيل النشط أو عدّل أحد العناوين المحفوظة.</p><div class="address-list">${state.addresses.map(a=>`<div class="address-choice ${state.activeAddress?.id===a.id?'active':''}"><button class="address-main" data-action="select-address" data-id="${a.id}"><span class="address-pin">${icon('map-pin',19)}</span><span><b>${esc(a.label)} - ${esc(a.area)}</b><small>${esc(a.details||'')}</small></span><i>${state.activeAddress?.id===a.id?'✓':''}</i></button><button class="address-edit" data-action="edit-address" data-id="${a.id}">تعديل</button></div>`).join('')}${!state.addresses.length?'<div class="empty-ux">لا يوجد عنوان محفوظ بعد. أضف عنوان التوصيل الأول.</div>':''}</div><button class="primary-ux-btn" data-action="add-address">+ إضافة عنوان جديد</button></div></section>`}

function addressFormPage(){const a=state.editingAddressId?state.addresses.find(x=>x.id===state.editingAddressId):null;const type=state.addressFormType||(a&&a.type)||'home',cities=Array.isArray(state.spikeCities)?state.spikeCities:[];return `<section class="screen address-form-screen">${simpleHead(a?'تعديل العنوان':'إضافة عنوان جديد')}<form class="address-form page-wrap" onsubmit="return false">
  <h2>تفاصيل العنوان</h2>
  <label class="reference-field"><span>${icon('house',19)}</span><input id="address-line1" value="${esc(a?.details||'')}" placeholder="العنوان بالتفصيل *"></label>
  <label class="reference-field"><span>${icon('building-2',19)}</span><input id="address-line2" value="${esc(a?.line2||'')}" placeholder="المنطقة / الحي (اختياري)"></label>
  <label class="reference-field"><span>${icon('landmark',19)}</span><input id="address-landmark" value="${esc(a?.landmark||'')}" placeholder="معلم بارز (اختياري)"></label>
  <label class="reference-field"><span>${icon('map',19)}</span><select id="address-city"><option value="">اختر مدينة التغطية *</option>${cities.map(c=>`<option value="${esc(c.name)}" ${String(a?.city_id||a?.raw?.city_id||'')===String(c.id)||String(a?.label||'')===String(c.name)?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label>
  <label class="reference-field"><span>${icon('map-pin',19)}</span><input id="address-maps" inputmode="url" dir="ltr" value="${esc(a?.google_maps_url||a?.raw?.google_maps_url||'')}" placeholder="رابط Google Maps للموقع *"></label>
  <p class="ux-muted">انسخ رابط موقعك من Google Maps والصقه هنا. النظام يحدد الإحداثيات تلقائياً بدون إدخالها يدوياً.</p>
  <h2>تفاصيل الاتصال</h2>
  <label class="reference-field phone-field"><span>${icon('phone',19)}</span><input id="address-phone" inputmode="tel" dir="ltr" value="${esc(a?.phone||'')}" placeholder="رقم الجوال *"><small>رقم الجوال</small></label>
  <h2>حفظ العنوان باسم</h2>
  <div class="address-type-grid">
    <button class="address-type ${type==='home'?'active':''}" data-action="address-type" data-value="home" type="button"><b>⌂</b><span>المنزل</span></button>
    <button class="address-type ${type==='office'?'active':''}" data-action="address-type" data-value="office" type="button"><b>▦</b><span>مكتب</span></button>
    <button class="address-type ${type==='other'?'active':''}" data-action="address-type" data-value="other" type="button"><b>⌖</b><span>أخرى</span></button>
  </div>
  <button class="default-address-row" data-action="toggle-default-address" type="button"><span class="default-check">✓</span><strong>تعيين كعنوان التوصيل الافتراضي</strong><i class="switch ${state.addressFormDefault?'on':''}"></i></button>
  <div class="address-form-actions"><button class="address-save" data-action="save-address" type="button">حفظ العنوان</button><button class="address-cancel" data-action="cancel-address" type="button">إلغاء</button></div>
</form></section>`}
