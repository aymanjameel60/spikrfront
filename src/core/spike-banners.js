/* Spike image-only banners from custom backend. */
(function(){
  const API='http://localhost:9100/api/v1';
  function normalize(b){return{...b,enabled:b.enabled!==false,action_type:b.target_type||'none',target:b.target_type==='internal'?(b.target_url||''):(b.target_id||''),image_url:b.image_url||''}}
  async function load(){try{const r=await fetch(API+'/banners?placement=home'),d=await r.json();if(!r.ok)throw Error(d.message||'تعذر تحميل البنرات');state.spikeContent=state.spikeContent||{};state.spikeContent.banner_items=(d.banners||[]).map(normalize);if(state.route==='home'&&typeof render==='function')render()}catch(e){console.warn('Spike banners:',e)}}
  window.refreshSpikeBanners=load;
  load();
})();
