import React from "react";
import "../../Button/style.css";
import "./style.css"
import {Link} from "react-router-dom";

function Header(props) {
    let rightContent;
    if(props.userName) {
        rightContent = (
            <div className="header__right-content">
                <div>{props.userName}</div>
            </div>
        );
    } else {
        rightContent = (
            <div className="header__right-content">
                <Link className="header__login-button" to="/login">
                    <button className="button_gray">
                        log in
                    </button>
                </Link>
                <Link className="header__register-button" to="/register">
                    <button className="button_gray">
                        register
                    </button>
                </Link>
            </div>
        );
    }
    return (
        <div className="header">
            <Link className="header__home-button" to="/">
                <button className="button_gray">
                    home
                </button>
            </Link>
            {rightContent}
        </div>
    )
}

export default Header;
