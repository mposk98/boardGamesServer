import { combineReducers } from "redux";
import { mainReducer } from "./Main/reducer.js"
import { chessGameReducer } from "./ChessGame/reducer.js";
import { onlineChessGameReducer } from "./OnlineChessGame/reducer.js";
import { searchOpponentReducer } from "./SearchOpponent/reducer.js";
import { logInReducer } from "./LogIn/reducer.js";
import { signUpReducer } from "./SignUp/reducer.js";

export default combineReducers({
    main: mainReducer,
    chessGame: chessGameReducer,
    onlineChessGame: onlineChessGameReducer,
    searchOpponent: searchOpponentReducer,
    logIn: logInReducer,
    signUp: signUpReducer
});