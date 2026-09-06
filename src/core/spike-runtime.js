/* Spike runtime UI helpers. Catalog loading is owned by the Spike commerce/catalog bridge. */
(function(){
  window.backendStatusChip=function(){const b=state.backend||{status:'loading',message:'جاري الاتصال بـ Spike'};const cls=b.status==='connected'?'connected':b.status==='loading'?'loading':'warning';return `<div class="backend-status-wrap"><button class="backend-status ${cls}" onclick="refreshSpikeCatalog().catch(e=>showToast(e.message||'تعذر تحديث البيانات'))"><span></span><b>${esc(b.message||'Spike')}</b><small>${b.status==='connected'?'تحديث':'إعادة المحاولة'}</small></button></div>`};
})();
