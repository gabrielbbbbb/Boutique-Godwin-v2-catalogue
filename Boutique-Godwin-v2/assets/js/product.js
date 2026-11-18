const target=document.querySelector('#productDetail');
const money=n=>new Intl.NumberFormat('fr-FR').format(Number(n)||0)+' FCFA';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function showProduct(){
 try{
  const id=new URLSearchParams(location.search).get('id');
  const res=await fetch('data/products.json');if(!res.ok)throw new Error();
  const list=await res.json(),p=list.find(x=>x.id===id);
  if(!p){target.innerHTML='<div class="empty">Produit introuvable. <a href="index.html#catalogue">Retour au catalogue</a></div>';return;}
  const imgs=Array.isArray(p.images)?p.images:[];
  if(imgs.length<3)console.warn('Ce produit a moins de trois images. La règle sera aussi contrôlée dans l’administration.');
  target.innerHTML=`<a class="detail-back" href="index.html#catalogue">← Retour au catalogue</a>
   <div class="detail-layout"><div><div class="gallery-main"><img id="mainProductImage" src="${esc(imgs[0]||'')}" alt="${esc(p.name)}"></div>
   <div class="thumbs">${imgs.map((src,i)=>`<button class="thumb ${i===0?'active':''}" data-image="${i}" aria-label="Afficher photo ${i+1}"><img src="${esc(src)}" alt=""></button>`).join('')}</div></div>
   <div class="detail-info"><span class="category">${esc(p.category)}</span><h1>${esc(p.name)}</h1><div class="detail-price">${money(p.price)}</div><p class="detail-description">${esc(p.description)}</p><p class="detail-description">${p.available?'Disponibilité à confirmer auprès de notre équipe.':'Ce produit est actuellement indisponible.'}</p><a class="detail-cta" href="tel:+22892423331">Appeler pour ce produit · +228 92 42 33 31</a></div></div>`;
  target.querySelectorAll('.thumb').forEach(btn=>btn.addEventListener('click',()=>{target.querySelector('#mainProductImage').src=imgs[Number(btn.dataset.image)];target.querySelectorAll('.thumb').forEach(x=>x.classList.toggle('active',x===btn));}));
 }catch(e){target.innerHTML='<div class="empty">Erreur de chargement du produit.</div>';console.error(e);}
}
showProduct();
