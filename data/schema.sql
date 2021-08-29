DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS participants;


CREATE TABLE admins(
adminid SERIAL PRIMARY KEY,
name VARCHAR(225),
password VARCHAR(225)
);


CREATE TABLE rooms(
roomid SERIAL PRIMARY KEY,
name VARCHAR(225),
adminid INT,
FOREIGN KEY (adminid) REFERENCES admins(adminid)
);


CREATE TABLE participants(
participantid SERIAL PRIMARY KEY,
name VARCHAR(225),
email VARCHAR(225),
password VARCHAR(225)
);


CREATE TABLE messages(
messageid SERIAL PRIMARY KEY,
time TEXT DEFAULT 5,
messagebody TEXT,
roomid INT,
FOREIGN KEY (roomid) REFERENCES rooms(roomid),
participantid INT,
FOREIGN KEY (participantid) REFERENCES participants(participantid)
);