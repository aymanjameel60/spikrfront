/* Spike catalog coordinator: one product/store loader plus category sync. */
(function(){
  const API='https://spike2.aymanjameel60.deno.net/api/v1';
  const SUPABASE_PUBLIC='https://oshdiaifvwfdbkatagex.supabase.co/storage/v1/object/public/spike-images/legacy/';
  const oldAbsolute=window.absoluteProductImage;
  const PLACEHOLDER='assets/assets/placeholder-product.svg';

  function fixText(value){const s=String(value||'');if(!/[ØÙ]/.test(s))return s;try{const bytes=Uint8Array.from([...s].map(ch=>ch.charCodeAt(0)&255));return new TextDecoder('utf-8').decode(bytes)}catch{return s}}
  function abs(src){const v=String(src||'').trim();if(!v)return PLACEHOLDER;if(/^https?:\/\//i.test(v))return v;const m=v.match(/^\/?uploads\/([^/?#]+)$/i);if(m)return SUPABASE_PUBLIC+encodeURIComponent(m[1]);if(v.startsWith('/assets/'))return v.slice(1);if(v.startsWith('assets/assets/'))return v;if(v.startsWith('assets/'))return 'assets/'+v;return oldAbsolute?oldAbsolute(v):v}
  window.absoluteProductImage=abs;

  async function json(path){
    const sep=path.includes('?')?'&':'?';
    const r=await fetch(API+path+sep+'_='+Date.now(),{headers:{accept:'application/json','cache-control':'no-cache'},cache:'no-store'});
    if(!r.ok)throw new Error(`${path} HTTP_${r.status}`);
    return r.json();
  }

  function category(c){return {...c,id:c.id,name:fixText(c.name||c.title||'قسم'),image_url:abs(c.image_url||c.image||c.thumbnail),enabled:c.enabled!==false}}

  async function syncCategories(){
    try{
      const cd=await json('/categories');
      const source=Array.isArray(cd.categories)?cd.categories:(Array.isArray(cd.data)?cd.data:[]);
      const live=source.filter(Boolean).map(category).filter(c=>c.enabled!==false);
      state.spikeContent=state.spikeContent||{};
      state.spikeContent.spike_categories=live;
      state.spikeContent.category_tree=Array.isArray(cd.tree)?cd.tree:[];
      state.liveCategories=live;
      categories.splice(0,categories.length,...live.map(c=>[c.image_url||PLACEHOLDER,c.name,c.id]));
      window.dispatchEvent(new CustomEvent('spike:categories',{detail:{count:live.length,categories:live}}));
      if(typeof render==='function')render();
      return live;
    }catch(e){
      console.error('Spike categories load failed',e);
      return state.liveCategories||[];
    }
  }

  async function load(){
    let productError=null;
    try{if(window.SpikeCommerce?.refreshCatalog)await window.SpikeCommerce.refreshCatalog()}catch(e){productError=e;console.warn('Spike products/stores',e)}
    const live=await syncCategories();
    if(productError&&!live.length){state.backend={status:'error',message:`Spike — ${productError.message||'تعذر تحميل البيانات'}`}}
    else state.backend={status:'connected',message:`Spike • ${products.length} منتج • ${storesData.length} متجر • ${live.length} فئة`};
    if(typeof render==='function')render();
    return products;
  }

  window.refreshSpikeCategories=syncCategories;
  window.refreshSpikeCatalog=load;

  queueMicrotask(()=>syncCategories());
  window.addEventListener('DOMContentLoaded',()=>syncCategories(),{once:true});
  window.setTimeout(()=>syncCategories(),700);
  window.setTimeout(()=>syncCategories(),1800);
})();
