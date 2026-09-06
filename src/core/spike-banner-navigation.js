/* Central navigation for admin-configured banner destinations. */
(function(){
  document.addEventListener('click',e=>{
    const el=e.target.closest?.('[data-action="banner-target"]');if(!el)return;
    const type=el.dataset.type||'',target=el.dataset.target||'';if(!type||type==='none')return;
    e.preventDefault();e.stopPropagation();
    if(type==='product'&&target){state.productGalleryIndex=0;go('product:'+target);return}
    if(type==='category'&&target){const c=(state.liveCategories||[]).find(x=>String(x.id)===String(target))||(state.spikeContent?.spike_categories||[]).find(x=>String(x.id)===String(target));state.selectedCategory=c?.name||target;go('category-products');return}
    if(type==='collection'&&target){state.collectionFilter=target;state.selectedCategory='الكل';go('category-products');return}
    if(type==='store'&&target){state.selectedStore=target;state.storeCategory='الكل';state.storeSort='relevance';state.storeProductSearch='';go('store-details');return}
    if(type==='internal'&&target){const route=String(target).replace(/^\/+|\/+$/g,'');const allowed=['home','categories','offers','stores','favorites','cart','profile','orders','notifications','settings','support'];if(allowed.includes(route)||route.startsWith('custom-section:'))go(route);else showToast('وجهة البنر غير متاحة');}
  },true);
})();
