function render(){
  let html='';
  switch(state.route){
    case'home':html=home();break;
    case'categories':html=categoriesPage();break;
    case'category-products':html=categoryProducts();break;
    case'addresses':html=addressesPage();break;
    case'address-form':html=addressFormPage();break;
    case'offers':html=offers();break;
    case'stores':html=stores();break;
    case'store-details':html=storeDetails();break;
    case'favorites':html=favorites();break;
    case'cart':html=cart();break;
    case'profile':html=profile();break;
    case'personal-data':html=personalDataPage();break;
    case'checkout':html=checkout();break;
    case'success':html=success();break;
    case'login':html=auth('login');break;
    case'signup':html=auth('signup');break;
    case'support':html=support();break;
    case'privacy':html=privacy();break;
    case'orders':html=orders();break;
    case'order-details':html=orderDetails();break;
    case'notifications':html=notificationsPage();break;
    case'settings':html=settings();break;
    default:html=state.route.startsWith('product:')?product(state.route.split(':')[1]):home();
  }
  app.innerHTML=html;
  if(window.lucide) requestAnimationFrame(()=>lucide.createIcons({attrs:{'stroke-width':1.9}}));
  window.scrollTo({top:0,behavior:'instant'});
}

function go(route,push=true){
  if(state.route==='settings'&&route!=='settings'){
    state.settingsDraft=null;
    previewTheme(state.settings.theme);
  }
  if(route==='logout'){logoutCustomer();route='login'}
  if(push&&state.route!==route)state.history.push(state.route);
  state.route=route;
  state.filter=false;
  state.offersFilterSheet=false;
  state.ordersFilter=false;
  state.storeFilter=false;
  state.storeSortSheet=false;
  state.productsSortSheet=false;
  state.storesFilterSheet=false;
  state.storesSortSheet=false;
  state.personalEditOpen=false;
  state.phoneEditOpen=false;
  state.phoneOtpStep='phone';
  state.pendingPhone='';
  state.settingsCurrencySheet=false;
  state.currencySheet=false;
  render();
}

