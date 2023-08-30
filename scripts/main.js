const productsBtn = document.getElementById('our-products-btn');
const products = document.getElementById('products');
const open = () => {
  productsBtn.classList.add('nav-links__btn--active');
  productsBtn.setAttribute('aria-expanded', true);
  products.style.setProperty('display', 'block');
  const anim = products.animate([
    { transform: 'scale(0.6)', opacity: 0 },
    { transform: 'scale(1)', opacity: 1 },
  ], {
    duration: 200,
    easing: 'cubic-bezier(0, 0.55, 0.45, 1)'
  });
  anim.finished.then(() => {
    anim.cancel();
  });
}
const close = () => {
  productsBtn.classList.remove('nav-links__btn--active');
  productsBtn.setAttribute('aria-expanded', false);
  const anim = products.animate([
    { transform: 'scale(1)', opacity: 1 },
    { transform: 'scale(0.6)', opacity: 0 },
  ], {
    duration: 200,
    easing: 'cubic-bezier(0, 0.55, 0.45, 1)'
  });
  anim.finished.then(() => {
    anim.cancel();
    products.style.removeProperty('display');
  });
}
let closeOnClickOut = null;
productsBtn.addEventListener('click', () => {
  if (productsBtn.getAttribute('aria-expanded') === 'false') {
    closeOnClickOut = (e) => {
      if (
          e.target === products ||
          products.contains(e.target) ||
          e.target === productsBtn ||
          productsBtn.contains(e.target)
        ) {
        return;
      }
      close();
      document.removeEventListener('click', closeOnClickOut);
    }
    document.addEventListener('click', closeOnClickOut);
    open();
  } else {
    close();
    document.removeEventListener('click', closeOnClickOut);
  }
});