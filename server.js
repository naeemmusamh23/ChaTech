'use strict';

// Dependencies

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
const { response } = require('express');
const methodoverride = require('method-override');
const bcrypt = require('bcrypt');
const { emit } = require("process");
const moment = require('moment');

// App Set-Up
const app = express();
app.use(cors());
app.use(express.json());
// Database
const DATABASE_URL = process.env.DATABASE_URL;
const client = new pg.Client(DATABASE_URL);

// pool
const Pool = require("pg").Pool;
const pool = new pg.Pool({
  user: "bwsdazcptpcqvz",
  host: "ec2-52-50-171-4.eu-west-1.compute.amazonaws.com",
  database: "d168avh50dh46i",
  password: "97bd5223b47e89854e9b3fa66af1dfe0f090c9b7994c5e20a0f6b5c6936562ba",
  port: 5432,
});

// socket-io

const server = require("http").createServer(app);
const socket_io = require('socket.io')(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

socket_io.on('connection', (socket) => {
  console.log('User Connected ^^^^^^^^^^^^^^^^^', socket.id)

  socket.on('join', (payload) => {
    socket.join(payload.id)
    console.log(socket.id + ' joined room: ' + payload.id)
  })

  socket.on('newMsg', (payload) => {
    socket_io.emit('renderMsg', payload)
  })
})

// Environmental Variables
const PORT = process.env.PORT || 3000;
const ENV = process.env.ENV;
// const socketPort= process.env.socketPort || 8000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public'));
app.set('view engine', 'ejs');
app.use(methodoverride('_method'));


// endpoints
app.get('/', renderhome);
app.post('/', participantInfoHandler);
app.get('/about', renderAbout);
app.get('/signup', signup);
app.post('/check_signup', check_signup);
app.get('/signin', renderSignin)
app.post('/signin', handlerAdminSignin);
app.get('/dashboard', renderDashboard);
app.post('/dashboard', addRoomToDashboard);
app.put('/dashboard/:roomid', editRoomInDashboard);
app.delete('/dashboard/:roomid', deleteRoomFromDashboard);

// app.post('/', saveParticipantInfo);

app.post('/chatrooms', select_chat_room);
app.post('/chatrooms2', new_message);



function signup(request, response) {
  response.render('../views/signup', { name: '', email: '', error_ms: '' })
}

// Call-Back Functions

function saveParticipantInfo(request, response) {
  const name = request.body.name;
  const password = request.body.password;
  const sqlQuery = `INSERT INTO participants(name,email) VALUES($1, $2) RETURNING participantid`
  const safeValues = [name, password]
  client.query(sqlQuery, safeValues).then(
    (result) => {
      const id = result.rows[0].participantid;
      console.log(id);
      response.redirect(`/chatrooms/1/${id}`)
    }
  )
}




function renderhome(request, response) {
  response.render('../views/index')
}

//About
function renderAbout(request, response) {
  response.render('../views/aboutus');
}

//Sign-In - Admin
function renderSignin(request, response) {
  response.render('../views/admin/sign-in', { massage: '' })
}

//---------- Test---------------------------------
app.get('/test', test_fun);

function test_fun(req, res) {

  res.alert('***')

  res.render('../views/test', { key: 'on' });
}


// ***********************************************

// SIGN UP HANDLER

function check_signup(request, response) {
  const { name, email, password, password2 } = request.body;
  
  // condition 1 ; check passwords
  if (password != password2) {
    response.render('../views/signup', { name: name, email: email, error_ms: 'Those passwords didn’t match. Try again' })
  } else {

    // condition 2 ; check user name is already taken or not
    const safeValues1 = [name];
    const sqlQuery = "SELECT * FROM participants WHERE name=$1"

    client.query(sqlQuery, safeValues1).then(item => {

      if (item.rows.length) {
        response.render('../views/signup', { name: name, email: email, error_ms: 'That username is taken . Try again' })
      }

      const password_hash = bcrypt.hashSync(password, 10);
      const safeValues = [name, email, password_hash];
      const sqlQuery = "INSERT INTO participants (name,email,password) VALUES ($1 , $2 , $3 );"

      client.query(sqlQuery, safeValues).then(data => {
        response.redirect('/');
        // response.render('../views/test', { key: 'Inserted successfully' });
      }).catch(error => {
        response.render('../views/test', { key: error });
      })

      // response.render('../views/test', { key: 'error' });
    }).catch(error => {
      response.render('../views/test', { key: error });
    })
  }
}

// Participant

function participantInfoHandler(request, response) {
  const { name, password } = request.body;
  const sqlQuery = `SELECT * FROM participants WHERE name=$1`
  const safeValues = [name];
  client.query(sqlQuery, safeValues).then(data => {
    const num = data.rows.length * 1;
    console.log(data)


    if (num) {

      const participantid = data.rows[0].participantid;
      const sql_password = data.rows[0].password;

      // ----- check password ------------
      let check = bcrypt.compareSync(password, sql_password);

      if (check) {
        //---------$$-------- edit chat rooms -------------------------
        const sqlQuery = `SELECT * FROM rooms ORDER BY roomid DESC;`;
        client.query(sqlQuery).then(data => {
          const list_room = data.rows;
          const user = name;

          // &&&&&&&&&&&&&&&&& GET room 1 messages &&&&&&&&
          const sqlQuery = "SELECT * FROM participants INNER JOIN messages ON participants.participantid=messages.participantid WHERE messages.roomid=3;";

          client.query(sqlQuery).then(massages => {
            response.render('../views/chatroom/chatroom', { list_room: list_room, user: user, sms: massages.rows, room_id: 1, participantid: participantid });
          }).catch(error => {
            response.render('../views/test', { key: error });
          })
          // &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&

        }).catch(error => {
          response.status(200).send(error)
          errorHandler(error, response);
        });
      } else {
         response.render('../views/index2', { err: 'User-name or password is incorrect !!' });
        // response.status(200).send('password is incorrect !!')
      }


      // *******************************************************
    }



    else {
      response.render('../views/index2', { err: 'User-name or password is incorrect !!' });
      // response.status(200).send('user-name is incorrect !!')
    }
  }).catch((error) => {
    errorHandler(error, response)
  })
}


function new_message(request, response) {
  const date = new Date().toLocaleTimeString("en-US");
  const { participantid, room_id, message } = request.body;
  console.log('????????????', participantid, room_id, message, request.body)
  const sqlQuery = "INSERT INTO messages (messagebody , roomid ,participantid,time) VALUES($1,$2,$3,$4)"
  const safeValues = [message, room_id, participantid, date];
  console.log(safeValues)
  pool.query(sqlQuery, safeValues).then(element => {
    select_chat_room(request, response);
  }).catch(error => {
    response.render('../views/test', { key: error });
  })

}




function select_chat_room(request, response) {

  // $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
  const { user, room_id, participantid } = request.body;

  // ----- send user-name to chat room ------------  

  //---------$$-------- edit chat rooms -------------------------
  const sqlQuery = "SELECT * FROM rooms;";
  console.log(1, sqlQuery)
  pool.query(sqlQuery).then(data => {
    console.log(2)
    const list_room = data.rows;

    // &&&&&&&&&&&&&&&&& GET room 1 messages &&&&&&&&
    const safeValues = [room_id];
    const sqlQuery = "SELECT * FROM participants INNER JOIN messages ON participants.participantid=messages.participantid WHERE messages.roomid=$1;";
    // const sqlQuery = "SELECT * FROM messages INNER JOIN participants ON participants.participantid=messages.participantid WHERE messages.roomid=$1;";

    function sort1(a, b) {
      if (a.messageid > b.messageid) {
        return 1;
      }
      if (b.messageid > a.messageid) {
        return -1;
      }
      return 0;
    }



    console.log(3)


    pool.query(sqlQuery, safeValues).then(massages => {
      const array = massages.rows;
      const massages2 = array.sort(sort1);
      response.render('../views/chatroom/chatroom', { list_room: list_room, user: user, sms: massages2, room_id: room_id, participantid: participantid });
    }).catch(error => {
      response.render('../views/test', { key: error });
    })
    // &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&

  }).catch(error => {
    console.log(error.message)
    errorHandler(error, response);
  });
  // response.render('../views/test', { key: list_room});
  // *********************************************************

  // $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$


  //  response.render('../views/test', { key: room_id });
}




// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function handlerAdminSignin(request, response) {

  const enteredPassword = request.body.password;
  
  const safeValues = [request.body.username];
  const sqlQuery = `SELECT password FROM admins WHERE name=$1;`;

  client.query(sqlQuery, safeValues).then(result => {
    const correctPass = result.rows[0].password;

    if (bcrypt.compareSync(enteredPassword, correctPass)) {
      console.log(1)
      response.redirect('/dashboard');
    } else {
      response.render('../views/admin/sign-in', { massage: 'incorrect' });
    }
  }).catch(error => {
    errorHandler(error, response);
  })

}


