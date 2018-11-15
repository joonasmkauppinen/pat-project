'use strict';

const menu = document.getElementById('menu');
const bottomNav = document.querySelector('.bottom-nav-wrapper');

menu.addEventListener('change', ()=> {
    bottomNav.classList.toggle('menu-hidden');
});