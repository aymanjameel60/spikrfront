const A='assets/assets/';
const app=document.getElementById('app');
const toast=document.getElementById('toast');

let state={
  route:'home', backend:{status:'loading',message:'جاري الاتصال بـ Spike'}, history:[], loggedIn:false,
  favs:new Set(), filter:false, offersFilterSheet:false, offersDiscount:0, offersPrice:'all', offersRating:0,
  payment:'transfer', couponCode:'', appliedCoupon:'', paymentReceipt:null, receiptUpload:null, notificationFilter:'all', notificationMenu:false,
  settings:{theme:'light',language:'ar',currency:'USD'}, settingsDraft:null, settingsCurrencySheet:false,
  deleteAccountModal:false, currencySheet:false, activeAddress:null, editingAddressId:null,
  addressFormType:'home', addressFormDefault:false, addresses:[], selectedCategory:'الكل', selectedVariant:null,
  noteOpen:false, cartItems:[], ordersTab:'current', ordersFilter:false, orderStatusFilter:'الكل', orderDateFilter:null,
  selectedOrder:null, selectedStore:null, followedStores:new Set(), productGalleryIndex:0,
  storeSort:'relevance', storeFilter:false, storeSortSheet:false, storeCategory:'الكل', productsSort:'relevance',
  productsSortSheet:false, storesCategory:'الكل', storesMinRating:0, storesFilterSheet:false, storesSort:'relevance',
  storesSortSheet:false, storesSearch:'', storeProductSearch:'', personalEditOpen:false, phoneEditOpen:false,
  phoneOtpStep:'phone', pendingPhone:'', pendingProfileAvatar:null,
  userProfile:{name:'',email:'',phone:'',country:'',avatar:null}, notifications:[],
  liveCategories:[], liveCollections:[], liveTags:[], liveSellers:[], liveOrders:[], liveRegions:[], liveCurrencies:[]
};

try{
  const savedSettings=JSON.parse(localStorage.getItem('storm-settings')||'null');
  if(savedSettings)state.settings={...state.settings,...savedSettings};
}catch(e){}

const products=[];
const categories=[];
const storesData=[];
const currentOrders=[];
const previousOrders=[];
