function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function parsePrice(value){return Number(String(value||'0').replace(/[^0-9.]/g,''))||0}
const currencyMap={USD:{symbol:'$',rate:1,decimals:2},SAR:{symbol:'ر.س',rate:3.75,decimals:2},YER_OLD:{symbol:'ر.ي قديم',rate:535,decimals:0},YER_NEW:{symbol:'ر.ي جديد',rate:1630,decimals:0}};
function currencyInfo(){return currencyMap[state.settings.currency]||currencyMap.USD}
function money(value){const c=currencyInfo();const amount=Number(value||0)*c.rate;return `${amount.toLocaleString('en-US',{minimumFractionDigits:c.decimals,maximumFractionDigits:c.decimals})} ${c.symbol}`}
function displayPrice(value){return money(parsePrice(value))}
function currencyShort(){return currencyInfo().symbol}
function getProduct(id){return products.find(p=>p.id===id)}
function getStore(id){return storesData.find(s=>s.id===id)||storesData[0]}
function cartCount(){return state.cartItems.reduce((sum,item)=>sum+item.qty,0)}
function cartRows(){return state.cartItems.map(item=>({item,product:getProduct(item.id)})).filter(x=>x.product)}
function cartSubtotal(){return cartRows().reduce((sum,row)=>sum+parsePrice(row.product.price)*row.item.qty,0)}
function cartSaving(){return cartRows().reduce((sum,row)=>sum+Math.max(0,parsePrice(row.product.old)-parsePrice(row.product.price))*row.item.qty,0)}
function addToCart(id){const row=state.cartItems.find(x=>x.id===id);if(row)row.qty++;else state.cartItems.push({id,qty:1});showToast('تمت الإضافة إلى حقيبة التسوق')}
function changeCartQty(id,delta){const row=state.cartItems.find(x=>x.id===id);if(!row)return;row.qty+=delta;if(row.qty<=0)state.cartItems=state.cartItems.filter(x=>x.id!==id)}
