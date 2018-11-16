'use strict';

const menu = document.getElementById('menu');
const bottomNav = document.querySelector('.bottom-nav-wrapper');
const radioButtons = document.querySelectorAll('input[type="radio"] ~ label');
const newPostButton = document.getElementById('new-post');
const bottomNavHeight = bottomNav.offsetHeight;
const navBarHeight = 56;
const navBarHiddenPos = (bottomNavHeight - navBarHeight) * -1;

const styleHidden = document.createElement('style');
styleHidden.type = 'text/css';
styleHidden.innerHTML = `.menu-hidden { bottom: ${navBarHiddenPos}px }`;
document.getElementsByTagName('head')[0].appendChild(styleHidden);

bottomNav.classList.add('menu-hidden');

menu.addEventListener('change', ()=> {
	bottomNav.classList.toggle('menu-hidden');
  newPostButton.classList.toggle('btn-hidden');
  radioButtons.forEach(element => {
    element.classList.toggle('btn-hidden');
  });

});

setTimeout(() => {
	bottomNav.style.transition = 'bottom 200ms ease-in-out';
}, 10);