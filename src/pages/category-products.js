function quickCategoriesLive(){
  const live=(Array.isArray(state.liveCategories)?state.liveCategories:[]).filter(c=>c&&c.enabled!==false).map(c=>c.name).filter(Boolean);
  const fallback=categories.map(c=>c[1]).filter(Boolean);
  return ['الكل',...[...new Set(live.length?live:fallback)],'عروض']
}
function categoryProducts(){
  let list=products.slice();
  if(state.selectedCategory!=='الكل'&&state.selectedCategory!=='عروض')list=list.filter(p=>p.category===state.selectedCategory||String(p.categoryId)===String(state.selectedCategory));
  if(state.selectedCategory==='عروض')list=list.filter(p=>Number(p.originalNumeric||0)>Number(p.priceNumeric||0)&&Number(p.priceNumeric||0)>0);
  list=sortProducts(list,state.productsSort);
  return `<section class="screen">${simpleHead('المنتجات',{sortAction:'products-sort'})}<div class="quick-filter-wrap"><div class="quick-filters drag-scroll">${quickCategoriesLive().map(x=>`<button class="quick-chip ${state.selectedCategory===x?'active':''}" data-action="quick-category" data-value="${esc(x)}">${esc(x)}</button>`).join('')}</div></div><div class="page-wrap"><div class="product-grid category-product-grid">${list.map(card).join('')}</div>${!list.length?'<div class="empty-ux">لا توجد منتجات في هذا القسم حالياً</div>':''}</div>${productsSortSheet()}</section>${bottom('home')}`
}
function sortProducts(list,sort){
  const out=[...list];
  const price=p=>Number(p.priceNumeric||parsePrice(p.price)||0);
  if(sort==='price-low')out.sort((a,b)=>price(a)-price(b));
  if(sort==='price-high')out.sort((a,b)=>price(b)-price(a));
  if(sort==='rating')out.sort((a,b)=>Number(b.review_average??b.rating??0)-Number(a.review_average??a.rating??0));
  if(sort==='discount')out.sort((a,b)=>((Number(b.originalNumeric||0)-price(b))/Math.max(Number(b.originalNumeric||0),1))-((Number(a.originalNumeric||0)-price(a))/Math.max(Number(a.originalNumeric||0),1)));
  return out;
}
function productsSortSheet(){
  const options=[['relevance','الأكثر صلة'],['price-low','السعر: من الأقل للأعلى'],['price-high','السعر: من الأعلى للأقل'],['rating','الأعلى تقييماً'],['discount','الأعلى خصماً']];
  return `<div class="shade ${state.productsSortSheet?'show':''}" data-action="close-products-sort"></div><div class="store-sheet ${state.productsSortSheet?'show':''}"><button class="close-filter icon-button" data-action="close-products-sort">${icon('x',20)}</button><h3>الترتيب حسب</h3><div class="sort-options">${options.map(([v,l])=>`<label><span>${l}</span><input type="radio" name="products-sort" value="${v}" ${state.productsSort===v?'checked':''}></label>`).join('')}</div></div>`
}
