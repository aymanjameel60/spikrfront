function bottom(active='home'){
  const discountIds=typeof spikeDiscountBadgeIds==='function'?spikeDiscountBadgeIds():[];
  const discountCount=typeof badgeUnseenCount==='function'?badgeUnseenCount('offers',discountIds):discountIds.length;
  return `<nav class="bottom-nav"><button class="${active==='profile'?'active':''}" data-nav="profile">${icon('user-round',23)}</button><button class="${active==='offers'?'active':''}" data-nav="offers">${icon('badge-percent',23)}${discountCount>0?`<b class="navbadge">${discountCount}</b>`:''}</button><button class="${active==='home'?'active':''}" data-nav="home">${icon('house',23)}</button><button class="${active==='cart'?'active':''}" data-nav="cart">${icon('shopping-bag',23)}</button></nav>`
}
