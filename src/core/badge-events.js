/* Mark section badges as seen when the user opens the related section. */
document.addEventListener('click',e=>{
  const nav=e.target.closest?.('[data-nav]');
  if(!nav)return;
  if(nav.dataset.nav==='offers'&&typeof markBadgeSeen==='function'&&typeof spikeDiscountBadgeIds==='function'){
    markBadgeSeen('offers',spikeDiscountBadgeIds());
  }
},true);