app.addEventListener('click',async e=>{
  const nav=e.target.closest('[data-nav]');
  if(nav){
    const target=nav.dataset.nav;
    if(target==='checkout'&&!customerToken()){
      state.afterLoginRoute='checkout';
      showToast('سجّل الدخول أولاً لإكمال الطلب');
      go('login');
      return;
    }
    go(target);if(target==='checkout'){loadSpikeCheckoutOptions().then(()=>render()).catch(err=>{spikeCheckoutState().error=err.message||'تعذر تحميل التوصيل';render()})}return
  }

  const act=e.target.closest('[data-action]');
  if(act){
    const a=act.dataset.action;
    if(a==='back')go(state.history.pop()||'home',false);
    else if(a==='filter'){state.filter=true;render()}
    else if(a==='closefilter'){state.filter=false;render()}
    else if(a==='applyfilter'){state.filter=false;showToast('تم تطبيق الفلتر');render()}
    else if(a==='fav'){const id=act.dataset.id;const add=!state.favs.has(id);add?state.favs.add(id):state.favs.delete(id);render();if(customerToken()){try{await setRemoteWishlist(id,add)}catch(err){console.warn(err);showToast('المفضلة محلياً — تعذر مزامنتها الآن')}}}
    else if(a==='add'){const id=act.dataset.id;try{await addRemoteCartItem(id,1);showToast('تمت الإضافة إلى السلة');render()}catch(err){console.warn(err);showToast(err.message||'تعذر إضافة المنتج إلى السلة')}}
    else if(a==='clearfavs'){state.favs.clear();render()}
    else if(a==='cart-plus'){const id=act.dataset.id;const row=state.cartItems.find(x=>x.id===id);const q=(row?.qty||0)+1;try{await updateRemoteCartItem(id,q);render()}catch(err){showToast(err.message||'تعذر تحديث الكمية')}}
    else if(a==='cart-minus'){const id=act.dataset.id;const row=state.cartItems.find(x=>x.id===id);const q=(row?.qty||1)-1;try{await updateRemoteCartItem(id,q);render()}catch(err){showToast(err.message||'تعذر تحديث الكمية')}}
    else if(a==='cart-remove'){const id=act.dataset.id;try{await updateRemoteCartItem(id,0);showToast('تم حذف المنتج');render()}catch(err){showToast(err.message||'تعذر حذف المنتج')}}
    else if(a==='move-favorite'){const id=act.dataset.id;state.favs.add(id);try{await updateRemoteCartItem(id,0)}catch(err){showToast(err.message||'تعذر تحديث السلة');return}showToast('تم حفظ المنتج في المفضلة');render()}
    else if(a==='toggle-note'){state.noteOpen=!state.noteOpen;render()}
    else if(a==='change-address')go('addresses')
    else if(a==='apply-coupon'){const input=document.getElementById('coupon-code');const code=(input?.value||'').trim();try{act.disabled=true;await applyCouponCode(code);showToast('تم تطبيق الكوبون');render()}catch(err){act.disabled=false;showToast(err.message||'الكوبون غير صالح')}}
    else if(a==='pay'){if(!customerToken()){state.afterLoginRoute='checkout';showToast('سجّل الدخول أولاً لإكمال الطلب');go('login');return}try{act.disabled=true;showToast('جاري إنشاء الطلب...');await completeSpikeCheckout();showToast('تم إنشاء الطلب بنجاح');go('success')}catch(err){act.disabled=false;showToast(err.message||'تعذر إتمام الطلب')}}
    else if(a==='auth'){const email=(document.getElementById('auth-email')?.value||'').trim();const password=document.getElementById('auth-password')?.value||'';const mode=act.dataset.mode||'login';if(!email||!password){showToast('أدخل البريد وكلمة المرور');return}try{if(mode==='signup'){const name=(document.getElementById('auth-name')?.value||'').trim();const parts=name.split(/\s+/);await registerCustomer({email,password,first_name:parts.shift()||'',last_name:parts.join(' ')})}else await loginCustomer(email,password);showToast(mode==='signup'?'تم إنشاء الحساب':'تم تسجيل الدخول');const next=state.afterLoginRoute||'home';state.afterLoginRoute=null;go(next)}catch(err){showToast(err.message||'تعذر تسجيل الدخول')}}
    else if(a==='contact')showToast('تم اختيار وسيلة التواصل');
    else if(a==='currency'||a==='open-currency'){state.currencySheet=true;render()}
    else if(a==='close-currency'){state.currencySheet=false;render()}
    else if(a==='select-home-currency'){state.settings.currency=act.dataset.value;state.currencySheet=false;try{localStorage.setItem('storm-settings',JSON.stringify(state.settings))}catch(e){}try{if(customerToken())await SpikeCommerce.req('/cart/meta',{method:'PUT',auth:true,body:{currency_code:state.settings.currency}});await refreshSpikeCatalog()}catch(err){console.warn(err)}showToast('تم تغيير العملة');render()}
    else if(a==='open-addresses')go('addresses');
    else if(a==='select-address'){const addr=state.addresses.find(x=>x.id===act.dataset.id);if(addr){state.activeAddress=addr;showToast('تم تغيير عنوان التوصيل');go(state.history.pop()||'home',false)}}
    else if(a==='edit-address'){const addr=state.addresses.find(x=>x.id===act.dataset.id);state.editingAddressId=act.dataset.id;state.addressFormType=addr?.type||'home';state.addressFormDefault=state.activeAddress?.id===act.dataset.id;go('address-form')}
    else if(a==='add-address'){state.editingAddressId=null;state.addressFormType='home';state.addressFormDefault=false;go('address-form')}
    else if(a==='address-type'){state.addressFormType=act.dataset.value;document.querySelectorAll('.address-type').forEach(x=>x.classList.toggle('active',x.dataset.value===state.addressFormType))}
    else if(a==='toggle-default-address'){state.addressFormDefault=!state.addressFormDefault;act.querySelector('.switch')?.classList.toggle('on',state.addressFormDefault)}
    else if(a==='cancel-address'){go(state.history.pop()||'addresses',false)}
    else if(a==='save-address'){saveAddressFromForm()}
    else if(a==='banner-target'){const t=act.dataset.type,target=act.dataset.target;if(t==='product'){state.selectedProduct=target;go('product:'+target)}else if(t==='category'){const c=state.liveCategories?.find(x=>x.id===target);state.selectedCategory=c?.name||target;go('category-products')}else if(t==='collection'){state.collectionFilter=target;state.selectedCategory='الكل';go('category-products')}}
    else if(a==='open-category'){state.selectedCategory=act.dataset.value||'الكل';go('category-products')}
    else if(a==='quick-category'){state.selectedCategory=act.dataset.value;render()}
    else if(a==='select-variant'){state.selectedVariant=act.dataset.value;render()}
    else if(a==='notify')go('notifications');
    else if(a==='notifications-all'){state.notificationFilter='all';state.notificationMenu=false;render()}
    else if(a==='notifications-unread'){state.notificationFilter='unread';state.notificationMenu=false;render()}
    else if(a==='notification-menu'){state.notificationMenu=!state.notificationMenu;render()}
    else if(a==='mark-all-read'){await markAllNotificationsRead();state.notificationMenu=false;showToast('تم تحديد الكل كمقروء');render()}
    else if(a==='clear-notifications'){state.notifications=[];state.notificationMenu=false;showToast('تم إخفاء الإشعارات من هذه الجلسة');render()}
    else if(a==='open-notification'){const n=state.notifications.find(x=>x.id===act.dataset.id);if(n){await markNotificationRead(n.id);if(n.entity_type==='order'&&n.entity_id){state.selectedOrder=n.entity_id;go('order-details')}else go(n.route||'notifications')}}
    else if(a==='note')showToast('تم حفظ الملاحظة');
    else if(a==='edit-personal'){state.personalEditOpen=true;state.pendingProfileAvatar=null;render()}
    else if(a==='close-personal-edit'){state.personalEditOpen=false;state.pendingProfileAvatar=null;render()}
    else if(a==='save-personal-edit'){savePersonalProfile()}
    else if(a==='edit-phone'){state.phoneEditOpen=true;state.phoneOtpStep='phone';state.pendingPhone='';render()}
    else if(a==='close-phone-edit'){state.phoneEditOpen=false;state.phoneOtpStep='phone';state.pendingPhone='';render()}
    else if(a==='send-phone-otp'){sendPhoneOtp()}
    else if(a==='resend-phone-otp'){sendPhoneOtp()}
    else if(a==='phone-back-to-number'){state.phoneOtpStep='phone';render()}
    else if(a==='verify-phone-otp'){verifyPhoneOtp()}
    else if(a==='collection-filter'){state.collectionFilter=act.dataset.id||null;state.selectedCategory='الكل';go('category-products')}
    else if(a==='external-banner'){const u=act.dataset.url||'';if(/^https?:\/\//i.test(u))window.open(u,'_blank','noopener,noreferrer')}
    else if(a==='reload-spike-delivery'){try{await loadSpikeCheckoutOptions();render()}catch(err){showToast(err.message||'تعذر تحميل مكاتب التوصيل')}}
    else if(a==='spike-office'){const cs=spikeCheckoutState();cs.selected[act.dataset.storeKey]=act.value;render()}
    else if(a==='load-shipping'){try{await fetchShippingOptions();showToast(state.shippingOptions?.length?'تم تحميل خيارات الشحن':'لا توجد خيارات شحن لهذه السلة');render()}catch(err){showToast(err.message||'تعذر تحميل الشحن')}}
    else if(a==='offers-filter'){state.offersFilterSheet=true;render()}
    else if(a==='close-offers-filter'){state.offersFilterSheet=false;render()}
    else if(a==='offers-discount'){state.offersDiscount=Number(act.dataset.value);render()}
    else if(a==='offers-price'){state.offersPrice=act.dataset.value;render()}
    else if(a==='offers-rating'){state.offersRating=Number(act.dataset.value);render()}
    else if(a==='reset-offers-filter'){state.offersDiscount=0;state.offersPrice='all';state.offersRating=0;render()}
    else if(a==='apply-offers-filter'){state.offersFilterSheet=false;showToast('تم تطبيق فلتر العروض');render()}
    else if(a==='products-sort'){state.productsSortSheet=true;render()}
    else if(a==='close-products-sort'){state.productsSortSheet=false;render()}
    else if(a==='stores-category'){state.storesCategory=act.dataset.value;render()}
    else if(a==='stores-filter'){state.storesFilterSheet=true;state.storesSortSheet=false;render()}
    else if(a==='close-stores-filter'){state.storesFilterSheet=false;render()}
    else if(a==='apply-stores-filter'){state.storesFilterSheet=false;showToast('تم تطبيق فلتر المتاجر');render()}
    else if(a==='stores-sort'){state.storesSortSheet=true;state.storesFilterSheet=false;render()}
    else if(a==='close-stores-sort'){state.storesSortSheet=false;render()}
    else if(a==='settings-theme'){ensureSettingsDraft();state.settingsDraft.theme=act.dataset.value;previewTheme(state.settingsDraft.theme);render()}
    else if(a==='settings-language'){ensureSettingsDraft();state.settingsDraft.language=act.dataset.value;render()}
    else if(a==='currency-sheet'){ensureSettingsDraft();state.settingsCurrencySheet=true;render()}
    else if(a==='currency-sheet-close'){state.settingsCurrencySheet=false;render()}
    else if(a==='settings-currency'){ensureSettingsDraft();state.settingsDraft.currency=act.dataset.value;state.settingsCurrencySheet=false;render()}
    else if(a==='save-settings'){ensureSettingsDraft();state.settings={...state.settingsDraft};state.settingsDraft=null;try{localStorage.setItem('storm-settings',JSON.stringify(state.settings))}catch(e){}applySettings();if(customerToken())try{await SpikeCommerce.req('/cart/meta',{method:'PUT',auth:true,body:{currency_code:state.settings.currency}})}catch(err){console.warn(err)}showToast(state.settings.language==='ar'?'تم حفظ التعديلات':'Changes saved');render()}
    else if(a==='orders-current'){state.ordersTab='current';render()}
    else if(a==='orders-previous'){state.ordersTab='previous';render()}
    else if(a==='orders-filter'){state.ordersFilter=true;render()}
    else if(a==='close-orders-filter'){state.ordersFilter=false;render()}
    else if(a==='select-order-status'){state.orderStatusFilter=act.dataset.value;render()}
    else if(a==='select-order-date'){state.orderDateFilter=act.dataset.value;render()}
    else if(a==='reset-orders-filter'){state.orderStatusFilter='الكل';state.orderDateFilter=null;render()}
    else if(a==='apply-orders-filter'){state.ordersFilter=false;showToast('تم تطبيق الفلتر');render()}
    else if(a==='open-order'){state.selectedOrder=act.dataset.order;go('order-details')}
    else if(a==='invoice')showToast('تم تجهيز الفاتورة');
    else if(a==='reorder'){const p=products[0];if(p){try{await addRemoteCartItem(p.id,1)}catch(err){showToast(err.message||'تعذر إعادة الطلب');return}}go('cart')}
    else if(a==='open-store'){state.selectedStore=act.dataset.store;state.storeCategory='الكل';state.storeSort='relevance';state.storeProductSearch='';go('store-details')}
    else if(a==='toggle-follow-store'){const id=act.dataset.store;state.followedStores.has(id)?state.followedStores.delete(id):state.followedStores.add(id);showToast(state.followedStores.has(id)?'تمت متابعة المتجر':'تم إلغاء متابعة المتجر');render()}
    else if(a==='store-filter'){state.storeFilter=true;state.storeSortSheet=false;render()}
    else if(a==='close-store-filter'){state.storeFilter=false;render()}
    else if(a==='store-category'){state.storeCategory=act.dataset.value;render()}
    else if(a==='apply-store-filter'){state.storeFilter=false;showToast('تم تطبيق فلتر المتجر');render()}
    else if(a==='store-sort'){state.storeSortSheet=true;state.storeFilter=false;render()}
    else if(a==='close-store-sort'){state.storeSortSheet=false;render()}
  }

  const prod=e.target.closest('.product-card');
  if(prod&&!e.target.closest('button')&&!e.target.closest('.card-gallery[data-just-swiped="1"]')){state.productGalleryIndex=0;go('product:'+prod.dataset.product);syncProductRating(prod.dataset.product).then(()=>render()).catch(()=>{});}
});

function changeCardGallery(gallery,step){
  if(!gallery)return;
  const raw=(gallery.dataset.gallery||'').split('|').filter(Boolean);
  if(raw.length<2)return;
  let index=Number(gallery.dataset.galleryIndex||0);
  index=(index+step+raw.length)%raw.length;
  gallery.dataset.galleryIndex=String(index);
  const img=gallery.querySelector('.card-gallery-img');
  gallery.classList.add('is-changing');
  window.setTimeout(()=>{
    if(img)img.src=absoluteProductImage(decodeURIComponent(raw[index]));
    gallery.querySelectorAll('.card-gallery-dots i').forEach((dot,i)=>dot.classList.toggle('active',i===index));
    window.setTimeout(()=>gallery.classList.remove('is-changing'),90);
  },70);
}

let cardSwipe=null;
app.addEventListener('pointerdown',e=>{
  const gallery=e.target.closest('.card-gallery');
  if(!gallery || e.target.closest('button'))return;
  const raw=(gallery.dataset.gallery||'').split('|').filter(Boolean);
  if(raw.length<2)return;
  cardSwipe={gallery,startX:e.clientX,startY:e.clientY,lastX:e.clientX,moved:false,pointerId:e.pointerId};
  gallery.classList.add('is-dragging');
  try{gallery.setPointerCapture(e.pointerId)}catch(_){}
});
app.addEventListener('pointermove',e=>{
  if(!cardSwipe || e.pointerId!==cardSwipe.pointerId)return;
  const dx=e.clientX-cardSwipe.startX;
  const dy=e.clientY-cardSwipe.startY;
  cardSwipe.lastX=e.clientX;
  if(Math.abs(dx)>6 && Math.abs(dx)>Math.abs(dy))cardSwipe.moved=true;
});
function finishCardSwipe(e){
  if(!cardSwipe || e.pointerId!==cardSwipe.pointerId)return;
  const {gallery,startX,lastX,moved}=cardSwipe;
  const dx=lastX-startX;
  gallery.classList.remove('is-dragging');
  if(moved && Math.abs(dx)>=32){
    gallery.dataset.justSwiped='1';
    changeCardGallery(gallery,dx<0?1:-1);
    window.setTimeout(()=>delete gallery.dataset.justSwiped,220);
  }
  cardSwipe=null;
}
app.addEventListener('pointerup',finishCardSwipe);
app.addEventListener('pointercancel',finishCardSwipe);

app.addEventListener('wheel',e=>{
  const gallery=e.target.closest('.card-gallery');
  if(!gallery)return;
  if(Math.abs(e.deltaX)<8 && !e.shiftKey)return;
  e.preventDefault();
  changeCardGallery(gallery,(e.deltaX||e.deltaY)>0?1:-1);
},{passive:false});

let detailSwipe=null;
app.addEventListener('pointerdown',e=>{
  const gallery=e.target.closest('.swipe-detail');
  if(!gallery || e.target.closest('button'))return;
  const raw=(gallery.dataset.detailGallery||'').split('|').filter(Boolean);if(raw.length<2)return;
  detailSwipe={gallery,startX:e.clientX,lastX:e.clientX,pointerId:e.pointerId,moved:false};
  gallery.classList.add('is-dragging');try{gallery.setPointerCapture(e.pointerId)}catch(_){}
});
app.addEventListener('pointermove',e=>{if(!detailSwipe||e.pointerId!==detailSwipe.pointerId)return;detailSwipe.lastX=e.clientX;if(Math.abs(detailSwipe.lastX-detailSwipe.startX)>7)detailSwipe.moved=true});
function finishDetailSwipe(e){
  if(!detailSwipe||e.pointerId!==detailSwipe.pointerId)return;
  const dx=detailSwipe.lastX-detailSwipe.startX;detailSwipe.gallery.classList.remove('is-dragging');
  if(detailSwipe.moved&&Math.abs(dx)>=34){const raw=(detailSwipe.gallery.dataset.detailGallery||'').split('|').filter(Boolean);let i=Number(detailSwipe.gallery.dataset.galleryIndex||0);i=(i+(dx<0?1:-1)+raw.length)%raw.length;state.productGalleryIndex=i;const img=detailSwipe.gallery.querySelector('.detail-gallery-img');if(img)img.src=absoluteProductImage(decodeURIComponent(raw[i]));detailSwipe.gallery.dataset.galleryIndex=String(i);detailSwipe.gallery.querySelectorAll('.detail-gallery-dots i').forEach((d,n)=>d.classList.toggle('active',n===i));}
  detailSwipe=null;
}
app.addEventListener('pointerup',finishDetailSwipe);app.addEventListener('pointercancel',finishDetailSwipe);

app.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&e.target.matches('[data-action="search"]')){const q=e.target.value.trim().toLowerCase();state.searchQuery=q;state.selectedCategory='الكل';if(q){state.searchResults=products.filter(p=>p.name.toLowerCase().includes(q)||p.description?.toLowerCase().includes(q)||p.store?.toLowerCase().includes(q));showToast(`${state.searchResults.length} نتيجة`)}go('category-products')}
  if(e.key==='Enter'&&e.target.matches('[data-action="store-search"]')){const term=e.target.value.trim();showToast(term?`نتائج البحث عن: ${term}`:'اكتب اسم متجر للبحث')}
  if(e.key==='Enter'&&e.target.matches('[data-action="store-product-search"]')){const term=e.target.value.trim();showToast(term?`نتائج داخل المتجر: ${term}`:'اكتب اسم منتج للبحث')}
});

