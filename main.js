let menuOpen = document.querySelector('.fa-bars');
let menuClose = document.querySelector('.fa-times');
let header = document.getElementById('header');
let navLinks = document.querySelectorAll('.nav-link')
menuOpen.addEventListener('click', ()=>{
    header.classList.add('open')
})
menuClose.addEventListener('click', ()=>{
    header.classList.remove('open')
})

navLinks.forEach((navLink)=>{
    navLink.addEventListener('click', ()=>{
        navLinks.forEach((link)=>{
            link.classList.remove("active")
        })
        navLink.classList.add('active')
    
    })
})

window.addEventListener('load', ()=>{
    setTimeout(() => {
    document.getElementById('loader').style.display = 'none'
    }, 1500);
})

let sr = ScrollReveal();

sr.reveal('.animate-left', {
    origin: 'left',
    duration: 1000,
    distance: '25em',
    delay: 300,
    reset: true

})
sr.reveal('.animate-right', {
    origin: 'right',
    duration: 2000,
    distance: '25em',
    delay: 400,
    reset: true
})