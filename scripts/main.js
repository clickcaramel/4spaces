const productsBtn = document.getElementById('our-products-btn');
const products = document.getElementById('products');
productsBtn.addEventListener('click', () => {
  const isOpen = productsBtn.classList.toggle('nav-links__btn--active');
  productsBtn.setAttribute('aria-expanded', isOpen);

  if (isOpen) {
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
  } else {
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

});