app.addEventListener('input',e=>{
  if(e.target.matches('[data-action="store-search"]')){state.storesSearch=e.target.value.trim();const pos=e.target.selectionStart;render();const n=document.querySelector('[data-action="store-search"]');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(_){}}}
  if(e.target.matches('[data-action="store-product-search"]')){state.storeProductSearch=e.target.value.trim();const pos=e.target.selectionStart;render();const n=document.querySelector('[data-action="store-product-search"]');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(_){}}}
});

app.addEventListener('change',e=>{
  if(e.target.name==='pay'){state.payment=e.target.value;render()}
  if(e.target.id==='transfer-receipt-input'){const f=e.target.files&&e.target.files[0];if(f&&!f.type.startsWith('image/')){showToast('اختر صورة للإيصال');e.target.value='';state.receiptUpload=null}else{state.receiptUpload=f||null;state.paymentReceipt=null;render()}}
  if(e.target.name==='store-sort'){state.storeSort=e.target.value;state.storeSortSheet=false;render()}
  if(e.target.name==='products-sort'){state.productsSort=e.target.value;state.productsSortSheet=false;render()}
  if(e.target.name==='stores-sort'){state.storesSort=e.target.value;state.storesSortSheet=false;render()}
  if(e.target.name==='stores-rating'){state.storesMinRating=Number(e.target.value);}
  if(e.target.id==='profile-image-input'){readProfileImage(e.target.files&&e.target.files[0])}
});

