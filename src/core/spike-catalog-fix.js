/* Spike catalog hard bridge: catalog must render even if optional settings/content endpoints fail. */
(function(){
  const API='http://localhost:9100/api/v1',HOST='http://localhost:9100';
  const oldAbsolute=window.absoluteProductImage;
  function abs(src){
    const v=String(src||'').trim();
    if(!v)return '';
    if(/^https?:\/\//i.test(v))return v;
    if(v.startsWith('/uploads/'))return API+v;
    if(v.startsWith('uploads/'))return API+'/'+v;
    if(v.startsWith('/assets/'))return v.slice(1);
    if(v.startsWith('assets/assets/'))return v;
    if(v.startsWith('assets/'))return 'assets/'+v;
    return oldAbsolute?oldAbsolute(v):v;
  }
  window.absoluteProductImage=abs;
  async function json(path){const r=await fetch(API+path,{headers:{accept:'application/json'},cache:'no-store'});if(!r.ok)throw new Error(`${path} HTTP_${r.status}`);return r.json()}
  const num=(...vals)=>{for(const v of vals){const n=Number(v);if(Number.isFinite(n)&&n>0)return n}return 0};
  function product(p){
    const rawVariants=Array.isArray(p.variants)?p.variants:[];
    const variants=rawVariants.map(v=>{
      const current=num(v.price_usd,v.price,v.amount,v.current_price,v.sale_price);
      const original=num(v.original_price_usd,v.original_price,v.compare_at_price,v.list_price);
      return {id:v.id,title:v.title||v.name||'Default',sku:v.sku||'',stock:Number(v.stock??v.inventory??v.quantity??0),priceNumeric:current,originalNumeric:original>current?original:0,currency:String(v.currency||v.currency_code||'USD').toUpperCase(),price:apiMoneyString(current,String(v.currency||v.currency_code||'USD').toUpperCase()),options:v.options||{},raw:v};
    });
    const first=variants.find(v=>v.priceNumeric>0)||variants[0]||{id:null,stock:Number(p.stock||0),priceNumeric:num(p.price_usd,p.price,p.amount),originalNumeric:num(p.original_price_usd,p.original_price,p.compare_at_price),currency:String(p.currency||p.currency_code||'USD').toUpperCase()};
    const rawImages=Array.isArray(p.images)?p.images:[];
    const images=[...rawImages.map(x=>abs(x?.url||x?.image_url||x)),abs(p.image_url),abs(p.thumbnail_url),abs(p.thumbnail)].filter(Boolean);
    const storeObj=p.store||p.seller||{};
    const categoryObj=p.category||{};
    const storeId=p.store_id??storeObj.id??p.seller_id??null;
    const storeName=p.store_name||storeObj.name||p.seller_name||'Spike';
    const categoryId=p.category_id??categoryObj.id??null;
    const categoryName=p.category_name||categoryObj.name||'غير مصنف';
    return {id:p.id,name:p.name||p.title||'منتج',price:apiMoneyString(first.priceNumeric,first.currency||'USD'),priceNumeric:first.priceNumeric,originalNumeric:first.originalNumeric||0,rating:String(p.review_average??p.rating??0),review_average:Number(p.review_average??p.rating??0),review_count:Number(p.review_count??p.reviews_count??0),img:images[0]||'',images,store:storeName,storeId,category:categoryName,categoryId,categories:categoryName?[categoryName]:[],description:p.description||'',inventory:first.stock,variants,selectedVariantId:first.id,currency:first.currency||'USD',returnable:!!p.returnable,spike:true,raw:p};
  }
  function category(c){return {...c,id:c.id,name:c.name||c.title||'قسم',image_url:abs(c.image_url||c.image||c.thumbnail),enabled:c.enabled!==false};}
  function store(s,mapped){
    const id=s.id;
    const name=s.name||s.store_name||s.title||'متجر';
    return {id,name,handle:s.slug||s.handle||'',rating:String(s.review_average??s.rating??0),reviews:Number(s.review_count??s.reviews_count??0),category:s.category_name||s.category||'عام',banner:abs(s.banner_url||s.banner||s.cover_url),logo:abs(s.logo_url||s.logo||s.image_url)||null,logoText:String(name).slice(0,8),products:mapped.filter(p=>String(p.storeId)===String(id)).map(p=>p.id),raw:s};
  }
  async function load(){
    try{
      const pd=await json('/products');
      const sourceProducts=Array.isArray(pd.products)?pd.products:(Array.isArray(pd.data)?pd.data:[]);
      const mapped=sourceProducts.map(product);
      products.splice(0,products.length,...mapped);

      let shops=[];
      try{
        const sd=await json('/stores');
        const sourceStores=Array.isArray(sd.stores)?sd.stores:(Array.isArray(sd.data)?sd.data:[]);
        shops=sourceStores.map(s=>store(s,mapped));
      }catch(e){console.warn('Spike stores',e)}
      if(!shops.length){
        const seen=new Map();
        mapped.forEach(p=>{if(p.storeId!=null&&!seen.has(String(p.storeId)))seen.set(String(p.storeId),{id:p.storeId,name:p.store,handle:'',rating:'0',reviews:0,category:'عام',banner:'',logo:null,logoText:String(p.store).slice(0,8),products:[]})});
        shops=[...seen.values()];mapped.forEach(p=>{const s=seen.get(String(p.storeId));if(s)s.products.push(p.id)});
      }
      storesData.splice(0,storesData.length,...shops);state.liveSellers=shops;

      try{
        const cd=await json('/categories');
        const live=(Array.isArray(cd.categories)?cd.categories:(Array.isArray(cd.data)?cd.data:[])).map(category);
        state.spikeContent=state.spikeContent||{};
        state.spikeContent.spike_categories=live;
        state.spikeContent.category_tree=cd.tree||[];
        state.liveCategories=live;
        categories.splice(0,categories.length,...live.map(c=>[c.image_url||'placeholder-product.svg',c.name,c.id]));
      }catch(e){console.warn('Spike categories',e)}

      state.backend={status:'connected',message:`Spike • ${mapped.length} منتج • ${shops.length} متجر`};
      if(typeof render==='function')render();
    }catch(e){state.backend={status:'error',message:`Spike — ${e.message}`};console.error('Spike catalog hard bridge',e);if(typeof render==='function')render()}
  }
  window.refreshSpikeCatalog=load;
  load();
})();
