function offerDiscountPercent(p){
  if(!p.old)return 0;
  const oldPrice=parsePrice(p.old), current=parsePrice(p.price);
  if(!oldPrice||oldPrice<=current)return 0;
  return Math.round(((oldPrice-current)/oldPrice)*100);
}

function offers(){
  let list=products.filter(p=>p.old);
  if(state.offersDiscount>0)list=list.filter(p=>offerDiscountPercent(p)>=state.offersDiscount);
  if(state.offersPrice==='under5')list=list.filter(p=>parsePrice(p.price)<5);
  if(state.offersPrice==='5to25')list=list.filter(p=>parsePrice(p.price)>=5&&parsePrice(p.price)<=25);
  if(state.offersPrice==='over25')list=list.filter(p=>parsePrice(p.price)>25);
  if(state.offersRating>0)list=list.filter(p=>Number(p.rating)>=state.offersRating);
  return `<section class="screen">${simpleHead('العروض والخصومات',{sortAction:'offers-filter',sortLabel:'فلترة العروض',sortIcon:'⌯'})}<div class="page-wrap"><div class="product-grid">${list.map(card).join('')}</div>${!list.length?'<div class="empty-ux">لا توجد عروض مطابقة للفلاتر المحددة</div>':''}</div>${offersFilterSheet()}</section>${bottom('offers')}`
}

function offersFilterSheet(){
  const discounts=[['0','كل العروض'],['20','خصم 20% فأكثر'],['30','خصم 30% فأكثر'],['40','خصم 40% فأكثر']];
  const prices=[['all','كل الأسعار'],['under5','أقل من $5'],['5to25','$5 – $25'],['over25','أكثر من $25']];
  const ratings=[['0','كل التقييمات'],['4','4 نجوم فأعلى'],['4.5','4.5 نجوم فأعلى']];
  return `<div class="shade ${state.offersFilterSheet?'show':''}" data-action="close-offers-filter"></div><div class="offers-filter-sheet ${state.offersFilterSheet?'show':''}"><button class="close-filter icon-button" data-action="close-offers-filter">${icon('x',20)}</button><div class="offers-filter-head"><h3>فلترة العروض والخصومات</h3><button data-action="reset-offers-filter">مسح الكل</button></div><div class="filter-group"><h4>نسبة الخصم</h4><div class="filter-chips">${discounts.map(([v,l])=>`<button class="filter-chip ${String(state.offersDiscount)===v?'selected':''}" data-action="offers-discount" data-value="${v}">${l}</button>`).join('')}</div></div><div class="filter-group"><h4>السعر بعد الخصم</h4><div class="filter-chips">${prices.map(([v,l])=>`<button class="filter-chip ${state.offersPrice===v?'selected':''}" data-action="offers-price" data-value="${v}">${l}</button>`).join('')}</div></div><div class="filter-group"><h4>التقييم</h4><div class="filter-chips">${ratings.map(([v,l])=>`<button class="filter-chip ${String(state.offersRating)===v?'selected':''}" data-action="offers-rating" data-value="${v}">${l}</button>`).join('')}</div></div><button class="red-action full" data-action="apply-offers-filter">عرض النتائج</button></div>`
}