function readProfileImage(file){
  if(!file)return;
  if(!file.type.startsWith('image/')){showToast('اختر ملف صورة');return}
  const reader=new FileReader();
  reader.onload=()=>{state.pendingProfileAvatar=reader.result;const preview=document.getElementById('profile-preview');if(preview)preview.src=reader.result};
  reader.readAsDataURL(file);
}
async function savePersonalProfile(){
  const name=(document.getElementById('profile-name-input')?.value||'').trim();
  if(!name){showToast('أدخل الاسم');return}
  try{
    if(customerToken()){await SpikeCommerce.req('/me',{method:'PUT',auth:true,body:{name}});await syncCustomer({silent:true})}
    else state.userProfile.name=name;
    if(state.pendingProfileAvatar)state.userProfile.avatar=state.pendingProfileAvatar;
    state.pendingProfileAvatar=null;state.personalEditOpen=false;showToast('تم تحديث الملف الشخصي');render();
  }catch(err){showToast(err.message||'تعذر تحديث الملف الشخصي')}
}

function sendPhoneOtp(){
  showToast('تغيير رقم الجوال عبر OTP يحتاج ربط مزود رسائل SMS قبل تفعيله');
}
function verifyPhoneOtp(){
  showToast('خدمة التحقق من الجوال غير مفعلة حتى يتم ربط مزود SMS');
}

