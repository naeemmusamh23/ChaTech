'use strict;'

const options = {
    transports: ['websocket'],
};
const socket = io('https://chatech.herokuapp.com', options);

socket.on('renderMsg', (payload) => {
    console.log(payload)

    const cont = document.getElementById('inner-message-container')
    const p = document.createElement('p')
    p.classList.add('retrieved-message')
    p.innerHTML = `
        <span class="retrieved-message-name">${payload.user}</span>
        <span class="retrieved-message-body">${payload.msg}</span>
        <span class="retrieved-message-time">${payload.date}</span>
    `
    cont.appendChild(p);
    cont.scrollTop =  cont.scrollHeight;
})

function join(e, id) {
    // e.preventDefault()
    socket.emit('join', { id })
}

async function send(e) {
    e.preventDefault()
    const msg = e.target.message.value
    const room = e.target.room_id.value
    const user = e.target.user.value
    const participantid = e.target.participantid.value
    const date = new Date().toLocaleTimeString("en-US")

    function formatDate(params) {
    }
    await superagent.post('/chatrooms2').send({ participantid: participantid, room_id: room, message: msg })

    const payload = { msg, room, user, date }

    socket.emit('newMsg', payload)
    
    // <section id="inner-message-container">
    // <p class="retrieved-message">
    //     <span class="retrieved-message-name"><%= massage.name %></span>
    //     <span class="retrieved-message-body"><%= massage.messagebody %></span>
    //     <span class="retrieved-message-time"><%= massage.time %></span>
    // </p>
     document.getElementById('message').value = "";
     document.getElementById('message').focus();
}