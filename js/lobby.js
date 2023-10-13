let form = document.addEventListener('join-form')

form.addEventListener('submit',(e)=>{
    e.preventDefault()

    let invite = e.target.invite_link.value
    window.location = `room.html?room=${invite}`
})