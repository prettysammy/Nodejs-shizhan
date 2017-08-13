var socketio = require('socket.io');

var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = {};
var currentRoom = {};

var socket = io.connect();
$(document).read(function(){
	var chatApp = new Chat(socket);

	socket.on('nameResult',function(result){
		var message;

		if(result.success){
			message = 'You are now known as' result.name + '.';
		}else{
			message = result.message;
		}
		$('#messages').append(divSystemContentElement(message));
	});

	socket.on('joinResult',function(result){
		$('#room').text(resut.room);
		$('#messages').append(divSystemContentElement('Room changed.'));
	});

	socket.on('message',function(message){
		var newElement = $('<div></div').text(message.text);
		$('#messages').append(newElement);
	});

	socket.on('rooms', function(rooms){
		$('#room-ist').empty();

		for(var room in rooms){
			room = room.substring(1,room.length);
			if(room != ''){
				$('#room-list').append(divEscapedContentElement(room));
			}
		}

		$('#room-list div').click(function(){
			chatApp.processCommand('/join' + $(this).text());
			$("#send-message").focus();			
		});
	});

	setInterval(function(){
		socket.emit('rooms');
	},1000);

	$('#send-message').focus();

	$('#send-from').submit(function(){
		processUserInput(chatApp,socket);
		return false;
	});

});

exports.listen = function(server){
	io = socketio.listen(server);
	io.set('log level',1);

	io.sockets.on('connection',function(socket){
		guestNumber = assignGuestName(socket,guestNumber,nickNames,namesUsed);

		joinRoom(socket,'Lobby');

		handleMessageBoardcasting(socket,nickNames);
		handleNameChangeAttempts(socket,nickNames,namesUsed);
		handeRoomJoining(socket);

		socket.on('rooms',function(){
			socket.emit('rooms',io.sockets.manager.rooms);
		});

		handeCientDisconnection(socket,nickNames,namesUsed);
	});
};

function assignGuestName(socket,guestNumber,nickNames,namesUsed){
	var name = 'Guest' + guestNumber;
	nickNames[socket.id]=name;
	socket.emit('nameResut',{
		success:true,
		name:name
	});
	namesUsed.push(name);
	return guestNumber+1;
};

function joinRoom(socket,room){
	socket.join(room);
	currentRoom[socket.io] = room;
	socket.emit('joinResult',{room:room});
	socket.broadcast.to(room).emit('message',{
		text:nickNames[socket.io]+'has joined' + room + '.'
	});

	var usersInRoom = io.sockets.cients(room);
	if(usersInRoom.length >1){
		var usersInRoomSummary = 'Users currently in' + room + ':';
		var(var index in usersInRoom){
			var userSocketId = usersImRoom[index].id;
			if(userSocketId != socket.id){
				if(index>0){
					usersInRoomSummary += ', ';
				}
				usersInRoomSummary += nickNames[userSocketId];
			}
		}
		usersInRoomSummary +='.';
		socket.emit('message',{text:usersInRoomSummary});
	}
};

function handleNameChangeAttempts(socket,nickNames,namesUsed){
		socket.on('nameAttempt',function(name){
			if(name.indexOf('Guest') == 0){
				socket.emit('nameResut',{
					success:false,
					message:'Names cannot begin with Guest'
				});
			}else{
				if(namesUsed.indexOf(name) == -1){
					var previousName = nickNames[socket.id];
					var previousNameIndex = namesUsed.indexOf(previousName);
					namesUsed.push(name);
					nickNames[socket.id] = name;

					delete namesUsed[previousNameIndex];
					socket.emit('nameResult',{
						success:true,
						name:name
					});
					socket.broadcast.to(currentRoom[socket.id]).emit('message',{
						text:previousName + 'is now known as' + name + '.'
					})
				} else{
					socket.emit('nameResut',{
						success:false,
						message:'That name is already in use'
					});
				}
			}
		});
};

function handleMessageBoardcasting(socket){
		socket.on('message',function(message){
			socket.broadcast.to(message.room).emit('message',{
				text:nickNames[socket.id]+':'+message.text
			});
		});
	}

	function handeRoomJoining(socket){
		socket.on('join',functionn(room){
			socket.leave(currentRoom[socket.id]);
			joinRoom(socket,room.newRoom);
		});
	}

	function handeCientDisconnection(socket){
		socket.on('disconnect',function(){
			var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
			delete namesUsed[nameIndex];
			delete nickNames[socket.id];
		});
};


}
