/* Spike live notification actions. */
(function(){
  const api=()=>window.SpikeCommerce?.req;
  async function refresh(){if(typeof syncNotifications==='function')await syncNotifications({silent:true});if(typeof render==='function')render()}
  document.addEventListener('click',async e=>{
    const el=e.target.closest?.('[data-action],[data-nav]');if(!el)return;
    try{
      if(el.dataset.nav==='notifications'){
        if(typeof syncNotifications==='function')await syncNotifications({silent:true});
        return;
      }
      const a=el.dataset.action;
      if(a==='notifications-all'){e.preventDefault();e.stopImmediatePropagation();state.notificationFilter='all';render()}
      else if(a==='notifications-unread'){e.preventDefault();e.stopImmediatePropagation();state.notificationFilter='unread';render()}
      else if(a==='notification-menu'){e.preventDefault();e.stopImmediatePropagation();state.notificationMenu=!state.notificationMenu;render()}
      else if(a==='mark-all-read'){e.preventDefault();e.stopImmediatePropagation();if(typeof markAllNotificationsRead==='function')await markAllNotificationsRead();state.notificationMenu=false;render();showToast('تم تحديد الإشعارات كمقروءة')}
      else if(a==='open-notification'){
        e.preventDefault();e.stopImmediatePropagation();const id=el.dataset.id,n=(state.notifications||[]).find(x=>String(x.id)===String(id));if(n&&!n.read&&typeof markNotificationRead==='function')await markNotificationRead(id);
        if(n?.data?.order_id){state.selectedOrder=n.data.order_id;state.spikeOrderDetails=null;go('order-details');try{const d=await api()(`/customer-orders/${n.data.order_id}`,{auth:true});state.spikeOrderDetails=d;render()}catch(err){showToast(err.message||'تعذر تحميل الطلب')}}else{render()}
      }
    }catch(err){showToast(err.message||'تعذر تنفيذ العملية')}
  },true);
  setInterval(()=>{if(customerToken?.()&&document.visibilityState==='visible'&&typeof syncNotifications==='function')syncNotifications({silent:true}).then(()=>{if(state.route==='home'||state.route==='notifications')render()}).catch(()=>{})},60000);
})();
