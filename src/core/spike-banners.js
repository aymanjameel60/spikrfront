/* Spike content from custom backend: banners, categories, collections, home sections. */
(function(){
  const API='http://localhost:9100/api/v1',HOST='http://localhost:9100';
  const abs=v=>String(v||'').startsWith('/uploads/')?HOST+v:(v||'');
  function banner(b){return{...b,enabled:b.enabled!==false,action_type:b.target_type||'none',target:b.target_type==='internal'?(b.target_url||''):(b.target_id||''),image_url:abs(b.image_url)}}
  function category(c){return{...c,image_url:abs(c.image_url)}}
  function collection(c){return{...c,image_url:abs(c.image_url)}}
  function section(s){return{...s,image_url:abs(s.image_url),target_id:s.reference_id||null,item_ids:Array.isArray(s.items)?s.items.map(x=>x.id):[]}}
  async function json(path){const r=await fetch(API+path),text=await r.text();let d={};try{d=text?JSON.parse(text):{}}catch{}if(!r.ok)throw Error(d.message||`${path}: ${r.status}`);return d}
  async function safe(path){try{return await json(path)}catch(e){console.warn('Spike content endpoint:',path,e.message);return null}}
  async function load(){
    const [bd,cd,cold,sd]=await Promise.all([safe('/banners?placement=home'),safe('/categories'),safe('/collections'),safe('/home-sections')]);
    state.spikeContent=state.spikeContent||{};
    if(bd)state.spikeContent.banner_items=(bd.banners||[]).map(banner);
    if(cd){state.spikeContent.spike_categories=(cd.categories||[]).map(category);state.spikeContent.category_tree=cd.tree||[];state.liveCategories=state.spikeContent.spike_categories}
    if(cold)state.spikeContent.spike_collections=(cold.collections||[]).map(collection);
    if(sd)state.spikeContent.home_sections=(sd.sections||[]).map(section);
    if(typeof render==='function'&&['home','categories','category-products'].includes(state.route))render();
  }
  window.refreshSpikeContent=load;
  window.refreshSpikeBanners=load;
  load();
})();
