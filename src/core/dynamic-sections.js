/* Admin-driven Spike categories, collections and home sections. */
(function(){
  function rows(key){return (Array.isArray(state.spikeContent?.[key])?state.spikeContent[key]:[]).filter(x=>x&&x.enabled!==false).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0))}
  function cats(){return rows('spike_categories')}
  function cols(){return rows('spike_collections')}
  function secs(){return rows('home_sections')}
  function mappedItems(s){const ids=(s.item_ids||[]).map(String);if(!ids.length)return[];return products.filter(p=>ids.includes(String(p.id)))}
  function productList(s){
    const direct=mappedItems(s);if(direct.length)return direct;
    let list=products.slice();
    const target=s.reference_id||s.target_id;
    if(s.content_type==='category'){
      const c=cats().find(x=>String(x.id)===String(target));const n=c?.name||target;
      list=list.filter(p=>String(p.categoryId||p.category_id||'')===String(target)||p.category===n||p.categories?.includes(n));
    }
    if(s.content_type==='collection'){
      const c=cols().find(x=>String(x.id)===String(target));
      const ids=(c?.products||[]).map(x=>String(x.id));
      if(ids.length)list=list.filter(p=>ids.includes(String(p.id)));
      else list=list.filter(p=>String(p.collection?.id||'')===String(target));
    }
    return list.slice(0,Number(s.item_limit||100));
  }
  function body(s,full=false){
    if(['products','category','collection'].includes(s.content_type)){
      const list=productList(s);if(!list.length)return '<div class="empty-ux">لا توجد عناصر في هذا القسم</div>';
      return full?`<div class="product-grid category-product-grid">${list.map(card).join('')}</div>`:`<div class="product-strip drag-scroll">${list.map(card).join('')}</div>`;
    }
    if(s.content_type==='stores'){
      const ids=(s.item_ids||[]).map(String),list=ids.length?storesData.filter(x=>ids.includes(String(x.id))):storesData.slice(0,Number(s.item_limit||12));
      return list.length?`<div class="brands drag-scroll">${list.map(x=>`<button class="brand" data-action="open-store" data-store="${x.id}">${esc(x.logoText||x.name)}</button>`).join('')}</div>`:'<div class="empty-ux">لا توجد متاجر</div>';
    }
    return '';
  }
  function homeSections(){return secs().map(s=>`<section class="section spike-custom-section" data-section-id="${esc(s.id)}"><div class="title-row"><h2>${esc(s.title)}</h2><button data-action="custom-section-more" data-id="${esc(s.id)}">عرض الكل</button></div>${body(s,false)}</section>`).join('')}
  function customPage(id){const s=secs().find(x=>String(x.id)===String(id));if(!s)return `<section class="screen">${simpleHead('القسم')}<div class="page-wrap"><div class="empty-ux">القسم غير موجود</div></div></section>${bottom('home')}`;return `<section class="screen">${simpleHead(s.title)}<div class="page-wrap" style="padding-top:8px">${body(s,true)}</div></section>${bottom('home')}`}

  const baseHome=window.home;
  if(typeof baseHome==='function')window.home=function(){const html=baseHome();const dynamic=homeSections();return dynamic?html.replace('</section><nav class="bottom-nav"',dynamic+'</section><nav class="bottom-nav"'):html};

  const baseCategories=window.categoriesPage;
  if(typeof baseCategories==='function')window.categoriesPage=function(){const list=cats();if(!list.length)return baseCategories();const roots=list.filter(x=>!x.parent_id);const renderCat=c=>`<button class="cat" data-action="open-spike-category" data-id="${esc(c.id)}">${c.image_url?`<img src="${esc(c.image_url)}">`:''}<span>${esc(c.name)}</span></button>`;return `<section class="screen">${simpleHead('تسوق حسب الفئة')}<div class="page-wrap"><div class="categories" style="margin-top:5px">${(roots.length?roots:list).map(renderCat).join('')}</div></div></section>${bottom('home')}`};

  const baseRender=window.render;
  if(typeof baseRender==='function')window.render=function(){if(String(state.route||'').startsWith('custom-section:')){app.innerHTML=customPage(String(state.route).split(':')[1]);if(window.lucide)requestAnimationFrame(()=>lucide.createIcons({attrs:{'stroke-width':1.9}}));window.scrollTo({top:0,behavior:'instant'});return}return baseRender()};

  document.addEventListener('click',e=>{const el=e.target.closest?.('[data-action]');if(!el)return;const a=el.dataset.action;if(a==='custom-section-more'){go(`custom-section:${el.dataset.id}`)}else if(a==='open-spike-category'){const c=cats().find(x=>String(x.id)===String(el.dataset.id));if(c){state.selectedCategory=c.name;state.selectedCategoryId=c.id;state.collectionFilter=null;go('category-products')}}else if(a==='open-spike-collection'){const c=cols().find(x=>String(x.id)===String(el.dataset.id));if(c){state.collectionFilter=c.id;state.selectedCategory='الكل';go('category-products')}}},true);

  setTimeout(()=>{try{render()}catch(_){}},300);
})();
