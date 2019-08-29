"use strict";

const Anon = require('../models/anon');
const Room = require('../models/room');
const AnonChallenge = require('../models/anonChallenge');

const cryptoRandomString = require('crypto-random-string');

const anonSocketHandler = async (io, socket, cookie) => {
    let thisAnon;
    if(    cookie === undefined
        || cookie.webchessAnon === undefined
        || await Anon.findOne({ token: cookie.webchessAnon }) === null
    ) {
        let token = cryptoRandomString({length: 15});
        const anon = new Anon();
        anon.token = token;
        anon.socketId = socket.id;
        anon.activeRoomId = null;
        await anon.save();
        socket.emit("anon_cookie", token);
        cookie = {
            webchessAnon: token
        };
        thisAnon = await Anon.findOne({ token: token });
    } else {
        thisAnon = await Anon.findOne({ token: cookie.webchessAnon });
        thisAnon.socketId = socket.id;
        await thisAnon.save();
        if(thisAnon.activeRoomId !== null) {
            await socket.emit("start_game", thisAnon.activeColor);
        }
    }

    socket.emit("refresh_lobby", await AnonChallenge.find({}));

    socket.on("add_challenge", async (options) => {
        const found_challenge = await AnonChallenge.findOne({options: options});

        if(found_challenge !== null) {
            const opponent = await Anon.findById(found_challenge.anonId);
            await AnonChallenge.findByIdAndRemove(found_challenge._id);
            await io.emit("refresh_lobby", await AnonChallenge.find({}));
            let room = new Room();
            let thisAnonColor;
            let opponentColor;
            if(Math.floor(Math.random()*2) === 0) {
                room.whitePlayerId = thisAnon._id;
                room.blackPlayerId = opponent._id;
                thisAnonColor = "w";
                opponentColor = "b";
            } else {
                room.whitePlayerId = opponent._id;
                room.blackPlayerId = thisAnon._id;
                thisAnonColor = "b";
                opponentColor = "w";
            }
            room.id = cryptoRandomString({length: 15});
            await room.save();
            thisAnon.activeRoomId = room.id;
            thisAnon.activeColor = thisAnonColor;
            await thisAnon.save();
            opponent.activeColor = opponentColor;
            opponent.activeRoomId = room.id;
            await opponent.save();
            await io.to(opponent.socketId).emit("start_game", opponentColor);
            await socket.emit("start_game", thisAnonColor);

            return;
        }

        const anon = await Anon.findOne({ token: cookie.webchessAnon });
        const challenge = new AnonChallenge();
        challenge.anonId = anon._id;
        challenge.options = options;
        if( await AnonChallenge.findOne({ anonId: anon._id, options: options}) === null ) {
            await challenge.save();
            await io.emit("refresh_lobby", await AnonChallenge.find({}));
            await socket.emit("challenge_added", options);
        }
    });

    socket.on("delete_challenge", async (options) => {
        const anon = await Anon.findOne({ token: cookie.webchessAnon });
        await AnonChallenge.findOneAndRemove({ anonId: anon._id, options: options});
        await io.emit("refresh_lobby", await AnonChallenge.find({}));
        await socket.emit("challenge_deleted", options);
    });

    socket.on("send_msg", async (msg) => {
        const anon = await Anon.findOne({ token: cookie.webchessAnon });
        const room = await Room.findOne({id: anon.activeRoomId});
        let opponent;
        let prefix;
        if(room.whitePlayerId === anon._id.toString()) {
            opponent = await Anon.findById(room.blackPlayerId);
            prefix = "white: "
        } else {
            opponent = await Anon.findById(room.whitePlayerId);
            prefix = "black: "
        }
        io.to(opponent.socketId).emit("get_msg", prefix + msg);
        socket.emit("get_msg", prefix + msg);
    });

    socket.on("send_fen_to_server", async (fen) => {
        const anon = await Anon.findOne({ token: cookie.webchessAnon });
        const room = await Room.findOne({id: anon.activeRoomId});
        room.game_fen = fen;
        await room.save();
        let opponent;
        if(room.whitePlayerId === anon._id.toString()) {
            opponent = await Anon.findById(room.blackPlayerId);
        } else {
            opponent = await Anon.findById(room.whitePlayerId);
        }
        io.to(opponent.socketId).emit("send_fen_to_client", fen);
    });

    socket.on("get_fen_from_server", async () => {
        const anon = await Anon.findOne({ token: cookie.webchessAnon });
        const room = await Room.findOne({id: anon.activeRoomId});
        socket.emit("send_fen_to_client", room.game_fen);
    });

    socket.on("disconnect", async () => {
        await AnonChallenge.deleteMany({anonId: thisAnon._id});
        io.emit("refresh_lobby", await AnonChallenge.find({}));
    });
};

module.exports = anonSocketHandler;