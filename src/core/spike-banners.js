/* Spike content from custom backend: banners, categories, collections, home sections. */
(function(){
  const API='http://localhost:9100/api/v1',HOST='http://localhost:9100';
  const abs=v=>String(v||'').startsWith('/uploads/')?HOST+v:(v||'');
  function banner(b){return{...b,enabled:b.enabled!==false,action_type:b.target_type||'none',target:b.target_type==='internal'?(b.target_url||''):(b.target_id||''),image_url:abs(b.image_url)}}
  function category(c){return{...c,image_url:abs(c.image_url)}}
  function collection(c){return{...c,image_url:abs(c.image_url)}}
  function section(s){return{...s,image_url:abs(s.image_url),target_id:s.reference_id||null,item_ids:Array.isArray(s.items)?s.items.map(x=>x.id):[]}}
  async function json(path){const r=await fetch(API+path),d=await r.json();if(!r.ok)throw Error(d.message||path);return d}
  async function load(){try{
    const [bd,cd,cold,sd]=await Promise.all([json('/banners?placement=home'),json('/categories'),json('/collections'),json('/home-sections')]);
    state.spikeContent=state.spikeContent||{};
    state.spikeContent.banner_items=(bd.banners||[]).map(banner);
    state.spikeContent.spike_categories=(cd.categories||[]).map(category);
    state.spikeContent.category_tree=cd.tree||[];
    state.spikeContent.spike_collections=(cold.collections||[]).map(collection);
    state.spikeContent.home_sections=(sd.sections||[]).map(section);
    state.liveCategories=state.spikeContent.spike_categories;
    if(typeof render==='function'&&['home','categories','category-products'].includes(state.route))render();
  }catch(e){console.warn('Spike content:',e)}}
  window.refreshSpikeContent=load;
  window.refreshSpikeBanners=load;
  load();
})();
