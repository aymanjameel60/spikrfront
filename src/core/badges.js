/* Reusable unread/unseen badge system for Spike navigation and future modules. */
const SPIKE_BADGE_PREFIX='spike-badge-seen:';
function badgeSeenIds(key){try{return new Set(JSON.parse(localStorage.getItem(SPIKE_BADGE_PREFIX+key)||'[]'))}catch(_){return new Set()}}
function badgeUnseenCount(key,currentIds=[]){const seen=badgeSeenIds(key);return [...new Set((currentIds||[]).map(String).filter(Boolean))].filter(id=>!seen.has(id)).length}
function markBadgeSeen(key,currentIds=[]){try{localStorage.setItem(SPIKE_BADGE_PREFIX+key,JSON.stringify([...new Set((currentIds||[]).map(String).filter(Boolean))]))}catch(_){}}
function spikeDiscountBadgeIds(){
  const list=typeof spikeDiscountProducts==='function'?spikeDiscountProducts():(Array.isArray(products)?products.filter(p=>{const c=Number(p?.priceNumeric||0),o=Number(p?.originalNumeric||0);return c>0&&o>c}):[]);
  return list.map(p=>{
    const id=p?.id||p?.raw?.id;
    const current=Number(p?.priceNumeric||0);
    const original=Number(p?.originalNumeric||0);
    const percent=original>current&&current>0?Math.round(((original-current)/original)*100):Number(p?.discountPercent||0);
    return id?`${id}:${current}:${original}:${percent}`:null;
  }).filter(Boolean);
}
window.badgeUnseenCount=badgeUnseenCount;
window.markBadgeSeen=markBadgeSeen;
window.spikeDiscountBadgeIds=spikeDiscountBadgeIds;
