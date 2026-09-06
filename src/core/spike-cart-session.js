/* Merge a guest cart into the authenticated Spike cart instead of silently losing it on login/register. */
(function(){
  const originalLogin=window.loginCustomer,originalRegister=window.registerCustomer;
  async function mergeGuest(items){
    if(!customerToken()||!items?.length||!window.SpikeCommerce?.req)return;
    const remote=await SpikeCommerce.req('/cart',{auth:true});
    const current=new Map((remote.items||[]).map(x=>[x.variant_id,Number(x.quantity||0)]));
    for(const item of items){
      if(!item.variantId)continue;
      const quantity=(current.get(item.variantId)||0)+Number(item.qty||1);
      await SpikeCommerce.req('/cart/items',{method:'POST',auth:true,body:{variant_id:item.variantId,quantity}});
    }
    await SpikeCommerce.refreshCart?.();
  }
  if(typeof originalLogin==='function')window.loginCustomer=async function(email,password){const guest=customerToken()?[]:[...(state.cartItems||[])];const d=await originalLogin(email,password);if(guest.length)await mergeGuest(guest);return d};
  if(typeof originalRegister==='function')window.registerCustomer=async function(payload){const guest=customerToken()?[]:[...(state.cartItems||[])];const d=await originalRegister(payload);if(guest.length)await mergeGuest(guest);return d};
})();
