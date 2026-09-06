/* Admin-driven Spike categories, collections and home sections. */
(function(){
  const API='http://localhost:9100/api/v1';
  function rows(key){return (Array.isArray(state.spikeContent?.[key])?state.spikeContent[key]:[]).filter(x=>x&&x.enabled!==false).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0))}
  function cats(){return rows('spike_categories')} function cols(){return rows('spike_collections')} function secs(){return rows('home_sections')}
  const abs=v=>String(v||'').startsWith('/uploads/')?API+v:String(v||'');
  function normalizeProduct(p){if(!p)return null;const live=(window.products||[]).find(x=>String(x.id)===String(p.id));if(live)return live;if(typeof window.SpikeCommerce?.mapProduct==='function')return window.SpikeCommerce.mapProduct(p);const v=p.variants?.[0]||{};return{id:p.id,name:p.name,price:apiMoneyString(Number(v.price_usd||p.price_usd||0),'USD'),priceNumeric:Number(v.price_usd||p.price_usd||0),rating:String(p.review_average||0),img:abs(p.images?.[0]?.url||p.image_url||''),images:(p.images||[]).map(x=>abs(x.url||x)),store:p.store_name||'Spike',storeId:p.store_id,category:p.category_name||'',categoryId:p.category_id,variants:p.variants||[],selectedVariantId:v.id,inventory:Number(v.stock||0),currency:'USD',raw:p}}
  function sectionProducts(s){return (s.items||[]).map(normalizeProduct).filter(Boolean)}
  function body(s,full=false){
    const items=sectionProducts(s);
    if(['products','category','collection'].includes(s.content_type)){
      if(!items.length)return '<div class="empty-ux">لا توجد عناصر في هذا القسم</div>';
      return full?`<div class="product-grid category-product-grid">${items.map(card).join('')}</div>`:`<div class="product-strip drag-scroll">${items.map(card).join('')}</div>`
    }
    if(s.content_type==='stores'){
      const list=s.items||[];
      return list.length?`<div class="brands drag-scroll">${list.map(x=>`<button class="brand" data-action="open-store" data-store="${x.id}">${esc(x.name||'متجر')}</button>`).join('')}</div>`:'<div class="empty-ux">لا توجد متاجر</div>'
    }
    if(s.content_type==='categories'){
      const list=s.items||[];
      return list.length?`<div class="categories drag-scroll">${list.map(x=>`<button class="cat" data-action="open-spike-category" data-id="${x.id}">${x.image_url?`<img src="${abs(x.image_url)}">`:''}<span>${esc(x.name)}</span></button>`).join('')}</div>`:'<div class="empty-ux">لا توجد فئات</div>'
    }
    if(s.content_type==='collections'){
      const list=(s.items||[]).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
      return list.length?`<div class="categories drag-scroll spike-collections-strip">${list.map(x=>`<button class="cat" data-action="open-spike-collection" data-destination-type="${esc(x.destination_type||'')}" data-destination-id="${esc(x.destination_id||'')}">${x.image_url?`<img src="${abs(x.image_url)}" alt="${esc(x.name||'مجموعة')}">`:''}<span>${esc(x.name||'مجموعة')}</span></button>`).join('')}</div>`:'<div class="empty-ux">لا توجد مجموعات</div>'
    }
    return '<div class="empty-ux">لا توجد عناصر في هذا القسم</div>'
  }
  function homeSections(){return secs().filter(s=>s.content_type!=='collections').map(s=>`<section class="section spike-custom-section" data-section-id="${esc(s.id)}"><div class="title-row"><h2>${esc(s.title)}</h2>${s.show_all===false?'':`<button data-action="custom-section-more" data-id="${esc(s.id)}">عرض الكل</button>`}</div>${body(s,false)}</section>`).join('')}
  function customPage(id){const s=secs().find(x=>String(x.id)===String(id));if(!s)return `<section class="screen">${simpleHead('القسم')}<div class="page-wrap"><div class="empty-ux">القسم غير موجود</div></div></section>${bottom('home')}`;return `<section class="screen">${simpleHead(s.title)}<div class="page-wrap" style="padding-top:8px">${body(s,true)}</div></section>${bottom('home')}`}
  async function loadDynamic(){try{const [ca,co,se]=await Promise.all([fetch(API+'/categories',{cache:'no-store'}).then(r=>r.json()),fetch(API+'/collections',{cache:'no-store'}).then(r=>r.json()),fetch(API+'/home-sections',{cache:'no-store'}).then(r=>r.json())]);state.spikeContent=state.spikeContent||{};state.spikeContent.spike_categories=ca.categories||[];state.spikeContent.spike_collections=co.collections||[];state.spikeContent.home_sections=se.sections||[];render()}catch(e){console.warn('Spike dynamic content',e)}}
  const baseHome=window.home;if(typeof baseHome==='function')window.home=function(){const html=baseHome(),dynamic=homeSections();return dynamic?html.replace('</section><nav class="bottom-nav"',dynamic+'</section><nav class="bottom-nav"'):html};
  const baseCategories=window.categoriesPage;if(typeof baseCategories==='function')window.categoriesPage=function(){const list=cats();if(!list.length)return baseCategories();const roots=list.filter(x=>!x.parent_id),renderCat=c=>`<button class="cat" data-action="open-spike-category" data-id="${esc(c.id)}">${c.image_url?`<img src="${abs(c.image_url)}">`:''}<span>${esc(c.name)}</span></button>`;return `<section class="screen">${simpleHead('تسوق حسب الفئة')}<div class="page-wrap"><div class="categories" style="margin-top:5px">${(roots.length?roots:list).map(renderCat).join('')}</div></div></section>${bottom('home')}`};
  const baseRender=window.render;if(typeof baseRender==='function')window.render=function(){if(String(state.route||'').startsWith('custom-section:')){app.innerHTML=customPage(String(state.route).split(':')[1]);if(window.lucide)requestAnimationFrame(()=>lucide.createIcons({attrs:{'stroke-width':1.9}}));window.scrollTo({top:0,behavior:'instant'});return}return baseRender()};
  document.addEventListener('click',async e=>{
    const el=e.target.closest?.('[data-action]');if(!el)return;const a=el.dataset.action;
    if(a==='custom-section-more'){
      const id=el.dataset.id;try{const d=await fetch(API+'/home-sections/'+id,{cache:'no-store'}).then(async r=>{const x=await r.json();if(!r.ok)throw Error(x.message||'تعذر تحميل القسم');return x});const i=state.spikeContent.home_sections.findIndex(x=>String(x.id)===String(id));if(i>=0)state.spikeContent.home_sections[i]={...d.section,items:d.items||d.section?.items||[]};go(`custom-section:${id}`)}catch(err){showToast(err.message||'تعذر تحميل القسم')}
    }else if(a==='open-spike-category'){
      const c=cats().find(x=>String(x.id)===String(el.dataset.id));if(c){state.selectedCategory=c.name;state.selectedCategoryId=c.id;state.collectionFilter=null;go('category-products')}
    }else if(a==='open-spike-collection'){
      const type=el.dataset.destinationType,id=el.dataset.destinationId;if(!id)return;
      if(type==='category'){const c=cats().find(x=>String(x.id)===String(id));if(c){state.selectedCategory=c.name;state.selectedCategoryId=c.id;state.collectionFilter=null;go('category-products')}}
      else if(type==='store'){state.selectedStore=id;state.selectedStoreId=id;go('store')}
      else if(type==='product'){state.selectedProduct=id;state.productId=id;go('product:'+id)}
    }
  },true);
  loadDynamic();
})();
