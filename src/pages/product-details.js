function product(id){
  const p=products.find(x=>x.id===id)||products[0];
  if(!p)return `<section class="screen">${simpleHead('تفاصيل المنتج')}<div class="empty-ux">المنتج غير متاح حالياً</div></section>`;
  const liveVariants=(p.variants&&p.variants.length?p.variants:null);
  const variants=liveVariants||[];
  let v=variants.find(x=>x.id===state.selectedVariant)||variants.find(x=>x.id===p.selectedVariantId)||variants[0];
  if(v&&state.selectedVariant!==v.id)state.selectedVariant=v.id;
  const base=v?.priceNumeric!=null?v.priceNumeric:parsePrice(p.price);
  const old=v?.originalNumeric!=null&&v.originalNumeric>base?v.originalNumeric:(v?.oldNumeric??(p.old?parsePrice(p.old):null));
  const gallery=(p.images&&p.images.length?p.images:[p.img]);
  const gi=Math.min(state.productGalleryIndex||0,gallery.length-1);
  const store=storesData.find(s=>s.name===p.store)||null;
  const seller=store||{id:p.storeId||'',name:p.store||'Spike',logoText:String(p.store||'SPIKE').slice(0,8).toUpperCase(),rating:p.rating||'0.0',reviews:p.reviews?.length||0};
  const followed=seller.id?state.followedStores.has(seller.id):false;
  const stock=v?.stock??p.inventory??0;
  const purchasable=!!(v?.offerId||p.offerId);

  const stockText=stock>=999999?'متوفر في المخزون':stock>0?`متوفر في المخزون — ${stock} قطعة`:'غير متوفر حالياً';
  return `<section class="screen product-details-screen">${simpleHead('تفاصيل المنتج')}
    <div class="product-gallery swipe-detail" data-detail-gallery="${gallery.map(x=>encodeURIComponent(x)).join('|')}" data-gallery-index="${gi}">
      <button class="fav ${state.favs.has(p.id)?'active':''}" data-action="fav" data-id="${p.id}">${icon('heart',20)}</button>
      <img class="detail-gallery-img" src="${absoluteProductImage(gallery[gi])}" alt="${esc(p.name)}" onerror="this.onerror=null;this.src='${A}placeholder-product.svg'">
      ${gallery.length>1?`<div class="detail-gallery-dots">${gallery.map((_,i)=>`<i class="${i===gi?'active':''}"></i>`).join('')}</div>`:''}
    </div>
    <div class="product-info-block product-main-info"><button class="product-store-link" data-action="open-store" data-store="${seller.id}">${icon('store',17)}<span>${p.store}</span>${icon('arrow-left',16)}</button><h1>${p.name}</h1><div class="detail-price">${old?`<span>${money(old)}</span>`:''}<strong>${money(base)}</strong>${old?`<em>خصم ${Math.round((old-base)/old*100)}%</em>`:''}</div><div class="stock-line">${icon(stock>0?'circle-check':'circle-x',16)} ${stockText}</div></div>
    ${variants.length>1?`<div class="product-info-block"><h2>اختر الخيار</h2><div class="variant-grid">${variants.map(x=>{const xp=x.priceNumeric!=null?x.priceNumeric:parsePrice(x.price);const xs=x.stock??0;return `<button class="variant-card ${v.id===x.id?'active':''}" data-action="select-variant" data-value="${x.id}"><b>${esc(x.title||x.name||'الخيار')}</b><strong>${money(xp)}</strong><small>${xs>=999999?'متوفر':xs>0?`متبقي ${xs}`:'غير متوفر'}</small></button>`}).join('')}</div></div>`:''}
    <div class="product-info-block"><h2>التوصيل والدفع</h2><button class="delivery-address" data-action="open-addresses"><span>${icon('map-pin',20)}</span><b>${state.activeAddress?`${esc(state.activeAddress.label)} - ${esc(state.activeAddress.area)}`:'اختر عنوان التوصيل'}</b><u>تغيير</u></button><div class="deliverable ok">${icon('circle-check',17)} التوصيل متاح إلى موقعك</div><div class="service-line">${icon('banknote',17)} الدفع عند التوصيل متوفر</div><div class="service-line">${icon('rotate-ccw',17)} الإرجاع حسب سياسة ${p.store}</div></div>
    <div class="product-info-block seller-card"><div class="seller-heading"><div class="seller-logo">${seller.logoText}</div><div><small>يباع بواسطة</small><strong>${seller.name}</strong><span><span class="filled-rating-star">${icon('star',14)}</span>${seller.rating} (${seller.reviews})</span></div></div><div class="seller-actions"><button data-action="open-store" data-store="${seller.id}">${icon('store',17)} زيارة المتجر</button><button class="${followed?'active':''}" data-action="toggle-follow-store" data-store="${seller.id}">${icon(followed?'check':'plus',17)} ${followed?'متابَع':'متابعة'}</button></div></div>
    <div class="product-info-block"><h2>تفاصيل المنتج</h2><p>${esc(p.description||'لا توجد تفاصيل إضافية لهذا المنتج حالياً.')}</p></div>
    <div class="product-info-block"><h2>التقييمات</h2><div class="service-line"><span class="filled-rating-star">${icon('star',16)}</span> ${p.rating} ${p.reviews?.length?`(${p.reviews.length} تقييم من Mercur)`:'(لا توجد تقييمات منشورة بعد)'}</div>${p.reviews?.slice(0,3).map(r=>`<p><b>${r.rating}/5</b> — ${esc(r.customer_note||r.note||'بدون تعليق')}</p>`).join('')||''}</div>
    <div class="product-info-block return-policy"><h2>سياسة الإرجاع</h2><p>يمكن للبائع تحديد أهلية الإرجاع ومدته وشروطه لكل منتج. راجع الشروط قبل إتمام الطلب.</p></div>
    <div class="product-sticky"><div><small>${old?`<s>${money(old)}</s>`:''}</small><strong>${money(base)}</strong></div><button data-action="add" data-id="${p.id}" ${(stock===0||!purchasable)?'disabled':''}>${icon('shopping-bag',18)} ${stock===0?'غير متوفر':!purchasable?'غير متاح للبيع':'إضافة إلى السلة'}</button></div>
  </section>${bottom('home')}`
}
