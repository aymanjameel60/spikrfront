/* Spike catalog coordinator: one product/store loader plus category sync. */
(function(){
  const API='http://localhost:9100/api/v1';
  const oldAbsolute=window.absoluteProductImage;
  function abs(src){const v=String(src||'').trim();if(!v)return '';if(/^https?:\/\//i.test(v))return v;if(v.startsWith('/uploads/'))return API+v;if(v.startsWith('uploads/'))return API+'/'+v;if(v.startsWith('/assets/'))return v.slice(1);if(v.startsWith('assets/assets/'))return v;if(v.startsWith('assets/'))return 'assets/'+v;return oldAbsolute?oldAbsolute(v):v}
  window.absoluteProductImage=abs;
  async function json(path){const r=await fetch(API+path,{headers:{accept:'application/json'},cache:'no-store'});if(!r.ok)throw new Error(`${path} HTTP_${r.status}`);return r.json()}
  function category(c){return {...c,id:c.id,name:c.name||c.title||'قسم',image_url:abs(c.image_url||c.image||c.thumbnail),enabled:c.enabled!==false}}
  async function syncCategories(){try{const cd=await json('/categories');const live=(Array.isArray(cd.categories)?cd.categories:(Array.isArray(cd.data)?cd.data:[])).map(category);state.spikeContent=state.spikeContent||{};state.spikeContent.spike_categories=live;state.spikeContent.category_tree=cd.tree||[];state.liveCategories=live;categories.splice(0,categories.length,...live.map(c=>[c.image_url||'placeholder-product.svg',c.name,c.id]));return live}catch(e){console.warn('Spike categories',e);return state.liveCategories||[]}}
  async function load(){try{if(window.SpikeCommerce?.refreshCatalog)await window.SpikeCommerce.refreshCatalog();await syncCategories();state.backend={status:'connected',message:`Spike • ${products.length} منتج • ${storesData.length} متجر`};if(typeof render==='function')render();return products}catch(e){state.backend={status:'error',message:`Spike — ${e.message||'تعذر تحميل البيانات'}`};console.error('Spike catalog',e);if(typeof render==='function')render();throw e}}
  window.refreshSpikeCategories=syncCategories;
  window.refreshSpikeCatalog=load;
})();
