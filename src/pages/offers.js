function offerPrices(p){
  const current=Number(p?.priceNumeric||parsePrice(p?.price)||0);
  const original=Number(p?.originalNumeric||0)>current?Number(p.originalNumeric):Number(p?.old?parsePrice(p.old):0);
  return {current,original};
}
function offerDiscountPercent(p){
  const {current,original}=offerPrices(p);
  if(!original||!current||original<=current)return 0;
  return Math.round(((original-current)/original)*100);
}

function offerSort(list){
  const mode=state.offersSort||'discount_desc';
  return [...list].sort((a,b)=>{
    if(mode==='price_asc')return offerPrices(a).current-offerPrices(b).current;
    if(mode==='price_desc')return offerPrices(b).current-offerPrices(a).current;
    if(mode==='rating_desc')return Number(b.rating||0)-Number(a.rating||0);
    if(mode==='newest')return Number(new Date(b.raw?.created_at||0))-Number(new Date(a.raw?.created_at||0));
    return offerDiscountPercent(b)-offerDiscountPercent(a);
  })
}

function spikeDiscountProducts(){return products.filter(p=>offerDiscountPercent(p)>0)}
window.spikeDiscountProducts=spikeDiscountProducts;

function offers(){
  let list=spikeDiscountProducts();
  if(state.offersDiscount>0)list=list.filter(p=>offerDiscountPercent(p)>=state.offersDiscount);
  if(state.offersPrice==='under5')list=list.filter(p=>offerPrices(p).current<5);
  if(state.offersPrice==='5to25')list=list.filter(p=>offerPrices(p).current>=5&&offerPrices(p).current<=25);
  if(state.offersPrice==='over25')list=list.filter(p=>offerPrices(p).current>25);
  if(state.offersRating>0)list=list.filter(p=>Number(p.rating)>=state.offersRating);
  list=offerSort(list);
  return `<section class="screen">${simpleHead('العروض والخصومات',{sortAction:'offers-filter',sortLabel:'فلترة وترتيب',sortIcon:'⌯'})}<div class="page-wrap"><div class="product-grid">${list.map(card).join('')}</div>${!list.length?'<div class="empty-ux">لا توجد عروض فعالة حالياً</div>':''}</div>${offersFilterSheet()}</section>${bottom('offers')}`
}

function offersFilterSheet(){
  const discounts=[['0','كل العروض'],['10','خصم 10% فأكثر'],['20','خصم 20% فأكثر'],['30','خصم 30% فأكثر'],['40','خصم 40% فأكثر']];
  const prices=[['all','كل الأسعار'],['under5','أقل من $5'],['5to25','$5 – $25'],['over25','أكثر من $25']];
  const ratings=[['0','كل التقييمات'],['4','4 نجوم فأعلى'],['4.5','4.5 نجوم فأعلى']];
  const sorts=[['discount_desc','أعلى خصم'],['newest','الأحدث'],['price_asc','السعر: الأقل أولاً'],['price_desc','السعر: الأعلى أولاً'],['rating_desc','الأعلى تقييمًا']];
  return `<div class="shade ${state.offersFilterSheet?'show':''}" data-action="close-offers-filter"></div><div class="offers-filter-sheet ${state.offersFilterSheet?'show':''}"><button class="close-filter icon-button" data-action="close-offers-filter">${icon('x',20)}</button><div class="offers-filter-head"><h3>فلترة وترتيب العروض</h3><button data-action="reset-offers-filter">مسح الكل</button></div><div class="filter-group"><h4>الترتيب</h4><div class="filter-chips">${sorts.map(([v,l])=>`<button class="filter-chip ${String(state.offersSort)===v?'selected':''}" onclick="state.offersSort='${v}';render()">${l}</button>`).join('')}</div></div><div class="filter-group"><h4>نسبة الخصم</h4><div class="filter-chips">${discounts.map(([v,l])=>`<button class="filter-chip ${String(state.offersDiscount)===v?'selected':''}" data-action="offers-discount" data-value="${v}">${l}</button>`).join('')}</div></div><div class="filter-group"><h4>السعر بعد الخصم</h4><div class="filter-chips">${prices.map(([v,l])=>`<button class="filter-chip ${state.offersPrice===v?'selected':''}" data-action="offers-price" data-value="${v}">${l}</button>`).join('')}</div></div><div class="filter-group"><h4>التقييم</h4><div class="filter-chips">${ratings.map(([v,l])=>`<button class="filter-chip ${String(state.offersRating)===v?'selected':''}" data-action="offers-rating" data-value="${v}">${l}</button>`).join('')}</div></div><button class="red-action full" data-action="apply-offers-filter">عرض النتائج</button></div>`
}
