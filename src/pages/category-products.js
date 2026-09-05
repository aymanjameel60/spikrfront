function quickCategoriesLive(){return ['الكل',...categories.map(c=>c[1]),'عروض']}
function categoryProducts(){
  let list=products.slice();
  if(state.selectedCategory!=='الكل'&&state.selectedCategory!=='عروض')list=list.filter(p=>p.category===state.selectedCategory);
  if(state.selectedCategory==='عروض')list=list.filter(p=>p.old);
  list=sortProducts(list,state.productsSort);
  return `<section class="screen">${simpleHead('المنتجات',{sortAction:'products-sort'})}<div class="quick-filter-wrap"><div class="quick-filters drag-scroll">${quickCategoriesLive().map(x=>`<button class="quick-chip ${state.selectedCategory===x?'active':''}" data-action="quick-category" data-value="${x}">${x}</button>`).join('')}</div></div><div class="page-wrap"><div class="product-grid category-product-grid">${list.map(card).join('')}</div>${!list.length?'<div class="empty-ux">لا توجد منتجات في هذا القسم حالياً</div>':''}</div>${productsSortSheet()}</section>${bottom('home')}`
}
function sortProducts(list,sort){
  const out=[...list];
  if(sort==='price-low')out.sort((a,b)=>parsePrice(a.price)-parsePrice(b.price));
  if(sort==='price-high')out.sort((a,b)=>parsePrice(b.price)-parsePrice(a.price));
  if(sort==='rating')out.sort((a,b)=>Number(b.rating)-Number(a.rating));
  if(sort==='discount')out.sort((a,b)=>Number(Boolean(b.old))-Number(Boolean(a.old)));
  return out;
}
function productsSortSheet(){
  const options=[['relevance','الأكثر صلة'],['price-low','السعر: من الأقل للأعلى'],['price-high','السعر: من الأعلى للأقل'],['rating','الأعلى تقييماً'],['discount','الأعلى خصماً']];
  return `<div class="shade ${state.productsSortSheet?'show':''}" data-action="close-products-sort"></div><div class="store-sheet ${state.productsSortSheet?'show':''}"><button class="close-filter icon-button" data-action="close-products-sort">${icon('x',20)}</button><h3>الترتيب حسب</h3><div class="sort-options">${options.map(([v,l])=>`<label><span>${l}</span><input type="radio" name="products-sort" value="${v}" ${state.productsSort===v?'checked':''}></label>`).join('')}</div></div>`
}
