/* Admin-driven Spike categories, collections and home sections. */
(function(){
  function rows(key){return (Array.isArray(state.spikeContent?.[key])?state.spikeContent[key]:[]).filter(x=>x&&x.enabled!==false).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0))}
  function cats(){return rows('spike_categories')}
  function cols(){return rows('spike_collections')}
  function secs(){return rows('home_sections')}
  function productList(s){
    let list=products.slice(); const ids=(s.item_ids||[]).map(String);
    if(s.content_type==='products'&&ids.length)list=list.filter(p=>ids.includes(String(p.id)));
    if(s.content_type==='category'){
      const c=cats().find(x=>String(x.id)===String(s.target_id)); const n=c?.name||s.target_id;
      list=list.filter(p=>String(p.categoryId||'')===String(s.target_id)||p.category===n||p.categories?.includes(n));
    }
    if(s.content_type==='collection'){
      const c=cols().find(x=>String(x.id)===String(s.target_id)); const n=c?.name||s.target_id;
      list=list.filter(p=>String(p.collection?.id||'')===String(s.target_id)||p.collection?.title===n||p.collection?.handle===n);
    }
    return list;
  }
  function body(s,full=false){
    if(['products','category','collection'].includes(s.content_type)){
      const list=productList(s); return full?`<div class="product-grid category-product-grid">${list.map(card).join('')}</div>`:`<div class="product-strip drag-scroll">${list.slice(0,10).map(card).join('')}</div>`;
    }
    if(s.content_type==='stores'){
      const ids=(s.item_ids||[]).map(String),list=ids.length?storesData.filter(x=>ids.includes(String(x.id))):storesData;
      return `<div class="brands drag-scroll">${list.map(x=>`<button class="brand" data-action="open-store" data-store="${x.id}">${esc(x.logoText||x.name)}</button>`).join('')}</div>`;
    }
    if(s.content_type==='categories'){
      const ids=(s.item_ids||[]).map(String),list=ids.length?cats().filter(x=>ids.includes(String(x.id))):cats();
      return `<div class="categories">${list.map(c=>`<button class="cat" data-action="open-spike-category" data-id="${esc(c.id)}"><img src="${esc(c.image_url)}"><span>${esc(c.name)}</span></button>`).join('')}</div>`;
    }
    const ids=(s.item_ids||[]).map(String),list=ids.length?cols().filter(x=>ids.includes(String(x.id))):cols();
    return `<div class="categories">${list.map(c=>`<button class="cat" data-action="open-spike-collection" data-id="${esc(c.id)}">${c.image_url?`<img src="${esc(c.image_url)}">`:''}<span>${esc(c.name)}</span></button>`).join('')}</div>`;
  }
  function homeSections(){return secs().map(s=>`<section class="section spike-custom-section" data-section-id="${esc(s.id)}"><div class="title-row"><h2>${esc(s.title)}</h2><button data-action="custom-section-more" data-id="${esc(s.id)}">المزيد</button></div>${body(s,false)}</section>`).join('')}
  function customPage(id){const s=secs().find(x=>String(x.id)===String(id));if(!s)return `<section class="screen">${simpleHead('القسم')}<div class="page-wrap"><div class="empty-ux">القسم غير موجود</div></div></section>${bottom('home')}`;return `<section class="screen">${simpleHead(s.title)}<div class="page-wrap" style="padding-top:8px">${body(s,true)}</div></section>${bottom('home')}`}

  const baseHome=window.home;
  if(typeof baseHome==='function')window.home=function(){const html=baseHome();const dynamic=homeSections();return dynamic?html.replace('</section><nav class="bottom-nav"',dynamic+'</section><nav class="bottom-nav"'):html};

  const baseCategories=window.categoriesPage;
  if(typeof baseCategories==='function')window.categoriesPage=function(){const list=cats();if(!list.length)return baseCategories();return `<section class="screen">${simpleHead('تسوق حسب الفئة')}<div class="page-wrap"><div class="categories" style="margin-top:5px">${list.map(c=>`<button class="cat" data-action="open-spike-category" data-id="${esc(c.id)}"><img src="${esc(c.image_url)}"><span>${esc(c.name)}</span></button>`).join('')}</div></div></section>${bottom('home')}`};

  const baseRender=window.render;
  if(typeof baseRender==='function')window.render=function(){if(String(state.route||'').startsWith('custom-section:')){app.innerHTML=customPage(String(state.route).split(':')[1]);if(window.lucide)requestAnimationFrame(()=>lucide.createIcons({attrs:{'stroke-width':1.9}}));window.scrollTo({top:0,behavior:'instant'});return}return baseRender()};

  document.addEventListener('click',e=>{const el=e.target.closest?.('[data-action]');if(!el)return;const a=el.dataset.action;if(a==='custom-section-more'){go(`custom-section:${el.dataset.id}`)}else if(a==='open-spike-category'){const c=cats().find(x=>String(x.id)===String(el.dataset.id));if(c){state.selectedCategory=c.name;go('category-products')}}else if(a==='open-spike-collection'){const c=cols().find(x=>String(x.id)===String(el.dataset.id));if(c?.target_type==='category'){const cat=cats().find(x=>String(x.id)===String(c.target_id));state.selectedCategory=cat?.name||'الكل';go('category-products')}else if(c?.target_type==='section'){go(`custom-section:${c.target_id}`)}}},true);

  setTimeout(()=>{try{render()}catch(_){}},300);
})();