async function saveAddressFromForm(){
  if(typeof window.saveRemoteAddress!=='function'){showToast('تعذر تحميل خدمة العناوين');return}
  if(!customerToken()){showToast('سجّل الدخول أولاً لحفظ العنوان');go('login');return}
  const old=state.editingAddressId?state.addresses.find(x=>x.id===state.editingAddressId):null;
  const details=(document.getElementById('address-line1')?.value||'').trim();
  const line2=(document.getElementById('address-line2')?.value||'').trim();
  const landmark=(document.getElementById('address-landmark')?.value||'').trim();
  const city=(document.getElementById('address-city')?.value||'').trim();
  const maps=(document.getElementById('address-maps')?.value||'').trim();
  const phone=(document.getElementById('address-phone')?.value||'').trim();
  if(!details||!city||!phone||!maps){showToast('أكمل العنوان والمدينة والجوال ورابط Google Maps');return}
  try{
    const saved=await saveRemoteAddress({...(old||{}),id:old?.id,label:city,details:[details,line2,landmark].filter(Boolean).join(' - '),phone,type:state.addressFormType||'home',google_maps_url:maps});
    state.editingAddressId=null;
    await syncCustomer({silent:true});
    state.activeAddress=state.addresses.find(x=>x.id===saved?.id)||state.activeAddress;
    showToast('تم حفظ العنوان وتحديد الموقع تلقائيًا');
    go('addresses',false);
  }catch(err){showToast(err.message||'تعذر حفظ العنوان')}
}

