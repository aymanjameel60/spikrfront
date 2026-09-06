/* Spike catalog hard bridge: catalog must render even if optional settings/content endpoints fail. */
(function(){
  const API='http://localhost:9100/api/v1',HOST='http://localhost:9100';
  const oldAbsolute=window.absoluteProductImage;
  window.absoluteProductImage=function(src){
    const v=String(src||'').trim();
    if(v.startsWith('/uploads/'))return HOST+v;
    if(v.startsWith(HOST+'/uploads/'))return v;
    return oldAbsolute?oldAbsolute(src):v;
  };
  async function json(path){const r=await fetch(API+path,{headers:{accept:'application/json'},cache:'no-store'});if(!r.ok)throw new Error(`${path} HTTP_${r.status}`);return r.json()}
  function product(p){
    const variants=(p.variants||[]).map(v=>({id:v.id,title:v.title||'Default',sku:v.sku||'',stock:Number(v.stock||0),priceNumeric:Number(v.price_usd||0),currency:'USD',price:apiMoneyString(Number(v.price_usd||0),'USD'),options:v.options||{},raw:v}));
    const first=variants[0]||{id:null,stock:0,priceNumeric:0};
    const images=(p.images||[]).map(x=>window.absoluteProductImage(x.url||x)).filter(Boolean);
    return {id:p.id,name:p.name,price:apiMoneyString(first.priceNumeric,'USD'),priceNumeric:first.priceNumeric,rating:String(p.review_average||0),img:images[0]||'',images,store:p.store_name||'Spike',storeId:p.store_id||null,category:p.category_name||'غير مصنف',categoryId:p.category_id||null,categories:p.category_name?[p.category_name]:[],description:p.description||'',inventory:first.stock,variants,selectedVariantId:first.id,currency:'USD',returnable:!!p.returnable,spike:true,raw:p};
  }
  async function load(){
    try{
      const pd=await json('/products');
      const mapped=(pd.products||[]).map(product);
      products.splice(0,products.length,...mapped);
      const sd=await json('/stores');
      const shops=(sd.stores||[]).map(s=>({id:s.id,name:s.name,handle:s.slug||'',rating:'0.0',reviews:0,category:'عام',banner:'',logo:s.logo_url?window.absoluteProductImage(s.logo_url):null,logoText:String(s.name||'STORE').slice(0,8),products:mapped.filter(p=>p.storeId===s.id).map(p=>p.id),raw:s}));
      storesData.splice(0,storesData.length,...shops);state.liveSellers=shops;
      try{const cd=await json('/categories');state.spikeContent=state.spikeContent||{};state.spikeContent.spike_categories=cd.categories||[];state.spikeContent.category_tree=cd.tree||[];state.liveCategories=cd.categories||[]}catch(e){console.warn('Spike categories',e)}
      state.backend={status:'connected',message:`Spike • ${mapped.length} منتج • ${shops.length} متجر`};
      if(typeof render==='function')render();
    }catch(e){state.backend={status:'error',message:`Spike — ${e.message}`};console.error('Spike catalog hard bridge',e);if(typeof render==='function')render()}
  }
  window.refreshSpikeCatalog=load;
  load();
})();
