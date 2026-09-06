/* Final Spike runtime compatibility: no customer-facing Mercur dependency. */
(function(){
  const refresh=async()=>{
    state.backend={status:'loading',message:'جاري الاتصال بـ Spike'};
    if(typeof render==='function')render();
    try{
      await window.SpikeCommerce?.refreshCatalog?.();
      await window.refreshSpikeContent?.();
      state.backend={status:'connected',message:`Spike • ${products.length} منتج • ${storesData.length} متجر`};
    }catch(e){
      state.backend={status:'error',message:'تعذر الاتصال بـ Spike'};
      throw e;
    }finally{if(typeof render==='function')render()}
  };
  window.syncMercurAll=refresh;
  window.syncMercurProducts=refresh;
  window.backendStatusChip=function(){
    const b=state.backend||{status:'loading',message:'جاري الاتصال بـ Spike'};
    const cls=b.status==='connected'?'connected':b.status==='loading'?'loading':'warning';
    return `<div class="backend-status-wrap"><button class="backend-status ${cls}" data-action="backend-refresh"><span></span><b>${esc(b.message||'Spike')}</b><small>${b.status==='connected'?'تحديث':'إعادة المحاولة'}</small></button></div>`;
  };
})();