// Dashboard

function renderDashboard(request, response) {
  const sqlQuery = `SELECT * FROM rooms ORDER BY roomid DESC;`;
  client.query(sqlQuery).then(data => {
    const list = data.rows;
    console.log(list);
    response.render('../views/admin/dashboard', { list: list });
  }).catch(error => {
    errorHandler(error, response);
  });

}

// Add a chat room 
function addRoomToDashboard(request, response) {
  const sqlQuery = `INSERT INTO rooms(name,adminid) VALUES($1,1)`;
  const safValues = [request.body.chatroom];
  client.query(sqlQuery, safValues).then(massage => {
    response.redirect('/dashboard');
  }).catch((error) => {
    response.render('../views/test', { key: error });
  });

}
// Edit a chat room
function editRoomInDashboard(request, response) {
  const roomid = request.params.roomid;
  const newName = request.body.name;
  const safeValues = [newName, roomid];
  const sqlQuery = `UPDATE rooms SET name=$1 WHERE roomid=$2;`;
  client.query(sqlQuery, safeValues).then(() => {
    response.redirect('/dashboard');
  }).catch(error => {
    errorHandler(error, response);
  });
}

// Delete a chat room 
function deleteRoomFromDashboard(request, response) {
  const roomid = request.params.roomid;
  console.log(roomid);
  const sqlQuery = "DELETE FROM rooms WHERE roomid=$1";
  const safeValues = [roomid];

  client.query(sqlQuery, safeValues).then(() => {
    response.redirect('/dashboard');
  }).catch(error => {
    errorHandler(error, response);
  });
}


// Participants

// function participantInfoHandler(request, response) {
//     const { name, email } = request.body;
//     const sqlQuery = `INSERT INTO participants(name,email) VALUES($1,$2);`
//     const safeValues = [name, email];
//     // Rooms will be rendered 
//     client.query(sqlQuery, safeValues).then(data => {
//         response.redirect(`/chatrooms`);
//     }).catch((error) => {
//         errorHandler(error, response)
//     })
// }







// -----------------------------------------------------------------------------------------------------------------------

// All Errors

function errorHandler(request, response) {
  response.render('../views/error')
}

app.use("*", errorHandler)



client.connect().then(() => {
  server.listen(PORT, () => {
    console.log(`Listening to Port ${PORT}`);
  })
})

// server.listen(
//   console.log(`listening on *:${PORT}`));


// empty the message sent 

// cahnge the date format