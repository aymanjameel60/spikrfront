/* Spike ↔ Mercur / Medusa Store API bridge — v20 full-store integration. */
const SPIKE_API={
  baseUrl:'http://localhost:9000',
  keyStorage:'spike-mercur-publishable-key',
  tokenStorage:'spike-mercur-customer-token',
  cartStorage:'spike-mercur-cart-id',
  timeoutMs:12000
};

function storageGet(k){try{return localStorage.getItem(k)||''}catch(_){return ''}}
function storageSet(k,v){try{v?localStorage.setItem(k,String(v)):localStorage.removeItem(k)}catch(_){}}
function apiPublishableKey(){return storageGet(SPIKE_API.keyStorage)}
function setApiPublishableKey(key){storageSet(SPIKE_API.keyStorage,String(key||'').trim())}
function customerToken(){return storageGet(SPIKE_API.tokenStorage)}
function setCustomerToken(token){storageSet(SPIKE_API.tokenStorage,token)}
function remoteCartId(){return storageGet(SPIKE_API.cartStorage)}
function setRemoteCartId(id){storageSet(SPIKE_API.cartStorage,id)}

function apiHeaders({auth=false,json=false}={}){
  const key=apiPublishableKey();
  if(!key)throw new Error('PUBLISHABLE_KEY_REQUIRED');
  const h={'x-publishable-api-key':key,'accept':'application/json'};
  if(json)h['content-type']='application/json';
  if(auth&&customerToken())h.authorization=`Bearer ${customerToken()}`;
  return h;
}
async function apiRequest(path,{method='GET',body,auth=false,allow404=false,noKey=false}={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),SPIKE_API.timeoutMs);
  try{
    let headers={accept:'application/json'};
    if(!noKey)headers=apiHeaders({auth,json:body!==undefined});
    else if(body!==undefined)headers['content-type']='application/json';
    if(auth&&customerToken())headers.authorization=`Bearer ${customerToken()}`;
    const res=await fetch(`${SPIKE_API.baseUrl}${path}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal});
    if(allow404&&res.status===404)return null;
    const text=await res.text();
    let data={};try{data=text?JSON.parse(text):{}}catch(_){data={raw:text}}
    if(!res.ok){const e=new Error(data?.message||data?.error||`HTTP_${res.status}`);e.status=res.status;e.data=data;throw e}
    return data;
  }finally{clearTimeout(timer)}
}
async function apiOptional(path,opts={}){try{return await apiRequest(path,{...opts,allow404:true})}catch(e){console.debug('[Spike/Mercur optional]',path,e.message);return null}}

function absoluteProductImage(src){
  if(!src)return `${A}placeholder-product.svg`;
  const v=String(src).trim();
  if(/^https?:\/\//i.test(v)||v.startsWith('data:')||v.startsWith('blob:'))return v;
  if(v.startsWith('/static/'))return `${SPIKE_API.baseUrl}${v}`;
  if(!/\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(v))return `${A}placeholder-product.svg`;
  return `${A}${v.replace(/^assets\//,'')}`;
}

function apiMoneyString(amount,currency='USD'){
  const n=Number(amount);if(!Number.isFinite(n))return '$0.00';
  const c=String(currency||'USD').toUpperCase();
  if(c==='USD')return `$${n.toFixed(2)}`;
  if(c==='SAR')return `${n.toFixed(2)} ر.س`;
  if(c==='YER')return `${Math.round(n)} ر.ي`;
  return `${n.toFixed(2)} ${c}`;
}
function calculatedAmount(cp){return cp?.calculated_amount_with_tax??cp?.calculatedAmountWithTax??cp?.calculated_amount??cp?.calculatedAmount??null}
function originalAmount(cp){return cp?.original_amount_with_tax??cp?.originalAmountWithTax??cp?.original_amount??cp?.originalAmount??null}
function extractVariantPrice(variant,region){
  const cp=variant?.calculated_price||variant?.calculatedPrice;
  if(cp){
    const amount=calculatedAmount(cp),original=originalAmount(cp),currency=cp.currency_code??cp.currencyCode??region?.currency_code??'USD';
    if(amount!=null)return {numeric:Number(amount),originalNumeric:original!=null?Number(original):null,currency,price:apiMoneyString(amount,currency),old:original!=null&&Number(original)>Number(amount)?apiMoneyString(original,currency):null};
  }
  const prices=variant?.prices||[];
  if(prices.length){const preferred=prices.find(x=>String(x.currency_code||x.currencyCode||'').toLowerCase()===String(region?.currency_code||'').toLowerCase())||prices[0];const amount=preferred.amount,currency=preferred.currency_code||preferred.currencyCode||region?.currency_code||'USD';return {numeric:Number(amount),originalNumeric:null,currency,price:apiMoneyString(amount,currency),old:null}}
  return null;
}
function optionLabel(v){const opts=v?.options||[];if(opts.length)return opts.map(o=>o.value||o.option_value||o.title).filter(Boolean).join(' / ');return v?.title||v?.sku||'الخيار'}

function sellerFromProduct(p){return p?.seller||p?.store||p?.metadata?.seller||null}
function sellerNameFromProduct(p){const s=sellerFromProduct(p);return s?.name||p?.metadata?.seller_name||p?.metadata?.store_name||'Spike'}
function sellerIdFromProduct(p){const s=sellerFromProduct(p);return s?.id||p?.metadata?.seller_id||p?.metadata?.store_id||null}
function mapMercurProduct(p,index,region){
  const variants=(p.variants||[]).map(v=>{const price=extractVariantPrice(v,region);const qty=Number(v.inventory_quantity??v.inventoryQuantity??0);const manage=v.manage_inventory??v.manageInventory;return {id:v.id,title:optionLabel(v),sku:v.sku||'',offerId:v.offer_id||v.offerId||null,stock:manage===false?999999:Math.max(0,qty),manageInventory:manage!==false,price:price?.price||'$0.00',old:price?.old||null,priceNumeric:price?.numeric??0,originalNumeric:price?.originalNumeric??null,currency:price?.currency||region?.currency_code||'USD',raw:v}});
  const priced=variants.filter(v=>v.priceNumeric>0).sort((a,b)=>a.priceNumeric-b.priceNumeric),selected=priced[0]||variants[0]||{price:'$0.00',old:null,priceNumeric:0,stock:0,currency:region?.currency_code||'USD'};
  const imgs=(p.images||[]).map(x=>x?.url||x).filter(Boolean),thumb=p.thumbnail||imgs[0]||'Rectangle 650.png';if(!imgs.length)imgs.push(thumb);
  const cats=(p.categories||[]).map(c=>c?.name).filter(Boolean),seller=sellerFromProduct(p);
  return {id:p.id||`mercur-${index}`,name:p.title||p.name||'منتج',price:selected.price,old:selected.old||undefined,rating:String((p.rating??p.metadata?.rating) || '0.0'),img:thumb,images:imgs,store:sellerNameFromProduct(p),storeId:sellerIdFromProduct(p),sellerHandle:seller?.handle||p?.metadata?.seller_handle||'',category:p.category?.name||cats[0]||'غير مصنف',categoryId:p.category?.id||(p.categories||[])[0]?.id||null,categories:cats,description:p.description||'',inventory:selected.stock,variants,selectedVariantId:selected.id||null,offerId:selected.offerId||null,currency:selected.currency,collection:p.collection||null,tags:p.tags||[],mercur:true,raw:p};
}

async function fetchMercurRegions(){const d=await apiRequest('/store/regions?limit=100');return d.regions||[]}
async function fetchMercurCurrencies(){const d=await apiRequest('/store/currencies?limit=100');return d.currencies||[]}
async function fetchMercurRegion(){const regions=state.liveRegions?.length?state.liveRegions:await fetchMercurRegions();const wanted=String(state?.settings?.currency||'USD').replace('_OLD','').replace('_NEW','').toLowerCase();return regions.find(r=>String(r.currency_code||'').toLowerCase()===wanted)||regions[0]||null}
async function fetchMercurCategories(){const d=await apiRequest('/store/product-categories?limit=100&fields=id,name,handle,parent_category_id,rank,metadata');return d.product_categories||d.categories||[]}
async function fetchMercurCollections(){const d=await apiRequest('/store/collections?limit=100&fields=id,title,handle,metadata');return d.collections||[]}
async function fetchSpikeContent(){const d=await apiOptional('/store/spike/content');return d?.spike||{}}
async function fetchMercurTags(){const d=await apiOptional('/store/product-tags?limit=100');return d?.product_tags||[]}
async function fetchMercurProducts(){
  const region=await fetchMercurRegion().catch(()=>null);const params=new URLSearchParams({limit:'100'});
  params.set('fields','*variants.calculated_price,+variants.offer_id,+variants.inventory_quantity,*variants.options,*categories,+collection,+tags,+seller');if(region?.id)params.set('region_id',region.id);
  let data;
  try{data=await apiRequest(`/store/products?${params.toString()}`)}catch(e){
    // Some Mercur versions don't expose +seller on product fields.
    params.set('fields','*variants.calculated_price,+variants.offer_id,+variants.inventory_quantity,*variants.options,*categories,+collection,+tags');
    data=await apiRequest(`/store/products?${params.toString()}`);
  }
  return (data.products||[]).map((p,i)=>mapMercurProduct(p,i,region));
}
async function fetchMercurOffers(){for(const q of ['/store/offers?limit=200&fields=id,variant_id,*prices,*product_variant.product,+seller,+metadata','/store/offers?limit=200']){const d=await apiOptional(q);if(d?.offers?.length)return d.offers}return []}
async function fetchMercurSellers(){
  for(const path of ['/store/sellers?limit=100','/store/seller?limit=100']){const d=await apiOptional(path);if(d?.sellers?.length)return d.sellers}
  return [];
}
async function fetchProductReviews(productId){if(!customerToken())return [];const d=await apiOptional(`/store/reviews?product_id=${encodeURIComponent(productId)}&limit=100`,{auth:true});return d?.reviews||[]}

function averageRating(reviews){if(!reviews?.length)return null;const vals=reviews.map(r=>Number(r.rating)).filter(Number.isFinite);return vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1):null}
function offerPriceInfo(o,wantedCurrency){
  const prices=o?.prices||o?.price_set?.prices||[];
  const wanted=String(wantedCurrency||'').toLowerCase();
  const row=prices.find(x=>String(x.currency_code||x.currencyCode||'').toLowerCase()===wanted)||prices[0];
  if(!row||row.amount==null)return null;
  const currency=row.currency_code||row.currencyCode||wantedCurrency||'USD';
  const before=Number(o?.metadata?.compare_at_price||o?.additional_data?.compare_at_price||0);
  const amount=Number(row.amount);
  return {amount,currency,before:before>amount?before:null};
}
function applyOffersToProducts(productsList,offers){
  if(!offers?.length)return;
  const byProduct=new Map(),byVariant=new Map();
  for(const o of offers){
    const vid=o.variant_id||o.product_variant?.id||o.variant?.id;
    if(vid)byVariant.set(String(vid),o);
    const pid=o.product_id||o.product_variant?.product_id||o.product_variant?.product?.id||o.product?.id;
    if(pid){if(!byProduct.has(String(pid)))byProduct.set(String(pid),[]);byProduct.get(String(pid)).push(o)}
  }
  productsList.forEach(p=>{
    const list=[...(byProduct.get(String(p.id))||[])];
    for(const v of p.variants||[]){const o=byVariant.get(String(v.id));if(o&&!list.includes(o))list.push(o)}
    if(!list.length)return;p.offers=list;
    for(const v of p.variants||[]){const o=byVariant.get(String(v.id))||list.find(x=>String(x.variant_id||x.product_variant?.id||'')===String(v.id));if(!o)continue;if(!v.offerId)v.offerId=o.id;const info=offerPriceInfo(o,v.currency||p.currency);if(info){v.priceNumeric=Number(info.amount)||0;v.price=apiMoneyString(v.priceNumeric,info.currency);v.currency=info.currency;if(info.before){v.originalNumeric=info.before;v.old=apiMoneyString(info.before,info.currency)}}}
    const selected=(p.variants||[]).filter(v=>Number(v.priceNumeric)>0).sort((a,b)=>a.priceNumeric-b.priceNumeric)[0]||p.variants?.find(v=>v.offerId)||p.variants?.[0];
    if(selected){p.selectedVariantId=selected.id;p.offerId=selected.offerId||p.offerId;p.priceNumeric=Number(selected.priceNumeric||0);p.originalNumeric=selected.originalNumeric;p.price=selected.price;p.old=selected.old||undefined;p.currency=selected.currency}
    const first=list[0];p.store=first?.seller?.name||p.store;p.storeId=first?.seller?.id||p.storeId;p.sellerHandle=first?.seller?.handle||p.sellerHandle;
  });
}
function categoryImage(i){const imgs=['Rectangle 642-3.png','Rectangle 642-2.png','Rectangle 642-1.png','Rectangle 642.png','Rectangle 650.png','Rectangle 646.png','Rectangle 645.png','Rectangle 644.png','Frame 43549-5.png','Frame 43549-4.png'];return imgs[i%imgs.length]}
function applyLiveCategories(list){state.liveCategories=list||[];categories.splice(0,categories.length,...(list||[]).map((c,i)=>[categoryImage(i),c.name||c.handle||'قسم',c.id,c.handle]))}
function mapSellerToStore(s,i){return {id:s.id||s.handle||`seller-${i}`,name:s.name||s.store_name||s.handle||`متجر ${i+1}`,handle:s.handle||'',rating:String(s.rating||s.reviews_rating||'0.0'),reviews:Number(s.reviews_count||s.reviews?.length||0),category:s.category||'عام',banner:s.photo||s.banner||s.image||'Rectangle 636.png',logoText:(s.name||s.handle||'STORE').slice(0,8).toUpperCase(),logo:s.logo||null,products:products.filter(p=>p.storeId===s.id||p.sellerHandle===s.handle||p.store===s.name).map(p=>p.id),raw:s}}
function rebuildStores(liveSellers=[]){
  const mapped=liveSellers.map(mapSellerToStore);
  const seen=new Set(mapped.map(s=>s.name));
  products.forEach((p,i)=>{if(!seen.has(p.store)){mapped.push({id:p.storeId||`derived-${i}`,name:p.store,rating:p.rating||'0.0',reviews:0,category:p.category||'عام',banner:'Rectangle 636.png',logoText:String(p.store||'STORE').slice(0,8).toUpperCase(),products:products.filter(x=>x.store===p.store).map(x=>x.id),handle:p.sellerHandle||'',raw:null});seen.add(p.store)}});
  storesData.splice(0,storesData.length,...mapped);
  state.liveSellers=mapped;
}

async function syncMercurAll({silent=false}={}){
  state.backend=state.backend||{};state.backend.status='loading';state.backend.message='مزامنة Mercur';if(!silent&&typeof render==='function')render();
  try{
    const [regions,currencies,cats,collections,tags,sellers,offers,remote,spikeContent]=await Promise.all([
      fetchMercurRegions().catch(()=>[]),fetchMercurCurrencies().catch(()=>[]),fetchMercurCategories().catch(()=>[]),fetchMercurCollections().catch(()=>[]),fetchMercurTags().catch(()=>[]),fetchMercurSellers().catch(()=>[]),fetchMercurOffers().catch(()=>[]),fetchMercurProducts(),fetchSpikeContent().catch(()=>({}))
    ]);
    state.liveRegions=regions;state.liveCurrencies=currencies;state.liveCollections=collections;state.spikeContent=spikeContent||{};state.liveTags=tags;applyLiveCategories(cats);applyOffersToProducts(remote,offers);
    products.splice(0,products.length,...remote);rebuildStores(sellers);
    state.cartItems=state.cartItems.filter(item=>products.some(p=>p.id===item.id));
    state.backend.status='connected';state.backend.message=`${remote.length} منتج • ${cats.length} قسم • ${storesData.length} متجر`;
    state.lastSync=new Date().toISOString();
    await Promise.all([syncCustomer({silent:true}),syncRemoteCart({silent:true}),syncOrders({silent:true}),syncWishlist({silent:true}),syncNotifications({silent:true})]);
  }catch(err){state.backend.status=err?.message==='PUBLISHABLE_KEY_REQUIRED'?'needs-key':'error';state.backend.message=state.backend.status==='needs-key'?'أضف Publishable API Key':`تعذر الاتصال بـ Mercur — ${err.message||'خطأ اتصال'}`;if(!silent)console.warn('[Spike/Mercur]',err)}
  if(typeof render==='function')render();
}
async function syncMercurProducts(opts={}){return syncMercurAll(opts)}

// ---------- Customer auth/profile ----------
async function loginCustomer(email,password){
  const d=await apiRequest('/auth/customer/emailpass',{method:'POST',body:{email,password},noKey:true});
  const token=d.token||d.access_token;if(!token)throw new Error('لم يرجع Mercur رمز تسجيل دخول');setCustomerToken(token);state.loggedIn=true;await syncCustomer({silent:true});await syncOrders({silent:true});await syncWishlist({silent:true});await syncNotifications({silent:true});return d;
}
async function registerCustomer({email,password,first_name='',last_name=''}){
  const a=await apiRequest('/auth/customer/emailpass/register',{method:'POST',body:{email,password},noKey:true});const token=a.token||a.access_token;if(!token)throw new Error('تعذر إنشاء رمز الحساب');setCustomerToken(token);
  await apiRequest('/store/customers',{method:'POST',auth:true,body:{email,first_name,last_name}});state.loggedIn=true;await syncCustomer({silent:true});return a;
}
function logoutCustomer(){setCustomerToken('');state.remoteCustomer=null;state.loggedIn=false;state.liveOrders=[];setRemoteCartId('')}
async function syncCustomer({silent=false}={}){if(!customerToken())return null;try{const d=await apiRequest('/store/customers/me?fields=*addresses',{auth:true});const c=d.customer;if(c){state.remoteCustomer=c;state.loggedIn=true;state.userProfile={...state.userProfile,name:[c.first_name,c.last_name].filter(Boolean).join(' ')||state.userProfile.name,email:c.email||state.userProfile.email,phone:c.phone||state.userProfile.phone};if(c.addresses?.length){state.addresses=c.addresses.map((a,i)=>({id:a.id,label:a.city||a.country_code||'عنوان',area:a.province||a.address_name||'',details:a.address_1||'',line2:a.address_2||'',landmark:a.metadata?.landmark||'',phone:a.phone||'',type:a.metadata?.type||'home',raw:a}));state.activeAddress=state.addresses.find(a=>a.id===c.default_shipping_address_id)||state.addresses[0]}}return c}catch(e){if(e.status===401){logoutCustomer()}if(!silent)throw e;return null}}
async function saveRemoteAddress(addr){if(!customerToken())return null;const body={first_name:state.remoteCustomer?.first_name||state.userProfile.name?.split(' ')[0]||'Customer',last_name:state.remoteCustomer?.last_name||state.userProfile.name?.split(' ').slice(1).join(' ')||'',phone:addr.phone||state.userProfile.phone,address_1:addr.details,address_2:addr.line2||'',city:addr.label||'Sanaa',province:addr.area||'',country_code:'ye',postal_code:'',metadata:{landmark:addr.landmark||'',type:addr.type||'home',latitude:addr.latitude??addr.raw?.metadata?.latitude??null,longitude:addr.longitude??addr.raw?.metadata?.longitude??null,google_maps_url:addr.google_maps_url||''}};if(addr.id?.startsWith('caaddr_')||addr.raw){return apiRequest(`/store/customers/me/addresses/${addr.id}`,{method:'POST',auth:true,body})}return apiRequest('/store/customers/me/addresses',{method:'POST',auth:true,body})}

// ---------- Customer notifications ----------
async function syncNotifications({silent=false}={}){if(!customerToken()){state.notifications=[];return []}try{const d=await apiRequest('/store/spike/notifications',{auth:true});state.notifications=(d.notifications||[]).map(n=>({...n,route:n.entity_type==='order'&&n.entity_id?'order-details':'notifications'}));return state.notifications}catch(e){if(!silent)throw e;return []}}
async function markNotificationRead(id){if(!id)return;await apiOptional(`/store/spike/notifications/${id}`,{method:'POST',auth:true});const n=state.notifications.find(x=>x.id===id);if(n)n.read=true}
// ---------- Wishlist ----------
async function syncWishlist({silent=false}={}){return null}
async function setRemoteWishlist(productId,add=true){return null}

// ---------- Remote cart ----------
async function ensureRemoteCart(){let id=remoteCartId();if(id){const d=await apiOptional(`/store/carts/${id}`,{});if(d?.cart){state.remoteCart=d.cart;return d.cart}setRemoteCartId('')}
  const region=await fetchMercurRegion();if(!region?.id)throw new Error('لا توجد Region في Mercur');const body={region_id:region.id};if(state.remoteCustomer?.email)body.email=state.remoteCustomer.email;const d=await apiRequest('/store/carts',{method:'POST',body});setRemoteCartId(d.cart.id);state.remoteCart=d.cart;return d.cart}
function localItemProductId(li){return li.product_id||li.product?.id||products.find(p=>p.variants?.some(v=>v.id===li.variant_id))?.id}
function syncLocalCartFromRemote(cart){if(!cart)return;state.remoteCart=cart;const mapped=(cart.items||[]).map(li=>({id:localItemProductId(li),qty:Number(li.quantity||1),lineItemId:li.id,variantId:li.variant_id,offerId:li.metadata?.offer_id||li.offer_id})).filter(x=>x.id&&products.some(p=>p.id===x.id));state.cartItems=mapped}
async function applyCouponCode(code){const cart=await ensureRemoteCart();const c=String(code||'').trim().toUpperCase();if(!c)throw new Error('اكتب كود الكوبون');const d=await apiRequest(`/store/carts/${cart.id}/promotions`,{method:'POST',body:{promo_codes:[c]}});syncLocalCartFromRemote(d.cart);state.appliedCoupon=c;return d.cart}
async function uploadTransferReceipt(file){if(!file)throw new Error('ارفع إيصال التحويل أولاً');if(!/^image\/(png|jpeg|jpg|webp)$/i.test(file.type||''))throw new Error('الإيصال يجب أن يكون صورة PNG أو JPG أو WEBP');if(file.size>5*1024*1024)throw new Error('حجم الإيصال يجب ألا يتجاوز 5MB');const cart=await ensureRemoteCart();const dataUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('تعذر قراءة ملف الإيصال'));r.readAsDataURL(file)});const d=await apiRequest('/store/spike/payment-receipts',{method:'POST',auth:true,body:{cart_id:cart.id,filename:file.name,data_url:dataUrl}});state.paymentReceipt=d.receipt||null;return d.receipt}
async function linkReceiptToOrder(order){if(!order?.id)return;const cartId=state.paymentReceipt?.cart_id;if(cartId)await apiOptional('/store/spike/payment-receipts',{method:'POST',auth:true,body:{cart_id:cartId,order_id:order.id}});await apiOptional('/store/spike/notifications',{method:'POST',auth:true,body:{type:'order_created',order_id:order.id}});await syncNotifications({silent:true})}
async function syncRemoteCart({silent=false}={}){const id=remoteCartId();if(!id)return null;try{const d=await apiRequest(`/store/carts/${id}`);syncLocalCartFromRemote(d.cart);return d.cart}catch(e){if(e.status===404)setRemoteCartId('');if(!silent)throw e;return null}}
async function addRemoteCartItem(productId,qty=1){const p=getProduct(productId);if(!p)throw new Error('المنتج غير موجود');const cart=await ensureRemoteCart();const selected=(p.variants||[]).find(v=>v.id===state.selectedVariant)||(p.variants||[]).find(v=>v.id===p.selectedVariantId)||p.variants?.[0];const offerId=selected?.offerId||p.offerId;if(!offerId)throw new Error('هذا المنتج غير متاح للبيع حالياً — لا يوجد Offer صالح');const d=await apiRequest(`/store/carts/${cart.id}/line-items`,{method:'POST',body:{offer_id:offerId,quantity:qty}});syncLocalCartFromRemote(d.cart);return d.cart}
async function updateRemoteCartItem(productId,newQty){const cart=await ensureRemoteCart();const row=state.cartItems.find(x=>x.id===productId);let lineId=row?.lineItemId;if(!lineId){await syncRemoteCart();lineId=state.cartItems.find(x=>x.id===productId)?.lineItemId}if(!lineId)return addRemoteCartItem(productId,newQty);if(newQty<=0){const d=await apiRequest(`/store/carts/${cart.id}/line-items/${lineId}`,{method:'DELETE'});syncLocalCartFromRemote(d.parent||d.cart);return d}const d=await apiRequest(`/store/carts/${cart.id}/line-items/${lineId}`,{method:'POST',body:{quantity:newQty}});syncLocalCartFromRemote(d.cart);return d.cart}
async function fetchShippingOptions(){const cart=await ensureRemoteCart();const d=await apiOptional(`/store/shipping-options?cart_id=${encodeURIComponent(cart.id)}`);state.shippingOptions=d?.shipping_options||[];return state.shippingOptions}
async function applyActiveAddressToCart(){
  const cart=await ensureRemoteCart();
  const a=state.activeAddress?.raw||state.activeAddress;
  if(!a)return cart;
  const shipping_address={
    first_name:a.first_name||state.remoteCustomer?.first_name||'Customer',
    last_name:a.last_name||state.remoteCustomer?.last_name||'',
    phone:a.phone||state.userProfile?.phone||'',
    address_1:a.address_1||a.details||'',address_2:a.address_2||a.line2||'',
    city:a.city||a.label||'Sanaa',province:a.province||a.area||'',
    country_code:String(a.country_code||'ye').toLowerCase(),postal_code:a.postal_code||''
  };
  const d=await apiRequest(`/store/carts/${cart.id}`,{method:'POST',body:{shipping_address}});
  if(d?.cart)syncLocalCartFromRemote(d.cart);return d?.cart||cart;
}
async function chooseCheapestShipping(){
  let cart=await applyActiveAddressToCart();
  const city=state.activeAddress?.raw?.city||state.activeAddress?.city||cart?.shipping_address?.city||'';
  const latitude=Number(state.activeAddress?.latitude??state.activeAddress?.raw?.metadata?.latitude);
  const longitude=Number(state.activeAddress?.longitude??state.activeAddress?.raw?.metadata?.longitude);
  let primaryError=null;
  try{
    const d=await apiRequest('/store/spike/checkout/shipping',{method:'POST',body:{cart_id:cart.id,city,latitude,longitude}});
    if(d?.cart){syncLocalCartFromRemote(d.cart);cart=d.cart}
    state.spikeDeliverySelection=d?.selected||[];
    state.spikeDeliveryTotal=Number(d?.delivery_total||0);
    const methods=d?.cart?.shipping_methods||[];
    const first=d?.selected?.[0]||null;
    if(methods.length||first){state.selectedShippingOption=first?.shipping_option_id||first?.option?.id||methods[0]?.shipping_option_id||null;return {cart:d?.cart||cart,option:first,selected:d?.selected||[]}}
  }catch(e){primaryError=e;console.warn('[Spike checkout shipping primary]',e)}
  // Some Mercur sellers have no native shipping option/profile. In that case Spike
  // stores its own shipment metadata and marks the line items as externally shipped,
  // so Medusa no longer blocks checkout with "no shipping method selected".
  try{
    const temp=await apiRequest('/store/spike/checkout/temporary-delivery',{method:'POST',body:{cart_id:cart.id,city,latitude,longitude}});
    state.spikeDeliverySelection=temp?.shipments||[];
    state.spikeDeliveryTotal=Number(temp?.delivery_total||0);
    await syncRemoteCart({silent:true});
    return {cart:state.remoteCart||cart,option:{id:'spike_external_delivery'},selected:temp?.shipments||[]};
  }catch(tempError){
    console.warn('[Spike checkout shipping external fallback]',tempError);
    try{
      const opts=await fetchShippingOptions();
      if(opts.length){const cheapest=[...opts].sort((a,b)=>Number(a.amount??Infinity)-Number(b.amount??Infinity))[0];const d=await apiRequest(`/store/carts/${cart.id}/shipping-methods`,{method:'POST',body:{option_id:cheapest.id}});if(d?.cart)syncLocalCartFromRemote(d.cart);state.selectedShippingOption=cheapest.id;return {cart:d?.cart||cart,option:cheapest}}
    }catch(nativeError){console.warn('[Spike checkout native fallback]',nativeError)}
    throw tempError?.message?tempError:(primaryError||new Error('تعذر تجهيز الشحن لهذا الطلب'));
  }
}
async function fetchPaymentProviders(cart){
  const regionId=cart?.region_id||cart?.region?.id;
  const qs=regionId?`?region_id=${encodeURIComponent(regionId)}`:'';
  const d=await apiOptional(`/store/payment-providers${qs}`);
  return d?.payment_providers||d?.providers||[];
}
function selectPaymentProvider(providers){
  const wanted=state.payment==='cod'?['cod','cash','manual','system']:['transfer','manual','system'];
  return providers.find(p=>wanted.some(k=>String(p.id||p.provider_id||'').toLowerCase().includes(k)))||providers[0]||null;
}
async function ensurePaymentForCart(){
  const cart=await ensureRemoteCart();
  let pc=cart.payment_collection||cart.paymentCollection||null;
  if(!pc){
    const made=await apiRequest('/store/payment-collections',{method:'POST',body:{cart_id:cart.id}});
    pc=made.payment_collection||made.paymentCollection||made;
  }
  const providers=await fetchPaymentProviders(cart);
  const provider=selectPaymentProvider(providers);
  if(!provider)throw new Error('لا توجد طريقة دفع مفعلة في Mercur بعد');
  const providerId=provider.id||provider.provider_id;
  const sessions=pc.payment_sessions||pc.paymentSessions||[];
  if(!sessions.some(x=>(x.provider_id||x.providerId)===providerId)){
    const d=await apiRequest(`/store/payment-collections/${pc.id}/payment-sessions`,{method:'POST',body:{provider_id:providerId}});
    pc=d.payment_collection||d.paymentCollection||pc;
  }
  state.paymentCollection=pc;state.selectedPaymentProvider=providerId;return pc;
}
async function prepareRemoteCheckout(){
  const shipping=await chooseCheapestShipping();
  await ensurePaymentForCart();
  await syncRemoteCart({silent:true});
  return {cart:state.remoteCart,shippingOption:shipping.option};
}
function isCompletedCartError(error){return /already completed|cart .* completed|completed cart/i.test(String(error?.message||error||''))}
async function recoverCompletedCartOrder(cartId){
  if(!cartId)return null;
  const byCart=await apiOptional(`/store/orders?cart_id=${encodeURIComponent(cartId)}&limit=5&fields=*items`,{auth:true});
  const rows=byCart?.orders||[];
  return rows.find(o=>o.cart_id===cartId||o.cart?.id===cartId)||rows[0]||null;
}
async function finalizeCompletedCheckout(order,cartId,idemKey){
  if(!order?.id)return null;
  try{await linkReceiptToOrder(order)}catch(e){console.warn('[Spike checkout post-complete linking]',e)}
  state.lastPlacedOrder=order;
  state.paymentReceipt=null;
  state.receiptUpload=null;
  if(idemKey)storageSet(idemKey,'');
  if(!cartId||remoteCartId()===cartId)setRemoteCartId('');
  state.remoteCart=null;
  state.cartItems=[];
  await syncOrders({silent:true});
  return order;
}
async function completeRemoteCart(){
  const cart=await ensureRemoteCart();
  const cartId=cart.id;
  const idemKey=`spike-checkout-${cartId}`;
  let idem=storageGet(idemKey);
  if(!idem){idem=(crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`);storageSet(idemKey,idem)}
  try{
    if(state.payment==='transfer'){
      if(!state.receiptUpload&&!state.paymentReceipt)throw new Error('ارفع إيصال التحويل أولاً');
      if(!state.paymentReceipt)await uploadTransferReceipt(state.receiptUpload);
    }
    await prepareRemoteCheckout();
    await apiOptional(`/store/carts/${cartId}`,{method:'POST',body:{metadata:{...(state.remoteCart?.metadata||{}),spike_idempotency_key:idem,spike_payment_review:'pending'}}});
    const d=await apiRequest(`/store/carts/${cartId}/complete`,{method:'POST'});
    if(d.type==='order'||d.order)return finalizeCompletedCheckout(d.order,cartId,idemKey);
    throw new Error(d.error?.message||'تعذر إكمال الطلب بعد تهيئة الشحن والدفع');
  }catch(error){
    if(isCompletedCartError(error)){
      const existing=await recoverCompletedCartOrder(cartId).catch(()=>null);
      if(existing)return finalizeCompletedCheckout(existing,cartId,idemKey);
      // Never keep a completed cart id around. This prevents every later retry
      // from failing while also avoiding silently creating a duplicate order.
      storageSet(idemKey,'');
      setRemoteCartId('');
      state.remoteCart=null;
      throw new Error('تم إكمال هذه السلة مسبقًا. حدّث الطلبات قبل إعادة المحاولة حتى لا يتم إنشاء طلب مكرر.');
    }
    throw error;
  }
}

// ---------- Orders ----------
function mapOrder(o){const li=o.items?.[0]||{};const status=String(o.status||o.fulfillment_status||'pending').toLowerCase();const ar=status.includes('cancel')?'ملغي':status.includes('deliver')||status.includes('complete')?'تم التوصيل':status.includes('ship')?'تم الشحن':status.includes('process')||status.includes('fulfill')?'قيد التجهيز':'تم التأكيد';return {id:o.display_id||o.id,status:ar,date:new Date(o.created_at||Date.now()).toLocaleString('ar-YE'),product:li.product_title||li.title||'طلب',price:apiMoneyString(o.total??li.total??0,o.currency_code||'USD'),image:li.thumbnail||'placeholder-product.svg',store:li.metadata?.seller_name||'Spike',raw:o}}
async function syncOrders({silent=false}={}){if(!customerToken())return [];const d=await apiOptional('/store/orders?limit=100&fields=*items',{auth:true});const orders=d?.orders||[];state.liveOrders=orders.map(mapOrder);if(orders.length){currentOrders.splice(0,currentOrders.length,...state.liveOrders.filter(o=>!['تم التوصيل','ملغي'].includes(o.status)));previousOrders.splice(0,previousOrders.length,...state.liveOrders.filter(o=>['تم التوصيل','ملغي'].includes(o.status)))}return orders}

// ---------- Reviews ----------
async function syncProductRating(productId){const reviews=await fetchProductReviews(productId);const p=getProduct(productId);if(p){p.reviews=reviews;const avg=averageRating(reviews);if(avg)p.rating=avg}return reviews}
async function createProductReview({productId,orderId,rating,note}){return apiRequest('/store/reviews',{method:'POST',auth:true,body:{order_id:orderId,reference:'product',reference_id:productId,rating:Number(rating),customer_note:note||''}})}

function backendStatusChip(){const b=state.backend||{status:'loading',message:'جاري الاتصال بـ Mercur'};const cls=b.status==='connected'?'connected':b.status==='loading'?'loading':'warning';const action=b.status==='connected'?'backend-refresh':'backend-connect';return `<div class="backend-status-wrap"><button class="backend-status ${cls}" data-action="${action}"><span></span><b>${esc(b.message||'Mercur')}</b><small>${b.status==='connected'?'تحديث الكل':'ربط'}</small></button></div>`}


// Spike v10.16: single checkout entry point used by router.
async function completeSpikeCheckout(){
  if(!customerToken()) throw new Error('سجّل الدخول أولاً لإكمال الطلب');
  if(!state.cartItems?.length && !(state.remoteCart?.items||[]).length) throw new Error('السلة فارغة');
  if(state.payment==='transfer' && !state.receiptUpload && !state.paymentReceipt) throw new Error('ارفع إيصال التحويل أولاً');
  try {
    const order=await completeRemoteCart();
    if(!order?.id) throw new Error('لم يتم إنشاء رقم طلب من الخادم');
    return order;
  } catch(e){
    console.error('[Spike checkout]',e);
    throw new Error(e?.message||'فشل إنشاء الطلب. لم يتم تفريغ السلة.');
  }
}
window.completeSpikeCheckout=completeSpikeCheckout;