function ensureSettingsDraft(){
  if(!state.settingsDraft)state.settingsDraft={...state.settings};
}
function previewTheme(theme){
  document.body.classList.toggle('theme-dark',theme==='dark');
}
function applySettings(){
  previewTheme(state.settings.theme);
  document.documentElement.lang=state.settings.language;
  document.documentElement.dir=state.settings.language==='ar'?'rtl':'ltr';
}
applySettings();

let dragState=null;
app.addEventListener('mousedown',e=>{const el=e.target.closest('.drag-scroll');if(!el)return;dragState={el,startX:e.pageX,left:el.scrollLeft,moved:false};el.classList.add('dragging')});
window.addEventListener('mousemove',e=>{if(!dragState)return;const dx=e.pageX-dragState.startX;if(Math.abs(dx)>4)dragState.moved=true;dragState.el.scrollLeft=dragState.left-dx});
window.addEventListener('mouseup',()=>{if(!dragState)return;dragState.el.classList.remove('dragging');dragState=null});

render();
refreshSpikeCatalog().catch(err=>console.warn('Spike startup',err));
if(customerToken()){
  syncCustomer({silent:true}).catch(()=>{});
  syncRemoteCart({silent:true}).catch(()=>{});
  syncOrders({silent:true}).catch(()=>{});
  syncNotifications({silent:true}).catch(()=>{});
}
