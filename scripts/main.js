const productsBtn = document.getElementById('our-products-btn');
const products = document.getElementById('products');
productsBtn.addEventListener('click', () => {
  const isOpen = productsBtn.classList.toggle('nav-links__btn--active');
  productsBtn.setAttribute('aria-expanded', isOpen);

  if (isOpen) {
    
  } else {
  }

});